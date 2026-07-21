import { reportId, stableHash } from "./canonical";
import type {
  PreflightCheck,
  PreflightReport,
  PreflightRequest,
  VerificationState,
} from "./types";

const SCALE = 1_000_000n;
const BPS = 10_000n;
const MAX_ORACLE_AGE_SECONDS = 300;
const STRESS_DROP_BPS = 1_500n;

function parseUsd(value: string): bigint {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
    throw new Error("USD values must be positive decimal strings with at most six decimals.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, "0"));
}

function formatUsd(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / SCALE;
  const cents = ((absolute % SCALE) / 10_000n).toString().padStart(2, "0");
  return `${sign}$${whole.toLocaleString("en-US")}.${cents}`;
}

function ratioBps(numerator: bigint, denominator: bigint): bigint {
  return denominator === 0n ? 0n : (numerator * BPS) / denominator;
}

function formatPercentBps(value: bigint): string {
  const whole = value / 100n;
  const decimal = (value % 100n).toString().padStart(2, "0");
  return `${whole}.${decimal}%`;
}

function check(
  id: string,
  label: string,
  condition: boolean,
  expression: string,
  observed: string,
  boundary: string,
  failureState: VerificationState = "violated",
): PreflightCheck {
  return {
    id,
    label,
    state: condition ? "holding" : failureState,
    expression,
    observed,
    boundary,
  };
}

export function runPreflight(
  input: PreflightRequest,
  generatedAt = new Date().toISOString(),
): PreflightReport {
  if (!Number.isInteger(input.maxLtvBps) || input.maxLtvBps < 1 || input.maxLtvBps > 9_500) {
    throw new Error("maxLtvBps must be an integer between 1 and 9500.");
  }
  if (!Number.isInteger(input.oracleAgeSeconds) || input.oracleAgeSeconds < 0) {
    throw new Error("oracleAgeSeconds must be a non-negative integer.");
  }

  const amount = parseUsd(input.amountUsd);
  const directBalance = parseUsd(input.directBalanceUsd);
  const collateral = parseUsd(input.collateralUsd);
  const debt = parseUsd(input.debtUsd);

  if (amount === 0n) throw new Error("Amount must be greater than zero.");

  const oracleFresh = input.oracleAgeSeconds <= MAX_ORACLE_AGE_SECONDS;
  const checks: PreflightCheck[] = [
    check(
      "price.freshness",
      "Price observation freshness",
      oracleFresh,
      `${input.oracleAgeSeconds}s <= ${MAX_ORACLE_AGE_SECONDS}s`,
      `${input.oracleAgeSeconds}s old`,
      `<= ${MAX_ORACLE_AGE_SECONDS}s`,
      "advisory",
    ),
  ];

  let fundingAvailable = false;
  let stressHolding = true;
  let beforePrimary = directBalance;
  let afterPrimary = directBalance - amount;
  let boundary = "$0.00";
  let primaryLabel = "Direct-pay balance";
  let beforeUtilization = 0n;
  let afterUtilization = 0n;

  if (input.mode === "direct") {
    fundingAvailable = directBalance >= amount;
    checks.push(
      check(
        "funding.direct-balance",
        "Direct-pay funds available",
        fundingAvailable,
        `${formatUsd(directBalance)} >= ${formatUsd(amount)}`,
        formatUsd(directBalance),
        formatUsd(amount),
      ),
    );
  } else {
    const maxLtv = BigInt(input.maxLtvBps);
    const capacity = (collateral * maxLtv) / BPS;
    const postDebt = debt + amount;
    const stressedCollateral = (collateral * (BPS - STRESS_DROP_BPS)) / BPS;
    const stressedCapacity = (stressedCollateral * maxLtv) / BPS;

    fundingAvailable = postDebt <= capacity;
    stressHolding = postDebt <= stressedCapacity;
    beforePrimary = debt;
    afterPrimary = postDebt;
    boundary = formatUsd(capacity);
    primaryLabel = "Borrowed balance";
    beforeUtilization = ratioBps(debt, capacity);
    afterUtilization = ratioBps(postDebt, capacity);

    checks.push(
      check(
        "funding.borrow-headroom",
        "Borrow headroom",
        fundingAvailable,
        `${formatUsd(postDebt)} <= ${formatUsd(capacity)}`,
        formatUsd(postDebt),
        formatUsd(capacity),
      ),
      check(
        "risk.collateral-stress",
        "15% collateral stress",
        stressHolding,
        `${formatUsd(postDebt)} <= ${formatUsd(stressedCapacity)}`,
        formatUsd(postDebt),
        formatUsd(stressedCapacity),
        "advisory",
      ),
    );
  }

  const hasViolation = checks.some(({ state }) => state === "violated");
  const hasAdvisory = checks.some(({ state }) => state === "advisory");
  const verdict = hasViolation
    ? "blocked_by_policy"
    : hasAdvisory
      ? "warning"
      : "no_blocking_findings";

  const headline =
    verdict === "blocked_by_policy"
      ? "Blocked by policy"
      : verdict === "warning"
        ? "Review before signing"
        : "No blocking findings";

  const summary =
    verdict === "blocked_by_policy"
      ? "The modeled transition crosses an encoded funding or risk boundary."
      : verdict === "warning"
        ? "Execution is modeled to succeed, but one observation or stress check needs review."
        : "The deterministic model completed without crossing an encoded boundary.";

  const payload = { input, checks, verdict };

  return {
    reportId: reportId("AGS-PF", payload),
    generatedAt,
    verdict,
    headline,
    summary,
    decodedIntent: {
      action: input.mode === "direct" ? "Fund a Cash purchase" : "Open debt for a Cash purchase",
      amount: formatUsd(amount),
      fundingPath: input.mode === "direct" ? "Direct Pay" : "Borrow Mode",
      submission: "never-submitted",
    },
    metrics: [
      {
        label: primaryLabel,
        before: formatUsd(beforePrimary),
        after: formatUsd(afterPrimary),
        boundary,
        state: fundingAvailable ? "holding" : "violated",
      },
      ...(input.mode === "borrow"
        ? [
            {
              label: "Capacity utilization",
              before: formatPercentBps(beforeUtilization),
              after: formatPercentBps(afterUtilization),
              boundary: formatPercentBps(BPS),
              state: (stressHolding ? "holding" : "advisory") as VerificationState,
            },
          ]
        : []),
      {
        label: "Oracle observation",
        before: `${input.oracleAgeSeconds}s old`,
        after: `${input.oracleAgeSeconds}s old`,
        boundary: `<= ${MAX_ORACLE_AGE_SECONDS}s`,
        state: oracleFresh ? "holding" : "advisory",
      },
    ],
    checks,
    executionTrace: [
      { index: 1, operation: "Decode funding intent", target: "CashModule", result: "recognized" },
      { index: 2, operation: "Read modeled account state", target: "EtherFiSafe", result: "snapshot pinned" },
      { index: 3, operation: "Evaluate price freshness", target: "PriceProvider", result: oracleFresh ? "current" : "advisory" },
      { index: 4, operation: "Evaluate spend capacity", target: input.mode === "direct" ? "CashModule" : "DebtManager", result: fundingAvailable ? "within boundary" : "policy blocked" },
      { index: 5, operation: "Re-run encoded controls", target: "Aegis engine", result: hasViolation ? "violation found" : "complete" },
    ],
    limitations: [
      {
        code: "REFERENCE_MODEL",
        text: "This is a deterministic educational model, not an eth_call against production contracts.",
      },
      {
        code: "NO_SUBMISSION",
        text: "Aegis never requests keys, signs transactions, or broadcasts this intent.",
      },
      {
        code: "UNMODELED_EFFECTS",
        text: "Future prices, mempool ordering, issuer decisions, gas, and contract upgrades are not modeled.",
      },
    ],
    reportHash: `AGS-${stableHash(payload)}`,
  };
}

export const DEFAULT_PREFLIGHT_REQUEST: PreflightRequest = {
  mode: "direct",
  amountUsd: "1280.00",
  directBalanceUsd: "5240.00",
  collateralUsd: "12000.00",
  debtUsd: "3500.00",
  maxLtvBps: 8000,
  oracleAgeSeconds: 42,
};
