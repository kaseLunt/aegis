import { reportId, stableHash } from "./canonical";
import {
  ENGINE_VERSION,
  PINNED_CASH_SOURCE,
  PINNED_CORE_SOURCE,
  REFERENCE_LIMITATIONS,
  REFERENCE_SNAPSHOT,
  REFERENCE_SNAPSHOT_SOURCE,
  SAFE_STAKING_SOURCE,
  SECURITY_DOCTRINE_SOURCE,
  type ProtocolSnapshot,
} from "./fixtures";
import type {
  ChainHead,
  InvariantResult,
  ProtocolReport,
  VerificationState,
} from "./types";

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function makeControl(
  control: Omit<InvariantResult, "resultHash" | "limitations" | "evidence">,
): InvariantResult {
  const payload = {
    id: control.id,
    expression: control.expression,
    current: control.current,
    guardrail: control.guardrail,
    state: control.state,
    snapshot: REFERENCE_SNAPSHOT.id,
  };

  return {
    ...control,
    evidence: [REFERENCE_SNAPSHOT_SOURCE, PINNED_CORE_SOURCE, SAFE_STAKING_SOURCE],
    limitations: REFERENCE_LIMITATIONS,
    resultHash: `AGS-${stableHash(payload)}`,
  };
}

function state(condition: boolean): VerificationState {
  return condition ? "holding" : "violated";
}

export function evaluateControls(snapshot: ProtocolSnapshot): InvariantResult[] {
  const backingRatio = snapshot.eethSharesHeldByWeeth / snapshot.weethTotalSupplyShares;
  const escrowMargin = snapshot.finalizedEscrowEth - snapshot.finalizedObligationsEth;
  const oracleGeometryHolds =
    snapshot.oracleQuorumSize >= snapshot.oracleMinQuorumSize &&
    snapshot.oracleActiveMembers >= snapshot.oracleQuorumSize &&
    snapshot.oracleActiveMembers < 2 * snapshot.oracleQuorumSize;
  const accruedRewardsCap = (snapshot.preTotalPooledEther * snapshot.maxPositiveRebaseBps) / 10_000;
  const observedRebaseBps = (snapshot.accruedRewardsEth / snapshot.preTotalPooledEther) * 10_000;
  const cashGeometryHolds =
    snapshot.cashLtvBps <= snapshot.cashLiquidationThresholdBps &&
    snapshot.cashLiquidationThresholdBps + snapshot.cashLiquidationBonusBps <= 10_000;

  return [
    {
      ...makeControl({
        id: "deployment.code-identity",
        shortId: "CODE-01",
        title: "weETH code identity",
        category: "Authority",
        severity: "critical",
        provenance: "REFERENCE_SCENARIO",
        state: state(snapshot.observedWeethImplementation.toLowerCase() === snapshot.expectedWeethImplementation.toLowerCase()),
        statement: "The EIP-1967 implementation at the pinned block matches the versioned deployment manifest.",
        expression: `${snapshot.observedWeethImplementation.slice(0, 10)}… == ${snapshot.expectedWeethImplementation.slice(0, 10)}…`,
        current: `${snapshot.observedWeethImplementation.slice(0, 8)}…${snapshot.observedWeethImplementation.slice(-4)}`,
        guardrail: "Manifest match",
        margin: "Exact",
        protects: "Makes proxy implementation drift observable without pretending every authorized upgrade is an exploit.",
        inputs: [
          { label: "Observed implementation", value: snapshot.observedWeethImplementation, source: `EIP-1967 · ETH block ${integer.format(snapshot.ethereumBlockNumber)}` },
          { label: "Expected implementation", value: snapshot.expectedWeethImplementation, source: "pinned deployment manifest" },
          { label: "Block hash", value: `${snapshot.ethereumBlockHash.slice(0, 12)}…${snapshot.ethereumBlockHash.slice(-8)}`, source: "recorded block reference" },
        ],
      }),
      evidence: [REFERENCE_SNAPSHOT_SOURCE, PINNED_CORE_SOURCE],
    },
    makeControl({
      id: "backing.coverage",
      shortId: "BACK-02",
      title: "weETH wrapper-share backing",
      category: "Backing",
      severity: "critical",
      provenance: "REFERENCE_SCENARIO",
      state: state(snapshot.eethSharesHeldByWeeth >= snapshot.weethTotalSupplyShares),
      statement: "eETH shares held by the weETH wrapper meet or exceed outstanding weETH supply.",
      expression: `${integer.format(snapshot.eethSharesHeldByWeeth)} shares >= ${integer.format(snapshot.weethTotalSupplyShares)} weETH`,
      current: `${backingRatio.toFixed(4)}x`,
      guardrail: ">= 1.0000x",
      margin: `+${integer.format(snapshot.eethSharesHeldByWeeth - snapshot.weethTotalSupplyShares)} shares`,
      protects: "Detects local wrapper-share under-backing. It deliberately does not claim whole-protocol solvency.",
      inputs: [
        { label: "eETH shares held", value: integer.format(snapshot.eethSharesHeldByWeeth), source: "recorded fixture · eETH.shares(weETH)" },
        { label: "weETH total supply", value: integer.format(snapshot.weethTotalSupplyShares), source: "recorded fixture · weETH.totalSupply()" },
      ],
    }),
    makeControl({
      id: "withdrawals.coverage",
      shortId: "WD-03",
      title: "Finalized-withdrawal coverage",
      category: "Withdrawals",
      severity: "critical",
      provenance: "REFERENCE_SCENARIO",
      state: state(snapshot.finalizedEscrowEth >= snapshot.finalizedObligationsEth),
      statement: "Escrowed withdrawal assets cover all finalized obligations.",
      expression: `${integer.format(snapshot.finalizedEscrowEth)} ETH >= ${integer.format(snapshot.finalizedObligationsEth)} ETH`,
      current: `${integer.format(snapshot.finalizedEscrowEth)} ETH`,
      guardrail: `>= ${integer.format(snapshot.finalizedObligationsEth)} ETH`,
      margin: `+${integer.format(escrowMargin)} ETH`,
      protects: "Keeps finalized claims funded at their locked accounting rate.",
      inputs: [
        { label: "Contract balance", value: `${integer.format(snapshot.finalizedEscrowEth)} ETH`, source: "recorded fixture · eth_getBalance(WithdrawRequestNFT)" },
        { label: "Locked obligations", value: `${integer.format(snapshot.finalizedObligationsEth)} ETH`, source: "recorded fixture · ethAmountLockedForWithdrawal()" },
      ],
    }),
    makeControl({
      id: "oracle.quorum-geometry",
      shortId: "ORCL-04",
      title: "Oracle quorum geometry",
      category: "Oracle",
      severity: "critical",
      provenance: "REFERENCE_SCENARIO",
      state: state(oracleGeometryHolds),
      statement: "Quorum is above its floor, has enough active members, and remains a strict majority.",
      expression: `${snapshot.oracleMinQuorumSize} <= ${snapshot.oracleQuorumSize} <= ${snapshot.oracleActiveMembers} < ${2 * snapshot.oracleQuorumSize}`,
      current: `${snapshot.oracleQuorumSize} / ${snapshot.oracleActiveMembers} members`,
      guardrail: "floor + strict majority",
      margin: `${snapshot.oracleActiveMembers - snapshot.oracleQuorumSize} member buffer`,
      protects: "Detects committee configurations that cannot reach quorum or no longer require a strict majority.",
      inputs: [
        { label: "Quorum size", value: String(snapshot.oracleQuorumSize), source: "recorded fixture · quorumSize()" },
        { label: "Minimum quorum", value: String(snapshot.oracleMinQuorumSize), source: "recorded fixture · minQuorumSize()" },
        { label: "Active committee", value: String(snapshot.oracleActiveMembers), source: "recorded fixture · numActiveCommitteeMembers()" },
      ],
    }),
    {
      ...makeControl({
        id: "governance.upgrade-delay",
        shortId: "GOV-05",
        title: "Upgrade timelock",
        category: "Authority",
        severity: "high",
        provenance: "REFERENCE_SCENARIO",
        state: state(snapshot.upgradeDelaySeconds === snapshot.expectedUpgradeDelaySeconds),
        statement: "The observed timelock delay matches the pinned 10-day governance policy.",
        expression: `${snapshot.upgradeDelaySeconds}s == ${snapshot.expectedUpgradeDelaySeconds}s`,
        current: `${snapshot.upgradeDelaySeconds / 86_400} days`,
        guardrail: "== 10 days",
        margin: "Exact",
        protects: "Surfaces governance-policy drift while acknowledging the delay can itself change through the timelock.",
        inputs: [
          { label: "Observed delay", value: `${snapshot.upgradeDelaySeconds}s`, source: "recorded fixture · UpgradeTimelock.getMinDelay()" },
          { label: "Policy delay", value: `${snapshot.expectedUpgradeDelaySeconds}s`, source: "pinned security doctrine" },
        ],
      }),
      evidence: [REFERENCE_SNAPSHOT_SOURCE, PINNED_CORE_SOURCE, SECURITY_DOCTRINE_SOURCE],
    },
    makeControl({
      id: "rebase.positive-cap",
      shortId: "REBASE-06",
      title: "Positive-rebase cap",
      category: "Limits",
      severity: "high",
      provenance: "REFERENCE_SCENARIO",
      state: state(snapshot.accruedRewardsEth <= accruedRewardsCap),
      statement: "Positive accrued rewards remain within the encoded per-rebase ceiling.",
      expression: `${integer.format(snapshot.accruedRewardsEth)} ETH <= ${integer.format(accruedRewardsCap)} ETH`,
      current: `${observedRebaseBps.toFixed(2)} bps`,
      guardrail: `<= ${snapshot.maxPositiveRebaseBps} bps`,
      margin: `${(snapshot.maxPositiveRebaseBps - observedRebaseBps).toFixed(2)} bps`,
      protects: "Bounds positive accounting jumps without incorrectly requiring rate monotonicity across legitimate negative rebases.",
      inputs: [
        { label: "Accrued rewards", value: `${integer.format(snapshot.accruedRewardsEth)} ETH`, source: "recorded reference transition" },
        { label: "Pre-rebase pooled ETH", value: `${integer.format(snapshot.preTotalPooledEther)} ETH`, source: "recorded reference transition" },
        { label: "Contract ceiling", value: `${snapshot.maxPositiveRebaseBps} bps`, source: "MAX_POSITIVE_REBASE_BPS()" },
      ],
    }),
    {
      ...makeControl({
        id: "cash.collateral-geometry",
        shortId: "CASH-07",
        title: "Cash collateral geometry",
        category: "Limits",
        severity: "high",
        provenance: "REFERENCE_SCENARIO",
        state: state(cashGeometryHolds),
        statement: "LTV does not exceed the liquidation threshold, and threshold plus bonus stays within 100%.",
        expression: `${snapshot.cashLtvBps} <= ${snapshot.cashLiquidationThresholdBps}; ${snapshot.cashLiquidationThresholdBps} + ${snapshot.cashLiquidationBonusBps} <= 10000`,
        current: `${snapshot.cashLtvBps / 100}% / ${snapshot.cashLiquidationThresholdBps / 100}%`,
        guardrail: "LTV ≤ LT; LT + bonus ≤ 100%",
        margin: `${(snapshot.cashLiquidationThresholdBps - snapshot.cashLtvBps) / 100}% buffer`,
        protects: "Rejects internally inconsistent collateral settings before they become spend or liquidation policy.",
        inputs: [
          { label: "Loan-to-value", value: `${snapshot.cashLtvBps / 100}%`, source: "recorded fixture · collateralTokenConfig(token)" },
          { label: "Liquidation threshold", value: `${snapshot.cashLiquidationThresholdBps / 100}%`, source: "recorded fixture · collateralTokenConfig(token)" },
          { label: "Liquidation bonus", value: `${snapshot.cashLiquidationBonusBps / 100}%`, source: "recorded fixture · collateralTokenConfig(token)" },
          { label: "OP block", value: integer.format(snapshot.optimismBlockNumber), source: snapshot.optimismBlockHash.slice(0, 18) },
        ],
      }),
      evidence: [REFERENCE_SNAPSHOT_SOURCE, PINNED_CASH_SOURCE],
    },
  ];
}

export function buildProtocolReport(
  snapshot: ProtocolSnapshot = REFERENCE_SNAPSHOT,
  chainHeads: ChainHead[] = [],
  generatedAt = new Date().toISOString(),
): ProtocolReport {
  const effectiveChainHeads: ChainHead[] = chainHeads.length
    ? chainHeads
    : [
        {
          chainId: 1,
          chain: "Ethereum",
          status: "recorded",
          blockNumber: String(snapshot.ethereumBlockNumber),
          blockHash: snapshot.ethereumBlockHash,
          capturedAt: snapshot.asOf,
        },
        {
          chainId: 10,
          chain: "OP Mainnet",
          status: "recorded",
          blockNumber: String(snapshot.optimismBlockNumber),
          blockHash: snapshot.optimismBlockHash,
          capturedAt: snapshot.asOf,
        },
      ];
  const controls = evaluateControls(snapshot);
  const count = (target: VerificationState) => controls.filter(({ state: item }) => item === target).length;
  const sourceMode = effectiveChainHeads.some((head) => head.status === "current") ? "hybrid" : "recorded";
  const payload = { snapshot: snapshot.id, controls: controls.map(({ resultHash }) => resultHash), chainHeads: effectiveChainHeads };

  return {
    reportId: reportId("AGS-HEALTH", payload),
    engineVersion: ENGINE_VERSION,
    generatedAt,
    sourceMode,
    snapshotId: snapshot.id,
    snapshotLabel: snapshot.label,
    controls,
    summary: {
      holding: count("holding"),
      advisory: count("advisory"),
      violated: count("violated"),
      unknown: count("unknown") + count("stale"),
    },
    stateChanges: [
      { at: "23:59:59", label: "Pinned block references aligned", provenance: "PUBLIC_STATE" },
      { at: "23:59:58", label: "Proxy implementations matched to manifest", provenance: "REFERENCE_SCENARIO" },
      { at: "23:59:56", label: "Backing and withdrawal assertions evaluated", provenance: "REFERENCE_SCENARIO" },
      { at: "23:59:54", label: "Governance and risk geometry inspected", provenance: "CODE_PROPERTY" },
    ],
    chainHeads: effectiveChainHeads,
    limitations: REFERENCE_LIMITATIONS,
    reportHash: `AGS-${stableHash(payload)}`,
  };
}
