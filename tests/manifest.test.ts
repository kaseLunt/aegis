// W2 manifest model + trust root (ENGINEERING_SPEC §Manifest model, §Manifest trust root;
// THREAT_MODEL adversarial tests 6 and 30). Core security property under test: a
// structurally valid, self-consistent manifest with any amount of authoritative-looking
// reviewer metadata can NEVER become trusted unless its content hash is in the
// deployment-configured approved set.
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  ManifestError,
  checkApplicability,
  evaluateTrust,
  loadManifest,
  manifestContentHash,
  policyTrustFromBytes,
} from "../lib/aegis/manifest/trust";
import { validateReport } from "../lib/aegis/report/canonical";

const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
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
    policyRefs: [
      { kind: "finality", id: "fin-1", version: "1", contentHash: sha("a") },
      { kind: "provider_quorum", id: "pq-1", version: "1", contentHash: sha("b") },
    ],
    targets: [
      {
        targetId: "l1-oft-adapter",
        chainId: 1,
        address: `0x${"c".repeat(40)}`,
        identityStrategy: "eip1967",
        expectedImplementation: `0x${"d".repeat(40)}`,
        expectedRuntimeCodeHash: sha("e"),
      },
    ],
    invariantIds: ["deployment.code_identity"],
    uncovered: ["consensus-layer state"],
  };
}

// A loadable manifest embeds its own content hash (required by the corrected contract).
function sealedManifest(): J {
  const m = validManifest();
  m.contentHash = manifestContentHash(m);
  return m;
}

describe("content addressing", () => {
  test("manifestContentHash is stable under key order and excludes the embedded hash", () => {
    const m = validManifest();
    const reordered = JSON.parse(JSON.stringify(m)) as J;
    delete reordered.schemaVersion;
    reordered.schemaVersion = "1"; // move key to the end
    expect(manifestContentHash(m)).toBe(manifestContentHash(reordered));
    const withHash = { ...validManifest(), contentHash: manifestContentHash(m) };
    expect(manifestContentHash(withHash)).toBe(manifestContentHash(m));
  });

  test("any content change changes the hash", () => {
    const a = manifestContentHash(validManifest());
    const m = validManifest();
    (m.targets as J[])[0].expectedRuntimeCodeHash = sha("f");
    expect(manifestContentHash(m)).not.toBe(a);
  });
});

describe("loading and integrity", () => {
  test("a valid manifest loads and reports its computed content hash", () => {
    const loaded = loadManifest(sealedManifest());
    expect(loaded.contentHash).toBe(manifestContentHash(validManifest()));
  });

  test("missing mandatory field is invalid and never evaluated", () => {
    const m = validManifest();
    delete m.targets;
    expect(() => loadManifest(m)).toThrow(ManifestError);
    try {
      loadManifest(m);
    } catch (e) {
      expect((e as ManifestError).code).toBe("missing_mandatory_field");
    }
  });

  test("embedded hash that mismatches computed content is invalid (integrity_mismatch)", () => {
    const m = { ...validManifest(), contentHash: sha("9") };
    expect(() => loadManifest(m)).toThrow(ManifestError);
    try {
      loadManifest(m);
    } catch (e) {
      expect((e as ManifestError).code).toBe("integrity_mismatch");
    }
  });

  // Adversarial review: set-like manifest fields must reject duplicates (W1 canonical-form
  // convention) — otherwise normalizeManifest's stable sort preserves input order on ties
  // and two orderings of the "same" manifest hash differently, breaking order-invariance.
  const expectInvalid = (mutate: (m: J) => void, code: string) => {
    const m = validManifest();
    mutate(m);
    m.contentHash = manifestContentHash(m); // sealed, so the set-member check is what rejects
    try {
      loadManifest(m);
      expect.unreachable("expected loadManifest to reject");
    } catch (e) {
      expect(e).toBeInstanceOf(ManifestError);
      expect((e as ManifestError).code).toBe(code);
    }
  };

  test("duplicate chainIds are rejected (duplicate_set_member)", () => {
    expectInvalid((m) => void (m.chainIds = [1, 10, 1]), "duplicate_set_member");
  });

  test("duplicate invariantIds are rejected (duplicate_set_member)", () => {
    expectInvalid(
      (m) => void (m.invariantIds = ["deployment.code_identity", "deployment.code_identity"]),
      "duplicate_set_member",
    );
  });

  test("non-string invariantIds/uncovered members are rejected (invalid_set_member)", () => {
    expectInvalid((m) => void (m.invariantIds = ["a", 1]), "invalid_set_member");
    expectInvalid((m) => void (m.uncovered = [{ surface: "x" }]), "invalid_set_member");
  });

  test("duplicate uncovered surfaces are rejected (duplicate_set_member)", () => {
    expectInvalid((m) => void (m.uncovered = ["x", "x"]), "duplicate_set_member");
  });

  test("policyRefs sharing (kind, id, version) identity are rejected even with different content hashes", () => {
    expectInvalid((m) => {
      (m.policyRefs as J[]).push({ kind: "finality", id: "fin-1", version: "1", contentHash: sha("d") });
    }, "duplicate_set_member");
  });

  test("duplicate targetIds are rejected (duplicate_set_member)", () => {
    expectInvalid((m) => {
      const t = { ...(m.targets as J[])[0] };
      (m.targets as J[]).push(t);
    }, "duplicate_set_member");
  });
});

describe("trust root (adversarial test 30)", () => {
  test("hash in the approved set evaluates trusted", () => {
    const loaded = loadManifest(sealedManifest());
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [loaded.contentHash] });
    expect(t.state).toBe("trusted");
    expect(t.manifestHash).toBe(loaded.contentHash);
  });

  test("structurally valid but unapproved manifest is untrusted with manifest_hash_not_approved", () => {
    const loaded = loadManifest(sealedManifest());
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [sha("0")] });
    expect(t.state).toBe("untrusted");
    expect(t.reasonCodes).toContain("manifest_hash_not_approved");
  });

  test("fabricated reviewer metadata can never flip untrusted to trusted", () => {
    const m = validManifest();
    m.reviewers = ["chief-security-officer", "external-auditor", "the-owner-definitely"];
    m.author = "official ether.fi release process";
    m.contentHash = manifestContentHash(m);
    const loaded = loadManifest(m);
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [sha("0")] });
    expect(t.state).toBe("untrusted");
  });

  test("reviewer fields are non-authenticating both ways (property)", () => {
    // Mutating author/reviewers changes the hash (they are content) but the trust DECISION
    // depends only on set membership — approved base stays trusted, unapproved stays not.
    const base = loadManifest(sealedManifest());
    const policy = { trustPolicyId: "tp-1", approvedHashes: [base.contentHash] };
    const mutated = validManifest();
    mutated.reviewers = ["someone-else"];
    mutated.contentHash = manifestContentHash(mutated);
    const loadedMutated = loadManifest(mutated);
    expect(evaluateTrust(base, policy).state).toBe("trusted");
    expect(evaluateTrust(loadedMutated, policy).state).toBe("untrusted");
  });
});

describe("applicability (adversarial test 6)", () => {
  const boundary = (chainId: number, number: string) => ({
    kind: "execution_block" as const,
    block: { chainId, number, hash: `0x${"a".repeat(64)}`, parentHash: `0x${"b".repeat(64)}`, timestamp: "2026-07-22T00:00:00Z", finality: "finalized" as const },
  });
  const ENV = "mainnet"; // validManifest() declares environment "mainnet"

  test("a block inside the validity window on a covered chain is applicable", () => {
    const loaded = loadManifest(sealedManifest());
    expect(checkApplicability(loaded, boundary(1, "25577369"), ENV)).toEqual({ applicable: true, reasonCodes: [] });
  });

  test("a block before fromBlock is inapplicable with manifest_not_yet_valid", () => {
    const loaded = loadManifest(sealedManifest());
    const r = checkApplicability(loaded, boundary(1, "24999999"), ENV);
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("manifest_not_yet_valid");
  });

  test("a chain the manifest does not cover is inapplicable with chain_not_covered", () => {
    const loaded = loadManifest(sealedManifest());
    const r = checkApplicability(loaded, boundary(42161, "1000"), ENV);
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("chain_not_covered");
  });

  test("a block past an expiring toBlock is inapplicable with manifest_expired", () => {
    const m = validManifest();
    (m.validity as J).toBlock = { chainId: 1, number: "26000000" };
    m.contentHash = manifestContentHash(m);
    const loaded = loadManifest(m);
    const r = checkApplicability(loaded, boundary(1, "26000001"), ENV);
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("manifest_expired");
  });

  test("a deployment environment differing from the manifest's is inapplicable with environment_mismatch", () => {
    const loaded = loadManifest(sealedManifest());
    const r = checkApplicability(loaded, boundary(1, "25577369"), "testnet");
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("environment_mismatch");
  });

  // Adversarial-review P1: cmpDecimal is length-then-lex and only sound for MINIMAL
  // decimals. A zero-padded boundary number ("0024999999" < fromBlock numerically) would
  // otherwise compare as LARGER than every shorter bound and silently apply (fail-open).
  // Malformed caller input must be a typed failure (D-004 fail-closed).
  test("a non-minimal boundary block number fails closed (noncanonical_unsigned_decimal)", () => {
    const loaded = loadManifest(sealedManifest());
    expect(() => checkApplicability(loaded, boundary(1, "0024999999"), ENV)).toThrow(ManifestError);
    try {
      checkApplicability(loaded, boundary(1, "0024999999"), ENV);
    } catch (e) {
      expect((e as ManifestError).code).toBe("noncanonical_unsigned_decimal");
    }
  });

  test("a non-integer boundary chainId fails closed (invalid_chain_id)", () => {
    const loaded = loadManifest(sealedManifest());
    const b = boundary(1, "25577369");
    (b.block as unknown as J).chainId = "1";
    expect(() => checkApplicability(loaded, b, ENV)).toThrow(ManifestError);
    try {
      checkApplicability(loaded, b, ENV);
    } catch (e) {
      expect((e as ManifestError).code).toBe("invalid_chain_id");
    }
  });
});

// The policyTrust block is the report payload's trust axis (ENGINEERING_SPEC
// AssurancePayload.policyTrust). These tests prove the wiring by embedding the produced
// block in a fully-formed payload and running W1's strict validateReport over it — shape
// compatibility is demonstrated, not asserted.
describe("policyTrust wiring into the report payload", () => {
  const sealedBytes = (): Uint8Array => new TextEncoder().encode(JSON.stringify(sealedManifest()));
  const bytesSha = (bytes: Uint8Array) =>
    `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

  const snapshotBoundary = {
    kind: "source_snapshot",
    snapshot: { sourceId: "data/manifests", contentHash: sha("6") },
  };
  const validationEvidence = () => ({
    id: sha("2"),
    kind: "manifest",
    provenanceClass: "reference_scenario",
    sourceMode: "recorded",
    boundary: snapshotBoundary,
    rawResultHash: sha("7"),
    capturedAt: "2026-07-22T00:00:00Z",
  });

  const executionBoundary = {
    kind: "execution_block",
    block: {
      chainId: 1, number: "25577369", hash: `0x${"a".repeat(64)}`,
      parentHash: `0x${"b".repeat(64)}`, timestamp: "2026-07-22T00:00:00Z",
      finality: "finalized",
    },
  };

  function payloadWith(block: J): J {
    return {
      schemaVersion: "1",
      engineVersion: "1",
      evaluationTime: "2026-07-22T00:00:01Z",
      manifestVersion: "1",
      manifestHash: block.manifestHash,
      policyRefs: [],
      policyTrust: block,
      sourceMode: "recorded",
      requestHash: sha("1"),
      observationBoundaries: [executionBoundary],
      evidence: [validationEvidence()],
      verifications: [],
      facts: [],
      coverage: { supported: [], unsupported: [], excluded: [] },
      limitations: [],
    };
  }

  test("an approved manifest produces a trusted block that passes strict report validation", () => {
    const bytes = sealedBytes();
    const block = policyTrustFromBytes(
      bytes,
      { trustPolicyId: "tp-1", approvedHashes: [manifestContentHash(validManifest())] },
      [validationEvidence()],
    );
    expect(block.state).toBe("trusted");
    expect(block.manifestHash).toBe(manifestContentHash(validManifest()));
    expect(block.reasonCodes).toEqual(["approved_hash"]);
    expect(() => validateReport(payloadWith(block as unknown as J))).not.toThrow();
  });

  test("an unapproved manifest produces an untrusted block that passes strict report validation", () => {
    const block = policyTrustFromBytes(
      sealedBytes(),
      { trustPolicyId: "tp-1", approvedHashes: [sha("0")] },
      [validationEvidence()],
    );
    expect(block.state).toBe("untrusted");
    expect(block.reasonCodes).toEqual(["manifest_hash_not_approved"]);
    expect(() => validateReport(payloadWith(block as unknown as J))).not.toThrow();
  });

  test("malformed bytes produce an invalid block anchored to the sha256 of the rejected bytes", () => {
    const bytes = new TextEncoder().encode('{"schemaVersion": ');
    const block = policyTrustFromBytes(
      bytes,
      { trustPolicyId: "tp-1", approvedHashes: [sha("0")] },
      [validationEvidence()],
    );
    expect(block.state).toBe("invalid");
    expect(block.reasonCodes).toEqual(["malformed_json"]);
    expect(block.manifestHash).toBe(bytesSha(bytes));
    expect(() => validateReport(payloadWith(block as unknown as J))).not.toThrow();
  });

  test("a structurally invalid manifest is never evaluated: invalid block, typed reason", () => {
    const m = sealedManifest();
    delete m.targets;
    const bytes = new TextEncoder().encode(JSON.stringify(m));
    // Approving the (would-be) hash changes nothing: an invalid manifest cannot be trusted.
    const block = policyTrustFromBytes(
      bytes,
      { trustPolicyId: "tp-1", approvedHashes: [String(m.contentHash)] },
      [validationEvidence()],
    );
    expect(block.state).toBe("invalid");
    expect(block.reasonCodes).toEqual(["missing_mandatory_field"]);
  });

  test("tampered content under an APPROVED embedded hash is invalid, never trusted (end-to-end)", () => {
    // The adversary keeps the approved manifest's embedded contentHash but edits the
    // content. Even with that hash in the approved set, the block must come out invalid
    // (integrity_mismatch) — approval of a hash is not approval of whatever carries it.
    const m = sealedManifest();
    const approvedHash = String(m.contentHash);
    m.protocol = "not-etherfi"; // content no longer matches the embedded (approved) hash
    const bytes = new TextEncoder().encode(JSON.stringify(m));
    const block = policyTrustFromBytes(
      bytes,
      { trustPolicyId: "tp-1", approvedHashes: [approvedHash] },
      [validationEvidence()],
    );
    expect(block.state).toBe("invalid");
    expect(block.reasonCodes).toEqual(["integrity_mismatch"]);
    expect(block.state).not.toBe("trusted");
  });

  test("the block carries the caller-supplied validation evidence untouched", () => {
    const ev = validationEvidence();
    const block = policyTrustFromBytes(
      sealedBytes(),
      { trustPolicyId: "tp-1", approvedHashes: [sha("0")] },
      [ev],
    );
    expect(block.evidence).toEqual([ev]);
  });
});
