// Rendering + outcome classification for the transport surfaces (W5 S3). Pure functions, no
// I/O. Every displayed label derives from hashed payload fields; the JSON envelope is
// jcsSerialize of exactly { payload, reportHash } with nothing else — no timestamps, no
// request ids — because S7 asserts cross-surface BYTE identity on it.
import { jcsSerialize } from "../report/canonical";
import type { VerificationRun } from "./engine";

interface PayloadView {
  readonly manifestVersion?: string;
  readonly manifestHash?: string;
  readonly policyTrust?: {
    readonly state?: string;
    readonly reasonCodes?: readonly string[];
    readonly trustPolicyId?: string;
  };
  readonly observationBoundaries?: readonly {
    readonly kind?: string;
    readonly block?: {
      readonly chainId?: number;
      readonly number?: string;
      readonly finality?: string;
      readonly hash?: string;
    };
  }[];
  readonly coverage?: {
    readonly supported?: readonly unknown[];
    readonly unsupported?: readonly unknown[];
    readonly excluded?: readonly unknown[];
  };
  readonly verifications?: readonly {
    readonly state?: string;
    readonly invariantId?: string;
    readonly statement?: string;
    readonly limitations?: readonly { readonly code?: string; readonly text?: string }[];
  }[];
  // Canonical limitation fields are (code, text) — canonical.ts limitationKey.
  readonly limitations?: readonly { readonly code?: string; readonly text?: string }[];
}

export function view(payload: unknown): PayloadView {
  return (payload ?? {}) as PayloadView;
}

// THREAT_MODEL:125 / ENGINEERING_SPEC:883 — every externally influenced string is untrusted:
// control bytes (ANSI redraws, BEL, a smuggled newline forging a report line) render as
// visible \uXXXX escapes, never as bytes. Applied to EVERY interpolated payload string —
// clean strings pass through unchanged, so trusted engine-authored text costs nothing.
export function esc(value: string): string {
  return value.replace(
    /[\u0000-\u001f\u007f]/g,
    (c) => `\\u${c.codePointAt(0)!.toString(16).padStart(4, "0")}`,
  );
}

// The exit-code matrix (W5 charter, S3 plan §3), payload-derived rows. Shared by the CLI and
// the S5 CI adapter so the two transports cannot classify one payload differently.
// 0 clean / 2 blocking fail / 3 unknown-stale-conflict / 4 invalid request or manifest.
export function exitCodeForPayload(payload: unknown): number {
  const p = view(payload);
  const trust = p.policyTrust?.state ?? "invalid";
  const verifications = p.verifications ?? [];

  if (trust === "invalid") return 4;
  if (verifications.some((v) => v.state === "fail")) return 2;
  const uncertain =
    verifications.some((v) => v.state !== "pass") ||
    trust !== "trusted" ||
    verifications.length === 0 ||
    (p.limitations ?? []).some((l) => l.code === "target_boundary_unavailable");
  return uncertain ? 3 : 0;
}

export function renderJson(run: VerificationRun): string {
  return jcsSerialize({ payload: run.payload, reportHash: run.reportHash });
}

// Minimal human rendering; the C-block tests (S3 plan 14-17) drive the canonical layout,
// escaping, and language rules red-first. Friendly labels stay OUT until those tests exist.
export function renderHuman(
  run: VerificationRun,
  opts?: { readonly reproduce?: string },
): string {
  const p = view(run.payload);
  const lines: string[] = [];
  // Boundaries-before-results (PRODUCT_SPEC:213-220): the frame renders BEFORE any verdict —
  // what was evaluated against, under which trust state, at which observed boundary, with
  // what coverage. Results without their frame are the detached-screenshot hazard.
  lines.push(`manifest: ${esc(p.manifestVersion ?? "unknown")} ${esc(p.manifestHash ?? "")}`.trimEnd());
  const reasons = (p.policyTrust?.reasonCodes ?? []).map(esc).join(", ");
  const policyId = p.policyTrust?.trustPolicyId;
  lines.push(
    `trust: ${esc(p.policyTrust?.state ?? "unknown")}${reasons ? ` (${reasons})` : ""}${policyId ? ` policy ${esc(policyId)}` : ""}`,
  );
  for (const b of p.observationBoundaries ?? []) {
    const blk = b.block;
    if (blk === undefined) continue;
    lines.push(
      `boundary: chain ${blk.chainId ?? "?"} block ${esc(blk.number ?? "?")} ${esc(blk.finality ?? "unknown")} ${esc(blk.hash ?? "")}`.trimEnd(),
    );
  }
  // Finality downgrades are part of the frame (W5 acceptance: they reach the reader on
  // every surface): the full record — requested, used, depth, reason — never just the
  // downgraded finality word. Diagnostics are display-only; engine.ts licenses this read
  // for a CLI renderer, and the payload/reportHash carry none of it (pinned by D21).
  for (const b of run.diagnostics.boundaries) {
    for (const d of b.downgrades) {
      lines.push(
        `downgrade: chain ${d.chainId} requested ${esc(d.requested)} used ${esc(d.used)} depth ${esc(d.confirmationDepth)} (${esc(d.reasonCode)})`,
      );
    }
  }
  const cov = p.coverage;
  lines.push(
    `coverage: supported ${cov?.supported?.length ?? 0}, unsupported ${cov?.unsupported?.length ?? 0}, excluded ${cov?.excluded?.length ?? 0}`,
  );
  for (const v of p.verifications ?? []) {
    lines.push(`${esc(v.state ?? "unknown")}  ${esc(v.invariantId ?? "")} ${esc(v.statement ?? "")}`.trimEnd());
    // Per-item limitations are schema-required context (PRODUCT_SPEC:426) — every entry
    // renders, none is summarized away.
    for (const l of v.limitations ?? []) {
      lines.push(`  limitation: ${esc(l.code ?? "")} ${esc(l.text ?? "")}`.trimEnd());
    }
  }
  for (const l of p.limitations ?? []) {
    lines.push(`limitation: ${esc(l.code ?? "")} ${esc(l.text ?? "")}`.trimEnd());
  }
  if (exitCodeForPayload(run.payload) === 0) {
    // THREAT_MODEL:153 — the strongest claim a clean run may make. Never a health verdict.
    lines.push("no blocking failure across the evaluated verifications, within declared coverage");
  }
  lines.push(`reportHash: ${esc(run.reportHash)}`);
  // Full-flag reproduction line (§6): supplied by the transport (only it knows the argv);
  // every determinism input explicit so the line alone re-derives the identical hash.
  if (opts?.reproduce !== undefined) {
    lines.push(`reproduce: ${esc(opts.reproduce)}`);
  }
  return lines.join("\n");
}
