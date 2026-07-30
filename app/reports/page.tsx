// W5 slice S6 — the reference evidence-drawer page (S6 plan §3). An async server
// component over the fourth transport: fixture bytes arrive via build-time `?raw` imports
// (the Workers runtime has no filesystem; data/** is -text, so the imported text's UTF-8
// encoding is byte-identical to the repo artifact — parse-then-restringify would destroy
// the R-003 duplicate-key guard and requestHash byte identity, and is forbidden).
// Relative imports on purpose: vitest resolves no "@/" alias, and this file is
// source-scanned by tests/drawer.test.ts I7 and the trust-language lint.
import { ReportDrawer } from "../../components/report-drawer";
import { loadEvidenceDrawer } from "../../lib/aegis/surfaces/drawer";
import { referenceDeployment } from "../../lib/aegis/surfaces/profiles";
import manifestRaw from "../../data/manifests/reference-code-identity.json?raw";
import headsRaw from "../../data/recordings/reference-eth-op-heads.json?raw";
import identityRaw from "../../data/recordings/reference-identity-reads.json?raw";

// The injected deterministic clock — the app/page.tsx precedent; no wall clock anywhere.
const EVALUATION_TIME = "2026-07-24T00:00:00Z";

export default async function ReportsPage() {
  const encoder = new TextEncoder();
  const manifestBytes = encoder.encode(manifestRaw);
  const { model, reportHash } = await loadEvidenceDrawer(
    {
      manifestBytes,
      recordings: [
        { role: "heads", bytes: encoder.encode(headsRaw) },
        { role: "identity", bytes: encoder.encode(identityRaw) },
      ],
    },
    { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] },
    referenceDeployment(manifestBytes, { evaluationTime: EVALUATION_TIME }),
  );
  return (
    <main className="panel">
      <h1>Evidence report — reference_scenario</h1>
      <p>
        Recorded reference fixtures evaluated at {EVALUATION_TIME}; provenance
        reference_scenario, mode recorded. This page is a projection of the canonical
        payload — not a protocol safety score.
      </p>
      <ReportDrawer model={model} reportHash={reportHash} />
    </main>
  );
}
