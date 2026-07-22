// W3 slice 3b — the engine pass: recorded adapters → block selection → provider quorum,
// composing with W2's policyTrust into a payload W1's strict validateReport accepts.
// Key semantics under test:
//   - mixed mode (one provider finalized-tagged, one depth-fallback) pins at the
//     conservative MINIMUM and quorums both providers AT that number;
//   - the raw comparison covers consensus content only — `finality` is request-derived
//     annotation, so a tag difference can never fake a raw-result conflict;
//   - quorum failure means NO boundary (fail closed), with observations preserved.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { type RecordingBundle, loadRecordingBytes, recordedAdapter } from "../lib/aegis/chain/adapter";
import { establishBoundary } from "../lib/aegis/chain/engine";
import { PROVIDERS } from "../lib/aegis/chain/providers";
import { manifestContentHash, policyTrustFromBytes } from "../lib/aegis/manifest/trust";
import { jcsSerialize, reportHash, validateReport } from "../lib/aegis/report/canonical";

const REC = join(__dirname, "..", "data", "recordings");
const bundle = (): RecordingBundle =>
  loadRecordingBytes(readFileSync(join(REC, "reference-eth-op-heads.json")));

const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
const shaOf = (v: unknown) =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;

const POLICY = {
  quorum: { policyId: "pq-reference", requiredProviders: ["alchemy", "quicknode"], minAgreeing: 2 },
  confirmationDepth: "12",
};

const adapters = () => [
  recordedAdapter(bundle(), PROVIDERS.alchemy),
  recordedAdapter(bundle(), PROVIDERS.quicknode),
];

// Build a sealed in-memory bundle for divergence scenarios.
function sealedBundle(mutate: (b: RecordingBundle) => void): RecordingBundle {
  const b = JSON.parse(JSON.stringify(bundle())) as RecordingBundle;
  mutate(b);
  for (const r of b.responses) r.rawResponseSha256 = shaOf(r.result);
  return loadRecordingBytes(new TextEncoder().encode(JSON.stringify(b)));
}

describe("single-chain engine pass", () => {
  test("ETH: both providers finalized-tagged and agreeing pins the finalized boundary", async () => {
    const r = await establishBoundary(adapters(), 1, POLICY);
    expect(r.status).toBe("pinned");
    if (r.status !== "pinned") return;
    expect(r.boundary.block.number).toBe("25577369");
    expect(r.boundary.block.finality).toBe("finalized");
    expect(r.downgrades).toEqual([]);
    expect(r.quorum.outcome).toBe("agreement");
    expect(r.quorum.agreeingProviders).toEqual(["alchemy", "quicknode"]);
  });

  test("OP mixed mode: pins the conservative minimum with the downgrade exposed", async () => {
    const r = await establishBoundary(adapters(), 10, POLICY);
    expect(r.status).toBe("pinned");
    if (r.status !== "pinned") return;
    // alchemy finalized head is 154496611; quicknode fallback target is 154496599 —
    // the engine pins min(611, 599) and re-fetches alchemy AT 599.
    expect(r.boundary.block.number).toBe("154496599");
    expect(r.boundary.block.finality).toBe("confirmations");
    expect(r.downgrades).toEqual([{
      chainId: 10, requested: "finalized", used: "confirmations",
      confirmationDepth: "12", reasonCode: "finality_tag_unsupported",
    }]);
    expect(r.quorum.outcome).toBe("agreement");
  });

  test("a finality-tag difference alone never fakes a raw mismatch (annotation is stripped)", async () => {
    const r = await establishBoundary(adapters(), 10, POLICY);
    expect(r.status).toBe("pinned"); // alchemy@599 says finalized, quicknode@599 says confirmations
  });

  test("block-hash divergence at the pinned number is a conflict with NO boundary", async () => {
    const diverged = sealedBundle((b) => {
      const qnEth = b.responses.find((x) => x.providerId === "quicknode" && x.chainId === 1)!;
      (qnEth.result as { hash: string }).hash = `0x${"9".repeat(64)}`;
    });
    const r = await establishBoundary(
      [recordedAdapter(diverged, PROVIDERS.alchemy), recordedAdapter(diverged, PROVIDERS.quicknode)],
      1,
      POLICY,
    );
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.outcome).toBe("conflict");
    expect(r.quorum.reasonCodes).toContain("block_hash_mismatch");
  });

  test("a provider with no recording is missing evidence: unknown, no boundary, never a value", async () => {
    const withoutQn = sealedBundle((b) => {
      b.responses = b.responses.filter((x) => !(x.providerId === "quicknode" && x.chainId === 1));
    });
    const r = await establishBoundary(
      [recordedAdapter(withoutQn, PROVIDERS.alchemy), recordedAdapter(withoutQn, PROVIDERS.quicknode)],
      1,
      POLICY,
    );
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.outcome).toBe("unknown");
    expect(r.quorum.missingProviders).toEqual(["quicknode"]);
  });

  test("observations are deterministic and provider-sorted", async () => {
    const a = await establishBoundary(adapters(), 1, POLICY);
    const b = await establishBoundary([...adapters()].reverse(), 1, POLICY);
    expect(b).toEqual(a);
    expect(a.observations.map((o) => o.providerId)).toEqual(["alchemy", "quicknode"]);
  });
});

describe("W1+W2+W3 composition: the engine output is canonical-report material", () => {
  test("boundaries + trusted policy block assemble into a payload validateReport accepts", async () => {
    const eth = await establishBoundary(adapters(), 1, POLICY);
    const op = await establishBoundary(adapters(), 10, POLICY);
    expect(eth.status).toBe("pinned");
    expect(op.status).toBe("pinned");
    if (eth.status !== "pinned" || op.status !== "pinned") return;

    const manifestBytes = readFileSync(join(__dirname, "..", "data", "manifests", "reference-code-identity.json"));
    const manifestHash = manifestContentHash(
      JSON.parse(new TextDecoder().decode(manifestBytes)),
    );
    const b = bundle();
    const evidence = [eth, op].flatMap((r) =>
      r.observations.map((o) => ({
        id: shaOf({ providerId: o.providerId, boundary: r.boundary, kind: "head" }),
        kind: "rpc_call",
        provenanceClass: "reference_scenario",
        sourceMode: "recorded",
        providerId: o.providerId,
        method: "eth_getBlockByNumber",
        boundary: r.boundary,
        rawResultHash: o.rawResultHash,
        capturedAt: b.capturedAt,
      })),
    );
    const policyTrust = policyTrustFromBytes(
      manifestBytes,
      { trustPolicyId: "tp-reference", approvedHashes: [manifestHash] },
      [],
    );
    expect(policyTrust.state).toBe("trusted");

    const payload = {
      schemaVersion: "1",
      engineVersion: "1",
      evaluationTime: "2026-07-22T00:00:00Z",
      manifestVersion: "reference-code-identity@v1",
      manifestHash,
      policyRefs: [],
      policyTrust,
      sourceMode: "recorded",
      requestHash: sha("1"),
      observationBoundaries: [eth.boundary, op.boundary],
      evidence,
      verifications: [],
      facts: [],
      coverage: { supported: [], unsupported: [], excluded: [] },
      limitations: [{
        code: "reference_scenario",
        text: "Recorded reference fixture; not live production telemetry.",
      }],
    };
    expect(() => validateReport(payload)).not.toThrow();
    expect(reportHash(payload)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(reportHash(payload)).toBe(reportHash(JSON.parse(JSON.stringify(payload))));
  });
});
