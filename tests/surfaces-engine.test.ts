// W5 slice S0 — the engine facade: THE one engine every surface delegates to.
//
// Before this facade the W1+W2+W3 composition existed only inside tests/engine.test.ts, so
// each of the four M1 surfaces would have had to re-wire it — four chances to diverge on a
// hash that is supposed to be identical everywhere. runVerification is that composition
// promoted into production code: recordings -> adapters -> boundaries per chain -> policy
// trust -> canonical payload, with the report hashed by W1's strict path.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PROVIDERS } from "../lib/aegis/chain/providers";
import { manifestContentHash } from "../lib/aegis/manifest/trust";
import { reportHash, validateReport } from "../lib/aegis/report/canonical";
import { SurfaceError, runVerification } from "../lib/aegis/surfaces/engine";
import { requestHash } from "../lib/aegis/surfaces/request";

const DATA = join(__dirname, "..", "data");
const manifestBytes = () => readFileSync(join(DATA, "manifests", "reference-code-identity.json"));
const headsBytes = () => readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json"));
const identityBytes = () => readFileSync(join(DATA, "recordings", "reference-identity-reads.json"));

const SELECTOR = { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] } as const;

const inputs = () => ({
  manifestBytes: manifestBytes(),
  recordings: [{ role: "heads", bytes: headsBytes() }] as const,
});

const deployment = () => ({
  engineVersion: "aegis-core/0.1.0",
  environment: "reference",
  evaluationTime: "2026-07-24T00:00:00Z",
  provenanceClass: "reference_scenario",
  trustPolicy: {
    trustPolicyId: "tp-reference",
    approvedHashes: [manifestContentHash(JSON.parse(new TextDecoder().decode(manifestBytes())))],
  },
  boundaryPolicy: {
    quorum: { policyId: "pq-reference", requiredProviders: ["alchemy", "quicknode"], minAgreeing: 2 },
    confirmationDepth: "12",
    maxHeadLagBlocks: "1000",
  },
  providers: [PROVIDERS.alchemy, PROVIDERS.quicknode],
  freshnessPolicyId: "fp-reference",
});

describe("W5 S0 — runVerification", () => {
  test("a recorded run produces a canonical payload W1's strict validator accepts", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());

    expect(() => validateReport(run.payload)).not.toThrow();
    expect(run.reportHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("the emitted reportHash survives a JSON round-trip of the payload", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());

    expect(reportHash(JSON.parse(JSON.stringify(run.payload)))).toBe(run.reportHash);
  });

  test("the same inputs and clock yield the same reportHash on every run", async () => {
    const first = await runVerification(inputs(), SELECTOR, deployment());
    const second = await runVerification(inputs(), SELECTOR, deployment());

    expect(second.reportHash).toBe(first.reportHash);
  });

  test("the order providers are configured in does not change the reportHash", async () => {
    const forward = await runVerification(inputs(), SELECTOR, deployment());
    const reversed = await runVerification(inputs(), SELECTOR, {
      ...deployment(),
      providers: [PROVIDERS.quicknode, PROVIDERS.alchemy],
    });

    expect(reversed.reportHash).toBe(forward.reportHash);
  });

  test("the payload is inert frozen data, so a transport cannot mutate what was hashed", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());
    const payload = run.payload as Record<string, unknown>;

    expect(Object.isFrozen(payload)).toBe(true);
    expect(Object.isFrozen(payload.evidence)).toBe(true);
    expect(() => {
      (payload as { sourceMode: string }).sourceMode = "live";
    }).toThrow(TypeError);
    expect(reportHash(run.payload)).toBe(run.reportHash);
  });

  // A report that asserts boundaries but carries no evidence for them has lost its provenance:
  // the reader cannot tell WHICH provider observations put the pin where it is.
  test("each pinned boundary carries head evidence for every agreeing provider", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());
    const evidence = (run.payload as { evidence: { kind: string; providerId?: string }[] }).evidence;
    const heads = evidence.filter((e) => e.kind === "rpc_call");

    expect(heads).toHaveLength(4); // 2 chains x 2 agreeing providers
    expect([...new Set(heads.map((e) => e.providerId))].sort()).toEqual(["alchemy", "quicknode"]);
    expect(heads.every((e) => typeof (e as { capturedAt?: unknown }).capturedAt === "string")).toBe(true);
  });

  test("delivery metadata never enters the hashed payload", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());

    // The API envelope carries requestId/generatedAt AROUND the payload; anything extra inside
    // it would silently change the identity the four surfaces are supposed to agree on.
    expect(Object.keys(run.payload as object).sort()).toEqual(
      [
        "coverage", "engineVersion", "evaluationTime", "evidence", "facts", "limitations",
        "manifestHash", "manifestVersion", "observationBoundaries", "policyRefs", "policyTrust",
        "requestHash", "schemaVersion", "sourceMode", "verifications",
      ],
    );
  });

  test("the report's requestHash is the hash of the request the run actually derived", async () => {
    const run = await runVerification(inputs(), SELECTOR, deployment());

    expect((run.payload as { requestHash: string }).requestHash).toBe(requestHash(run.request));
  });

  test("a manifest that does not apply at the pinned boundary says so instead of applying", async () => {
    const run = await runVerification(inputs(), SELECTOR, { ...deployment(), environment: "production" });

    expect(run.diagnostics.applicability.flatMap((a) => a.reasonCodes)).toContain("environment_mismatch");
    expect((run.payload as { limitations: { code: string }[] }).limitations.map((l) => l.code))
      .toContain("manifest_not_applicable");
    expect(() => validateReport(run.payload)).not.toThrow();
  });
});

// S1 — the manifest's targets are verified, and the targets come from the TRUSTED manifest
// rather than from anything a caller supplied.
//
// Note what the shipped fixtures do here: the reference manifest declares targets at
// 0xcccc... (chain 1, eip1967) and 0xeeee... (chain 10, direct), while
// reference-identity-reads.json records reads for 0xa1a1.../0xb2b2... on chain 1 only. So no
// declared target has recorded evidence, and the honest outcome is `unknown` on every
// expectation. That is the correct result to assert — a matched manifest/recording pair for a
// genuine `pass` is a scenario fixture, which is W6's deliverable, not W5's.
describe("W5 S1 — identity verifications from the trusted manifest", () => {
  const withIdentity = () => ({
    manifestBytes: manifestBytes(),
    recordings: [
      { role: "heads", bytes: headsBytes() },
      { role: "identity", bytes: identityBytes() },
    ] as const,
  });

  test("every declared manifest expectation becomes its own verification", async () => {
    const run = await runVerification(withIdentity(), SELECTOR, deployment());
    const verifications = (run.payload as { verifications: { invariantId: string }[] }).verifications;

    expect(verifications.map((v) => v.invariantId).sort()).toEqual([
      "deployment.code_identity/reference-direct/runtime_code_hash",
      "deployment.code_identity/reference-eip1967-proxy/implementation",
      "deployment.code_identity/reference-eip1967-proxy/runtime_code_hash",
    ]);
  });

  test("a target with no recorded evidence can never pass", async () => {
    const run = await runVerification(withIdentity(), SELECTOR, deployment());
    const verifications = (run.payload as { verifications: { state: string }[] }).verifications;

    expect(verifications.length).toBeGreaterThan(0);
    expect(verifications.map((v) => v.state)).not.toContain("pass");
  });

  test("the verified report still satisfies the strict validator and hash round-trip", async () => {
    const run = await runVerification(withIdentity(), SELECTOR, deployment());

    expect(() => validateReport(run.payload)).not.toThrow();
    expect(reportHash(JSON.parse(JSON.stringify(run.payload)))).toBe(run.reportHash);
  });

  // Partial degradation: one chain pins, the other does not. The target on the unresolved chain
  // must be SURFACED as unevaluated — silently omitting it would read as "checked and fine".
  test("a target on an unresolved chain is reported unevaluated, not quietly dropped", async () => {
    const doc = JSON.parse(new TextDecoder().decode(headsBytes())) as {
      responses: { providerId: string; chainId: number }[];
    };
    doc.responses = doc.responses.filter((r) => !(r.providerId === "quicknode" && r.chainId === 10));
    const partial = new TextEncoder().encode(JSON.stringify(doc));

    const run = await runVerification(
      {
        manifestBytes: manifestBytes(),
        recordings: [
          { role: "heads", bytes: partial },
          { role: "identity", bytes: identityBytes() },
        ],
      },
      SELECTOR,
      deployment(),
    );
    const payload = run.payload as {
      verifications: { invariantId: string }[];
      limitations: { code: string; text: string }[];
    };

    // Chain 10 never pinned, so its target could not be evaluated...
    expect(run.diagnostics.boundaries.find((b) => b.chainId === 10)?.status).toBe("unresolved");
    const unevaluated = payload.limitations.filter((l) => l.code === "target_boundary_unavailable");
    expect(unevaluated).toHaveLength(1);
    expect(unevaluated[0].text).toContain("reference-direct");
    expect(payload.verifications.map((v) => v.invariantId)).not.toContain(
      "deployment.code_identity/reference-direct/runtime_code_hash",
    );
    // ...while chain 1 still pinned and was verified.
    expect(payload.verifications.map((v) => v.invariantId)).toContain(
      "deployment.code_identity/reference-eip1967-proxy/runtime_code_hash",
    );
    expect(() => validateReport(run.payload)).not.toThrow();
  });

  test("an untrusted manifest yields no verifications at all — targets are unreachable", async () => {
    const untrusting = { ...deployment(), trustPolicy: { trustPolicyId: "tp-x", approvedHashes: [] } };
    const run = await runVerification(withIdentity(), SELECTOR, untrusting);
    const payload = run.payload as { verifications: unknown[]; policyTrust: { state: string } };

    expect(payload.policyTrust.state).toBe("untrusted");
    expect(payload.verifications).toEqual([]);
  });
});

describe("W5 S0 — runVerification fails closed", () => {
  // Dropping one provider's responses entirely leaves quorum unable to reach agreement on any
  // requested chain. validateReport requires at least one observationBoundary, so there is no
  // honest report to emit — the run is a typed engine failure, never a report with no boundary.
  const withoutQuicknode = (): Uint8Array => {
    const doc = JSON.parse(new TextDecoder().decode(headsBytes())) as {
      responses: { providerId: string }[];
    };
    doc.responses = doc.responses.filter((r) => r.providerId !== "quicknode");
    return new TextEncoder().encode(JSON.stringify(doc));
  };

  test("a run whose every chain is unresolved refuses to emit a report", async () => {
    const attempt = runVerification(
      { manifestBytes: manifestBytes(), recordings: [{ role: "heads", bytes: withoutQuicknode() }] },
      SELECTOR,
      deployment(),
    );

    await expect(attempt).rejects.toThrow(SurfaceError);
    await expect(attempt).rejects.toMatchObject({ code: "no_observation_boundary" });
  });
});
