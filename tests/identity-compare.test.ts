// W4 slice 3 — manifest comparison producing W1-shaped Verifications + the
// code-hash-scoped ABI registry.
// Key semantics under test:
//   - every declared manifest expectation (expectedRuntimeCodeHash,
//     expectedImplementation) is flagged INDEPENDENTLY — one verification each, with
//     drift-requiring-review language, never proof-of-compromise claims;
//   - a mismatched or unknown identity can never produce pass; unknown observation
//     reasons travel as typed limitations;
//   - the ABI registry is keyed by runtime code hash and refuses selection until the
//     terminal hash matches — an unresolved identity can never select an ABI;
//   - composed output is W1-valid: strict validateReport accepts the full payload and
//     the report hash is deterministic.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadRecordingBytes, recordedAdapter } from "../lib/aegis/chain/adapter";
import { establishBoundary } from "../lib/aegis/chain/engine";
import { PROVIDERS } from "../lib/aegis/chain/providers";
import type { QuorumPolicy } from "../lib/aegis/chain/quorum";
import type { PinnedBlock } from "../lib/aegis/chain/selection";
import { createAbiRegistry, selectAbi } from "../lib/aegis/identity/abi";
import {
  CODE_IDENTITY_EVALUATOR_VERSION,
  compareIdentityTarget,
} from "../lib/aegis/identity/compare";
import { type ObservedIdentity, observeIdentity } from "../lib/aegis/identity/observe";
import type { IdentityResult } from "../lib/aegis/identity/resolve";
import { manifestContentHash, policyTrustFromBytes } from "../lib/aegis/manifest/trust";
import { jcsSerialize, reportHash, validateReport } from "../lib/aegis/report/canonical";

const REC = join(__dirname, "..", "data", "recordings");
const codeHash = (hex: string) =>
  `sha256:${createHash("sha256").update(Buffer.from(hex.slice(2), "hex")).digest("hex")}`;
const shaOf = (v: unknown) =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;

const PROXY = `0x${"a1".repeat(20)}`;
const IMPL = `0x${"b2".repeat(20)}`;
const IMPL_CODE = "0x608060405f";
const IMPL_CODE_HASH = codeHash(IMPL_CODE);

const PIN: PinnedBlock = {
  chainId: 1,
  number: "25577369",
  hash: "0x26997307bf47a13c29abb3e325fbb195cb9182632268f89a5627499f10f7afc7",
  parentHash: `0x${"11".repeat(32)}`,
  timestamp: "2026-07-20T23:59:59Z",
  finality: "finalized",
};

const QUORUM: QuorumPolicy = {
  policyId: "pq-reference",
  requiredProviders: ["alchemy", "quicknode"],
  minAgreeing: 2,
};

const MANIFEST_EV_ID = shaOf("manifest-evidence:identity-compare");
const CONTEXT = {
  provenanceClass: "reference_scenario",
  manifestEvidenceId: MANIFEST_EV_ID,
};

const TARGET = {
  targetId: "reference-eip1967-proxy",
  chainId: 1,
  address: PROXY,
  identityStrategy: "eip1967",
  expectedImplementation: IMPL,
  expectedRuntimeCodeHash: IMPL_CODE_HASH,
};

async function observedEip1967(): Promise<ObservedIdentity> {
  const identity = loadRecordingBytes(readFileSync(join(REC, "reference-identity-reads.json")));
  return observeIdentity(
    "eip1967",
    PROXY,
    [recordedAdapter(identity, PROVIDERS.alchemy), recordedAdapter(identity, PROVIDERS.quicknode)],
    PIN,
    QUORUM,
  );
}

const RESOLVED: IdentityResult = {
  strategy: "eip1967",
  status: "resolved",
  path: [
    { role: "proxy", address: PROXY },
    { role: "implementation", address: IMPL },
  ],
  terminalAddress: IMPL,
  runtimeCodeHash: IMPL_CODE_HASH,
  reasonCodes: [],
};

const UNKNOWN: IdentityResult = {
  strategy: "eip1967",
  status: "unknown",
  path: [],
  terminalAddress: null,
  runtimeCodeHash: null,
  reasonCodes: ["observation_unresolved"],
};

describe("code-hash-scoped ABI registry", () => {
  const registry = createAbiRegistry([
    { runtimeCodeHash: IMPL_CODE_HASH, abiId: "weeth-impl@v1" },
  ]);

  test("selection requires a resolved identity whose terminal hash matches the expectation", () => {
    const s = selectAbi(registry, RESOLVED, IMPL_CODE_HASH);
    expect(s).toEqual({ status: "selected", abiId: "weeth-impl@v1", runtimeCodeHash: IMPL_CODE_HASH });
  });

  test("an unresolved identity can NEVER select an ABI, whatever the registry holds", () => {
    for (const reason of ["observation_unresolved", "code_absent", "implementation_slot_empty"]) {
      const s = selectAbi(registry, { ...UNKNOWN, reasonCodes: [reason] }, IMPL_CODE_HASH);
      expect(s.status).toBe("refused");
      if (s.status === "refused") expect(s.reasonCodes).toEqual(["identity_unresolved"]);
    }
  });

  test("a resolved identity with an unregistered hash is refused, never approximated", () => {
    const unregistered = `sha256:${"9".repeat(64)}`;
    const s = selectAbi(registry, { ...RESOLVED, runtimeCodeHash: unregistered }, unregistered);
    expect(s.status).toBe("refused");
    if (s.status === "refused") expect(s.reasonCodes).toEqual(["abi_unregistered"]);
  });

  test("registry construction rejects malformed hashes and duplicates", () => {
    expect(() => createAbiRegistry([{ runtimeCodeHash: "sha256:short", abiId: "x" }]))
      .toThrow(/invalid_registry_entry/);
    expect(() => createAbiRegistry([{ runtimeCodeHash: IMPL_CODE_HASH, abiId: "" }]))
      .toThrow(/invalid_registry_entry/);
    expect(() =>
      createAbiRegistry([
        { runtimeCodeHash: IMPL_CODE_HASH, abiId: "a" },
        { runtimeCodeHash: IMPL_CODE_HASH, abiId: "b" },
      ]),
    ).toThrow(/duplicate_registry_hash/);
  });
});

describe("manifest comparison — W1-shaped verifications", () => {
  test("matching identity: one independent pass per declared expectation", async () => {
    const observed = await observedEip1967();
    const { verifications, evidence } = compareIdentityTarget(TARGET, observed, PIN, CONTEXT);
    expect(verifications).toHaveLength(2);
    const byId = new Map(verifications.map((v) => [v.invariantId, v]));
    const hash = byId.get(`deployment.code_identity/${TARGET.targetId}/runtime_code_hash`)!;
    const impl = byId.get(`deployment.code_identity/${TARGET.targetId}/implementation`)!;
    expect(hash.state).toBe("pass");
    expect(hash.expected).toBe(IMPL_CODE_HASH);
    expect(hash.actual).toBe(IMPL_CODE_HASH);
    expect(impl.state).toBe("pass");
    expect(impl.actual).toBe(IMPL);
    expect(evidence.length).toBeGreaterThan(0);
    const ids = new Set(evidence.map((e) => e.id));
    for (const v of verifications) {
      expect(v.actualEvidenceIds.length).toBeGreaterThan(0);
      for (const id of v.actualEvidenceIds) expect(ids.has(id)).toBe(true);
      expect(v.evaluatorVersion).toBe(CODE_IDENTITY_EVALUATOR_VERSION);
    }
  });

  test("a hash mismatch fails ONLY the hash expectation, with drift language", async () => {
    const observed = await observedEip1967();
    const drifted = { ...TARGET, expectedRuntimeCodeHash: `sha256:${"7".repeat(64)}` };
    const { verifications } = compareIdentityTarget(drifted, observed, PIN, CONTEXT);
    const byId = new Map(verifications.map((v) => [v.invariantId, v]));
    const hash = byId.get(`deployment.code_identity/${TARGET.targetId}/runtime_code_hash`)!;
    const impl = byId.get(`deployment.code_identity/${TARGET.targetId}/implementation`)!;
    expect(hash.state).toBe("fail");
    expect(hash.statement).toContain("Drift requiring review");
    expect(hash.statement).toContain("authorized upgrade");
    expect(hash.statement.toLowerCase()).not.toContain("compromised");
    expect(impl.state).toBe("pass");
  });

  test("an unknown identity can never produce pass; the reason travels as a limitation", async () => {
    const observed: ObservedIdentity = { identity: UNKNOWN, reads: [] };
    const { verifications } = compareIdentityTarget(TARGET, observed, PIN, CONTEXT);
    expect(verifications).toHaveLength(2);
    for (const v of verifications) {
      expect(v.state).toBe("unknown");
      expect(v.limitations).toEqual([
        { code: "observation_unresolved", text: expect.stringContaining("unresolved") as unknown as string },
      ]);
    }
  });

  test("derivation-typed unknowns (code_absent, slot empty) also stay unknown, never fail", async () => {
    for (const reason of ["code_absent", "implementation_slot_empty", "not_eip1167_clone"]) {
      const observed: ObservedIdentity = {
        identity: { ...UNKNOWN, reasonCodes: [reason] },
        reads: [],
      };
      const { verifications } = compareIdentityTarget(TARGET, observed, PIN, CONTEXT);
      for (const v of verifications) {
        expect(v.state).toBe("unknown");
        expect(v.limitations[0].code).toBe(reason);
      }
    }
  });

  test("a target declaring only expectedRuntimeCodeHash yields exactly one verification", async () => {
    const observed = await observedEip1967();
    const only = {
      targetId: "hash-only",
      chainId: 1,
      address: PROXY,
      identityStrategy: "eip1967",
      expectedRuntimeCodeHash: IMPL_CODE_HASH,
    };
    const { verifications } = compareIdentityTarget(only, observed, PIN, CONTEXT);
    expect(verifications).toHaveLength(1);
    expect(verifications[0].invariantId).toBe("deployment.code_identity/hash-only/runtime_code_hash");
  });

  test("caller defects are typed errors: wrong chain, wrong root address, malformed target", async () => {
    const observed = await observedEip1967();
    expect(() => compareIdentityTarget({ ...TARGET, chainId: 10 }, observed, PIN, CONTEXT))
      .toThrow(/target_chain_mismatch/);
    expect(() =>
      compareIdentityTarget({ ...TARGET, address: `0x${"55".repeat(20)}` }, observed, PIN, CONTEXT),
    ).toThrow(/target_address_mismatch/);
    expect(() =>
      compareIdentityTarget({ ...TARGET, expectedRuntimeCodeHash: "keccak:nope" }, observed, PIN, CONTEXT),
    ).toThrow(/invalid_target/);
    expect(() =>
      compareIdentityTarget({ ...TARGET, address: "0xNOT" }, observed, PIN, CONTEXT),
    ).toThrow(/invalid_target/);
  });

  test("evidence refs carry the read provenance: kinds, methods, pinned boundary", async () => {
    const observed = await observedEip1967();
    const { evidence } = compareIdentityTarget(TARGET, observed, PIN, CONTEXT);
    const kinds = new Set(evidence.map((e) => e.kind));
    expect(kinds).toEqual(new Set(["rpc_call", "storage_read"]));
    for (const e of evidence) {
      expect(e.boundary).toEqual({ kind: "execution_block", block: PIN });
      expect(e.rawResultHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(e.sourceMode).toBe("recorded");
    }
  });
});

describe("end-to-end: W1-valid payload from boundary + identity + manifest", () => {
  test("strict validateReport accepts the composed payload; hash is deterministic", async () => {
    const heads = loadRecordingBytes(readFileSync(join(REC, "reference-eth-op-heads.json")));
    const boundary = await establishBoundary(
      [recordedAdapter(heads, PROVIDERS.alchemy), recordedAdapter(heads, PROVIDERS.quicknode)],
      1,
      { quorum: QUORUM, confirmationDepth: "12", maxHeadLagBlocks: "1000" },
    );
    expect(boundary.status).toBe("pinned");
    if (boundary.status !== "pinned") return;

    const observed = await observedEip1967();
    const { verifications, evidence } = compareIdentityTarget(
      TARGET,
      observed,
      boundary.boundary.block,
      CONTEXT,
    );
    expect(verifications.every((v) => v.state === "pass")).toBe(true);

    // Full W2 manifest shape: the committed reference manifest with our target swapped
    // in and the content hash re-sealed (the loader verifies embedded integrity).
    const manifest = JSON.parse(
      new TextDecoder().decode(
        readFileSync(join(__dirname, "..", "data", "manifests", "reference-code-identity.json")),
      ),
    ) as Record<string, unknown>;
    manifest.manifestVersion = "identity-compare-e2e@v1";
    manifest.targets = [TARGET];
    manifest.contentHash = manifestContentHash(manifest);
    const manifestBytes = Buffer.from(JSON.stringify(manifest), "utf-8");
    const manifestHash = manifestContentHash(manifest);
    const policyTrust = policyTrustFromBytes(
      manifestBytes,
      { trustPolicyId: "tp-reference", approvedHashes: [manifestHash] },
      [],
    );
    expect(policyTrust.state).toBe("trusted");

    // The manifest itself is expected-side evidence (kind "manifest"), carrying the id
    // every verification's expectedEvidenceIds names.
    const manifestEvidence = {
      id: MANIFEST_EV_ID,
      kind: "manifest",
      provenanceClass: "reference_scenario",
      sourceMode: "recorded",
      boundary: {
        kind: "source_snapshot",
        snapshot: { sourceId: "manifest", contentHash: manifestHash },
      },
      rawResultHash: manifestHash,
      capturedAt: "2026-07-22T00:00:00Z",
    };
    const payload = {
      schemaVersion: "1",
      engineVersion: "1",
      evaluationTime: "2026-07-22T00:00:00Z",
      manifestVersion: manifest.manifestVersion,
      manifestHash,
      policyRefs: [],
      policyTrust,
      sourceMode: "recorded",
      requestHash: shaOf("identity-compare-e2e"),
      observationBoundaries: [boundary.boundary],
      evidence: [manifestEvidence, ...evidence],
      verifications,
      facts: [],
      coverage: { supported: ["deployment.code_identity"], unsupported: [], excluded: [] },
      limitations: [{
        code: "reference_scenario",
        text: "Recorded reference fixture; not live production telemetry.",
      }],
    };
    expect(() => validateReport(payload)).not.toThrow();
    expect(reportHash(payload)).toBe(reportHash(JSON.parse(JSON.stringify(payload))));
  });
});
