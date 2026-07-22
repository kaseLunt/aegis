# Aegis Delivery Roadmap

Status: execution plan
Version: 1.0
Last updated: 2026-07-21

## How to read this roadmap

The existing application is a polished, deterministic prototype. It demonstrates the information architecture, pure evaluation functions, fixed-point modeling, and evidence-oriented UI. It is milestone 0, not the completed system described in the product and engineering specifications.

The remaining work is intentionally organized around independently reviewable vertical slices. A milestone is complete only when its exit gate passes. Page count, code volume, or AI-agent throughput do not substitute for those gates.

Effort labels describe the depth of engineering and validation, not a promise that a swarm must consume a particular amount of wall-clock time. The target represents several conventional engineer-weeks because the hard work is evidence acquisition, predicate validation, adversarial testing, and review - not drawing additional screens.

## Release thesis

The first hiring-ready release is **Aegis: ether.fi Change Assurance and weETH Route Readiness**. The [project selection decision](PROJECT_SELECTION.md) records the evaluated alternatives and why Aegis absorbs the strongest crosschain-monitor idea instead of becoming a portfolio dashboard, generalized risk score, or market simulator.

The target architecture is stronger than those alternatives; milestone 0 is not. A genuinely live crosschain monitor would beat a fixture-only Aegis. Therefore, no additional prototype-only page, animation, card, or modeled scenario counts as meaningful progress before the live vertical slice.

## Scope discipline

The first production-grade slice is narrow:

- ether.fi-specific, not a generic protocol framework;
- read-only;
- Ethereum plus one OP route;
- both Ethereum-to-OP and OP-to-Ethereum directions;
- one code-identity predicate completed end to end before broad invariant coverage;
- versioned expected-state manifests;
- two independent RPC providers for critical positive findings;
- CLI, API, and web renderers over one shared engine;
- deterministic offline fixtures for every live path.

No later milestone may weaken provenance, finality, or failure semantics to add breadth faster.

## Milestone 0 - Prototype shell

### Already present

- three connected surfaces for health, preflight, and replay;
- pure TypeScript evaluators;
- deterministic fixtures and report hashes;
- fixed-point arithmetic for modeled financial values;
- a shared evidence drawer and explicit limitations;
- baseline lint, type, unit, property, and build checks;
- a deployed independent portfolio demo.

### Honest limitations

- verifier values are recorded fixtures, not live production reads;
- current chain-head reads provide context only;
- preflight is a deterministic domain model, not production `eth_call` or fork simulation;
- replay is a reference scenario, not an indexed production event history;
- the current result vocabulary predates the canonical six-state target;
- manifests do not yet meet the full review and provenance contract.

### Exit gate

The prototype gate is already met when the application boots, all checks pass, and every simulated or recorded value is labeled honestly. It earns permission to build the real evidence pipeline; it does not earn production assurance claims. Milestone 0 receives no further feature work unless required to support milestones 1 through 4.

## Milestone 1 - One indisputable live vertical slice

### Goal

Implement `CODE-01`, runtime implementation identity, from reviewed manifest to real finalized evidence and expose the identical result through CLI, API, and web.

### Deliverables

- JSON Schema and TypeScript types for manifests, evidence, results, and reports;
- manifest hash, source commit, author/reviewer metadata, validity window, and environment binding;
- finalized-block selection with chain ID, number, hash, timestamp, and provider head lag;
- two administratively independent RPC adapters;
- EIP-1967 proxy implementation resolution plus runtime bytecode hashing;
- code-hash-scoped ABI registry;
- conflict-aware evidence acquisition with raw-response hashes;
- RFC 8785 canonical report serialization and SHA-256 report identity;
- `aegis verify`, `GET /api/v1/reports/:hash`, and a web evidence drawer using the same engine;
- recorded success, mismatch, missing-evidence, stale-provider, provider-conflict, and reorg fixtures.

### Exit gate

- A reviewer can reproduce one real report from a documented command.
- Both providers agree on the exact finalized block and value for a `pass`.
- Disconnecting or corrupting either provider cannot create a false pass.
- An unexpected implementation fails before dependent ABI decoding occurs.
- Identical input artifacts produce byte-identical canonical reports offline.
- The web UI contains no special-case verdict logic.

## Milestone 2 - weETH route readiness

### Goal

Expand from code identity to one live, bidirectional Ethereum and OP weETH route rendered as an evidence-backed directed topology.

### Deliverables

- code identity for every participating route contract;
- reciprocal peers and Endpoint IDs in both directions;
- LayerZero send/receive library pinning;
- effective send and receive configuration, DVN membership, thresholds, and confirmations;
- directed-route pause and pairwise rate-limit configuration;
- owner, delegate, and relevant role configuration;
- a directed topology whose edges are canonical engine results rather than UI-derived health scores;
- a visible coverage matrix showing unsupported contracts, routes, and chains;
- independent expected-state sources and a review note for every predicate.

### Exit gate

- At least six meaningful predicates run against both directions of one production route.
- Every predicate has a written rationale, units, evidence requirements, limitations, and negative fixture.
- Unsupported or unobservable properties remain visible as `not_applicable` or `unknown`.
- No predicate claims route safety, whole-protocol safety, solvency, or reserve proof.
- A domain reviewer can challenge an expected value without reading UI code.
- No price, APY, TVL, liquidity, or decorative traffic metric is required for the route verdict.

## Milestone 3 - Rewind and change attribution

### Goal

Explain how a recorded configuration came to exist, without pretending crosschain history is globally atomic.

### Deliverables

- block-hash-anchored log ingestion with range-gap detection;
- implementation/ABI epoch handling;
- deterministic event identities and idempotent indexing;
- checkpoint reconciliation between derived and direct state;
- before/after configuration diffs tied to transaction, initiator, and executor;
- explicit causal edges for crosschain event bundles;
- separate provenance labels for observed, documented, derived, and modeled events;
- immutable incident bundles and supersession behavior after a reorg.

### Exit gate

- Re-indexing the same ranges produces the same event and report hashes.
- An injected missing range is detected rather than silently omitted.
- At least one real configuration change can be traced from transaction to affected predicates.
- The incident experience never presents a documented scenario as an observed ether.fi exploit.
- Chronological display order and causal inference remain separate in data and UI.

## Milestone 4 - Rehearse a real governance action

### Goal

Accept a public unsigned proposal or reconstruct a public historical Safe or timelock execution at its parent block, then show its decoded, simulated, policy-relevant effect without broadcasting it.

### Deliverables

- strict input validation for sender, target, calldata, value, chain, and manifest;
- explicit artifact origin: `public_unsigned_proposal` or `retrospective_rehearsal`;
- Safe transaction JSON ingestion;
- code-identity-first ABI selection and deterministic calldata decoding;
- pinned-state `eth_call`, with local-fork execution for deeper traces where needed;
- predicted configuration diff for supported actions;
- affected-predicate selection and post-state evaluation;
- explicit preflight expiry and state-drift invalidation;
- privacy disclosure for remote simulation;
- CLI command suitable for CI or a Safe-review workflow.

### Exit gate

- One real, nontrivial supported transaction is decoded and simulated end to end.
- A retrospective case produces its prediction from parent-block state before separately comparing it with receipt and post-state evidence.
- Unknown code identity blocks semantic decoding.
- Intervening relevant state invalidates the preflight.
- The report never says `safe to sign` or guarantees execution.
- A malformed batch, reverted call, unsupported delegatecall, and partial batch failure have distinct outcomes.

## Hiring-ready release gate

Milestones 1 through 4 form one public hiring artifact. It is ready to lead the portfolio only when:

- real code identity works from independent manifest through finalized redundant observations;
- both Ethereum and OP route directions expose peer, library, DVN, threshold, control, and rate-limit evidence;
- one real configuration change is indexed and reproduced as a before and after diff;
- one public unsigned proposal or retrospective Safe/timelock configuration transaction is rehearsed at pinned pre-execution state;
- one deliberately corrupted fork fails only the affected assertions;
- one provider timeout produces incomplete evidence and one disagreement produces `conflict`;
- CLI, API, and web export the same canonical report hash;
- the hero topology is usable, responsive, accessible, and explicit about unsupported coverage.

Counterfactual replay, core staking, Cash, Liquid, operator intelligence, and broad chain coverage can follow. They do not block the first hiring-ready release and do not substitute for it.

## Milestone 5 - Counterfactual replay

### Goal

Run deterministic what-if policies over an immutable factual event bundle.

### Deliverables

- versioned incident-bundle schema;
- immutable observed/documented event layer;
- deterministic policy engine for rate cap, detection latency, pause latency, verifier availability, and allowed-chain set;
- modeled event namespace and constrained verdict language;
- side-by-side policy comparison;
- exported scenario inputs, outputs, limitations, and report hash;
- boundary, property, and metamorphic tests for model behavior.

### Exit gate

- At least two policies can be compared with identical factual input.
- Changing a model input cannot mutate or relabel a factual event.
- Repeated runs with injected time produce byte-identical results.
- The UI says `bounded under model`, `delayed under model`, `unchanged under model`, or `indeterminate` rather than `prevented`.

## Milestone 6 - Public engineering release

### Goal

Turn the vertical slices into a repository an ether.fi engineer can clone, audit, break, and extend.

### Deliverables

- one-command local setup and fixture-only demo;
- reproducible manifest and fixture refresh tooling that requires explicit chain and block arguments;
- architecture decisions for finality, provider quorum, canonicalization, and plugin boundaries;
- provider health and last-finalized-observation endpoints;
- structured logs, metrics, and trace IDs without private preflight payloads;
- rate limits, bounded retries, cache retention, and resource budgets;
- accessibility, responsive layout, empty/error/loading states, and renderer conformance tests;
- dependency, secret, license, and supply-chain review;
- a five-minute demo script and a deeper reviewer runbook;
- public limitations, threat model, coverage table, and disclosure procedure.

### Exit gate

- A clean clone passes lint, typecheck, unit/property/fixture tests, and production build.
- The complete deterministic test suite runs without network access.
- Cold live verification and warm render targets are measured and documented.
- All required threat-model failure injections pass.
- No placeholder result is reachable in production mode.
- Another engineer can add one manifest target or invariant from the documented extension path.

## Cross-cutting workstreams

These run through every milestone:

### Predicate review

For every check, document the exact claim, why it matters, its units, required observations, expected source, exclusions, and failure cases. This is the highest-value human review surface.

### Evidence and provenance

Expected and observed values remain independently attributable. Every report includes a block hash, manifest hash, engine version, raw-result hash, derivation, freshness, and limitations.

### Failure honesty

Provider failures, missing history, unsupported proxy patterns, and stale evidence receive typed outcomes. They are tested as normal operating conditions.

### Design quality

The interface must help a protocol engineer answer an operational question quickly, then descend to raw proof. Visual polish is valuable only when it strengthens that information hierarchy.

### Reviewability

Keep domain logic pure, schemas explicit, fixtures small, and adapters replaceable. Generated code is acceptable; opaque generated behavior is not.

## Final definition of done

Aegis is ready to present as the finished project when all of the following are true:

- Record, Rehearse, and Rewind each contain at least one real, end-to-end workflow.
- Every positive production claim is block-hash-bound, manifest-bound, and supported by independent provider agreement.
- A report can be regenerated and hashed without the web UI.
- The six result states survive unchanged across engine, storage, API, CLI, and UI.
- Live, recorded, declared, derived, and modeled data cannot be mistaken for one another.
- The threat-model adversarial suite passes.
- The five-minute demo includes a real pass, an intentional failure, a provider uncertainty case, a transaction rehearsal, and a replay model.
- The repository clearly states what is real, what is recorded, and what remains unsupported.

Until then, the correct phrase is **working prototype progressing toward the target specification**, not **completed protocol assurance platform**.
