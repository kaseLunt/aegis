// W5 slice S6 — the web evidence drawer component (S6 plan §3). Sync, props-fed, and
// trivially thin: props → elements, zero logic beyond presence checks and array maps.
// Every value renders as a React text node — markup protection comes from React's
// auto-escaping (THREAT_MODEL:125's escaping clause); React's raw-innerHTML escape hatch
// is banned by the source lint. The model's key order IS the render order: frame before results,
// so a screenshot can never detach a verdict from its boundary and trust context.
// Relative import on purpose: vitest resolves no "@/" alias and this file is imported
// in-process by tests/drawer.test.ts (the I6 spike).
import type { DrawerModel } from "../lib/aegis/surfaces/drawer";

export function ReportDrawer(props: { model: DrawerModel; reportHash: string }) {
  const { model, reportHash } = props;
  return (
    <section className="evidence-drawer">
      <div className="drawer-section">
        <div className="drawer-section-label">manifest</div>
        <div className="mono">
          {model.header.manifestVersion} {model.header.manifestHash}
        </div>
        <div>mode: {model.header.sourceMode}</div>
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">trust</div>
        <div>
          {model.trust.state}
          {model.trust.reasonCodes.length > 0 ? ` (${model.trust.reasonCodes.join(", ")})` : ""}
          {model.trust.trustPolicyId !== undefined ? ` policy ${model.trust.trustPolicyId}` : ""}
        </div>
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">boundaries</div>
        {model.boundaries.map((b, i) => (
          <div key={i}>
            <div className="mono">
              {b.kind}
              {b.block !== undefined
                ? ` chain ${b.block.chainId ?? "?"} block ${b.block.number ?? "?"} ${b.block.finality ?? "unknown"} ${b.block.hash ?? ""}`
                : ""}
            </div>
            {b.downgrades.map((d, j) => (
              <div key={j}>
                downgrade: chain {d.chainId} requested {d.requested} used {d.used} depth{" "}
                {d.confirmationDepth} ({d.reasonCode})
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">coverage</div>
        <div>
          supported {model.coverage.supported}, unsupported {model.coverage.unsupported},
          excluded {model.coverage.excluded}
        </div>
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">verifications</div>
        {model.verifications.map((v, i) => (
          <div key={i}>
            <div>
              <span className={`status status--${v.state}`}>{v.state}</span>{" "}
              <span className="mono">{v.invariantId}</span> {v.statement}
            </div>
            {v.limitations.map((l, j) => (
              <div key={j}>
                limitation: {l.code} {l.text}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">evidence</div>
        {model.evidence.map((e, i) => (
          <div key={i} className="mono">
            {e.id} {e.kind} {e.provenanceClass} {e.sourceMode}
            {e.providerId !== undefined ? ` provider ${e.providerId}` : ""}
            {e.method !== undefined ? ` ${e.method}` : ""}
            {e.rawResultHash !== undefined ? ` raw ${e.rawResultHash}` : ""}
            {` captured ${e.capturedAt}`}
            {e.capturedAtScope !== undefined ? ` (${e.capturedAtScope})` : ""}
          </div>
        ))}
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">limitations</div>
        {model.limitations.map((l, i) => (
          <div key={i}>
            limitation: {l.code} {l.text}
          </div>
        ))}
      </div>
      <div className="drawer-section">
        <div className="drawer-section-label">report hash</div>
        <div className="mono">{reportHash}</div>
      </div>
    </section>
  );
}
