// Fixes for the Codex spine review (roadmap/reviews/W1W2-spine-codex-review.md). Each test
// encodes a verified finding; written before the fixes (RED first).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  CanonicalizationError,
  canonicalBytes,
  canonicalBytesStructural,
  jcsSerialize,
  reportHash,
} from "../lib/aegis/report/canonical";
import {
  ManifestError,
  evaluateTrust,
  loadManifest,
  manifestContentHash,
  policyTrustFromBytes,
} from "../lib/aegis/manifest/trust";

const VEC = join(__dirname, "..", "roadmap", "research", "WR6", "vectors");
const loadJson = (name: string): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(readFileSync(join(VEC, name)))) as Record<string, unknown>;

const sha = (f: string) => `sha256:${f.repeat(64)}`;
type J = Record<string, unknown>;

function fullManifest(): J {
  const m: J = {
    schemaVersion: "1", manifestVersion: "ref@v1", protocol: "etherfi", environment: "mainnet",
    author: "a", reviewers: ["r"], createdAt: "2026-07-22T00:00:00Z", chainIds: [1, 10],
    validity: { fromBlock: { chainId: 1, number: "25000000" }, toBlock: null },
    policyRefs: [{ kind: "finality", id: "f", version: "1", contentHash: sha("a") }],
    targets: [{ targetId: "t", chainId: 1, address: `0x${"c".repeat(40)}`, identityStrategy: "direct", expectedRuntimeCodeHash: sha("e") }],
    invariantIds: ["deployment.code_identity"], uncovered: [],
  };
  m.contentHash = manifestContentHash(m);
  return m;
}

// --- P0#1: manifest trust binding -------------------------------------------------------
describe("P0#1 trust cannot be forged or mutated", () => {
  test("a forged LoadedManifest with an approved hash but junk content is not trusted", () => {
    const approved = sha("a");
    expect(() =>
      evaluateTrust({ manifest: { junk: true } as J, contentHash: approved } as never, {
        trustPolicyId: "tp", approvedHashes: [approved],
      }),
    ).toThrow();
  });

  test("loaded content is frozen — direct tampering is blocked", () => {
    const loaded = loadManifest(fullManifest());
    expect(evaluateTrust(loaded, { trustPolicyId: "tp", approvedHashes: [loaded.contentHash] }).state).toBe("trusted");
    expect(() => {
      (loaded.manifest.targets as J[])[0].expectedRuntimeCodeHash = sha("f");
    }).toThrow();
  });

  test("a reconstructed LoadedManifest with mutated content + stale approved hash is rejected", () => {
    const loaded = loadManifest(fullManifest());
    const approved = loaded.contentHash;
    const tampered = structuredClone(fullManifest()) as J;
    (tampered.targets as J[])[0].expectedRuntimeCodeHash = sha("f");
    expect(() =>
      evaluateTrust({ manifest: tampered, contentHash: approved } as never, {
        trustPolicyId: "tp", approvedHashes: [approved],
      }),
    ).toThrow();
  });

  test("a prototype-only manifest does not load as an empty object", () => {
    const proto = fullManifest();
    const child = Object.create(proto) as J;
    expect(() => loadManifest(child)).toThrow(ManifestError);
  });
});

// --- P0#2: strict validation at the production entry point ------------------------------
describe("P0#2 reportHash runs strict validation", () => {
  const strictReport = (): J => {
    const b = { kind: "execution_block", block: { chainId: 1, number: "2", hash: `0x${"a".repeat(64)}`, parentHash: `0x${"b".repeat(64)}`, timestamp: "t", finality: "finalized" } };
    const ev = { id: sha("2"), kind: "rpc_call", provenanceClass: "observed_public_state", sourceMode: "recorded", boundary: b, rawResultHash: sha("5"), capturedAt: "t" };
    return {
      schemaVersion: "1", engineVersion: "1", evaluationTime: "t", manifestVersion: "1",
      manifestHash: sha("0"), policyRefs: [], policyTrust: { state: "trusted", trustPolicyId: "tp", manifestHash: sha("0"), reasonCodes: ["approved_hash"], evidence: [ev] },
      sourceMode: "recorded", requestHash: sha("1"), observationBoundaries: [b], evidence: [ev],
      verifications: [], facts: [], coverage: { supported: [], unsupported: [], excluded: [] }, limitations: [],
    };
  };

  test("a strict, full-length report canonicalizes and hashes", () => {
    expect(() => reportHash(strictReport())).not.toThrow();
    expect(reportHash(strictReport())).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("bad enum reaches NO hash through reportHash", () => {
    const p = strictReport();
    p.sourceMode = "imagined";
    expect(() => reportHash(p)).toThrow(CanonicalizationError);
  });

  test("abbreviated WR6 goldens still work through the structural entry point", () => {
    expect(() => canonicalBytesStructural(loadJson("golden-01-minimal.json"))).not.toThrow();
  });

  test("abbreviated golden is REJECTED by the strict production entry point (byte length)", () => {
    expect(() => canonicalBytes(loadJson("golden-02-set-normalization.json"))).toThrow(CanonicalizationError);
  });
});

// --- P0#3 + P1#5: manifest schema completeness and normalized hashing -------------------
describe("P0#3 manifest schema completeness", () => {
  test("missing embedded contentHash is invalid", () => {
    const m = fullManifest();
    delete m.contentHash;
    expect(() => loadManifest(m)).toThrow(ManifestError);
  });

  test("uppercase address is invalid", () => {
    const m = fullManifest();
    (m.targets as J[])[0].address = `0x${"C".repeat(40)}`;
    m.contentHash = manifestContentHash(m);
    expect(() => loadManifest(m)).toThrow(ManifestError);
  });

  test("non-minimal decimal block number in validity is invalid", () => {
    const m = fullManifest();
    (m.validity as J).toBlock = { chainId: 1, number: "0009" };
    m.contentHash = manifestContentHash(m);
    expect(() => loadManifest(m)).toThrow(ManifestError);
  });
});

describe("P1#5 manifest hashing is normalization-stable", () => {
  test("chainIds order does not change the content hash", () => {
    const a = fullManifest();
    const b: J = { ...a, chainIds: [10, 1] };
    delete a.contentHash; delete b.contentHash;
    expect(manifestContentHash(a)).toBe(manifestContentHash(b));
  });
});

// --- P1#4: duplicate rejection + semantic index -----------------------------------------
describe("P1#4 set duplicates and semantic indices", () => {
  test("duplicate limitations reject", () => {
    const p = loadJson("golden-01-minimal.json");
    p.limitations = [{ code: "x", text: "y" }, { code: "x", text: "y" }];
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });

  test("gapped semantic index rejects", () => {
    const p = loadJson("golden-03-semantic-order-a.json");
    ((p.evidence as J[])[0].decodedResult as J).safeBatch = [{ index: "0", to: "0xaa", value: "0" }, { index: "2", to: "0xbb", value: "1" }];
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });
});

// --- P1#6 + P1#7: JSON domain --------------------------------------------------------
describe("P1#6/#7 JSON domain rejection", () => {
  test("lone surrogate in a string rejects", () => {
    const p = loadJson("golden-01-minimal.json");
    p.engineVersion = "\ud800";
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });

  test("undefined-valued property is not silently dropped to match its absence", () => {
    const p = loadJson("golden-01-minimal.json");
    (p as J).engineVersion = undefined;
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });

  test("a Date value rejects rather than becoming {}", () => {
    const p = loadJson("golden-01-minimal.json");
    (p.coverage as J).supported = [];
    (p as J).extra = new Date(0) as unknown;
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });

  test("a toJSON-bearing object rejects", () => {
    const p = loadJson("golden-01-minimal.json");
    (p as J).extra = { toJSON: () => 1 } as unknown;
    expect(() => canonicalBytesStructural(p)).toThrow(CanonicalizationError);
  });
});

// --- Adversarial review (W2): recursion depth capped, never a raw RangeError ------------
// At depth ~10k, JSON.parse succeeds but the jcs recursion overflows and a raw RangeError
// escaped policyTrustFromBytes / manifestContentHash (probed empirically). The domain
// guard now rejects past a deterministic nesting cap BEFORE any deeper recursion runs, so
// every entry point fails typed at the same depth on every platform.
describe("adversarial review: nesting depth cap (fail closed, no RangeError escape)", () => {
  const nested = (depth: number): unknown => JSON.parse("[".repeat(depth) + "0" + "]".repeat(depth));

  const deepManifestBytes = (depth: number): Uint8Array => {
    const m = fullManifest();
    const json = JSON.stringify(m);
    return new TextEncoder().encode(
      `${json.slice(0, -1)},"deep":${"[".repeat(depth)}0${"]".repeat(depth)}}`,
    );
  };

  test("jcsSerialize rejects past the cap with nesting_depth_exceeded, accepts at the cap", () => {
    expect(() => jcsSerialize(nested(1024))).not.toThrow();
    let caught: unknown;
    try {
      jcsSerialize(nested(1025));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CanonicalizationError);
    expect((caught as CanonicalizationError).code).toBe("nesting_depth_exceeded");
  });

  test("manifestContentHash on an over-deep manifest fails typed, not RangeError", () => {
    const m = fullManifest();
    m.deep = nested(10_000);
    let caught: unknown;
    try {
      manifestContentHash(m);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CanonicalizationError);
    expect((caught as CanonicalizationError).code).toBe("nesting_depth_exceeded");
  });

  test("policyTrustFromBytes returns a typed invalid block at every depth — nothing escapes", () => {
    for (const depth of [2_000, 10_000, 50_000, 200_000]) {
      const block = policyTrustFromBytes(
        deepManifestBytes(depth),
        { trustPolicyId: "tp", approvedHashes: [] },
        [],
      );
      expect(block.state).toBe("invalid");
      expect(["non_json_manifest", "malformed_json"]).toContain(block.reasonCodes[0]);
    }
  });
});
