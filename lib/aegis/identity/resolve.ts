// W4 identity derivation (ENGINEERING_SPEC §Target invariant, deployment code identity).
// Pure evaluator: adapters perform the reads and hand a pre-fetched observation set here;
// this module never performs I/O. Every strategy verifies code exists, retains the full
// indirection path, and derives an identity ONLY from the terminal runtime code. An
// undeclared or unsupported pattern is `unknown` — Aegis never guesses a proxy type.
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

// EIP-1967 storage slots: keccak256(label) - 1.
export const EIP1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const EIP1967_BEACON_SLOT =
  "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

// Exact EIP-1167 minimal-proxy runtime bytecode around the 20-byte target address.
const EIP1167_PREFIX = "363d3d373d3d3d363d73";
const EIP1167_SUFFIX = "5af43d82803e903d91602b57fd5bf3";

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const HEX_RE = /^0x([0-9a-f]{2})*$/; // 0x + whole bytes
const ZERO_ADDRESS = `0x${"0".repeat(40)}`;

export type IdentityStrategy = "direct" | "eip1967" | "beacon" | "eip1167_clone" | "custom";
const SUPPORTED = new Set(["direct", "eip1967", "beacon", "eip1167_clone"]);
const KNOWN = new Set([...SUPPORTED, "custom"]);

export type StepRole =
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

const hasCode = (code: string | null): code is string =>
  typeof code === "string" && code.length > 2 && code !== "0x";

// OUR content addressing: sha256 over the returned code BYTES (never the hex string,
// never an on-chain keccak codehash).
function hashRuntimeCode(code: string): string {
  if (!HEX_RE.test(code)) throw new IdentityError("malformed_code_hex", code.slice(0, 16));
  return `sha256:${createHash("sha256").update(Buffer.from(code.slice(2), "hex")).digest("hex")}`;
}

// The low 20 bytes of a 32-byte storage word, as a checksum-free lowercase address.
function addressFromWord(word: string): string {
  if (typeof word !== "string" || !/^0x[0-9a-f]{64}$/.test(word)) {
    throw new IdentityError("malformed_storage_word", String(word));
  }
  return `0x${word.slice(26)}`;
}

const unknown = (
  strategy: string,
  path: IdentityStep[],
  reason: string,
): IdentityResult => ({ strategy, status: "unknown", path, terminalAddress: null, runtimeCodeHash: null, reasonCodes: [reason] });

// Terminal step shared by every strategy: the resolved address must carry code, and the
// identity is the sha256 of that code. Absent code is unknown, never a fallback.
function terminal(
  strategy: string,
  path: IdentityStep[],
  address: string,
  reader: CodeObservation,
): IdentityResult {
  const code = reader.getCode(address);
  if (!hasCode(code)) return unknown(strategy, path, "code_absent");
  return {
    strategy,
    status: "resolved",
    path,
    terminalAddress: address,
    runtimeCodeHash: hashRuntimeCode(code),
    reasonCodes: [],
  };
}

function deriveDirect(address: string, reader: CodeObservation): IdentityResult {
  return terminal("direct", [{ role: "direct", address }], address, reader);
}

// A proxy must itself have code before any slot is read (an EOA/empty account is not a
// proxy). The slot address must be non-zero to count as declared.
function resolveVia(
  strategy: string,
  proxyRole: StepRole,
  address: string,
  slot: string,
  emptyReason: string,
  reader: CodeObservation,
): { path: IdentityStep[]; next: string } | IdentityResult {
  if (!hasCode(reader.getCode(address))) {
    return unknown(strategy, [{ role: proxyRole, address }], "code_absent");
  }
  const next = addressFromWord(reader.getStorageWord(address, slot));
  if (next === ZERO_ADDRESS) {
    return unknown(strategy, [{ role: proxyRole, address }], emptyReason);
  }
  return { path: [{ role: proxyRole, address }], next };
}

function deriveEip1967(address: string, reader: CodeObservation): IdentityResult {
  const step = resolveVia("eip1967", "proxy", address, EIP1967_IMPLEMENTATION_SLOT, "implementation_slot_empty", reader);
  if ("status" in step) return step;
  return terminal("eip1967", [...step.path, { role: "implementation", address: step.next }], step.next, reader);
}

function deriveBeacon(address: string, reader: CodeObservation): IdentityResult {
  const step = resolveVia("beacon", "proxy", address, EIP1967_BEACON_SLOT, "beacon_slot_empty", reader);
  if ("status" in step) return step;
  const beacon = step.next;
  const path = [...step.path, { role: "beacon" as const, address: beacon }];
  if (!hasCode(reader.getCode(beacon))) return unknown("beacon", path, "code_absent");
  const impl = reader.getBeaconImplementation(beacon);
  if (impl === null || !ADDRESS_RE.test(impl) || impl === ZERO_ADDRESS) {
    return unknown("beacon", path, "beacon_implementation_unresolved");
  }
  return terminal("beacon", [...path, { role: "beacon_implementation", address: impl }], impl, reader);
}

function deriveClone(address: string, reader: CodeObservation): IdentityResult {
  const path: IdentityStep[] = [{ role: "clone", address }];
  const code = reader.getCode(address);
  if (!hasCode(code)) return unknown("eip1167_clone", path, "code_absent");
  if (!HEX_RE.test(code)) throw new IdentityError("malformed_code_hex", code.slice(0, 16));
  const body = code.slice(2);
  const expectedLen = EIP1167_PREFIX.length + 40 + EIP1167_SUFFIX.length;
  if (
    body.length !== expectedLen ||
    !body.startsWith(EIP1167_PREFIX) ||
    !body.endsWith(EIP1167_SUFFIX)
  ) {
    return unknown("eip1167_clone", path, "not_eip1167_clone");
  }
  const target = `0x${body.slice(EIP1167_PREFIX.length, EIP1167_PREFIX.length + 40)}`;
  if (target === ZERO_ADDRESS) return unknown("eip1167_clone", path, "clone_target_zero");
  return terminal("eip1167_clone", [...path, { role: "clone_target", address: target }], target, reader);
}

export function deriveIdentity(
  strategy: string,
  address: string,
  reader: CodeObservation,
): IdentityResult {
  if (!KNOWN.has(strategy)) throw new IdentityError("unknown_strategy", strategy);
  requireAddress(address);
  // The custom strategy is the separately-reviewed indirection path (W4 non-goal): it is
  // known but unsupported here — unknown, never guessed.
  if (strategy === "custom") return unknown("custom", [], "unsupported_strategy");
  switch (strategy) {
    case "direct": return deriveDirect(address, reader);
    case "eip1967": return deriveEip1967(address, reader);
    case "beacon": return deriveBeacon(address, reader);
    case "eip1167_clone": return deriveClone(address, reader);
    default: throw new IdentityError("unknown_strategy", strategy);
  }
}
