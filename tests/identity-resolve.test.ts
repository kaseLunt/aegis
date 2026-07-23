// W4 slice 1 — pure identity derivation (ENGINEERING_SPEC §Target invariant, deployment
// code identity), TDD from the spec rules verbatim:
//   - every strategy verifies that code EXISTS;
//   - the full indirection path is retained in every result;
//   - an undeclared/unsupported pattern is unknown — Aegis never guesses a proxy type;
//   - an ABI/identity is derived only from the terminal runtime code;
//   - runtime code hashes are OUR sha256 content addressing over the returned code
//     BYTES (never the hex string, never on-chain keccak codehashes).
// Unresolved outcomes are returned states (legitimate observations); caller-contract
// violations (malformed hex, unknown strategy) are typed throws.
import { createHash } from "node:crypto";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
  EIP1967_BEACON_SLOT,
  EIP1967_IMPLEMENTATION_SLOT,
  IdentityError,
  type CodeObservation,
  deriveIdentity,
} from "../lib/aegis/identity/resolve";

const addr = (fill: string) => `0x${fill.repeat(40)}`;
const ZERO32 = `0x${"0".repeat(64)}`;
// A 32-byte storage word whose low 20 bytes encode `address`.
const slotWord = (address: string) => `0x${"0".repeat(24)}${address.slice(2)}`;
const cloneCode = (target: string) =>
  `0x363d3d373d3d3d363d73${target.slice(2)}5af43d82803e903d91602b57fd5bf3`;
const sha256Bytes = (hex: string) =>
  `sha256:${createHash("sha256").update(Buffer.from(hex.slice(2), "hex")).digest("hex")}`;

// A fixture observation set: an in-memory index of pre-fetched adapter reads. The pure
// resolver never performs I/O; it walks this observed data.
function observation(over: {
  code?: Record<string, string | null>;
  storage?: Record<string, Record<string, string>>;
  beaconImpl?: Record<string, string | null>;
}): CodeObservation {
  return {
    getCode: (a: string) => (over.code && a in over.code ? over.code[a] : null),
    getStorageWord: (a: string, slot: string) => over.storage?.[a]?.[slot] ?? ZERO32,
    getBeaconImplementation: (a: string) => (over.beaconImpl && a in over.beaconImpl ? over.beaconImpl[a] : null),
  };
}

const PROXY = addr("c");
const IMPL = addr("d");
const BEACON = addr("e");
const TARGET = addr("f");
const CODE = "0x6001600255";

describe("direct", () => {
  test("code present at the address resolves with its sha256 content hash", () => {
    const r = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: CODE } }));
    expect(r.status).toBe("resolved");
    expect(r.terminalAddress).toBe(PROXY);
    expect(r.runtimeCodeHash).toBe(sha256Bytes(CODE));
    expect(r.path).toEqual([{ role: "direct", address: PROXY }]);
    expect(r.reasonCodes).toEqual([]);
  });

  test("absent code is unknown (code_absent), never a guessed identity", () => {
    const r = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: null } }));
    expect(r.status).toBe("unknown");
    expect(r.runtimeCodeHash).toBeNull();
    expect(r.reasonCodes).toContain("code_absent");
  });

  test("empty (0x) code is not code — unknown", () => {
    const r = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: "0x" } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("code_absent");
  });
});

describe("eip1967", () => {
  const base = observation({
    code: { [PROXY]: cloneCode(IMPL) /* has code */, [IMPL]: CODE },
    storage: { [PROXY]: { [EIP1967_IMPLEMENTATION_SLOT]: slotWord(IMPL) } },
  });

  test("resolves the implementation slot and hashes implementation code, retaining the path", () => {
    const r = deriveIdentity("eip1967", PROXY, base);
    expect(r.status).toBe("resolved");
    expect(r.terminalAddress).toBe(IMPL);
    expect(r.runtimeCodeHash).toBe(sha256Bytes(CODE));
    expect(r.path).toEqual([
      { role: "proxy", address: PROXY },
      { role: "implementation", address: IMPL },
    ]);
  });

  test("an empty implementation slot is unknown (slot_empty), never a direct fallback", () => {
    const r = deriveIdentity("eip1967", PROXY, observation({ code: { [PROXY]: CODE } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("implementation_slot_empty");
    expect(r.runtimeCodeHash).toBeNull();
  });

  test("implementation address with no code is unknown (code_absent), path still retained", () => {
    const r = deriveIdentity("eip1967", PROXY, observation({
      code: { [PROXY]: CODE, [IMPL]: null },
      storage: { [PROXY]: { [EIP1967_IMPLEMENTATION_SLOT]: slotWord(IMPL) } },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("code_absent");
    expect(r.path.map((s: { address: string }) => s.address)).toEqual([PROXY, IMPL]);
  });

  test("a proxy with no code of its own is unknown before any slot read", () => {
    const r = deriveIdentity("eip1967", PROXY, observation({ code: { [PROXY]: null } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("code_absent");
  });
});

describe("beacon", () => {
  const base = observation({
    code: { [PROXY]: CODE, [BEACON]: CODE, [IMPL]: CODE },
    storage: { [PROXY]: { [EIP1967_BEACON_SLOT]: slotWord(BEACON) } },
    beaconImpl: { [BEACON]: IMPL },
  });

  test("resolves beacon then beacon implementation, retaining the full path", () => {
    const r = deriveIdentity("beacon", PROXY, base);
    expect(r.status).toBe("resolved");
    expect(r.terminalAddress).toBe(IMPL);
    expect(r.runtimeCodeHash).toBe(sha256Bytes(CODE));
    expect(r.path).toEqual([
      { role: "proxy", address: PROXY },
      { role: "beacon", address: BEACON },
      { role: "beacon_implementation", address: IMPL },
    ]);
  });

  test("empty beacon slot is unknown", () => {
    const r = deriveIdentity("beacon", PROXY, observation({ code: { [PROXY]: CODE } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("beacon_slot_empty");
  });

  test("beacon with no code is unknown", () => {
    const r = deriveIdentity("beacon", PROXY, observation({
      code: { [PROXY]: CODE, [BEACON]: null },
      storage: { [PROXY]: { [EIP1967_BEACON_SLOT]: slotWord(BEACON) } },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("code_absent");
  });

  test("beacon that does not return an implementation is unknown", () => {
    const r = deriveIdentity("beacon", PROXY, observation({
      code: { [PROXY]: CODE, [BEACON]: CODE },
      storage: { [PROXY]: { [EIP1967_BEACON_SLOT]: slotWord(BEACON) } },
      beaconImpl: { [BEACON]: null },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("beacon_implementation_unresolved");
  });
});

describe("eip1167_clone", () => {
  test("decodes the exact minimal-proxy target and hashes target code", () => {
    const r = deriveIdentity("eip1167_clone", PROXY, observation({
      code: { [PROXY]: cloneCode(TARGET), [TARGET]: CODE },
    }));
    expect(r.status).toBe("resolved");
    expect(r.terminalAddress).toBe(TARGET);
    expect(r.runtimeCodeHash).toBe(sha256Bytes(CODE));
    expect(r.path).toEqual([
      { role: "clone", address: PROXY },
      { role: "clone_target", address: TARGET },
    ]);
  });

  test("bytecode that is not the exact EIP-1167 pattern is unknown (not_a_clone), never guessed", () => {
    const r = deriveIdentity("eip1167_clone", PROXY, observation({
      code: { [PROXY]: `0x363d3d373d3d3d363d73${TARGET.slice(2)}deadbeef` },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("not_eip1167_clone");
  });

  test("clone target with no code is unknown, target retained in the path", () => {
    const r = deriveIdentity("eip1167_clone", PROXY, observation({
      code: { [PROXY]: cloneCode(TARGET), [TARGET]: null },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("code_absent");
    expect(r.path.map((s: { address: string }) => s.address)).toEqual([PROXY, TARGET]);
  });

  test("clone pointing at the zero address is unknown", () => {
    const r = deriveIdentity("eip1167_clone", PROXY, observation({
      code: { [PROXY]: cloneCode(`0x${"0".repeat(40)}`) },
    }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("clone_target_zero");
  });
});

describe("strategy dispatch and input contract", () => {
  test("the custom strategy is unsupported here — unknown, never guessed (separate reviewed path)", () => {
    const r = deriveIdentity("custom", PROXY, observation({ code: { [PROXY]: CODE } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("unsupported_strategy");
  });

  test("an unrecognized strategy string is a caller-contract violation (throws)", () => {
    expect(() => deriveIdentity("uups2" as never, PROXY, observation({}))).toThrow(IdentityError);
  });

  test("a malformed target address throws (not a silent unknown)", () => {
    expect(() => deriveIdentity("direct", "0xnothex", observation({}))).toThrow(IdentityError);
  });

  test("malformed observed code bytes are typed unknown (malformed evidence), path retained", () => {
    // Codex W4 review finding 4: malformed OBSERVED data is missing/malformed evidence,
    // never a throw out of derivation and never resolution through a garbage read.
    const r = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: "0x123" } }));
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("malformed_code_hex");
    expect(r.path).toEqual([{ role: "direct", address: PROXY }]);
  });
});

describe("robust: derivation is content-sensitive and never fabricates identity (property)", () => {
  test("any change to the terminal code bytes changes the runtime code hash", () => {
    const ref = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: CODE } })).runtimeCodeHash;
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 64 }).filter((b) => `0x${Buffer.from(b).toString("hex")}` !== CODE),
        (bytes) => {
          const hex = `0x${Buffer.from(bytes).toString("hex")}`;
          const r = deriveIdentity("direct", PROXY, observation({ code: { [PROXY]: hex } }));
          expect(r.runtimeCodeHash).not.toBe(ref);
        },
      ),
      { numRuns: 50 },
    );
  });

  test("an unknown outcome never carries a runtime code hash", () => {
    fc.assert(
      fc.property(fc.constantFrom("eip1967", "beacon", "eip1167_clone"), (strategy) => {
        const r = deriveIdentity(strategy, PROXY, observation({ code: { [PROXY]: CODE } }));
        if (r.status === "unknown") expect(r.runtimeCodeHash).toBeNull();
      }),
      { numRuns: 20 },
    );
  });
});
