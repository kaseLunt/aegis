import type { EvidenceSource, Limitation } from "./types";
import referenceManifest from "../../data/manifests/etherfi-reference-v1.json";

export const ENGINE_VERSION = "aegis-core/0.1.0";

export const SAFE_STAKING_SOURCE: EvidenceSource = {
  id: "etherfi-safe-staking-2026-07-14",
  label: "ether.fi Safe Staking design",
  kind: "official-doc",
  provenance: "CODE_PROPERTY",
  uri: "https://www.ether.fi/blog/safe-staking-from-doctrine-to-code",
  capturedAt: "2026-07-20T18:00:00.000Z",
  rawResultHash: "DOC-8A132E9C",
};

export const SECURITY_DOCTRINE_SOURCE: EvidenceSource = {
  id: "etherfi-security-doctrine",
  label: "ether.fi security doctrine",
  kind: "official-doc",
  provenance: "CODE_PROPERTY",
  uri: "https://www.ether.fi/blog/non-custodial-actively-defended",
  capturedAt: "2026-07-20T18:00:00.000Z",
  rawResultHash: "DOC-2E51C40A",
};

export const WITHDRAWAL_STRESS_SOURCE: EvidenceSource = {
  id: "etherfi-withdrawal-stress-test",
  label: "ether.fi withdrawal stress-test account",
  kind: "official-doc",
  provenance: "REFERENCE_SCENARIO",
  uri: "https://www.ether.fi/blog/how-ether-fi-redeemed-20-percent-of-tvl-without-adding-to-exit-queue",
  capturedAt: "2026-07-20T18:00:00.000Z",
  rawResultHash: "DOC-C19B33D0",
};

export const REFERENCE_SNAPSHOT_SOURCE: EvidenceSource = {
  id: "aegis-reference-snapshot-safe-staking-v1",
  label: "Aegis deterministic verifier fixture",
  kind: "scenario-fixture",
  provenance: "REFERENCE_SCENARIO",
  capturedAt: "2026-07-20T23:59:59.000Z",
  rawResultHash: "FIX-76F22BE1",
};

export const PINNED_CORE_SOURCE: EvidenceSource = {
  id: "etherfi-core-b4a0968",
  label: "ether.fi core contracts · pinned commit b4a0968",
  kind: "code-property",
  provenance: "CODE_PROPERTY",
  uri: "https://github.com/etherfi-protocol/smart-contracts/tree/b4a0968087b178bc346cdf6bee6c0597bf4c42c7",
  capturedAt: "2026-07-20T23:59:59.000Z",
  rawResultHash: "GIT-B4A09680",
};

export const PINNED_CASH_SOURCE: EvidenceSource = {
  id: "etherfi-cash-v3-247faab",
  label: "Cash v3 deployment manifest · Optimism",
  kind: "code-property",
  provenance: "CODE_PROPERTY",
  uri: "https://github.com/etherfi-protocol/cash-v3/blob/247faab2206cb651e2e81b2331404eed841145b8/deployments/mainnet/10/deployments.json",
  capturedAt: "2026-07-20T23:59:59.000Z",
  rawResultHash: "GIT-247FAAB2",
};

export interface ProtocolSnapshot {
  id: string;
  label: string;
  asOf: string;
  ethereumBlockNumber: number;
  ethereumBlockHash: string;
  optimismBlockNumber: number;
  optimismBlockHash: string;
  expectedWeethImplementation: string;
  observedWeethImplementation: string;
  weethTotalSupplyShares: number;
  eethSharesHeldByWeeth: number;
  finalizedEscrowEth: number;
  finalizedObligationsEth: number;
  oracleQuorumSize: number;
  oracleMinQuorumSize: number;
  oracleActiveMembers: number;
  upgradeDelaySeconds: number;
  expectedUpgradeDelaySeconds: number;
  preTotalPooledEther: number;
  accruedRewardsEth: number;
  maxPositiveRebaseBps: number;
  cashLtvBps: number;
  cashLiquidationThresholdBps: number;
  cashLiquidationBonusBps: number;
}

export const REFERENCE_SNAPSHOT: ProtocolSnapshot = {
  id: "safe-staking-reference-2026-07-v1",
  label: "Pinned reference · ETH 25,577,369 / OP 154,496,611",
  asOf: referenceManifest.asOfUtc,
  ethereumBlockNumber: referenceManifest.blocks.ethereum.number,
  ethereumBlockHash: referenceManifest.blocks.ethereum.hash,
  optimismBlockNumber: referenceManifest.blocks.optimism.number,
  optimismBlockHash: referenceManifest.blocks.optimism.hash,
  expectedWeethImplementation: referenceManifest.contracts.ethereum.weeth.implementation,
  observedWeethImplementation: referenceManifest.contracts.ethereum.weeth.implementation,
  weethTotalSupplyShares: 1_230_000,
  eethSharesHeldByWeeth: 1_234_512,
  finalizedEscrowEth: 68_420,
  finalizedObligationsEth: 68_175,
  oracleQuorumSize: 5,
  oracleMinQuorumSize: 3,
  oracleActiveMembers: 7,
  upgradeDelaySeconds: 864_000,
  expectedUpgradeDelaySeconds: 864_000,
  preTotalPooledEther: 1_000_000,
  accruedRewardsEth: 1_870,
  maxPositiveRebaseBps: 25,
  cashLtvBps: 8_000,
  cashLiquidationThresholdBps: 8_500,
  cashLiquidationBonusBps: 500,
};

export const REFERENCE_LIMITATIONS: Limitation[] = [
  {
    code: "RECORDED_INPUTS",
    text: "Control inputs are deterministic reference values, not claims about current production contract state.",
  },
  {
    code: "DESIGN_SCOPE",
    text: "A holding result proves only the encoded assertion against this snapshot; it is not a protocol-wide safety guarantee.",
  },
];
