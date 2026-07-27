// W5 slice S5 — the CI adapter (S5 plan). Third transport over the one engine: it calls
// runVerification only, classifies via the SHARED exitCodeForPayload (two transports can
// never classify one payload differently), and carries the SHARED renderJson bytes as its
// canonical body — the S7 byte-identity artifact, reused not rebuilt.
//
// A throw is an operational failure of the run, never a verdict: the thrown-path mapping
// mirrors the CLI verbatim (RequestError -> 4, SurfaceError/other -> 5), returned as data
// so a CI step can act on the exit code without parsing prose.
import type { DeploymentConfig, VerificationRun } from "./engine";
import { runVerification, SurfaceError } from "./engine";
import type { VerificationInputs, VerificationSelector } from "./request";
import { RequestError } from "./request";
import { esc, exitCodeForPayload, renderJson, view } from "./render";

const STATES = ["pass", "fail", "unknown", "stale", "conflict"] as const;

// Deterministic projection of the payload ONLY (ENGINEERING_SPEC:879): stable key=value
// lines for CI logs. Per-state counts are named individually — never collapsed into one
// aggregate word (THREAT_MODEL:98). No timestamps, no clock, no request ids.
function summarize(payload: unknown, exitCode: number, reportHash: string): string[] {
  const p = view(payload);
  const reasons = (p.policyTrust?.reasonCodes ?? []).map(esc).join(", ");
  const verifications = p.verifications ?? [];
  return [
    `exit=${exitCode}`,
    `reportHash=${esc(reportHash)}`,
    `trust=${esc(p.policyTrust?.state ?? "unknown")}${reasons ? ` (${reasons})` : ""}`,
    `boundaries=${(p.observationBoundaries ?? []).length}`,
    ...STATES.map(
      (state) => `verifications.${state}=${verifications.filter((v) => v.state === state).length}`,
    ),
    `limitations=${(p.limitations ?? []).length}`,
  ];
}

export interface CiRun {
  readonly exitCode: number;
  readonly reportHash: string | null;
  readonly canonicalBody: string | null;
  readonly summaryLines: readonly string[];
}

function thrownCiRun(exitCode: number, detail: string): CiRun {
  return {
    exitCode,
    reportHash: null,
    canonicalBody: null,
    summaryLines: [`exit=${exitCode}`, `error=${esc(detail)}`],
  };
}

export async function runCiVerification(
  inputs: VerificationInputs,
  selector: VerificationSelector,
  deployment: DeploymentConfig,
): Promise<CiRun> {
  let run: VerificationRun;
  try {
    run = await runVerification(inputs, selector, deployment);
  } catch (error) {
    if (error instanceof RequestError) {
      return thrownCiRun(4, `${error.code} at ${error.path}`);
    }
    if (error instanceof SurfaceError) {
      return thrownCiRun(5, `${error.code} at ${error.path}`);
    }
    const code =
      error instanceof Error && "code" in error && typeof error.code === "string"
        ? error.code
        : "engine_failure";
    return thrownCiRun(5, code);
  }

  const exitCode = exitCodeForPayload(run.payload);
  return {
    exitCode,
    reportHash: run.reportHash,
    canonicalBody: renderJson(run),
    summaryLines: summarize(run.payload, exitCode, run.reportHash),
  };
}
