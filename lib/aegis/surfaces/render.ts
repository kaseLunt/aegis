// Rendering + outcome classification for the transport surfaces (W5 S3). Pure functions, no
// I/O. Every displayed label derives from hashed payload fields; the JSON envelope is
// jcsSerialize of exactly { payload, reportHash } with nothing else — no timestamps, no
// request ids — because S7 asserts cross-surface BYTE identity on it.
import { jcsSerialize } from "../report/canonical";
import type { VerificationRun } from "./engine";

interface PayloadView {
  readonly policyTrust?: { readonly state?: string; readonly reasonCodes?: readonly string[] };
  readonly verifications?: readonly {
    readonly state?: string;
    readonly verificationId?: string;
    readonly statement?: string;
  }[];
  readonly limitations?: readonly { readonly kind?: string; readonly detail?: string }[];
}

function view(payload: unknown): PayloadView {
  return (payload ?? {}) as PayloadView;
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
    (p.limitations ?? []).some((l) => l.kind === "target_boundary_unavailable");
  return uncertain ? 3 : 0;
}

export function renderJson(run: VerificationRun): string {
  return jcsSerialize({ payload: run.payload, reportHash: run.reportHash });
}

// Minimal human rendering; the C-block tests (S3 plan 14-17) drive the canonical layout,
// escaping, and language rules red-first. Friendly labels stay OUT until those tests exist.
export function renderHuman(run: VerificationRun): string {
  const p = view(run.payload);
  const lines: string[] = [];
  lines.push(`trust: ${p.policyTrust?.state ?? "unknown"}`);
  for (const v of p.verifications ?? []) {
    lines.push(`${v.state ?? "unknown"}  ${v.verificationId ?? ""} ${v.statement ?? ""}`.trimEnd());
  }
  for (const l of p.limitations ?? []) {
    lines.push(`limitation: ${l.kind ?? ""} ${l.detail ?? ""}`.trimEnd());
  }
  lines.push(`reportHash: ${run.reportHash}`);
  return lines.join("\n");
}
