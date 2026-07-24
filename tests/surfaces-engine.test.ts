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
