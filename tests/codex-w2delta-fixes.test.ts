// Fixes for the Codex cross-vendor review of the W2 delta (f7e6dbd, session
// 019f8b83-b164-7843-9b46-df21c3eb3bcd; dispositions in
// roadmap/reviews/W2-delta-codex-review.md). Each test encodes a verified finding;
// written before the fixes (RED first).
import { describe, expect, test } from "vitest";
import {
  ManifestError,
  checkApplicability,
  loadManifest,
  manifestContentHash,
  policyTrustFromBytes,
} from "../lib/aegis/manifest/trust";
import {
  CanonicalizationError,
  normalizeReport,
  validateReport,
  validateReportStructure,
} from "../lib/aegis/report/canonical";

const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
const h32 = (fill: string) => `0x${fill.repeat(64)}`;
const addr = (fill: string) => `0x${fill.repeat(40)}`;
type J = Record<string, unknown>;

function validManifest(): J {
  return {
    schemaVersion: "1",
    manifestVersion: "weeth-crosschain@e30c859",
    protocol: "etherfi",
    environment: "mainnet",
    author: "route-research",
    reviewers: ["klunt"],
    createdAt: "2026-07-22T00:00:00Z",
    chainIds: [1, 10],
    validity: { fromBlock: { chainId: 1, number: "25000000" }, toBlock: null },
    policyRefs: [{ kind: "finality", id: "fin-1", version: "1", contentHash: sha("a") }],
    targets: [
      {
        targetId: "l1-oft-adapter",
        chainId: 1,
        address: addr("c"),
        identityStrategy: "eip1967",
        expectedImplementation: addr("d"),
        expectedRuntimeCodeHash: sha("e"),
      },
    ],
    invariantIds: ["deployment.code_identity"],
    uncovered: ["consensus-layer state"],
  };
}

function expectCode(fn: () => unknown, code: string): void {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(ManifestError);
  expect((caught as ManifestError).code).toBe(code);
}

const sealAndLoad = (mutate: (m: J) => void) => {
  const m = validManifest();
  mutate(m);
  m.contentHash = manifestContentHash(m);
  return () => loadManifest(m);
};

// --- Finding 1: wrong container/component types passed structural validation ------------
describe("F1: mandatory collections and identity components are type-checked", () => {
  test("scalar invariantIds is invalid, never loadable", () => {
    expectCode(sealAndLoad((m) => void (m.invariantIds = "deployment.code_identity")), "invalid_field_type");
  });

  test("scalar uncovered is invalid", () => {
    expectCode(sealAndLoad((m) => void (m.uncovered = "nothing")), "invalid_field_type");
  });

  test("non-array policyRefs is invalid", () => {
    expectCode(sealAndLoad((m) => void (m.policyRefs = { kind: "finality" })), "invalid_field_type");
  });

  test("policyRef identity components must be strings (array kind is not coerced)", () => {
    expectCode(
      sealAndLoad((m) => void ((m.policyRefs as J[])[0].kind = ["finality"])),
      "invalid_field_type",
    );
  });

  test("targetId must be a string (array is not coerced)", () => {
    expectCode(
      sealAndLoad((m) => void ((m.targets as J[])[0].targetId = ["l1-oft-adapter"])),
      "invalid_field_type",
    );
  });

  test("identityStrategy must be a string before enum membership (array is not coerced)", () => {
    expectCode(
      sealAndLoad((m) => void ((m.targets as J[])[0].identityStrategy = ["eip1967"])),
      "invalid_field_type",
    );
  });

  test("scalar reviewers and non-string author are invalid", () => {
    expectCode(sealAndLoad((m) => void (m.reviewers = "klunt")), "invalid_field_type");
    expectCode(sealAndLoad((m) => void (m.author = 42)), "invalid_field_type");
  });

  test("non-object validity is invalid, not silently window-free", () => {
    expectCode(sealAndLoad((m) => void (m.validity = "always")), "invalid_validity_window");
  });

  test("fractional validity chainId is invalid, not a silently ignored lower bound", () => {
    expectCode(
      sealAndLoad((m) => void (((m.validity as J).fromBlock as J).chainId = 1.5)),
      "invalid_chain_id",
    );
  });

  test("end-to-end: a wrong-typed manifest with its recomputed hash approved is invalid, never trusted", () => {
    const m = validManifest();
    m.invariantIds = "deployment.code_identity";
    m.contentHash = manifestContentHash(m);
    const block = policyTrustFromBytes(
      new TextEncoder().encode(JSON.stringify(m)),
      { trustPolicyId: "tp", approvedHashes: [String(m.contentHash)] },
      [],
    );
    expect(block.state).toBe("invalid");
    expect(block.reasonCodes).toEqual(["invalid_field_type"]);
  });
});

// --- Finding 2: depth cap must guard every exported recursive entry point ---------------
describe("F2: validateReport / validateReportStructure / normalizeReport reject over-deep input typed", () => {
  const nested = (depth: number): unknown => JSON.parse("[".repeat(depth) + "0" + "]".repeat(depth));

  function deepPayload(): J {
    const boundary = {
      kind: "execution_block",
      block: {
        chainId: 1, number: "25577369", hash: h32("a"), parentHash: h32("b"),
        timestamp: "2026-07-22T00:00:00Z", finality: "finalized",
      },
    };
    const evidence = {
      id: sha("2"), kind: "rpc_call", provenanceClass: "observed_public_state",
      sourceMode: "recorded", boundary, address: addr("c"), method: "eth_call",
      calldata: "0x00", rawResultHash: sha("5"), capturedAt: "2026-07-22T00:00:00Z",
      decodedResult: nested(10_000),
    };
    return {
      schemaVersion: "1", engineVersion: "1", evaluationTime: "2026-07-22T00:00:01Z",
      manifestVersion: "1", manifestHash: sha("0"), policyRefs: [],
      policyTrust: { state: "trusted", trustPolicyId: "tp-1", manifestHash: sha("0"), reasonCodes: ["approved_hash"], evidence: [] },
      sourceMode: "recorded", requestHash: sha("1"), observationBoundaries: [boundary],
      evidence: [evidence], verifications: [], facts: [],
      coverage: { supported: [], unsupported: [], excluded: [] }, limitations: [],
    };
  }

  const expectDepthRejection = (fn: () => unknown) => {
    let caught: unknown;
    try {
      fn();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CanonicalizationError);
    expect((caught as CanonicalizationError).code).toBe("nesting_depth_exceeded");
  };

  test("validateReport", () => expectDepthRejection(() => validateReport(deepPayload())));
  test("validateReportStructure", () => expectDepthRejection(() => validateReportStructure(deepPayload())));
  test("normalizeReport", () => expectDepthRejection(() => normalizeReport(deepPayload())));
});

// --- Finding 3: applicability boundary must be validated as an execution block ----------
describe("F3: checkApplicability fails closed on wrong or missing boundary structure", () => {
  const loaded = () => {
    const m = validManifest();
    m.contentHash = manifestContentHash(m);
    return loadManifest(m);
  };

  test("a source_snapshot boundary carrying a block is not interpreted as an execution block", () => {
    const b = { kind: "source_snapshot", block: { chainId: 1, number: "25000000" } };
    expectCode(() => checkApplicability(loaded(), b as never, "mainnet"), "invalid_observation_boundary");
  });

  test("an execution_block boundary without a block object fails typed, not TypeError", () => {
    expectCode(() => checkApplicability(loaded(), { kind: "execution_block" } as never, "mainnet"), "invalid_observation_boundary");
  });

  test("a null boundary fails typed", () => {
    expectCode(() => checkApplicability(loaded(), null as never, "mainnet"), "invalid_observation_boundary");
  });

  test("a non-string deployment environment fails typed", () => {
    const b = { kind: "execution_block" as const, block: { chainId: 1, number: "25577369" } };
    expectCode(() => checkApplicability(loaded(), b, undefined as never), "invalid_environment");
  });
});
