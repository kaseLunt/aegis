export type ProvenanceClass = "PUBLIC_STATE" | "CODE_PROPERTY" | "REFERENCE_SCENARIO";

export type VerificationState =
  | "holding"
  | "advisory"
  | "violated"
  | "unknown"
  | "stale";

export type Severity = "critical" | "high" | "medium" | "low";

export interface EvidenceSource {
  id: string;
  label: string;
  kind: "official-doc" | "rpc-call" | "code-property" | "scenario-fixture";
  provenance: ProvenanceClass;
  uri?: string;
  method?: string;
  capturedAt: string;
  rawResultHash: string;
}

export interface Limitation {
  code: string;
  text: string;
}

export interface InvariantResult {
  id: string;
  shortId: string;
  title: string;
  category: "Backing" | "Withdrawals" | "Oracle" | "Authority" | "Limits";
  severity: Severity;
  provenance: ProvenanceClass;
  state: VerificationState;
  statement: string;
  expression: string;
  current: string;
  guardrail: string;
  margin: string;
  protects: string;
  inputs: Array<{ label: string; value: string; source: string }>;
  evidence: EvidenceSource[];
  limitations: Limitation[];
  resultHash: string;
}

export interface ChainHead {
  chainId: number;
  chain: string;
  status: "current" | "recorded" | "unavailable";
  blockNumber?: string;
  blockHash?: string;
  capturedAt: string;
  latencyMs?: number;
}

export interface ProtocolReport {
  reportId: string;
  engineVersion: string;
  generatedAt: string;
  sourceMode: "recorded" | "hybrid";
  snapshotId: string;
  snapshotLabel: string;
  controls: InvariantResult[];
  summary: {
    holding: number;
    advisory: number;
    violated: number;
    unknown: number;
  };
  stateChanges: Array<{
    at: string;
    label: string;
    provenance: ProvenanceClass;
  }>;
  chainHeads: ChainHead[];
  limitations: Limitation[];
  reportHash: string;
}

export type SpendMode = "direct" | "borrow";

export interface PreflightRequest {
  mode: SpendMode;
  amountUsd: string;
  directBalanceUsd: string;
  collateralUsd: string;
  debtUsd: string;
  maxLtvBps: number;
  oracleAgeSeconds: number;
}

export interface PreflightCheck {
  id: string;
  label: string;
  state: VerificationState;
  expression: string;
  observed: string;
  boundary: string;
}

export interface PreflightReport {
  reportId: string;
  generatedAt: string;
  verdict: "no_blocking_findings" | "warning" | "blocked_by_policy";
  headline: string;
  summary: string;
  decodedIntent: {
    action: string;
    amount: string;
    fundingPath: string;
    submission: "never-submitted";
  };
  metrics: Array<{
    label: string;
    before: string;
    after: string;
    boundary?: string;
    state: VerificationState;
  }>;
  checks: PreflightCheck[];
  executionTrace: Array<{
    index: number;
    operation: string;
    target: string;
    result: string;
  }>;
  limitations: Limitation[];
  reportHash: string;
}

export interface ReplayOptions {
  fallbackDelayDays: number;
  publicFallbackEnabled: boolean;
}

export interface ReplayStep {
  id: string;
  index: number;
  timeLabel: string;
  title: string;
  detail: string;
  source: string;
  provenance: ProvenanceClass;
  affectedControl: string;
  state: VerificationState;
  delta: Array<{ label: string; before: string; after: string }>;
}

export interface ReplayReport {
  reportId: string;
  scenarioId: string;
  title: string;
  classification: "documented-scenario";
  generatedAt: string;
  options: ReplayOptions;
  steps: ReplayStep[];
  outcome: {
    status: "bounded" | "delayed";
    headline: string;
    claimableBy: string;
    referenceDelta: string;
  };
  assumptions: string[];
  evidence: EvidenceSource[];
  reportHash: string;
}
