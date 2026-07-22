# Aegis Engineering Specification

Status: target architecture
Version: 1.2
Updated: 2026-07-22

## Engineering objective

Build a small, reviewable assurance core that produces deterministic verifications and neutral facts from independently sourced policy and evidence inputs. Expose that core through a CLI, API, CI workflow, scheduled monitor, and evidence-oriented web interface.

The system must prefer an honest `unknown` over an unjustified `pass` or `fail`.

## System contract

Given:

- versioned deployment manifests and external-source policies;
- one or more execution, consensus, or external-source targets;
- explicit finality and freshness policies;
- the providers or content-addressed source snapshots required by the target;
- versioned invariant and fact registries;
- an injected clock;

Aegis produces a canonical assurance report containing typed observation boundaries, evidence, predicate verifications, neutral facts, coverage, limitations, and a cryptographic content hash.

The same inputs must produce byte-identical canonical reports.

## Target architecture

```text
                         +----------------------+
                         | Manifests and source |
                         | policies             |
                         +----------+-----------+
                                    |
                                    v
+----------------+   +--------------+---------------+      +----------------+
| RPC/consensus  +-->+ Observation and evidence     +----->+ Pure predicate |
| /source inputs |   | normalization               |      | and fact evals  |
+----------------+   +--------------+---------------+      +--------+-------+
                                    |                               |
                                    v                               v
                         +----------+-----------+        +----------+----------+
                         | Append-only evidence |        | Canonical report   |
                         | and boundary lineage  |        | and SHA-256 hash  |
                         +----------+-----------+        +----+----+----+-----+
                                                              |    |    |
                                                             CLI  API  Web/CI
```

### Completed-product architecture

Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS adapters all terminate at the same observation, evaluation, evidence, and report contracts. Domain packages may define their own typed observations and predicates; they may not define alternate truth states, provenance classes, hashing rules, or UI-only verdicts.

An append-only indexer stores implementation epochs, configuration events, exposure edges, checkpoints, and report lineage. A scheduler or release hook requests verification, but it does not bypass finality or provider policy. Webhooks and CI consume content-addressed reports rather than recomputing conclusions.

The web Protocol Atlas is a projection of this graph:

```text
chain-scoped contract identities
        + roles and dependencies
        + directed routes
        + vault policies and queues
        + governance actions
        + validator/operator/AVS exposure edges
                         |
                         v
             canonical evidence reports
                         |
             +-----------+-----------+
             |           |           |
          current      history    proposed state
          Record       Rewind       Rehearse
```

## Proposed repository shape

The existing site may evolve toward this logical structure without adding services before they are necessary:

```text
packages/
  core/
    canonical.ts
    clock.ts
    types.ts
  manifests/
    schema.ts
    loader.ts
  evidence/
    normalize.ts
    freshness.ts
    conflicts.ts
  invariants/
    registry.ts
    code-identity.ts
    wrapper-backing.ts
    withdrawal-escrow.ts
    oracle-quorum.ts
    governance-delay.ts
    bridge-path.ts
    liquid-wiring.ts
    liquid-policy.ts
    liquid-rebalance.ts
    cash-wiring.ts
    cash-risk.ts
  facts/
    registry.ts
    operator-exposure.ts
    account-state.ts
  preflight/
    identity.ts
    decode.ts
    simulate.ts
    diff.ts
    policies.ts
  replay/
    ingest.ts
    timeline.ts
    causal-graph.ts
    counterfactual.ts
  indexer/
    epochs.ts
    checkpoints.ts
    configuration-events.ts
    exposure-edges.ts
  adapters/
    rpc.ts
    consensus.ts
    source-snapshot.ts
    recorded.ts
    manifest.ts
  report/
    schema.ts
    hash.ts
apps/
  web/
  cli/
  worker/
data/
  manifests/
  incidents/
  fixtures/rpc/
```

This is a logical boundary, not a requirement to manufacture a large monorepo. The trusted evaluator core should remain small.

## Canonical domain types

```ts
type VerificationState =
  | "pass"
  | "fail"
  | "unknown"
  | "stale"
  | "conflict"
  | "not_applicable";

type FactAvailabilityState =
  | "available"
  | "partial"
  | "unknown"
  | "stale"
  | "conflict"
  | "not_applicable";

type PolicyTrustState = "trusted" | "untrusted" | "invalid";

type ClaimKind = "observed" | "derived" | "policy" | "modeled";
type ProvenanceClass =
  | "observed_public_state"
  | "observed_external_source"
  | "code_property"
  | "reviewed_research_rationale"
  | "declared_configuration"
  | "derived_result"
  | "reference_scenario"
  | "modeled_counterfactual";
type SourceMode = "live" | "recorded" | "simulation";

interface BlockRef {
  chainId: number;
  number: string;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestamp: string;
  finality: "finalized" | "safe" | "confirmations" | "unconfirmed";
}

interface SourceSnapshotRef {
  sourceId: string;
  contentHash: `sha256:${string}`;
  retrievedAt: string;
  publishedAt?: string;
  version?: string;
  uri: string;
}

interface ConsensusRef {
  network: string;
  slot: string;
  blockRoot: `0x${string}`;
  stateRoot?: `0x${string}`;
  timestamp: string;
  finalized: boolean;
}

type ObservationBoundary =
  | { kind: "execution_block"; block: BlockRef }
  | { kind: "consensus_state"; consensus: ConsensusRef }
  | { kind: "source_snapshot"; snapshot: SourceSnapshotRef };

interface EvidenceRef {
  id: `sha256:${string}`;
  kind:
    | "rpc_call"
    | "storage_read"
    | "event_log"
    | "transaction"
    | "manifest"
    | "source_snapshot"
    | "audit"
    | "simulation";
  provenanceClass: ProvenanceClass;
  sourceMode: SourceMode;
  providerId?: string;
  boundary: ObservationBoundary;
  address?: `0x${string}`;
  method?: string;
  calldata?: `0x${string}`;
  rawResultHash: `sha256:${string}`;
  decodedResult?: unknown;
  uri?: string;
  commitSha?: string;
  capturedAt: string;
}

type FreshnessState = "current" | "aging" | "stale" | "unknown";

interface BoundaryFreshness {
  policyId: string;
  boundary: ObservationBoundary;
  state: FreshnessState;
  headAtFetch?: BlockRef | ConsensusRef;
  lagBlocks?: string;
  lagSlots?: string;
  ageSeconds?: number;
}

interface Freshness {
  aggregate: FreshnessState | "not_applicable";
  assessments: BoundaryFreshness[];
}

interface Verification {
  invariantId: string;
  evaluatorVersion: string;
  state: VerificationState;
  severity: "info" | "low" | "medium" | "high" | "critical";
  claimKind: ClaimKind;
  statement: string;
  expected?: unknown;
  actual?: unknown;
  evidence: EvidenceRef[];
  expectedEvidenceIds: Array<EvidenceRef["id"]>;
  actualEvidenceIds: Array<EvidenceRef["id"]>;
  derivationInputIds: Array<EvidenceRef["id"]>;
  freshness: Freshness;
  limitations: Array<{ code: string; text: string }>;
}

interface EvidenceFact {
  factId: string;
  evaluatorVersion: string;
  state: FactAvailabilityState;
  claimKind: "observed" | "derived";
  statement: string;
  value?: unknown;
  unit?: string;
  derivation?: {
    expression: string;
    inputFactIds: string[];
  };
  coverage?: {
    populationDefinition: string;
    total?: string;
    attributed?: string;
    unattributed?: string;
    unsupported?: string;
  };
  evidence: EvidenceRef[];
  inputEvidenceIds: Array<EvidenceRef["id"]>;
  freshness: Freshness;
  limitations: Array<{ code: string; text: string }>;
}

interface AssurancePayload {
  schemaVersion: string;
  engineVersion: string;
  evaluationTime: string;
  manifestVersion: string;
  manifestHash: `sha256:${string}`;
  policyRefs: Array<{
    kind: "source" | "finality" | "freshness" | "provider_quorum";
    id: string;
    version: string;
    contentHash: `sha256:${string}`;
  }>;
  policyTrust: {
    state: PolicyTrustState;
    trustPolicyId: string;
    manifestHash: `sha256:${string}`;
    reasonCodes: string[];
    evidence: EvidenceRef[];
  };
  sourceMode: SourceMode;
  requestHash: `sha256:${string}`;
  observationBoundaries: ObservationBoundary[];
  evidence: EvidenceRef[];
  verifications: Verification[];
  facts: EvidenceFact[];
  coverage: {
    supported: string[];
    unsupported: string[];
    excluded: string[];
  };
  limitations: Array<{ code: string; text: string }>;
}
```

Token quantities, block numbers, slots, counts, and currency values are serialized as decimal strings. Evaluators use integer or fixed-point arithmetic. Execution evidence is anchored to `BlockRef`, consensus evidence to `ConsensusRef`, and external attribution or policy material to a content-addressed `SourceSnapshotRef`. A result that combines them exposes every boundary rather than implying an external snapshot was finalized by a chain.

`Verification` is reserved for a falsifiable predicate with expected/actual semantics and may return `pass` or `fail`. Expected, actual, and derivation evidence roles are explicit ID lists; schema validation rejects missing IDs and observed evidence masquerading as expected policy. `EvidenceFact` is neutral observed or derived context such as an account value, attribution edge, top-N share, or HHI. Facts use availability states and can never return `pass` or `fail`; `available` means the stated value was reproducibly computed, not that the subject is healthy. `partial` requires an explicit population denominator and uncovered count.

Freshness is assessed per observation boundary. Its aggregate is the least acceptable required assessment under the referenced policy: `unknown` outranks `stale`, which outranks `aging`, which outranks `current`. Optional evidence does not weaken the aggregate but remains visible. A `not_applicable` verification/fact uses aggregate `not_applicable` with an empty assessment list; no fake block or snapshot is invented.

These axes are deliberately independent. `ProvenanceClass` says what epistemic kind of datum this is. `SourceMode` says whether this execution read a production provider, replayed a recorded fixture, or ran a simulation. `ClaimKind` describes the form of conclusion produced by the evaluator. Incident bundles separately use `onchain_reconstruction`, `documented_scenario`, or `synthetic`; none of these fields may be inferred from another.

## Manifest model

A manifest declares expected state; it never supplies observed production state.

Required manifest content:

- schema and manifest version;
- protocol and environment;
- author, reviewer/approval record, created time, and immutable content hash;
- validity/applicability windows expressed for the relevant execution block, consensus slot/root, or external source-snapshot boundary;
- chain IDs;
- referenced finality, provider-quorum, freshness, and external-source policy identifiers;
- deployment release or commit;
- proxy addresses;
- expected implementations and runtime code hashes;
- expected dependency addresses;
- expected role holders and timelock policy;
- Stake/core predicate parameters, units, implementation epochs, and applicability;
- bridge route lifecycle (`candidate`, `active`, `disabled`, or `decommissioned`), EIDs, reciprocal peers, libraries, DVNs, thresholds, and rate-limit mode/policy;
- Liquid vault identities, module relationships, authority/capability policy, supported Merkle commitments/leaves, Accountant bounds, and queue policy;
- Cash token and risk-policy expectations where public and versioned;
- governance artifact sources, supported action families, and change authorities;
- source-snapshot identities, denominator rules, attribution precedence, and supported joins for operator/AVS exposure;
- source URIs and commit hashes;
- applicable invariant identifiers;
- explicit uncovered surfaces.

Manifest changes require review. An expected value must not be generated by reading the same RPC state it will later verify. Factual operator/AVS source snapshots are evidence inputs rather than expected-policy values, but their allowed sources, join rules, denominators, and freshness rules are versioned and reviewed like manifest policy.

### Manifest trust root

A content hash proves integrity, not authority. Production deployments configure a `ManifestTrustPolicy` outside caller input. It contains an approved manifest-hash set anchored to a protected repository commit/release and/or reviewer public keys plus a signature threshold. Author and reviewer fields inside a manifest are descriptive and never authenticate themselves.

The default live UI, scheduled monitor, and release-blocking CI accept only manifests whose `policyTrust.state` is `trusted`. A CLI or explicitly isolated analysis mode may load a structurally valid custom manifest with `policyTrust.state = untrusted`; policy-dependent verifications become `unknown`, observed neutral facts may remain available, and the artifact cannot replace the default live report. A malformed manifest or failed authentication is `invalid` and cannot be evaluated. Policy trust is a separate report axis, never a seventh verification state. Trust-policy identifier and validation evidence are included in every canonical report.

## Block selection and finality

### Single-chain report

1. Request the provider's finalized head.
2. If finalized is unsupported, use a configured confirmation-depth policy.
3. Fetch the complete block and record number, hash, parent hash, and timestamp.
4. Pin every execution-layer observation in the report to that exact block hash.
5. Expose any finality downgrade.

### Multi-chain report

Crosschain state is never described as atomic.

1. Obtain finalized heads for each chain.
2. Select an `asOfTimestamp` no later than the oldest finalized head.
3. Resolve one canonical block per chain at or before that timestamp.
4. Label the report `time_aligned`, not atomic.

## Provider quorum and conflicts

For every critical conclusion, whether `pass` or `fail`, use matching evidence from at least two administratively independent providers.

- Agreement requires matching block hashes and canonicalized raw results.
- A block-number match with a hash mismatch is a conflict.
- A decoded-value match with a raw mismatch is retained as separate evidence and reviewed by policy.
- Provider timeout or malformed response is missing evidence, not a zero value.
- Required-provider disagreement yields `conflict`.
- Insufficient responses yield `unknown`.
- A single provider contradicting policy without quorum produces `unknown` with a provisional-contradiction alert; it cannot produce a canonical `fail`.
- A critical `fail` requires the same evidence-quorum discipline as a critical `pass`.

Provider identities, latency, status, and request IDs are included in diagnostics without exposing secrets.

## Evidence acquisition

Adapters perform I/O. Evaluators do not.

Each RPC observation records:

- canonical JSON-RPC request;
- provider identifier;
- chain ID;
- block number and hash;
- target address;
- calldata or method plus arguments;
- raw result bytes or canonical response;
- decoded value;
- ABI identity;
- capture time;
- SHA-256 of the raw response.

Batch reads may use Multicall only when the report preserves the individual logical calls and the same block boundary.

## Invariant engine

An invariant has separate observation and evaluation phases:

```ts
interface Invariant<O> {
  id: string;
  version: string;
  observe(context: ObservationContext): Promise<ObservationResult<O>>;
  evaluate(
    observation: ObservationResult<O>,
    manifest: Manifest,
  ): Verification;
}
```

Verification rules:

- `pass` requires every mandatory observation, acceptable freshness, and no required-source conflict.
- Missing ABI, unknown code identity, missing manifest coverage, or unsupported provider capability cannot produce `pass`.
- Stale evidence cannot produce `pass`.
- Expected and actual values retain independent provenance.
- A policy drift result is not automatically classified as an exploit.
- The aggregate report does not produce a universal safety score.

Facts and metrics are evaluated through the separate availability contract. Missing population coverage produces `partial` or `unknown`, never a reassuring verification result.

## Target invariant and evidence registry

### Deployment code identity

Each contract manifest declares an identity strategy rather than assuming EIP-1967:

- `direct`: hash runtime code at the contract address;
- `eip1967` / transparent / UUPS: resolve the declared implementation slot and hash implementation runtime code;
- `beacon`: resolve and identify the beacon, then resolve and hash its implementation;
- `eip1167_clone`: decode and identify the minimal-proxy target, then hash target runtime code;
- a separately reviewed custom adapter for a documented indirection pattern.

Every strategy verifies that code exists, retains the full indirection path, compares each expected identity from the manifest, and selects an ABI only after the terminal runtime hash matches. An undeclared or unsupported pattern returns `unknown` for dependent semantic reads; Aegis never guesses a proxy type from explorer labels.

An authorized upgrade can create a manifest mismatch. The consequence is drift requiring review, not proof of compromise.

### weETH local wrapper-share backing

```text
weETH.totalSupply() <= eETH.shares(weETH.address)
```

This proves only the local wrapper-share equation at the block. It is not proof of validator solvency or total protocol reserves.

### Finalized-withdrawal escrow coverage

```text
eth_getBalance(WithdrawRequestNFT)
  >= WithdrawRequestNFT.ethAmountLockedForWithdrawal()
```

### Oracle quorum geometry

```text
quorumSize >= minQuorumSize
activeMembers >= quorumSize
activeMembers < 2 * quorumSize
```

Freshness and committee geometry are separate assertions.

### Governance upgrade delay

```text
UpgradeTimelock.getMinDelay() == manifest.expectedDelay
```

The delay is mutable through governance; Aegis reports drift rather than calling it immutable.

### Positive-rebase cap

For a protected positive-rebase transition:

```text
accruedRewards
  <= preTotalPooledEther * MAX_POSITIVE_REBASE_BPS / 10_000
```

Do not compare arbitrary blocks and call every decrease a violation; legitimate negative rebases require correct transaction semantics.

### Bridge directed-route controls

For every supported direction, behavior depends on the independently reviewed manifest lifecycle:

- source peer equals the destination OApp;
- destination peer equals the source OApp;
- send library is explicit and manifest-pinned;
- receive library is explicit, manifest-pinned, and not an inherited default;
- effective send and receive ULN configuration use the expected required DVNs;
- required count, optional count, and optional threshold match policy;
- inbound and outbound rate-limit mode, caps, and windows match declared policy;
- an `active` route whose policy requires bounded rate limits has positive caps/windows and complete reciprocal configuration;
- a `candidate`, `disabled`, or `decommissioned` route remains visible but is not required to satisfy active-route activity predicates; zero limits or a pause may be the expected disabled state.

Route deployment does not prove route activity. Active lifecycle is expected policy from an independent reviewed source and requires reciprocal peer plus effective configuration evidence; observed traffic or its absence is not a lifecycle classifier.

### Liquid canonical wiring

For every supported vault deployment, `liquid.canonical_wiring` verifies the reviewed chain-scoped identity and dependency graph:

- manifest-declared BoringVault identity, normally direct runtime code for the supported non-upgradeable core; use proxy resolution only if a specific deployment proves that indirection;
- RolesAuthority and relevant role/capability assignments;
- Teller, Accountant, Manager, decoder/sanitizer, queue, and registry pointers;
- supported asset identities and decimals;
- pause authorities and upgrade controls.

An expected relationship comes from a reviewed manifest. A discovered relationship is never silently promoted into expected policy.

### Liquid policy constraints

`liquid.policy_constraints` evaluates only decoded, observable constraints for a supported deployment:

- Manager Merkle root or equivalent policy commitment matches the reviewed manifest;
- a policy proof resolves to the expected target, selector, assets, argument constraints, and decoder/sanitizer;
- Accountant exchange-rate update bounds, timing, fees, and pause state match declared policy;
- withdrawal/deposit queue delay, window, capacity, and role configuration match declared policy;
- supported allowed-action coverage is explicit, including leaves Aegis cannot decode.

A Merkle root does not reveal or prove completeness of its leaf corpus. Aegis decodes only supplied or independently sourced leaves/proofs, content-addresses that corpus, and calls the action set complete only when an authoritative full corpus is available and reviewed. A matching commitment does not prove that a strategy is profitable, liquid, or free of economic risk.

### Liquid rebalance transition

`liquid.rebalance_transition` is a Rehearse family rather than a universal current-state pass. For a supported proposal it records:

- exact calls and policy proofs;
- whether each call is permitted by the pinned policy commitment;
- pre/post asset and accounting observations that Aegis can decode;
- expected value-deviation and Accountant bounds;
- queue or pause effects;
- external calls and strategy consequences that remain unmodeled.

It never produces an APY estimate, return guarantee, or allocation recommendation.

### Cash canonical wiring

- CashModule dependencies equal the pinned manifest;
- DataProvider points to the expected CashModule, CashLens, PriceProvider, and SafeFactory;
- CashLens and CashEventEmitter point back to the CashModule;
- components use the pinned RoleRegistry.

### Cash risk configuration

For every supported collateral/borrow asset:

```text
borrow token is an allowed collateral token
ltv <= liquidationThreshold
liquidationThreshold + liquidationBonus <= 100%
0 < borrowApyPerSecond <= MAX_BORROW_APY
borrowTokenMinShares > 0
PriceProvider.price(token) succeeds and returns > 0
```

A liquidatable user account is account risk, not a protocol invariant failure.

Oracle callability and oracle freshness are separate findings. Aegis reports freshness only through an implementation-bound adapter that exposes a source observation timestamp/round and a reviewed heartbeat or maximum-age policy. The report names the source timestamp and block timestamp used in the comparison. If the implementation exposes only a price, Aegis may report that the call succeeded and returned a positive value but freshness is `unknown` or `not_applicable`; fetch time is never substituted for source freshness.

### Operator and AVS exposure topology

`restaking.exposure_topology` emits `EvidenceFact` artifacts, not pass/fail safety invariants. It records supported relationships among validators, node operators or DVT clusters, AVSs, and identifiable infrastructure at cited source versions and observation boundaries.

It may calculate attributed-subset top-N shares, attributed-subset Herfindahl-Hirschman concentration, change over time, and exposure paths. No single value may be labeled population-wide when attribution is incomplete. Every result must include:

- the numerator and denominator used;
- attributed, unattributed, stale, and unsupported population counts;
- source coverage and last observation boundary;
- whether a relationship is onchain-observed, officially declared, externally sourced, or inferred by a named deterministic rule;
- limitations on correlation, operational independence, performance, and slashing attribution.

Concentration output follows these rules:

- always report source-population coverage before concentration;
- when the full population denominator is unknown, report only an attributed-subset metric normalized to that subset;
- when total exposure and the unattributed amount are known, report the known attributed contribution plus explicit lower/upper bounds only if the allocation/granularity assumptions needed to compute them are stated and versioned;
- for top-N, disclose the lower-bound known share and an upper bound that permits unattributed exposure to join the top N;
- for HHI, disclose whether unattributed exposure may belong to known identities or new identities and use the finite validator/allocation granularity in any bound;
- never treat all unknown exposure as one operator, omit it, or silently redistribute it.

If defensible bounds cannot be computed, Aegis reports `partial` coverage and no population-wide concentration number. The engine cannot transform these facts into a composite operator risk score, insurance conclusion, competence judgment, or claim of complete infrastructure independence.

### Bridge-first vertical slice and renderer

The first implementation slice prioritizes one Ethereum and OP bidirectional weETH route because it exercises the largest number of shared architectural primitives in one reviewable workflow. It combines:

- deployment code identity for every participating contract;
- both directional peer and Endpoint ID relationships;
- explicit send and receive libraries, including default-fallback detection;
- effective send and receive ULN configuration;
- required and optional DVNs, thresholds, and confirmations;
- directional pause, role, owner, and delegate observations where applicable;
- inbound and outbound pairwise rate-limit parameters;
- configuration-change events required for one real before and after history.

The canonical `ROUTE-ETH-OP-v1` active-route matrix is evaluated in both Ethereum-to-OP and OP-to-Ethereum directions:

| Matrix row | Required directed assertion |
| --- | --- |
| Identity | Participating OApp/endpoint indirection and terminal runtime identities match the manifest |
| Peer/EID | Source peer and Endpoint ID resolve to the expected destination identity |
| Send library | Effective send library is explicit and manifest-pinned |
| Receive library | Effective receive library is explicit, manifest-pinned, and not an unintended default fallback |
| Send verification | Effective send ULN DVNs, thresholds, optional policy, and confirmations match |
| Receive verification | Effective receive ULN DVNs, thresholds, optional policy, and confirmations match |
| Rate limit | Directional inbound/outbound mode, cap, and window match the active lifecycle policy |
| Control plane | Expected pause state and applicable owner/delegate/role authorities match |

`evaluated` means a matrix cell ran against real evidence and emitted a canonical verification. For the hiring-ready baseline report, every mandatory active-route cell must be `pass`. `fail`, `unknown`, `stale`, and `conflict` are correct runtime outcomes and required demonstrations, but they do not satisfy the successful baseline gate; `not_applicable` is allowed only for a cell the reviewed route manifest explicitly marks optional.

The primary first renderer is a directed topology. Nodes represent chain-scoped contract identities; edges represent one configured direction. An edge result comes only from canonical engine output and links to the generic evidence drawer. The renderer may show operational consequence and coverage, but it cannot compute a separate route-health verdict.

This subsection defines delivery order only. Stake/core, Liquid, Cash, governance, operator/AVS, and wider route coverage are required parts of the completed product.

## Preflight engine

### Request

```ts
interface TransactionInput {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value?: string;
}

interface PreflightBase {
  chainId: number;
  manifestVersion: string;
}

type PreflightRequest = PreflightBase &
  (
    | {
        artifactOrigin: "public_unsigned_proposal";
        proposal:
          | { kind: "transaction"; tx: TransactionInput }
          | { kind: "safe_batch"; safeBatch: SafeTransactionBundle };
        at:
          | { kind: "finalized" }
          | { kind: "block"; number: string; hash: `0x${string}` };
      }
    | {
        artifactOrigin: "retrospective_rehearsal";
        retrospectiveSource: {
          transactionHash: `0x${string}`;
          targetBlock: {
            number: string;
            hash: `0x${string}`;
            transactionIndex: string;
          };
          parentBlock: { number: string; hash: `0x${string}` };
        };
      }
  );
```

The JSON Schema uses the same discriminated `oneOf` contract, so a retrospective request cannot silently fall back to `finalized`, omit its block hashes, or accept multiple separately mined target transactions.

### Acceptance artifact

The hiring-ready release accepts either a public unsigned proposal or an exact reconstruction of a public historical Safe or timelock execution.

For `retrospective_rehearsal`, the accepted unit is one canonical execution transaction, which may itself contain an atomic Safe MultiSend/timelock batch. A sequence of separately mined target transactions is out of scope until Aegis implements canonical inter-block replay.

- reconstruct the complete target transaction envelope and any internal batch order exactly;
- resolve and verify the target block hash, transaction index, parent block hash, and required block environment;
- fork the canonical parent block and replay every canonical transaction earlier in the target block in exact order before snapshotting the target's pre-state;
- execute the target transaction statefully against that reconstructed pre-state;
- exclude receipts, emitted events, post-state values, and later transactions from all prediction inputs;
- generate and hash the predicted before and after report before comparison;
- compare the prediction with separately acquired execution evidence: receipt plus an independent trace/state diff, or a block-end checkpoint accompanied by proof that no later transaction touched the affected state;
- report any divergence without rewriting the original predicted artifact.

If the archive/fork cannot reproduce the target block context, canonical prefix, sender semantics, or stateful post-state, or if actual target effects cannot be isolated from later same-block writes, the retrospective result is `unknown`/`indeterminate` and cannot satisfy the acceptance gate. This validates decoding and state-transition behavior with public evidence while preserving the distinction between retrospective validation and a prospective approval workflow.

### Evaluation order

1. Validate hex, sizes, supported chains, and request limits.
2. Resolve proxy and runtime code identity.
3. Select ABI only after identity succeeds.
4. Decode functions and semantic effects.
5. Resolve `finalized` to an exact number/hash or verify the caller-supplied block hash.
6. Read required balances, roles, limits, and dependencies at that boundary.
7. Use `eth_call` only for preliminary call success, revert data, and return values.
8. For any claimed post-state, execute the exact transaction or ordered bundle on a stateful local fork or equivalent simulator and read the committed simulated state.
9. If stateful execution or required tracing is unavailable, mark affected post-state and semantic effects `unknown`; ordinary `eth_call` success cannot supply them.
10. Calculate the supported semantic before/after state and list unmodeled writes/external effects.
11. Rerun affected invariants and facts.
12. Canonicalize findings and limitations.

Unknown code identity prevents confident decoding. Simulation success is not permission to sign.

## Replay and indexer

### Event identity

```text
(chainId, blockHash, transactionHash, logIndex)
```

The indexer retains block lineage and marks orphaned events after reorg detection rather than silently deleting history.

### Ordering

- Within one chain, order by block number, transaction index, and log index.
- Across chains, display deterministic timestamp order for navigation only.
- Use explicit causal edges for reasoning.
- Never describe a multi-chain ordering as globally authoritative.

### Incident bundle

```ts
type IncidentClassification =
  | "onchain_reconstruction"
  | "documented_scenario"
  | "synthetic";
```

An immutable bundle contains:

- bundle and schema version;
- `IncidentClassification`;
- block references and evidence;
- factual events;
- causal edges;
- source limitations;
- canonical content hash.

Counterfactual runs reference the bundle hash, model version, policy inputs, assumptions, and their own output hash.

## Canonicalization and hashing

Use RFC 8785 JSON Canonicalization Scheme or a well-reviewed compatible implementation after domain normalization. JCS sorts object keys; it does not define semantic order for arrays, so Aegis normalizes arrays before serialization.

The hashed assurance payload includes:

- schema version and explicit injected `evaluationTime`;
- engine and evaluator versions;
- manifest, source-policy, finality, freshness, and provider-policy identifiers/versions/hashes;
- complete `policyTrust` state, trust-policy ID, reason codes, and validation-evidence hashes;
- `sourceMode`;
- request hash;
- typed observation boundaries, including block hashes, consensus roots, and source-snapshot hashes;
- every boundary freshness assessment and aggregate;
- normalized evidence and evidence-role mappings;
- verifications;
- neutral facts and their coverage;
- explicit supported/unsupported/excluded coverage;
- limitations.

Canonical array rules:

- evidence sorts by evidence ID; verifications by invariant ID then evaluator version; facts by fact ID then evaluator version;
- observation boundaries sort by kind plus chain/network/source identity and boundary number/root/hash;
- provider responses sort by provider ID then request/result hash;
- set-like address, role, DVN, reason-code, limitation, coverage, and causal-edge arrays use documented stable keys after hex/address normalization;
- duplicates in set-like arrays are rejected unless the schema explicitly models multiplicity;
- integers use minimal unsigned decimal strings and hex bytes use normalized lowercase `0x` encoding;
- arrays with semantic order, including Safe batches, transaction prefixes, event tapes, and traces, retain order and include an explicit sequence/index field rather than being sorted.

### Canonicalization clarifications (v1.2, adopted 2026-07-22 from the WR6 blind-derivation triage)

Two layers are normative and separable. **Schema validation** enforces structure: mandatory
fields, exact byte lengths (32-byte block hashes, roots, and transaction hashes; 20-byte
addresses; `sha256:` identifiers are exactly 64 lowercase hex characters), enum membership,
and referential integrity. **Domain normalization + JCS** enforces canonical form and may be
exercised independently by test vectors that use abbreviated identifiers.

1. **Typed rejection.** A canonicalization or validation failure carries
   `{ phase: "schema_validation" | "referential_validation" | "domain_normalization", code }`
   with stable codes including `missing_mandatory_field`, `duplicate_set_member`,
   `noncanonical_unsigned_decimal`, `noncanonical_hex`, `dangling_evidence_role_id`, and
   `semantic_index_invalid`. The first failing phase reports; codes are part of the contract.
2. **Noncanonical encodings are rejected, not repaired, at the payload boundary.** Adapters
   normalize raw provider material before constructing payload values; once a payload is
   presented for canonicalization, uppercase hex, non-minimal decimals (leading zeros, `+`),
   and duplicate set members are errors.
3. **Numeric fields.** Fields declared as JSON numbers (`chainId`, `ageSeconds`) serialize as
   JCS numbers. The minimal-unsigned-decimal-string rule applies to declared string-typed
   quantities (block numbers, slots, token amounts, counts, currency values).
4. **Semantic-order arrays** (Safe batches, transaction prefixes, event tapes, traces) carry
   an explicit `index` field: zero-based, minimal unsigned decimal string, contiguous, no
   duplicates (`semantic_index_invalid` otherwise). The normalizer never reorders them.
5. **Normalization inside open-typed values** (`decodedResult`, `expected`, `actual`, fact
   `value`): the normalizer descends only into shapes registered by the producing adapter
   (e.g. `safeBatch`); unregistered subtrees pass through with JCS key-sorting only and
   arrays left untouched.
6. **Stable sort keys.** Scalar string sets: lexicographic after normalization. `EvidenceRef`
   arrays: by `id` — this applies to every `EvidenceRef` array (top-level `evidence`,
   `policyTrust.evidence`, `Verification.evidence`, `EvidenceFact.evidence`). Observation
   boundaries: by `kind`, then chain/network/source identity, then number/slot/contentHash,
   then hash/root. Provider responses: `(providerId, rawResultHash)`. Limitations:
   `(code, text)`. `policyRefs`: `(kind, id, version)`. Evidence-role ID lists
   (`expectedEvidenceIds`, `actualEvidenceIds`, `derivationInputIds`, `inputEvidenceIds`)
   are sets sorted by value. Freshness assessments: `(policyId, boundary stable key)`.
7. **Decimal-string comparison is numeric**, implemented as length-then-lexicographic over
   minimal unsigned decimals (valid because encodings are minimal).
8. **Referential integrity.** Every `EvidenceRef` appearing anywhere in the payload must
   also appear, by `id`, in top-level `evidence`; evidence-role IDs resolve against
   top-level `evidence`.
9. **Cardinality.** `observationBoundaries` requires at least one entry; other arrays may be
   empty.
10. **External representation of the report identity** is the content-address form
    `sha256:<64 lowercase hex>`.
11. **Identity-mismatch semantics** (cross-reference §Deployment code identity): the
    `deployment.code_identity` predicate itself returns `fail` when quorum evidence shows a
    terminal-runtime-hash mismatch against the manifest; verifications that depend on
    semantic decoding of that contract return `unknown`.

Deferred to their owning milestones: the provisional-contradiction alert schema (provider
quorum, M1/W3), raw-result canonicalization for provider agreement (M1/W3), and
supersession/lineage representation (append-only store, M3).

`reportHash = sha256(JCS(normalizedAssurancePayload))`. `requestId`, delivery `generatedAt`, provider latency, retry count, HTTP metadata, and tracing identifiers live only in the delivery envelope and are excluded. Any visible live/recorded label, policy-trust badge, freshness state, or coverage summary is read from or deterministically derived from hashed payload fields; a renderer cannot relabel a recorded or untrusted artifact without changing or contradicting its hash.

Cryptographic hashes provide integrity and reproducibility, not authenticity. Production manifest authenticity comes from the configured manifest trust root above. Any signed report attestations are a separate feature with their own key purpose, custody, rotation, and revocation policy.

## API surface

```text
POST /api/v1/verify
POST /api/v1/diff
POST /api/v1/preflight
GET  /api/v1/reports/:hash
GET  /api/v1/atlas
GET  /api/v1/history
GET  /api/v1/exposure
GET  /api/v1/coverage
GET  /api/v1/incidents
GET  /api/v1/incidents/:id
POST /api/v1/incidents/:id/counterfactual
GET  /api/v1/manifests/:version
GET  /api/v1/service-status
```

Every response envelope includes:

```ts
{
  requestId,
  generatedAt,
  payload: AssurancePayload,
  reportHash
}
```

`requestId` and `generatedAt` are delivery metadata. Every semantic display field comes from the hashed `payload`; API convenience summaries must be deterministic projections of it.

Upstream failure normally produces a completed `unknown`, `stale`, or `conflict` report. Reserve HTTP 503 for inability to construct any meaningful report envelope.

Public API callers cannot supply arbitrary server-side RPC or source URLs. Providers come from a deployment allowlist so verification cannot become an SSRF primitive. Requests have strict limits for calldata size, Safe-batch length, address count, log range, simulation duration, and response size. Contract metadata, revert data, token symbols, provider errors, and other external strings are untrusted and escaped by every renderer.

## CLI surface

```bash
aegis verify --manifest etherfi-2026-07.json --at finalized
aegis verify --domain liquid --manifest etherfi-2026-07.json --at finalized
aegis verify --offline tests/fixtures/core-healthy.json
aegis diff report-before.json report-after.json
aegis preflight safe-batch.json --fork-block 25577369
aegis history --domain governance --from-block 25000000 --to-block 25577369
aegis exposure --snapshot sha256:<source-snapshot-hash>
aegis replay bridge-hardening-2026 --policy hardened.json
aegis reproduce sha256:<report-hash>
```

CLI JSON output and API output use the same schemas. Human-readable terminal output is a renderer, not a separate evaluator.

Suggested exit codes:

- `0`: evaluation completed with no blocking failure or incomplete blocking claim;
- `2`: one or more blocking predicates failed;
- `3`: a blocking predicate is `unknown`, `stale`, or `conflict`;
- `4`: invalid request or manifest;
- `5`: engine failure prevented construction of a report.

Fixture recording requires an explicit chain ID and block hash and refuses `latest`.

## Storage and caching

Use an append-only evidence store plus indexed projections.

Minimum entities:

- blocks and parent relationships;
- raw RPC observations;
- normalized evidence;
- manifests and hashes;
- assurance reports;
- transactions and event logs;
- implementation and ABI epochs;
- decoded configuration changes and checkpoints;
- content-addressed external source snapshots;
- versioned operator/AVS attribution edges and coverage denominators;
- incident bundles and causal edges;
- counterfactual runs.

Cache keys include provider policy, manifest hash, chain ID, block hash, request hash, and evaluator version. Never key critical cached evidence by block number alone.

A block-hash change invalidates derived cache entries and marks prior observations orphaned.

## Tests

### Unit and property tests

- same inputs produce byte-identical reports;
- randomized provider completion and set-input order produce the same normalized payload/hash, while transaction-batch order remains significant;
- duplicate set members and noncanonical numeric/hex encodings are rejected;
- changing policy trust, source mode, freshness, coverage, or any referenced policy hash changes the report hash;
- missing evidence cannot improve a result;
- stale evidence cannot pass;
- provider disagreement produces conflict;
- fixed-point and token-bucket boundaries;
- wrapper backing and collateral geometry;
- counterfactual action never precedes detection or eligibility;
- ABI/code-hash mismatch prevents decoding.

### Recorded integration fixtures

Fixtures contain exact RPC requests and responses at explicit block hashes plus normalized output and raw-response hashes.

Required negative fixtures include:

- wrong implementation;
- unknown runtime code;
- missing manifest entry;
- inherited/default bridge library;
- asymmetric peer;
- three required DVNs instead of four;
- absent or zero rate limit on an `active` direction whose reviewed policy requires a bounded nonzero limit;
- Cash dependency miswiring;
- stale implementation-bound oracle with an observable source timestamp and reviewed heartbeat;
- reverted or malformed oracle where freshness is unavailable;
- provider disagreement;
- reorged block;
- unsupported selector;
- simulation revert;
- unexpected Liquid module or authority;
- mismatched Liquid policy root;
- malformed or unsupported Liquid policy proof;
- Accountant or queue bound violation;
- duplicated operator attribution edge;
- unattributed population omitted from an exposure denominator;
- stale or conflicting operator/AVS source snapshot.

Fixture regeneration requires explicit chain and block arguments and never records `latest` silently.

### Fork and end-to-end tests

- reproduce selected reports from pinned archive/fork state;
- mutate one configuration and verify only affected assertions change;
- simulate a real Safe/timelock bundle;
- verify CLI, API, CI, and web report-hash agreement;
- confirm exported reproduction commands work in a clean environment.

## Observability

Track:

- provider latency, error rate, disagreement, and head lag;
- finality resolution duration;
- observation and evaluator duration;
- cache hits and reorg invalidations;
- report state counts by invariant;
- preflight simulation failures by stage;
- indexer lag and orphaned-event count;
- source-snapshot age, attribution coverage, and join failures;
- scheduled-run delay and notification delivery outcome.

Logs include request and report IDs but never private RPC credentials or user transaction secrets.

## Performance and reliability targets

Initial engineering targets, subject to measurement:

- cached assurance report: p95 under 500 ms;
- uncached single-chain core report: p95 under 8 seconds;
- preflight without trace: p95 under 10 seconds;
- deterministic offline verification: no network dependency;
- no false `pass` or `fail` under injected provider timeout, conflict, stale evidence, or unilateral contradiction tests.

These targets are not public SLOs until measured in production.

## Engineering acceptance gate

The target architecture is credible when one complete vertical slice demonstrates:

1. independently sourced expected manifest;
2. finalized-block observation from redundant providers;
3. real manifest-declared identity resolution and terminal runtime-code-hash verification for the selected deployment pattern;
4. raw evidence capture and SHA-256 hashing;
5. pass, fail, unknown, stale, conflict, and not-applicable fixtures;
6. block-hash-keyed caching and reorg invalidation;
7. one-command CLI reproduction;
8. identical CLI, API, CI, and web report hashes;
9. a deliberately broken fork producing the expected narrow failure;
10. documented limitations and threat assumptions.

This gate proves that the shared architecture is real before additional domain adapters depend on it.

The first hiring-ready release adds the following integration gate on top of the architecture gate:

1. every mandatory `ROUTE-ETH-OP-v1` matrix cell passes in both directions using real finalized evidence;
2. code identity, peers, effective libraries, DVNs, thresholds, controls, and rate limits remain individually inspectable;
3. one real configuration transaction is indexed into a deterministic before and after diff;
4. one public unsigned proposal or one exact retrospective Safe/timelock execution transaction (which may contain an atomic internal batch) is decoded and statefully evaluated at its exact reconstructed pre-transaction state;
5. one corrupted fork produces only the expected narrow failures;
6. one provider disagreement produces `conflict` across CLI, API, CI, and web;
7. the directed topology contains no verdict logic outside the shared engine.

Passing the hiring-ready gate does not satisfy the completed-product contract.

## Finished-product integration gate

The fully featured Aegis Protocol Flight Recorder is complete only when:

1. Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS evidence families all execute against reviewed real sources with explicit coverage;
2. every family uses the same typed observation-boundary, manifest/source-policy, evidence, limitation, and report-hash contracts; predicates use canonical verification states while neutral facts use canonical availability states;
3. the append-only index retains implementation/ABI epochs, configuration histories, exposure-edge histories, checkpoints, gaps, reorg supersessions, and report lineage;
4. Record supports scheduled and release-triggered verification plus content-addressed CI/webhook outputs;
5. Rehearse supports at least one real action family for governance/upgrades, bridge controls, Liquid policy or rebalance, and Cash configuration or account effects;
6. Rewind reconstructs at least one independently reproducible real change/history in each of Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS exposure, including ABI/source epochs and explicit causal edges where required;
7. the counterfactual lab keeps immutable observations and modeled outputs in separate schemas and hashes;
8. the Protocol Atlas, focused workbenches, CLI, API, CI, and monitor transport identical canonical findings without renderer verdict logic;
9. unsupported actions, policy leaves, sources, operators, AVSs, routes, and contracts remain visible as coverage gaps;
10. each enabled assertion or derived metric has provenance, units, applicability, limitations, negative/boundary fixtures, and domain review;
11. no public surface emits a universal safety score, APY/market forecast, allocation recommendation, offchain Cash conclusion, or unqualified operator-risk judgment;
12. the cross-domain adversarial suite demonstrates provider conflict, reorgs, ABI changes, incomplete history, attribution gaps, malformed policy proofs, unsupported simulation effects, and deterministic report reproduction.
