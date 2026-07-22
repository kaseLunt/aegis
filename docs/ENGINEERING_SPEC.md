# Aegis Engineering Specification

Status: target architecture
Version: 1.0
Updated: 2026-07-21

## Engineering objective

Build a small, reviewable assurance core that produces deterministic claims from independent expected and observed inputs. Expose that core through a CLI, API, CI workflow, and evidence-oriented web interface.

The system must prefer an honest `unknown` over an unjustified `pass`.

## System contract

Given:

- a versioned deployment manifest;
- one or more chain targets;
- an explicit finality policy;
- redundant RPC providers;
- a versioned invariant registry;
- an injected clock;

Aegis produces a canonical assurance report containing block references, evidence, verifications, limitations, and a cryptographic content hash.

The same inputs must produce byte-identical canonical reports.

## Target architecture

```text
                         +----------------------+
                         | Versioned manifests  |
                         | expected deployments |
                         +----------+-----------+
                                    |
                                    v
+-------------+      +--------------+---------------+      +----------------+
| RPC quorum  +----->+ Observation and evidence     +----->+ Pure invariant |
| N providers |      | normalization               |      | evaluators      |
+-------------+      +--------------+---------------+      +--------+-------+
                                    |                               |
                                    v                               v
                         +----------+-----------+        +----------+----------+
                         | Append-only evidence |        | Canonical report   |
                         | and block lineage     |        | and SHA-256 hash  |
                         +----------+-----------+        +----+----+----+-----+
                                                              |    |    |
                                                             CLI  API  Web/CI
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
    cash-wiring.ts
    cash-risk.ts
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
  adapters/
    rpc.ts
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

type ClaimKind = "observed" | "derived" | "policy" | "modeled";
type ProvenanceClass =
  | "observed_public_state"
  | "code_property"
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

interface EvidenceRef {
  id: `sha256:${string}`;
  kind: "rpc_call" | "event_log" | "manifest" | "source" | "audit";
  provenanceClass: ProvenanceClass;
  sourceMode: SourceMode;
  providerId?: string;
  block?: BlockRef;
  address?: `0x${string}`;
  method?: string;
  calldata?: `0x${string}`;
  rawResultHash: `sha256:${string}`;
  decodedResult?: unknown;
  uri?: string;
  commitSha?: string;
  capturedAt: string;
}

interface Freshness {
  state: "current" | "aging" | "stale" | "unknown";
  policyId: string;
  observedAt?: BlockRef;
  headAtFetch?: BlockRef;
  lagBlocks?: string;
  ageSeconds?: number;
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
  freshness: Freshness;
  limitations: Array<{ code: string; text: string }>;
}
```

Token quantities, block numbers, and currency values are serialized as decimal strings. Evaluators use integer or fixed-point arithmetic.

These axes are deliberately independent. `ProvenanceClass` says what epistemic kind of datum this is. `SourceMode` says whether this execution read a production provider, replayed a recorded fixture, or ran a simulation. `ClaimKind` describes the form of conclusion produced by the evaluator. Incident bundles separately use `onchain_reconstruction`, `documented_scenario`, or `synthetic`; none of these fields may be inferred from another.

## Manifest model

A manifest declares expected state; it never supplies observed production state.

Required manifest content:

- schema and manifest version;
- protocol and environment;
- chain IDs;
- deployment release or commit;
- proxy addresses;
- expected implementations and runtime code hashes;
- expected dependency addresses;
- expected role holders and timelock policy;
- bridge routes, EIDs, reciprocal peers, libraries, DVNs, thresholds, and rate-limit policy;
- Cash token and risk-policy expectations where public and versioned;
- source URIs and commit hashes;
- applicable invariant identifiers;
- explicit uncovered surfaces.

Manifest changes require review. An expected value must not be generated by reading the same RPC state it will later verify.

## Block selection and finality

### Single-chain report

1. Request the provider's finalized head.
2. If finalized is unsupported, use a configured confirmation-depth policy.
3. Fetch the complete block and record number, hash, parent hash, and timestamp.
4. Pin every observation in the report to that exact block hash.
5. Expose any finality downgrade.

### Multi-chain report

Crosschain state is never described as atomic.

1. Obtain finalized heads for each chain.
2. Select an `asOfTimestamp` no later than the oldest finalized head.
3. Resolve one canonical block per chain at or before that timestamp.
4. Label the report `time_aligned`, not atomic.

## Provider quorum and conflicts

For critical observations, use at least two independent providers.

- Agreement requires matching block hashes and canonicalized raw results.
- A block-number match with a hash mismatch is a conflict.
- A decoded-value match with a raw mismatch is retained as separate evidence and reviewed by policy.
- Provider timeout or malformed response is missing evidence, not a zero value.
- Required-provider disagreement yields `conflict`.
- Insufficient responses yield `unknown`.

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

Evaluation rules:

- `pass` requires every mandatory observation, acceptable freshness, and no required-source conflict.
- Missing ABI, unknown code identity, missing manifest coverage, or unsupported provider capability cannot produce `pass`.
- Stale evidence cannot produce `pass`.
- Expected and actual values retain independent provenance.
- A policy drift result is not automatically classified as an exploit.
- The aggregate report does not produce a universal safety score.

## Initial invariant registry

### Deployment code identity

```text
code(proxy) != empty
EIP1967(proxy) == manifest.expectedImplementation
keccak256(code(implementation)) == manifest.runtimeCodeHash
```

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

For every supported direction:

- source peer equals the destination OApp;
- destination peer equals the source OApp;
- send library is explicit and manifest-pinned;
- receive library is explicit, manifest-pinned, and not an inherited default;
- effective send and receive ULN configuration use the expected required DVNs;
- required count, optional count, and optional threshold match policy;
- inbound and outbound rate-limit caps and windows are nonzero and match declared policy.

Route deployment does not prove route activity. Activity requires reciprocal peer and effective configuration evidence.

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

## Preflight engine

### Request

```ts
interface PreflightRequest {
  chainId: number;
  tx?: {
    from: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: string;
  };
  safeBatch?: SafeTransactionBundle;
  at: { kind: "finalized" } | { kind: "block"; number: string; hash?: string };
  manifestVersion: string;
}
```

### Evaluation order

1. Validate hex, sizes, supported chains, and request limits.
2. Resolve proxy and runtime code identity.
3. Select ABI only after identity succeeds.
4. Decode functions and semantic effects.
5. Read required balances, roles, limits, and dependencies at the same block.
6. Execute `eth_call` or equivalent simulation.
7. Use trace capability when available; lack of trace support is explicit.
8. Calculate semantic before/after state.
9. Rerun affected invariants.
10. Canonicalize findings and limitations.

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

Use RFC 8785 JSON Canonicalization Scheme or a well-reviewed compatible implementation. Hash canonical bytes with SHA-256.

Report identity includes:

- engine and evaluator versions;
- manifest hash;
- request hash;
- block hashes;
- normalized evidence hashes;
- verifications;
- limitations.

Cryptographic hashes provide integrity and reproducibility, not authenticity. Signed attestations, if added, use a separately documented key and rotation policy.

## API surface

```text
POST /api/v1/verify
POST /api/v1/diff
POST /api/v1/preflight
GET  /api/v1/reports/:hash
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
  engineVersion,
  manifestVersion,
  manifestHash,
  sourceMode,
  blockRefs,
  freshness,
  data,
  evidence,
  limitations,
  reportHash
}
```

Upstream failure normally produces a completed `unknown`, `stale`, or `conflict` report. Reserve HTTP 503 for inability to construct any meaningful report envelope.

Public API callers cannot supply arbitrary server-side RPC or source URLs. Providers come from a deployment allowlist so verification cannot become an SSRF primitive. Requests have strict limits for calldata size, Safe-batch length, address count, log range, simulation duration, and response size. Contract metadata, revert data, token symbols, provider errors, and other external strings are untrusted and escaped by every renderer.

## CLI surface

```bash
aegis verify --manifest etherfi-2026-07.json --at finalized
aegis verify --offline tests/fixtures/core-healthy.json
aegis diff report-before.json report-after.json
aegis preflight safe-batch.json --fork-block 25577369
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
- incident bundles and causal edges;
- counterfactual runs.

Cache keys include provider policy, manifest hash, chain ID, block hash, request hash, and evaluator version. Never key critical cached evidence by block number alone.

A block-hash change invalidates derived cache entries and marks prior observations orphaned.

## Tests

### Unit and property tests

- same inputs produce byte-identical reports;
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
- absent or zero rate limit;
- Cash dependency miswiring;
- stale oracle;
- provider disagreement;
- reorged block;
- unsupported selector;
- simulation revert.

Fixture regeneration requires explicit chain and block arguments and never records `latest` silently.

### Fork and end-to-end tests

- reproduce selected reports from pinned archive/fork state;
- mutate one configuration and verify only affected assertions change;
- simulate a real Safe/timelock bundle;
- verify CLI, API, and web report-hash agreement;
- confirm exported reproduction commands work in a clean environment.

## Observability

Track:

- provider latency, error rate, disagreement, and head lag;
- finality resolution duration;
- observation and evaluator duration;
- cache hits and reorg invalidations;
- report state counts by invariant;
- preflight simulation failures by stage;
- indexer lag and orphaned-event count.

Logs include request and report IDs but never private RPC credentials or user transaction secrets.

## Performance and reliability targets

Initial engineering targets, subject to measurement:

- cached assurance report: p95 under 500 ms;
- uncached single-chain core report: p95 under 8 seconds;
- preflight without trace: p95 under 10 seconds;
- deterministic offline verification: no network dependency;
- no false `pass` under injected provider timeout, conflict, or stale evidence tests.

These targets are not public SLOs until measured in production.

## Engineering acceptance gate

The target architecture is credible when one complete vertical slice demonstrates:

1. independently sourced expected manifest;
2. finalized-block observation from redundant providers;
3. real EIP-1967 and runtime-code-hash verification;
4. raw evidence capture and SHA-256 hashing;
5. pass, fail, unknown, stale, conflict, and not-applicable fixtures;
6. block-hash-keyed caching and reorg invalidation;
7. one-command CLI reproduction;
8. identical CLI, API, and web report hashes;
9. a deliberately broken fork producing the expected narrow failure;
10. documented limitations and threat assumptions.

Additional breadth must not precede this vertical slice.
