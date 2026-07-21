import { AegisDashboard } from "@/components/aegis-dashboard";
import { buildProtocolReport } from "@/lib/aegis/invariants";
import { DEFAULT_PREFLIGHT_REQUEST, runPreflight } from "@/lib/aegis/preflight";
import { DEFAULT_REPLAY_OPTIONS, runReplay } from "@/lib/aegis/replay";

export default function Home() {
  const renderedAt = "2026-07-20T18:00:00.000Z";

  return (
    <AegisDashboard
      initialProtocol={buildProtocolReport(undefined, [], renderedAt)}
      initialPreflight={runPreflight(DEFAULT_PREFLIGHT_REQUEST, renderedAt)}
      initialReplay={runReplay(DEFAULT_REPLAY_OPTIONS, renderedAt)}
    />
  );
}
