// W6-S1 — the corpus conformance harness (W6 plan §2). Two duties per scenario:
// (1) CONFORMANCE — the on-disk fixture is byte-identical to what its committed spec
//     derives through the authoring recipes (a fixture can never drift from its
//     disclosed recipe, and every fixture is authored-not-mysterious);
// (2) DECLARED OUTCOME — the fixture produces exactly its declared verdicts and
//     classification through the unmodified W5 facade, with four-surface hash parity
//     (the J5 idiom): the corpus cannot green on one transport and diverge on another.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { POST } from "../app/api/v1/verify/route";
import { runCiVerification } from "../lib/aegis/surfaces/ci";
import { loadEvidenceDrawer } from "../lib/aegis/surfaces/drawer";
import { runVerification } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
import { exitCodeForPayload } from "../lib/aegis/surfaces/render";
import {
  REFERENCE_HEADS,
  REFERENCE_IDENTITY,
  SCENARIOS,
  scenarioManifestBytes,
  scenarioManifestPath,
} from "./corpus-recipes";

const HEADS_BYTES = new Uint8Array(readFileSync(REFERENCE_HEADS));
const IDENTITY_BYTES = new Uint8Array(readFileSync(REFERENCE_IDENTITY));

function b64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

describe("W6 S1 — L. scenario corpus conformance", () => {
  for (const spec of SCENARIOS) {
    test(`L-conformance [${spec.scenarioId}]: the on-disk fixture is byte-identical to its committed spec`, () => {
      const derived = scenarioManifestBytes(spec);
      const onDisk = new Uint8Array(readFileSync(scenarioManifestPath(spec)));
      expect(Buffer.from(onDisk).equals(Buffer.from(derived))).toBe(true);
    });

    test(`L-outcome [${spec.scenarioId}]: declared verdicts and classification on all four surfaces, one hash`, async () => {
      const manifestBytes = new Uint8Array(readFileSync(scenarioManifestPath(spec)));
      const inputs = {
        manifestBytes,
        recordings: [
          { role: "heads", bytes: HEADS_BYTES },
          { role: "identity", bytes: IDENTITY_BYTES },
        ],
      } as const;
      const selector = { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] } as const;
      const deployment = () =>
        referenceDeployment(manifestBytes, { evaluationTime: spec.evaluationTime });

      const run = await runVerification(inputs, selector, deployment());
      const payload = run.payload as {
        policyTrust: { state: string };
        verifications: readonly { state: string }[];
      };
      // The declared outcome, exactly — sorted multiset of verdict states.
      expect(payload.verifications.map((v) => v.state).sort()).toEqual(
        [...spec.declaredVerdicts].sort(),
      );
      expect(exitCodeForPayload(run.payload)).toBe(spec.declaredExit);
      // Trust is visibly self-approved reference — never a silent canonical claim.
      expect(payload.policyTrust.state).toBe("trusted");

      // Four-surface parity (the J5 idiom): one hash everywhere, same classification.
      const res = await POST(
        new Request("http://aegis.test/api/v1/verify", {
          method: "POST",
          body: JSON.stringify({
            manifest: b64(manifestBytes),
            recordings: [
              { role: "heads", bytes: b64(HEADS_BYTES) },
              { role: "identity", bytes: b64(IDENTITY_BYTES) },
            ],
            chainIds: [1, 10],
            at: "finalized",
            evaluationTime: spec.evaluationTime,
            profile: "reference",
          }),
        }),
      );
      expect(res.status).toBe(200);
      const envelope = JSON.parse(await res.text()) as { reportHash: string };
      expect(envelope.reportHash).toBe(run.reportHash);

      const ci = await runCiVerification(inputs, selector, deployment());
      expect(ci.reportHash).toBe(run.reportHash);
      expect(ci.exitCode).toBe(spec.declaredExit);

      const drawer = await loadEvidenceDrawer(inputs, selector, deployment());
      expect(drawer.reportHash).toBe(run.reportHash);
      expect(drawer.classification).toBe(spec.declaredExit);
    });
  }
});
