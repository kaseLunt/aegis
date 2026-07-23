// W4 identity derivation (ENGINEERING_SPEC §Target invariant, deployment code identity).
// Pure evaluator: adapters perform the reads and hand a pre-fetched observation set here;
// this module never performs I/O. Every strategy verifies code exists, retains the full
// indirection path — including on every unknown outcome — and derives an identity ONLY
// from the terminal runtime code. An undeclared or unsupported pattern is `unknown` —
// Aegis never guesses a proxy type.
//
// Outcome taxonomy (Codex W4 review):
//   - caller-contract violations (malformed target address, unknown strategy) THROW;
//   - malformed OBSERVED data (non-hex code, bad storage word) is typed unknown with the
//     walked path retained — malformed evidence is missing evidence, never a value;
//   - a reader may throw ObservationUnavailable to signal that a read had no
//     quorum-agreed value; derivation converts it to a typed unknown AT that step, so
//     the path walked so far survives (finding 9).
import { createHash } from "node:crypto";

export class IdentityError extends Error {
  constructor(
    public readonly code: string,
    public readonly detail?: string,
  ) {
    super(`${code}${detail ? `: ${detail}` : ""}`);
    this.name = "IdentityError";
  }
}

// Thrown BY observation readers (never by this module) when a read produced no usable
// value: no quorum agreement (conflict) or missing/insufficient evidence (unresolved).
export class ObservationUnavailable extends Error {
  constructor(public readonly code: "observation_unresolved" | "observation_conflict") {
    super(code);
    this.name = "ObservationUnavailable";
  }
}

// Internal control flow: a typed dead end in the walk (absent code, empty slot, ...).
class DerivationHalt extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "DerivationHalt";
  }
}

// EIP-1967 storage slots: keccak256(label) - 1 (asserted against the ERC literals in tests).
export const EIP1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const EIP1967_BEACON_SLOT =
  "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

// Exact EIP-1167 minimal-proxy runtime bytecode around the 20-byte target address.
const EIP1167_PREFIX = "363d3d373d3d3d363d73";
const EIP1167_SUFFIX = "5af43d82803e903d91602b57fd5bf3";

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const HEX_RE = /^0x([0-9a-f]{2})*$/; // 0x + whole bytes
const WORD_RE = /^0x[0-9a-f]{64}$/;
const ZERO_ADDRESS = `0x${"0".repeat(40)}`;

export type IdentityStrategy = "direct" | "eip1967" | "beacon" | "eip1167_clone" | "custom";
const SUPPORTED = new Set(["direct", "eip1967", "beacon", "eip1167_clone"]);
const KNOWN = new Set([...SUPPORTED, "custom"]);

export type StepRole =
  | "root"
  | "direct"
  | "proxy"
  | "implementation"
  | "beacon"
  | "beacon_implementation"
  | "clone"
  | "clone_target";

export interface IdentityStep {
  role: StepRole;
  address: string;
}

export interface IdentityResult {
  strategy: string;
  status: "resolved" | "unknown";
  path: IdentityStep[];
  terminalAddress: string | null;
  runtimeCodeHash: string | null;
  reasonCodes: string[];
}

// A pre-fetched observation set. getCode returns runtime code hex (or null/"0x" for an
// account with no code); getStorageWord returns a 32-byte word; getBeaconImplementation
// returns the beacon's implementation() result (or null if the beacon did not answer).
// Any reader may throw ObservationUnavailable when the read has no usable value.
export interface CodeObservation {
  getCode(address: string): string | null;
  getStorageWord(address: string, slot: string): string;
  getBeaconImplementation(address: string): string | null;
}

const requireAddress = (address: string): string => {
  if (typeof address !== "string" || !ADDRESS_RE.test(address)) {
    throw new IdentityError("invalid_address", String(address));
  }
  return address;
};

// Observed code, strictly validated: null/"0x" is ABSENT; non-hex is MALFORMED observed
// data (typed dead end, never resolution through a garbage intermediate — finding 4).
function codeAt(reader: CodeObservation, address: string): string | null {
  const code = reader.getCode(address);
  if (code === null || code === "0x" || code === "") return null;
  if (typeof code !== "string" || !HEX_RE.test(code)) {
    throw new DerivationHalt("malformed_code_hex");
  }
  return code;
}

// Observed storage word, strictly validated (typed dead end when malformed).
function wordAt(reader: CodeObservation, address: string, slot: string): string {
  const word = reader.getStorageWord(address, slot);
  if (typeof word !== "string" || !WORD_RE.test(word)) {
    throw new DerivationHalt("malformed_storage_word");
  }
  return word;
}

// The low 20 bytes of a validated 32-byte storage word (ERC-1967 slot convention).
const addressFromWord = (word: string): string => `0x${word.slice(26)}`;

// OUR content addressing: sha256 over the returned code BYTES (never the hex string,
// never an on-chain keccak codehash). Input is pre-validated hex.
const hashRuntimeCode = (code: string): string =>
  `sha256:${createHash("sha256").update(Buffer.from(code.slice(2), "hex")).digest("hex")}`;

const unknown = (strategy: string, path: IdentityStep[], reason: string): IdentityResult => ({
  strategy,
  status: "unknown",
  path: [...path],
  terminalAddress: null,
  runtimeCodeHash: null,
  reasonCodes: [reason],
});

// Runs a strategy walk; typed dead ends and unavailable observations become unknown
// results carrying the path accumulated so far.
function walk(
  strategy: string,
  path: IdentityStep[],
  steps: () => IdentityResult,
): IdentityResult {
  try {
    return steps();
  } catch (e) {
    if (e instanceof DerivationHalt) return unknown(strategy, path, e.reason);
    if (e instanceof ObservationUnavailable) return unknown(strategy, path, e.code);
    throw e;
  }
}

// Terminal step shared by every strategy: the resolved address must carry code, and the
// identity is the sha256 of that code. Absent code is unknown, never a fallback.
function terminal(
  strategy: string,
  path: IdentityStep[],
  address: string,
  reader: CodeObservation,
): IdentityResult {
  const code = codeAt(reader, address);
  if (code === null) throw new DerivationHalt("code_absent");
  return {
    strategy,
    status: "resolved",
    path: [...path],
    terminalAddress: address,
    runtimeCodeHash: hashRuntimeCode(code),
    reasonCodes: [],
  };
}

// A proxy must itself have code before any slot is read (an EOA/empty account is not a
// proxy); the slot address must be non-zero to count as declared.
function slotTarget(
  reader: CodeObservation,
  proxy: string,
  slot: string,
  emptyReason: string,
): string {
  if (codeAt(reader, proxy) === null) throw new DerivationHalt("code_absent");
  const next = addressFromWord(wordAt(reader, proxy, slot));
  if (next === ZERO_ADDRESS) throw new DerivationHalt(emptyReason);
  return next;
}

function deriveDirect(address: string, reader: CodeObservation): IdentityResult {
  const path: IdentityStep[] = [{ role: "direct", address }];
  return walk("direct", path, () => terminal("direct", path, address, reader));
}

function deriveEip1967(address: string, reader: CodeObservation): IdentityResult {
  const path: IdentityStep[] = [{ role: "proxy", address }];
  return walk("eip1967", path, () => {
    const impl = slotTarget(reader, address, EIP1967_IMPLEMENTATION_SLOT, "implementation_slot_empty");
    path.push({ role: "implementation", address: impl });
    return terminal("eip1967", path, impl, reader);
  });
}

function deriveBeacon(address: string, reader: CodeObservation): IdentityResult {
  const path: IdentityStep[] = [{ role: "proxy", address }];
  return walk("beacon", path, () => {
    if (codeAt(reader, address) === null) throw new DerivationHalt("code_absent");
    // ERC-1967: the beacon applies only while the direct logic slot is EMPTY. A
    // populated logic slot alongside a beacon claim is ambiguous, nonconforming
    // identity — never resolved through the beacon (finding 6).
    if (addressFromWord(wordAt(reader, address, EIP1967_IMPLEMENTATION_SLOT)) !== ZERO_ADDRESS) {
      throw new DerivationHalt("logic_slot_populated");
    }
    const beacon = addressFromWord(wordAt(reader, address, EIP1967_BEACON_SLOT));
    if (beacon === ZERO_ADDRESS) throw new DerivationHalt("beacon_slot_empty");
    path.push({ role: "beacon", address: beacon });
    if (codeAt(reader, beacon) === null) throw new DerivationHalt("code_absent");
    const impl = reader.getBeaconImplementation(beacon);
    if (impl === null || !ADDRESS_RE.test(impl) || impl === ZERO_ADDRESS) {
      throw new DerivationHalt("beacon_implementation_unresolved");
    }
    path.push({ role: "beacon_implementation", address: impl });
    return terminal("beacon", path, impl, reader);
  });
}

function deriveClone(address: string, reader: CodeObservation): IdentityResult {
  const path: IdentityStep[] = [{ role: "clone", address }];
  return walk("eip1167_clone", path, () => {
    const code = codeAt(reader, address);
    if (code === null) throw new DerivationHalt("code_absent");
    const body = code.slice(2);
    const expectedLen = EIP1167_PREFIX.length + 40 + EIP1167_SUFFIX.length;
    if (
      body.length !== expectedLen ||
      !body.startsWith(EIP1167_PREFIX) ||
      !body.endsWith(EIP1167_SUFFIX)
    ) {
      throw new DerivationHalt("not_eip1167_clone");
    }
    const target = `0x${body.slice(EIP1167_PREFIX.length, EIP1167_PREFIX.length + 40)}`;
    if (target === ZERO_ADDRESS) throw new DerivationHalt("clone_target_zero");
    path.push({ role: "clone_target", address: target });
    return terminal("eip1167_clone", path, target, reader);
  });
}

export function deriveIdentity(
  strategy: string,
  address: string,
  reader: CodeObservation,
): IdentityResult {
  if (!KNOWN.has(strategy)) throw new IdentityError("unknown_strategy", strategy);
  requireAddress(address);
  // The custom strategy is the separately-reviewed indirection path (W4 non-goal): it is
  // known but unsupported here — unknown with the declared root retained, never guessed.
  if (strategy === "custom") {
    return unknown("custom", [{ role: "root", address }], "unsupported_strategy");
  }
  switch (strategy) {
    case "direct": return deriveDirect(address, reader);
    case "eip1967": return deriveEip1967(address, reader);
    case "beacon": return deriveBeacon(address, reader);
    case "eip1167_clone": return deriveClone(address, reader);
    default: throw new IdentityError("unknown_strategy", strategy);
  }
}
