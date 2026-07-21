"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { DEFAULT_PREFLIGHT_REQUEST } from "@/lib/aegis/preflight";
import { DEFAULT_REPLAY_OPTIONS } from "@/lib/aegis/replay";
import type {
  InvariantResult,
  PreflightReport,
  PreflightRequest,
  ProtocolReport,
  ReplayOptions,
  ReplayReport,
  ReplayStep,
  VerificationState,
} from "@/lib/aegis/types";

type View = "health" | "preflight" | "replay";

const NAV_ITEMS: Array<{ id: View; index: string; label: string; kicker: string }> = [
  { id: "health", index: "01", label: "Protocol health", kicker: "Observe state" },
  { id: "preflight", index: "02", label: "Transaction preflight", kicker: "Test intent" },
  { id: "replay", index: "03", label: "Incident replay", kicker: "Reconstruct impact" },
];

function displayState(state: VerificationState): string {
  return {
    holding: "Holding",
    advisory: "Advisory",
    violated: "Violated",
    unknown: "Unknown",
    stale: "Stale",
  }[state];
}

function stateGlyph(state: VerificationState): string {
  if (state === "holding") return "✓";
  if (state === "advisory" || state === "stale") return "!";
  if (state === "violated") return "×";
  return "?";
}

function Status({ state, compact = false }: { state: VerificationState; compact?: boolean }) {
  return (
    <span className={`status status--${state}${compact ? " status--compact" : ""}`}>
      <span className="status__mark" aria-hidden="true">{stateGlyph(state)}</span>
      {!compact && <span>{displayState(state)}</span>}
    </span>
  );
}

function Provenance({ value }: { value: "PUBLIC_STATE" | "CODE_PROPERTY" | "REFERENCE_SCENARIO" }) {
  return <span className={`provenance provenance--${value.toLowerCase()}`}>{value.replaceAll("_", " ")}</span>;
}

function truncateHash(value?: string): string {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function timestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

async function copyJson(value: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function AegisDashboard({
  initialProtocol,
  initialPreflight,
  initialReplay,
}: {
  initialProtocol: ProtocolReport;
  initialPreflight: PreflightReport;
  initialReplay: ReplayReport;
}) {
  const [view, setView] = useState<View>("health");
  const [protocol, setProtocol] = useState(initialProtocol);
  const [protocolQuery, setProtocolQuery] = useState<"connecting" | "current" | "degraded">("connecting");
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState("");
  const [preflightInput, setPreflightInput] = useState<PreflightRequest>(DEFAULT_PREFLIGHT_REQUEST);
  const [preflight, setPreflight] = useState(initialPreflight);
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "running" | "error">("idle");
  const [preflightError, setPreflightError] = useState("");
  const [replay, setReplay] = useState(initialReplay);
  const [replayOptions, setReplayOptions] = useState<ReplayOptions>(DEFAULT_REPLAY_OPTIONS);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayStatus, setReplayStatus] = useState<"idle" | "running" | "error">("idle");
  const mainRef = useRef<HTMLElement>(null);

  const selectedControl = useMemo(
    () => protocol.controls.find(({ id }) => id === selectedControlId) ?? null,
    [protocol.controls, selectedControlId],
  );
  const ethereumHead = protocol.chainHeads.find(({ chainId }) => chainId === 1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Health endpoint unavailable");
        return response.json() as Promise<ProtocolReport>;
      })
      .then((next) => {
        if (cancelled) return;
        setProtocol(next);
        setProtocolQuery(next.chainHeads.some(({ status }) => status === "current") ? "current" : "degraded");
      })
      .catch(() => {
        if (!cancelled) setProtocolQuery("degraded");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "1") selectView("health");
      if (event.key === "2") selectView("preflight");
      if (event.key === "3") selectView("replay");
      if (event.key === "ArrowRight" && view === "replay") {
        setActiveStep((current) => Math.min(current + 1, replay.steps.length - 1));
      }
      if (event.key === "ArrowLeft" && view === "replay") {
        setActiveStep((current) => Math.max(current - 1, 0));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [replay.steps.length, view]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= replay.steps.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1_600);
    return () => window.clearInterval(timer);
  }, [isPlaying, replay.steps.length]);

  function selectView(next: View) {
    setView(next);
    window.history.replaceState(null, "", next === "health" ? "/" : `/?mode=${next}`);
    window.requestAnimationFrame(() => mainRef.current?.focus());
  }

  async function runPreflightRequest(event: FormEvent) {
    event.preventDefault();
    setPreflightStatus("running");
    setPreflightError("");
    try {
      const response = await fetch("/api/preflight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(preflightInput),
      });
      const body = (await response.json()) as { message?: string } | PreflightReport;
      if (!response.ok) {
        throw new Error("message" in body ? body.message ?? "The preflight request could not be evaluated." : "The preflight request could not be evaluated.");
      }
      setPreflight(body as PreflightReport);
      setPreflightStatus("idle");
    } catch (error) {
      setPreflightStatus("error");
      setPreflightError(error instanceof Error ? error.message : "The request failed.");
    }
  }

  async function updateReplay(next: ReplayOptions) {
    setReplayOptions(next);
    setReplayStatus("running");
    setIsPlaying(false);
    try {
      const response = await fetch("/api/replay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("Replay engine unavailable");
      setReplay((await response.json()) as ReplayReport);
      setActiveStep(0);
      setReplayStatus("idle");
    } catch {
      setReplayStatus("error");
    }
  }

  async function handleCopy(value: unknown, label: string) {
    try {
      await copyJson(value);
      setCopyNotice(`${label} copied`);
      window.setTimeout(() => setCopyNotice(""), 2_000);
    } catch {
      setCopyNotice("Copy unavailable in this browser");
    }
  }

  return (
    <div className="aegis-shell">
      <a className="skip-link" href="#main">Skip to instrument</a>
      <header className="masthead">
        <button className="wordmark" type="button" onClick={() => selectView("health")} aria-label="Aegis home">
          <span className="aegis-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="wordmark__name">AEGIS</span>
          <span className="wordmark__descriptor">PROTOCOL FLIGHT RECORDER</span>
        </button>
        <div className="masthead__context">
          <span className={`recorder recorder--${protocolQuery}`}><i aria-hidden="true" /> REC</span>
          <span className="network-context">
            {ethereumHead?.status === "current"
              ? `ETHEREUM · BLOCK ${Number(ethereumHead.blockNumber).toLocaleString("en-US")}`
              : protocolQuery === "connecting"
                ? "QUERYING CHAIN HEAD…"
                : "RPC UNAVAILABLE · RECORDED INPUTS"}
          </span>
          <Provenance value={ethereumHead?.status === "current" ? "PUBLIC_STATE" : "REFERENCE_SCENARIO"} />
        </div>
        <button className="command-key" type="button" onClick={() => setSelectedControlId(protocol.controls[0].id)}>
          Evidence <kbd>E</kbd>
        </button>
      </header>

      <aside className="mode-rail" aria-label="Aegis modes">
        <div className="mode-rail__label">INSTRUMENTS</div>
        <nav className="mode-nav">
          {NAV_ITEMS.map((item) => (
            <button
              className={`mode-nav__item${view === item.id ? " is-active" : ""}`}
              type="button"
              key={item.id}
              onClick={() => selectView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <span className="mode-nav__index">{item.index}</span>
              <span><strong>{item.label}</strong><small>{item.kicker}</small></span>
              <span className="mode-nav__arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </nav>
        <div className="mode-rail__footer">
          <span className="rail-rule" />
          <strong>OBSERVE, NEVER SUBMIT.</strong>
          <p>Independent engineering prototype. Not affiliated with ether.fi.</p>
          <span>CORE / 0.1.0</span>
        </div>
      </aside>

      <main id="main" ref={mainRef} className="instrument" tabIndex={-1}>
        {view === "health" && (
          <HealthView
            protocol={protocol}
            queryState={protocolQuery}
            onSelectControl={setSelectedControlId}
            onPreflight={() => selectView("preflight")}
          />
        )}
        {view === "preflight" && (
          <PreflightView
            input={preflightInput}
            setInput={setPreflightInput}
            report={preflight}
            status={preflightStatus}
            error={preflightError}
            onSubmit={runPreflightRequest}
            onCopy={() => handleCopy(preflight, "Preflight report")}
            onDownload={() => downloadJson(`${preflight.reportId.toLowerCase()}.json`, preflight)}
            onReplay={() => selectView("replay")}
          />
        )}
        {view === "replay" && (
          <ReplayView
            report={replay}
            options={replayOptions}
            activeStep={activeStep}
            isPlaying={isPlaying}
            status={replayStatus}
            onOptions={updateReplay}
            onStep={setActiveStep}
            onPlay={() => {
              if (activeStep === replay.steps.length - 1) setActiveStep(0);
              setIsPlaying((current) => !current);
            }}
            onCopy={() => handleCopy(replay, "Replay bundle")}
            onDownload={() => downloadJson(`${replay.reportId.toLowerCase()}.json`, replay)}
            onHealth={() => selectView("health")}
          />
        )}
      </main>

      <div className="toast" role="status" aria-live="polite">{copyNotice}</div>
      {selectedControl && (
        <EvidenceDrawer
          control={selectedControl}
          onClose={() => setSelectedControlId(null)}
          onCopy={() => handleCopy(selectedControl, "Reproduction bundle")}
          onPreflight={() => {
            setSelectedControlId(null);
            selectView("preflight");
          }}
        />
      )}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {badge && <div className="page-header__badge">{badge}</div>}
    </header>
  );
}

function HealthView({
  protocol,
  queryState,
  onSelectControl,
  onPreflight,
}: {
  protocol: ProtocolReport;
  queryState: "connecting" | "current" | "degraded";
  onSelectControl: (id: string) => void;
  onPreflight: () => void;
}) {
  const total = protocol.controls.length;
  const allHolding = protocol.summary.holding === total;
  const publicHeads = protocol.chainHeads.filter(({ status }) => status === "current");

  return (
    <div className="view view--health">
      <PageHeader
        eyebrow="SYSTEM OBSERVATION / REFERENCE SUITE"
        title={allHolding ? "Controls holding." : "Controls need attention."}
        subtitle={`${total} falsifiable conditions evaluated against ${protocol.snapshotLabel}.`}
        badge={<><span className="record-dot" /> ENGINE RUN {protocol.reportId.slice(-6)}</>}
      />

      <section className="health-summary" aria-label="Verification summary">
        <div className="holding-card tape-card">
          <div className="tape-card__ticks" aria-hidden="true">00&nbsp;&nbsp;01&nbsp;&nbsp;02&nbsp;&nbsp;03&nbsp;&nbsp;04&nbsp;&nbsp;05&nbsp;&nbsp;06&nbsp;&nbsp;07</div>
          <div className="holding-card__score">
            <span>{String(protocol.summary.holding).padStart(2, "0")}</span>
            <i>/</i>
            <span>{String(total).padStart(2, "0")}</span>
          </div>
          <div>
            <strong>CONTROLS HOLDING</strong>
            <p>This is assertion coverage, not a protocol safety score.</p>
          </div>
          <div className="holding-card__counts">
            <span><b>{protocol.summary.violated}</b> violated</span>
            <span><b>{protocol.summary.advisory}</b> advisory</span>
            <span><b>{protocol.summary.unknown}</b> unknown</span>
          </div>
        </div>

        <div className="observation-card panel">
          <div className="panel__label">OBSERVATION MODE</div>
          <div className="observation-card__mode">
            <span className={`observation-signal observation-signal--${queryState}`} aria-hidden="true" />
            <strong>{queryState === "current" ? "Hybrid context" : queryState === "connecting" ? "Querying chain…" : "Recorded verifier"}</strong>
          </div>
          <p>
            {queryState === "current"
              ? "Public chain heads are current. Control inputs remain an explicitly labeled reference fixture."
              : "RPC context is unavailable or pending. Aegis has not promoted recorded evidence to public state."}
          </p>
          <div className="observation-card__meta">
            <span>REPORT HASH</span><code>{truncateHash(protocol.reportHash)}</code>
            <span>GENERATED</span><code>{timestamp(protocol.generatedAt)}</code>
          </div>
        </div>
      </section>

      <section className="panel control-matrix" aria-labelledby="control-matrix-title">
        <div className="panel-heading">
          <div><span className="panel__label">PRIMARY INSTRUMENT</span><h2 id="control-matrix-title">Control matrix</h2></div>
          <div className="panel-heading__actions">
            <Provenance value="REFERENCE_SCENARIO" />
            <button className="button button--secondary" type="button" onClick={onPreflight}>Simulate from this state <span>↗</span></button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Control</th><th>Evidence</th><th>Current</th><th>Guardrail</th><th>Margin</th><th>Result</th></tr></thead>
            <tbody>
              {protocol.controls.map((control) => (
                <tr key={control.id} onClick={() => onSelectControl(control.id)}>
                  <td>
                    <button className="control-name" type="button" onClick={() => onSelectControl(control.id)}>
                      <span>{control.shortId}</span><strong>{control.title}</strong>
                    </button>
                  </td>
                  <td><Provenance value={control.provenance} /></td>
                  <td className="numeric">{control.current}</td>
                  <td className="numeric muted-value">{control.guardrail}</td>
                  <td><div className="margin-cell"><span className={`margin-bar margin-bar--${control.category.toLowerCase()}`} /><code>{control.margin}</code></div></td>
                  <td><Status state={control.state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="matrix-footnote">
          <span><i className="legend-dot legend-dot--reference" /> Reference values are deterministic fixtures</span>
          <button type="button" onClick={() => onSelectControl(protocol.controls[0].id)}>Inspect evidence model <span>→</span></button>
        </div>
      </section>

      <section className="health-lower-grid">
        <div className="panel state-tape">
          <div className="panel-heading"><div><span className="panel__label">EVALUATION TAPE</span><h2>State changes</h2></div><span className="quiet-meta">4 EVENTS</span></div>
          <ol>
            {protocol.stateChanges.map((change, index) => (
              <li key={`${change.at}-${change.label}`}>
                <span className="tape-index">{String(index + 1).padStart(2, "0")}</span>
                <time>{change.at}</time>
                <span className="tape-line" aria-hidden="true" />
                <strong>{change.label}</strong>
                <Provenance value={change.provenance} />
              </li>
            ))}
          </ol>
        </div>

        <div className="panel control-envelope">
          <div className="panel-heading"><div><span className="panel__label">DISTANCE TO BOUNDARY</span><h2>Control envelope</h2></div><span className="quiet-meta">NORMALIZED</span></div>
          <div className="envelope-list">
            {[
              ["Backing", "67% margin retained", 67],
              ["Withdrawals", "58% daily capacity free", 58],
              ["Oracle", "99% fallback window free", 99],
              ["Authority", "57% pause window free", 57],
            ].map(([label, detail, width]) => (
              <div className="envelope-row" key={String(label)}>
                <div><strong>{label}</strong><span>{detail}</span></div>
                <div className="envelope-track"><i style={{ width: `${width}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel chain-context">
          <div className="panel-heading"><div><span className="panel__label">PUBLIC CONTEXT</span><h2>Chain pulse</h2></div><span className="quiet-meta">RPC</span></div>
          <div className="chain-list">
            {(protocol.chainHeads.length ? protocol.chainHeads : [
              { chain: "Ethereum", chainId: 1, status: "unavailable" as const, capturedAt: protocol.generatedAt },
              { chain: "OP Mainnet", chainId: 10, status: "unavailable" as const, capturedAt: protocol.generatedAt },
            ]).map((head) => (
              <div className="chain-row" key={head.chainId}>
                <span className={`chain-icon chain-icon--${head.status}`} aria-hidden="true">{head.chainId === 1 ? "E" : "O"}</span>
                <div><strong>{head.chain}</strong><span>{head.status === "current" ? `Block ${Number(head.blockNumber).toLocaleString("en-US")}` : head.status === "recorded" ? `Pinned block ${Number(head.blockNumber).toLocaleString("en-US")}` : "RPC unavailable"}</span></div>
                <Status state={head.status === "current" ? "holding" : "unknown"} compact />
              </div>
            ))}
          </div>
          <p className="context-note">{publicHeads.length} / 2 chain heads observed. Chain pulse provides context only; it does not validate fixture controls.</p>
        </div>
      </section>
    </div>
  );
}

function PreflightView({
  input,
  setInput,
  report,
  status,
  error,
  onSubmit,
  onCopy,
  onDownload,
  onReplay,
}: {
  input: PreflightRequest;
  setInput: (input: PreflightRequest) => void;
  report: PreflightReport;
  status: "idle" | "running" | "error";
  error: string;
  onSubmit: (event: FormEvent) => void;
  onCopy: () => void;
  onDownload: () => void;
  onReplay: () => void;
}) {
  const reportState: VerificationState =
    report.verdict === "no_blocking_findings" ? "holding" : report.verdict === "warning" ? "advisory" : "violated";

  function numberValue(key: "maxLtvBps" | "oracleAgeSeconds", value: string) {
    setInput({ ...input, [key]: Number.parseInt(value || "0", 10) });
  }

  return (
    <div className="view view--preflight">
      <PageHeader
        eyebrow="STATE TRANSITION SIMULATOR"
        title="Know the transition before you sign."
        subtitle="Model funding intent, evaluate boundary conditions, and inspect the decision trace. Nothing is submitted."
        badge={<Provenance value="REFERENCE_SCENARIO" />}
      />

      <div className="preflight-grid">
        <form className="panel preflight-form" onSubmit={onSubmit}>
          <div className="panel-heading">
            <div><span className="panel__label">MODELED INTENT</span><h2>Cash purchase</h2></div>
            <span className="quiet-meta">USD / 6 DECIMALS</span>
          </div>
          <fieldset className="segmented-control">
            <legend>Funding mode</legend>
            <button
              type="button"
              className={input.mode === "direct" ? "is-active" : ""}
              onClick={() => setInput({ ...input, mode: "direct" })}
              aria-pressed={input.mode === "direct"}
            >
              <span>01</span><strong>Direct Pay</strong><small>Spend available funds</small>
            </button>
            <button
              type="button"
              className={input.mode === "borrow" ? "is-active" : ""}
              onClick={() => setInput({ ...input, mode: "borrow" })}
              aria-pressed={input.mode === "borrow"}
            >
              <span>02</span><strong>Borrow Mode</strong><small>Open collateralized debt</small>
            </button>
          </fieldset>

          <label className="field field--amount">
            <span>Purchase amount</span>
            <div><i aria-hidden="true">$</i><input type="text" inputMode="decimal" value={input.amountUsd} onChange={(event) => setInput({ ...input, amountUsd: event.target.value })} aria-describedby="amount-help" /></div>
            <small id="amount-help">Modeled against deterministic account state</small>
          </label>

          <div className="scenario-presets" aria-label="Scenario presets">
            <span>PRESETS</span>
            <button type="button" onClick={() => setInput({ ...input, amountUsd: "1280.00", oracleAgeSeconds: 42 })}>Nominal</button>
            <button type="button" onClick={() => setInput({ ...input, amountUsd: "1280.00", oracleAgeSeconds: 940 })}>Stale oracle</button>
            <button type="button" onClick={() => setInput({ ...input, amountUsd: input.mode === "direct" ? "6900.00" : "7000.00", oracleAgeSeconds: 42 })}>Boundary breach</button>
          </div>

          <details className="advanced-fields" open>
            <summary>Account-state inputs <span>Deterministic fixture</span></summary>
            <div className="field-grid">
              <label className="field"><span>Direct balance</span><div><i>$</i><input type="text" inputMode="decimal" value={input.directBalanceUsd} onChange={(event) => setInput({ ...input, directBalanceUsd: event.target.value })} /></div></label>
              <label className="field"><span>Collateral value</span><div><i>$</i><input type="text" inputMode="decimal" value={input.collateralUsd} onChange={(event) => setInput({ ...input, collateralUsd: event.target.value })} /></div></label>
              <label className="field"><span>Current debt</span><div><i>$</i><input type="text" inputMode="decimal" value={input.debtUsd} onChange={(event) => setInput({ ...input, debtUsd: event.target.value })} /></div></label>
              <label className="field"><span>Maximum LTV</span><div><input type="number" min="1" max="95" value={input.maxLtvBps / 100} onChange={(event) => numberValue("maxLtvBps", String(Number(event.target.value) * 100))} /><i>%</i></div></label>
              <label className="field field--wide"><span>Oracle observation age</span><div><input type="number" min="0" value={input.oracleAgeSeconds} onChange={(event) => numberValue("oracleAgeSeconds", event.target.value)} /><i>seconds</i></div></label>
            </div>
          </details>

          {status === "error" && <div className="inline-error" role="alert"><strong>Evaluation failed.</strong> {error}</div>}
          <button className="button button--primary button--run" type="submit" disabled={status === "running"}>
            <span className={status === "running" ? "button-spinner" : "run-mark"} aria-hidden="true">{status === "running" ? "" : "→"}</span>
            {status === "running" ? "Evaluating controls…" : "Run deterministic preflight"}
          </button>
          <p className="form-disclaimer">No wallet connection · No private keys · No transaction broadcast</p>
        </form>

        <section className={`panel preflight-report report--${reportState}`} aria-label="Preflight result" aria-busy={status === "running"}>
          <div className="report-hero">
            <Status state={reportState} compact />
            <div><span className="panel__label">PREFLIGHT VERDICT</span><h2>{report.headline}</h2><p>{report.summary}</p></div>
            <div className="report-id"><span>DETERMINISTIC REPORT</span><code>{report.reportId}</code></div>
          </div>

          <div className="report-section decoded-intent">
            <div className="section-heading"><span>01</span><h3>Decoded intent</h3><Provenance value="REFERENCE_SCENARIO" /></div>
            <div className="intent-grid">
              <div><span>ACTION</span><strong>{report.decodedIntent.action}</strong></div>
              <div><span>AMOUNT</span><strong>{report.decodedIntent.amount}</strong></div>
              <div><span>FUNDING PATH</span><strong>{report.decodedIntent.fundingPath}</strong></div>
              <div><span>SUBMISSION</span><strong>Never submitted</strong></div>
            </div>
          </div>

          <div className="report-section">
            <div className="section-heading"><span>02</span><h3>Modeled state delta</h3></div>
            <div className="delta-table">
              <div className="delta-table__head"><span>Metric</span><span>Before</span><span>After</span><span>Boundary</span><span>State</span></div>
              {report.metrics.map((metric) => (
                <div className="delta-table__row" key={metric.label}>
                  <strong>{metric.label}</strong><code>{metric.before}</code><code className="delta-after">{metric.after}</code><code>{metric.boundary ?? "—"}</code><Status state={metric.state} compact />
                </div>
              ))}
            </div>
          </div>

          <div className="report-columns">
            <div className="report-section checks-list">
              <div className="section-heading"><span>03</span><h3>Controls after execution</h3></div>
              {report.checks.map((item) => (
                <div className="check-row" key={item.id}>
                  <Status state={item.state} compact />
                  <div><strong>{item.label}</strong><code>{item.expression}</code></div>
                  <span>{displayState(item.state)}</span>
                </div>
              ))}
            </div>
            <div className="report-section execution-trace">
              <div className="section-heading"><span>04</span><h3>Decision trace</h3></div>
              <ol>
                {report.executionTrace.map((trace) => (
                  <li key={trace.index}><span>{String(trace.index).padStart(2, "0")}</span><div><strong>{trace.operation}</strong><small>{trace.target}</small></div><code>{trace.result}</code></li>
                ))}
              </ol>
            </div>
          </div>

          <div className="report-limitations"><strong>Mode boundary</strong><p>{report.limitations[0].text} {report.limitations[2].text}</p></div>
          <div className="report-actions">
            <button className="button button--secondary" type="button" onClick={onCopy}>Copy report</button>
            <button className="button button--secondary" type="button" onClick={onDownload}>Download JSON</button>
            <button className="button button--text" type="button" onClick={onReplay}>Replay this transition <span>→</span></button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReplayView({
  report,
  options,
  activeStep,
  isPlaying,
  status,
  onOptions,
  onStep,
  onPlay,
  onCopy,
  onDownload,
  onHealth,
}: {
  report: ReplayReport;
  options: ReplayOptions;
  activeStep: number;
  isPlaying: boolean;
  status: "idle" | "running" | "error";
  onOptions: (options: ReplayOptions) => void;
  onStep: (step: number) => void;
  onPlay: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onHealth: () => void;
}) {
  const step = report.steps[activeStep] ?? report.steps[0];

  return (
    <div className="view view--replay">
      <PageHeader
        eyebrow="DETERMINISTIC FAILURE DRILL"
        title="Every incident is a sequence, not a screenshot."
        subtitle="Walk a causal timeline, inspect every state transition, then change one control and rerun the model."
        badge={<><Provenance value="REFERENCE_SCENARIO" /><span>NOT A REAL INCIDENT</span></>}
      />

      <section className="panel replay-outcome">
        <div><span className="panel__label">SCENARIO / {report.scenarioId.toUpperCase()}</span><h2>{report.title}</h2><p>{report.outcome.headline}</p></div>
        <div className="outcome-metrics">
          <div><span>LIVENESS</span><strong>{report.outcome.status === "bounded" ? "Restored" : "Unresolved"}</strong></div>
          <div><span>CLAIMABLE BY</span><strong>{report.outcome.claimableBy}</strong></div>
          <div><span>VS REFERENCE</span><strong>{report.outcome.referenceDelta}</strong></div>
        </div>
      </section>

      <section className="panel playback-panel" aria-label="Replay controls">
        <div className="playback-controls">
          <button type="button" onClick={() => onStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0} aria-label="Previous replay step">←</button>
          <button className="play-button" type="button" onClick={onPlay} aria-label={isPlaying ? "Pause replay" : "Play replay"}>{isPlaying ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => onStep(Math.min(report.steps.length - 1, activeStep + 1))} disabled={activeStep === report.steps.length - 1} aria-label="Next replay step">→</button>
        </div>
        <div className="scrubber">
          <div><span>STEP {String(activeStep + 1).padStart(2, "0")} / {String(report.steps.length).padStart(2, "0")}</span><strong>{step.timeLabel}</strong></div>
          <input
            type="range"
            min="0"
            max={report.steps.length - 1}
            value={activeStep}
            onChange={(event) => onStep(Number(event.target.value))}
            aria-label={`Replay step ${activeStep + 1}: ${step.title}`}
            style={{ "--scrub-progress": `${(activeStep / (report.steps.length - 1)) * 100}%` } as React.CSSProperties}
          />
          <div className="scrubber__ticks" aria-hidden="true">{report.steps.map((item, index) => <i className={index <= activeStep ? "is-past" : ""} key={item.id} />)}</div>
        </div>
        <div className="playback-speed"><span>SPEED</span><button type="button" className="is-active">1×</button><button type="button">2×</button></div>
      </section>

      <section className="replay-workbench" aria-busy={status === "running"}>
        <div className="panel event-tape">
          <div className="panel-heading"><div><span className="panel__label">CAUSAL ORDER</span><h2>Event tape</h2></div><span className="quiet-meta">5 EVENTS</span></div>
          <ol>
            {report.steps.map((item, index) => (
              <li key={item.id} className={index === activeStep ? "is-active" : index < activeStep ? "is-past" : ""}>
                <button type="button" onClick={() => onStep(index)}>
                  <span className="event-node">{String(index + 1).padStart(2, "0")}</span>
                  <span><time>{item.timeLabel}</time><strong>{item.title}</strong><small>{item.affectedControl}</small></span>
                  <Status state={item.state} compact />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="panel active-event" aria-live="polite">
          <div className="active-event__header">
            <div><span className="panel__label">ACTIVE SNAPSHOT / {String(activeStep + 1).padStart(2, "0")}</span><h2>{step.title}</h2></div>
            <Status state={step.state} />
          </div>
          <p className="active-event__detail">{step.detail}</p>
          <div className="snapshot-deltas">
            <div className="section-heading"><span>Δ</span><h3>State delta</h3></div>
            {step.delta.map((delta) => (
              <div key={delta.label}><strong>{delta.label}</strong><code>{delta.before}</code><span aria-hidden="true">→</span><code>{delta.after}</code></div>
            ))}
          </div>
          <div className="causal-note">
            <span className="causal-note__line" aria-hidden="true" />
            <div><span>WHY THIS TRANSITION IS POSSIBLE</span><p>{causalExplanation(step)}</p></div>
          </div>
          <div className="event-source"><Provenance value={step.provenance} /><span>{step.source}</span></div>
        </div>

        <div className="panel counterfactual">
          <div className="panel-heading"><div><span className="panel__label">MODEL CONTROLS</span><h2>Change one control</h2></div>{status === "running" && <span className="mini-loader">RUNNING</span>}</div>
          <label className="range-field">
            <span><strong>Public fallback delay</strong><code>{options.fallbackDelayDays} days</code></span>
            <input
              type="range"
              min="1"
              max="30"
              value={options.fallbackDelayDays}
              onChange={(event) => onOptions({ ...options, fallbackDelayDays: Number(event.target.value) })}
              style={{ "--range-progress": `${((options.fallbackDelayDays - 1) / 29) * 100}%` } as React.CSSProperties}
            />
            <small><span>1 day</span><span>30 days</span></small>
          </label>
          <label className="toggle-row">
            <span><strong>Permissionless fallback</strong><small>Allow any caller after delay</small></span>
            <input type="checkbox" checked={options.publicFallbackEnabled} onChange={(event) => onOptions({ ...options, publicFallbackEnabled: event.target.checked })} />
            <i aria-hidden="true" />
          </label>
          <div className="comparison-card">
            <div><span>REFERENCE</span><strong>Liveness restored T+14d</strong></div>
            <div><span>ALTERNATE</span><strong>{options.publicFallbackEnabled ? `Liveness restored T+${options.fallbackDelayDays}d` : "No public recovery path"}</strong></div>
            <div><span>TRADEOFF</span><p>{options.publicFallbackEnabled ? `${Math.abs(options.fallbackDelayDays - 14)}-day change to the privileged-response window.` : "Liveness depends entirely on role availability."}</p></div>
          </div>
          <p className="counterfactual-note">Modeled outcome, not a governance recommendation. Assumptions are included in the exported bundle.</p>
          {status === "error" && <div className="inline-error">Replay service unavailable.</div>}
        </div>
      </section>

      <section className="replay-actions">
        <div><span className="panel__label">BUNDLE HASH</span><code>{report.reportHash}</code></div>
        <button className="button button--secondary" type="button" onClick={onCopy}>Copy bundle</button>
        <button className="button button--secondary" type="button" onClick={onDownload}>Export replay JSON</button>
        <button className="button button--text" type="button" onClick={onHealth}>Open final state in health <span>→</span></button>
      </section>
    </div>
  );
}

function causalExplanation(step: ReplayStep): string {
  const explanations: Record<string, string> = {
    "last-valid-report": "The previous state contains a valid report and no unmet preconditions.",
    "heartbeat-missed": "Aegis advances an injected clock without inventing a new oracle observation.",
    "liveness-advisory": "The freshness policy changes presentation state as evidence ages; protocol state itself is not rewritten.",
    "fallback-boundary": "The modeled delay is immutable input to this run. Eligibility changes only when the deterministic clock reaches it.",
    "finalization-restored": "The fallback boundary is open and a public caller is an explicit scenario assumption.",
  };
  return explanations[step.id] ?? "This transition follows an explicit causal edge in the scenario bundle.";
}

function EvidenceDrawer({
  control,
  onClose,
  onCopy,
  onPreflight,
}: {
  control: InvariantResult;
  onClose: () => void;
  onCopy: () => void;
  onPreflight: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close evidence drawer" />
      <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
        <header>
          <div><span className="panel__label">EVIDENCE / {control.shortId}</span><h2 id="evidence-title">{control.title}</h2></div>
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Close evidence drawer">×</button>
        </header>
        <div className="drawer-status"><Status state={control.state} /><Provenance value={control.provenance} /></div>

        <section>
          <span className="drawer-section-label">WHAT THIS CONTROL PROTECTS</span>
          <p className="drawer-lead">{control.protects}</p>
          <p>{control.statement}</p>
        </section>

        <section className="expression-block">
          <span className="drawer-section-label">EVALUATED EXPRESSION</span>
          <code>{control.expression}</code>
          <div><span>RESULT HASH</span><strong>{control.resultHash}</strong></div>
        </section>

        <section>
          <span className="drawer-section-label">INPUT TRACE</span>
          <div className="input-trace">
            {control.inputs.map((input, index) => (
              <div key={input.label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{input.label}</strong><code>{input.source}</code></div><b>{input.value}</b></div>
            ))}
          </div>
        </section>

        <section>
          <span className="drawer-section-label">EVIDENCE ANCHORS</span>
          <div className="evidence-links">
            {control.evidence.map((evidence) => (
              <a href={evidence.uri} target="_blank" rel="noreferrer" key={evidence.id}>
                <span><Provenance value={evidence.provenance} /><strong>{evidence.label}</strong></span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="limitation-block">
          <span className="drawer-section-label">LIMITATIONS</span>
          {control.limitations.map((limitation) => <p key={limitation.code}><strong>{limitation.code}</strong>{limitation.text}</p>)}
        </section>

        <footer>
          <button className="button button--secondary" type="button" onClick={onCopy}>Copy reproduction</button>
          <button className="button button--primary" type="button" onClick={onPreflight}>Open in preflight <span>→</span></button>
        </footer>
      </aside>
    </div>
  );
}
