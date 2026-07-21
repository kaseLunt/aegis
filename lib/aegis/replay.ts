import { reportId, stableHash } from "./canonical";
import { SAFE_STAKING_SOURCE, WITHDRAWAL_STRESS_SOURCE } from "./fixtures";
import type { ReplayOptions, ReplayReport, ReplayStep } from "./types";

export const DEFAULT_REPLAY_OPTIONS: ReplayOptions = {
  fallbackDelayDays: 14,
  publicFallbackEnabled: true,
};

export function runReplay(
  options: ReplayOptions = DEFAULT_REPLAY_OPTIONS,
  generatedAt = new Date().toISOString(),
): ReplayReport {
  if (!Number.isInteger(options.fallbackDelayDays) || options.fallbackDelayDays < 1 || options.fallbackDelayDays > 30) {
    throw new Error("fallbackDelayDays must be an integer between 1 and 30.");
  }

  const restoredAtDays = options.publicFallbackEnabled ? options.fallbackDelayDays : 30;
  const isReference = options.fallbackDelayDays === 14 && options.publicFallbackEnabled;
  const finalState = options.publicFallbackEnabled ? "holding" : "violated";

  const steps: ReplayStep[] = [
    {
      id: "last-valid-report",
      index: 1,
      timeLabel: "T+00",
      title: "Last valid oracle report accepted",
      detail: "The reference snapshot begins with a valid report and a fully permissioned finalization path.",
      source: "Safe Staking reference model",
      provenance: "REFERENCE_SCENARIO",
      affectedControl: "ORCL-04",
      state: "holding",
      delta: [
        { label: "Oracle age", before: "—", after: "0m" },
        { label: "Finalization path", before: "—", after: "Oracle" },
      ],
    },
    {
      id: "heartbeat-missed",
      index: 2,
      timeLabel: "T+04H",
      title: "Expected heartbeat missed",
      detail: "A report is not observed on schedule. The protocol remains operable, but the liveness margin begins to narrow.",
      source: "Aegis deterministic clock",
      provenance: "REFERENCE_SCENARIO",
      affectedControl: "ORCL-04",
      state: "holding",
      delta: [
        { label: "Oracle age", before: "0m", after: "4h" },
        { label: "Liveness margin", before: `${options.fallbackDelayDays}d`, after: `${options.fallbackDelayDays}d − 4h` },
      ],
    },
    {
      id: "liveness-advisory",
      index: 3,
      timeLabel: "T+24H",
      title: "Oracle liveness enters advisory",
      detail: "Aegis marks the observation aging. It does not convert missing evidence into a passing result.",
      source: "Aegis freshness policy ORCL-04",
      provenance: "REFERENCE_SCENARIO",
      affectedControl: "ORCL-04",
      state: "advisory",
      delta: [
        { label: "Oracle age", before: "4h", after: "24h" },
        { label: "Control state", before: "Holding", after: "Advisory" },
      ],
    },
    {
      id: "fallback-boundary",
      index: 4,
      timeLabel: `T+${options.fallbackDelayDays}D`,
      title: options.publicFallbackEnabled ? "Public fallback becomes available" : "Fallback boundary reached without a public path",
      detail: options.publicFallbackEnabled
        ? "The modeled immutable delay has elapsed, allowing any actor to restore withdrawal finalization liveness."
        : "The counterfactual removes the permissionless recovery path, so liveness remains dependent on privileged reporting.",
      source: "Safe Staking public-fallback design",
      provenance: "CODE_PROPERTY",
      affectedControl: "ORCL-04",
      state: options.publicFallbackEnabled ? "advisory" : "violated",
      delta: [
        { label: "Fallback eligibility", before: "Locked", after: options.publicFallbackEnabled ? "Open" : "Unavailable" },
        { label: "Who can recover", before: "Oracle role", after: options.publicFallbackEnabled ? "Any address" : "Oracle role" },
      ],
    },
    {
      id: "finalization-restored",
      index: 5,
      timeLabel: options.publicFallbackEnabled ? `T+${options.fallbackDelayDays}D 03M` : "T+30D",
      title: options.publicFallbackEnabled ? "Finalization resumes" : "Scenario ends with unresolved liveness",
      detail: options.publicFallbackEnabled
        ? "A public caller advances the modeled finalization path; claims can continue without oracle-role intervention."
        : "The 30-day drill window closes without an encoded permissionless recovery transition.",
      source: "Aegis transition model",
      provenance: "REFERENCE_SCENARIO",
      affectedControl: "WD-03",
      state: finalState,
      delta: [
        { label: "Finalization path", before: "Stalled", after: options.publicFallbackEnabled ? "Public fallback" : "Stalled" },
        { label: "Withdrawal liveness", before: "Delayed", after: options.publicFallbackEnabled ? "Restored" : "Unresolved" },
      ],
    },
  ];

  const referenceDelta = isReference
    ? "Reference policy"
    : options.publicFallbackEnabled
      ? `${options.fallbackDelayDays - 14 > 0 ? "+" : ""}${options.fallbackDelayDays - 14} days vs reference`
      : "+16 days unresolved vs reference window";
  const payload = { scenario: "oracle-staleness-public-fallback-v1", options, steps };

  return {
    reportId: reportId("AGS-RP", payload),
    scenarioId: "oracle-staleness-public-fallback-v1",
    title: "Oracle staleness → public fallback",
    classification: "documented-scenario",
    generatedAt,
    options,
    steps,
    outcome: {
      status: options.publicFallbackEnabled ? "bounded" : "delayed",
      headline: options.publicFallbackEnabled
        ? `Withdrawal liveness restored at T+${restoredAtDays}d through the public fallback path.`
        : "Withdrawal liveness remains dependent on the privileged oracle path.",
      claimableBy: options.publicFallbackEnabled ? `T+${restoredAtDays}d 03m` : "Unresolved in 30-day drill",
      referenceDelta,
    },
    assumptions: [
      "This is a deterministic reference scenario, not a reconstruction of a production incident.",
      "The caller is available and able to invoke the public fallback after the encoded delay.",
      "Backing, escrow coverage, gas availability, and unrelated protocol controls remain within bounds.",
      "Changing the delay illustrates a tradeoff; it does not recommend a production governance value.",
    ],
    evidence: [SAFE_STAKING_SOURCE, WITHDRAWAL_STRESS_SOURCE],
    reportHash: `AGS-${stableHash(payload)}`,
  };
}
