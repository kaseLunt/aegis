// W2 manifest model + trust root (ENGINEERING_SPEC §Manifest model, §Manifest trust root;
// THREAT_MODEL adversarial tests 6 and 30). Core security property under test: a
// structurally valid, self-consistent manifest with any amount of authoritative-looking
// reviewer metadata can NEVER become trusted unless its content hash is in the
// deployment-configured approved set.
import { describe, expect, test } from "vitest";
import {
  ManifestError,
  checkApplicability,
  evaluateTrust,
  loadManifest,
  manifestContentHash,
} from "../lib/aegis/manifest/trust";

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
    const loaded = loadManifest(validManifest());
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
});

describe("trust root (adversarial test 30)", () => {
  test("hash in the approved set evaluates trusted", () => {
    const loaded = loadManifest(validManifest());
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [loaded.contentHash] });
    expect(t.state).toBe("trusted");
    expect(t.manifestHash).toBe(loaded.contentHash);
  });

  test("structurally valid but unapproved manifest is untrusted with manifest_hash_not_approved", () => {
    const loaded = loadManifest(validManifest());
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [sha("0")] });
    expect(t.state).toBe("untrusted");
    expect(t.reasonCodes).toContain("manifest_hash_not_approved");
  });

  test("fabricated reviewer metadata can never flip untrusted to trusted", () => {
    const m = validManifest();
    m.reviewers = ["chief-security-officer", "external-auditor", "the-owner-definitely"];
    m.author = "official ether.fi release process";
    const loaded = loadManifest(m);
    const t = evaluateTrust(loaded, { trustPolicyId: "tp-1", approvedHashes: [sha("0")] });
    expect(t.state).toBe("untrusted");
  });

  test("reviewer fields are non-authenticating both ways (property)", () => {
    // Mutating author/reviewers changes the hash (they are content) but the trust DECISION
    // depends only on set membership — approved base stays trusted, unapproved stays not.
    const base = loadManifest(validManifest());
    const policy = { trustPolicyId: "tp-1", approvedHashes: [base.contentHash] };
    const mutated = validManifest();
    mutated.reviewers = ["someone-else"];
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

  test("a block inside the validity window on a covered chain is applicable", () => {
    const loaded = loadManifest(validManifest());
    expect(checkApplicability(loaded, boundary(1, "25577369"))).toEqual({ applicable: true, reasonCodes: [] });
  });

  test("a block before fromBlock is inapplicable with manifest_not_yet_valid", () => {
    const loaded = loadManifest(validManifest());
    const r = checkApplicability(loaded, boundary(1, "24999999"));
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("manifest_not_yet_valid");
  });

  test("a chain the manifest does not cover is inapplicable with chain_not_covered", () => {
    const loaded = loadManifest(validManifest());
    const r = checkApplicability(loaded, boundary(42161, "1000"));
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("chain_not_covered");
  });

  test("a block past an expiring toBlock is inapplicable with manifest_expired", () => {
    const m = validManifest();
    (m.validity as J).toBlock = { chainId: 1, number: "26000000" };
    const loaded = loadManifest(m);
    const r = checkApplicability(loaded, boundary(1, "26000001"));
    expect(r.applicable).toBe(false);
    expect(r.reasonCodes).toContain("manifest_expired");
  });
});
