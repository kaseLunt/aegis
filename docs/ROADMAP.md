# Aegis Delivery Roadmap

Status: execution plan
Version: 1.1
Last updated: 2026-07-21

## How to read this roadmap

The existing application is a polished, deterministic prototype. It demonstrates information architecture, pure evaluation functions, fixed-point modeling, and an evidence-oriented UI. It is milestone 0, not the completed system described in the product and engineering specifications.

Project selection compares the intended finished Aegis with other intended finished products. This roadmap does something different: it orders implementation so the shared evidence spine is proven before six domain families depend on it. The fact that a capability appears later here does not make it optional or less important to the finished product.

A milestone is complete only when its exit gate passes. Page count, code volume, elapsed wall-clock time, or AI-agent throughput do not substitute for real evidence acquisition, predicate validation, adversarial testing, and review. Those activities are why the target represents substantial conventional engineering work even when agents accelerate implementation.

## Release map

| Stage | Milestones | Meaning |
| --- | --- | --- |
| Prototype | M0 | Interaction shell and deterministic product hypothesis |
| Hiring-ready bridge slice | M1-M4 | First complete proof of Record, Rewind, and Rehearse on real evidence |
| Domain-complete beta | M5-M8 | Stake/core, wider crosschain, Liquid, Cash, governance, and operator/AVS evidence families |
| Finished public product | M9-M10 | Bounded counterfactual lab plus production/reviewer hardening |

The hiring-ready bridge slice is deliberately useful on its own. It is an intermediate portfolio release, not the final definition of Aegis.

## Delivery thesis

The finished product is the Aegis Protocol Flight Recorder across ether.fi Stake, crosschain, Liquid, Cash, governance, and operator/AVS control and exposure surfaces.

The Ethereum and OP weETH route is implemented first because one coherent route exercises unusually broad shared machinery:

- chain-scoped code and ABI identity;
- multi-chain finality and timestamp boundaries;
- independent expected-state manifests;
- provider quorum and conflict behavior;
- directional topology and coverage;
- reorg-aware configuration history;
- governance transaction rehearsal;
- a deliberately broken fork;
- identical CLI, API, CI, and web output.

Once that spine survives review, the remaining domains extend it rather than inventing separate data models or dashboards.

## Cross-cutting rules

- Aegis remains ether.fi-specific and read-only.
- Expected and observed state always have independent provenance.
- Every critical `pass` or `fail` requires explicit finality and matching evidence from independent providers; a unilateral contradiction may alert but cannot become a canonical failure verdict.
- Unsupported coverage remains visible.
- The renderer never creates a verdict outside the shared engine.
- Every enabled claim has a rationale, units, evidence requirements, limitations, and adversarial fixtures.
- Facts, declared policy, deterministic derivations, and modeled counterfactuals remain separate.
- Falsifiable predicates use the six verification states; neutral facts/metrics use availability and coverage states and never become pass/fail safety verdicts.
- No domain may add a universal score, market forecast, recommendation, or offchain conclusion to appear more complete.

## Milestone 0 - Prototype shell

### Already present

- three connected surfaces for health, preflight, and replay;
- pure TypeScript evaluators;
- deterministic fixtures and report identifiers;
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

The prototype gate is already met when the application boots, all checks pass, and every simulated or recorded value is labeled honestly. M0 receives no independent feature expansion; existing surfaces may change only to support later milestones.

## Milestone 1 - Canonical evidence spine

### Goal

Implement `deployment.code_identity` from reviewed manifest to real finalized evidence and expose the identical result through CLI, API, CI, and web.

### Deliverables

- JSON Schema and TypeScript types for manifests, evidence, results, coverage, and reports;
- manifest hash, source commit, author/reviewer metadata, validity window, environment binding, and a deployment-configured approved-hash/reviewer-key trust policy;
- finalized-block selection with chain ID, number, hash, timestamp, provider head, and lag;
- two administratively independent RPC adapters;
- manifest-declared direct, EIP-1967, beacon, or minimal-clone identity adapters as required by supported targets, plus terminal runtime bytecode hashing;
- code-hash-scoped ABI registry;
- conflict-aware evidence acquisition with raw-response hashes and typed per-call failures;
- RFC 8785 canonical report serialization and SHA-256 report identity;
- `aegis verify`, content-addressed report API, CI adapter, and evidence drawer over the same engine;
- block-hash-keyed caches, canonicality checks, and reorg supersession;
- recorded success, mismatch, missing-evidence, stale-provider, provider-conflict, ABI-mismatch, and reorg fixtures.

### Exit gate

- A reviewer reproduces one real report from a documented command.
- Required providers agree on the exact finalized block and value for a `pass`.
- Disconnecting or corrupting a provider cannot create a false pass.
- Unexpected implementation identity blocks dependent semantic decoding.
- A caller-selected self-consistent manifest cannot replace the canonical live policy; custom manifests are visibly noncanonical and cannot create a production pass/fail.
- Identical input artifacts produce byte-identical reports offline.
- CLI, API, CI, and web carry the same payload and hash.

## Milestone 2 - Ethereum and OP weETH route Record

### Goal

Expand the evidence spine into one live, bidirectional Ethereum and OP route rendered as an evidence-backed directed topology.

### Deliverables

- code identity for each participating route contract;
- reciprocal peers and Endpoint IDs in both directions;
- explicit send and receive library resolution, including inherited-default detection;
- effective ULN configuration, DVNs, thresholds, confirmations, and optional-DVN policy;
- directed pause, owner, delegate, role, and pairwise rate-limit configuration;
- reviewed expected-state provenance and explicit lifecycle for every route predicate;
- a topology whose nodes and edges are projections of canonical engine output;
- a coverage matrix that keeps unsupported contracts, directions, and chains visible;
- scheduled report capture and a content-addressed permalink.

### Exit gate

- Every mandatory `ROUTE-ETH-OP-v1` matrix cell passes in both directions using real finalized evidence; uncertainty outcomes are demonstrated separately and do not count toward the baseline.
- Every predicate documents its claim, evidence, units, applicability, exclusions, and negative fixture.
- Candidate, disabled, and decommissioned directions remain visible and are evaluated against their lifecycle policy rather than active-route requirements.
- A wrong peer, library, DVN, limit, or implementation fails only affected assertions.
- Provider timeout and disagreement yield typed uncertainty, never a false pass.
- No price, APY, TVL, liquidity, traffic, or route-health score participates in the result.

## Milestone 3 - Rewind and change attribution

### Goal

Explain how a recorded configuration came to exist without pretending crosschain history is globally atomic.

### Deliverables

- block-hash-anchored log ingestion with adaptive ranges and gap detection;
- implementation and ABI epoch handling;
- deterministic event identities and idempotent indexing;
- checkpoint reconciliation between indexed and direct state;
- before/after configuration diffs tied to transaction, initiator, and executor;
- explicit causal edges for crosschain event bundles;
- immutable change bundles and supersession after a reorg;
- configuration tape in the web UI and equivalent CLI/API access.

### Exit gate

- Re-indexing identical ranges produces identical event and report hashes.
- An injected missing range is detected rather than silently omitted.
- At least one real configuration or implementation change traces from transaction to affected route assertions.
- ABI changes decode through explicit epochs.
- Chronological display and causal inference remain separate in data and UI.

## Milestone 4 - Rehearse a real governance action

### Goal

Evaluate one public unsigned proposal or exactly reconstruct one canonical public historical Safe/timelock execution transaction, then show its decoded, statefully simulated, policy-relevant effect without broadcasting it.

### Deliverables

- strict sender, target, calldata, value, chain, manifest, and batch validation;
- explicit origin: `public_unsigned_proposal` or `retrospective_rehearsal`;
- Safe/timelock artifact ingestion;
- identity-first ABI selection and deterministic calldata decoding;
- exact block-hash resolution; `eth_call` only for preliminary call/revert output; stateful local-fork execution for any claimed post-state;
- for retrospective rehearsal, parent-block fork plus canonical replay of every earlier transaction in the target block before target execution;
- independent actual-effect comparison using a trace/state diff or a block-end checkpoint with proof that no later transaction touched affected state;
- semantic before/after configuration diff and affected-assertion evaluation;
- expiry and state-drift invalidation;
- separation between retrospective prediction inputs and later receipt/post-state comparison;
- privacy disclosure and a CLI command usable in review or CI.

### Exit gate

- One real, nontrivial supported artifact is decoded and simulated end to end.
- A retrospective case reconstructs the exact pre-transaction state from the parent block plus canonical same-block prefix, hashes its prediction, and only then compares actual outcome evidence.
- Failure to reproduce block context, transaction prefix, sender semantics, committed simulated post-state, or isolated actual effects yields `unknown`/`indeterminate` and cannot pass the gate.
- Unknown code identity blocks semantic decoding.
- Relevant intervening state invalidates the preflight.
- Malformed, reverted, unsupported delegatecall, and partial-batch cases have distinct outcomes.
- No result says `safe to sign` or guarantees execution.

## Intermediate hiring-ready gate

Milestones 1 through 4 form the first public hiring artifact. It is ready to lead the portfolio only when:

- Record, Rewind, and Rehearse all use real evidence in the route workflow;
- one corrupted fork creates a precise failure and one provider disagreement creates `conflict`;
- CLI, API, CI, and web reproduce the same canonical report hash;
- the directed topology is usable, responsive, accessible, and explicit about coverage;
- a skeptical reviewer can trace one screen-level statement to raw evidence and manifest provenance;
- the repository never presents the route slice as the completed multi-domain platform.

## Milestone 5 - Stake/core and wider crosschain atlas

### Goal

Prove the engine generalizes beyond one route without weakening its semantics.

### Deliverables

- real, reviewed Stake/core coverage for implementation identity, weETH local wrapper-share backing, withdrawal escrow, oracle quorum geometry, positive-rebase bounds, and upgrade delays;
- explicit operational findings for pause/freshness states that are not mislabeled as invariant failure;
- additional production routes added only after their directed configuration and expected-state sources meet the M2 quality bar;
- cross-domain role and governance relationships in the Protocol Atlas;
- release-diff reports and optional CI/webhook notification for supported changes;
- negative, boundary, missing-evidence, proxy-change, and source-conflict fixtures per family.

### Exit gate

- At least five Stake/core claims execute against real finalized data with domain-reviewed limitations.
- Wider routes meet the same bidirectional evidence contract as Ethereum and OP; route count alone cannot pass the gate.
- An accounting getter is never presented as proof of reserves or solvency.
- Cross-domain release diffs reproduce through CLI, API, and web.

## Milestone 6 - Liquid policy and rebalance assurance

### Goal

Make Liquid vault wiring, authority, allowed-action policy, accounting bounds, queues, and supported proposed rebalances inspectable without forecasting returns.

### Deliverables

- chain-scoped deployment and runtime identities for supported BoringVault systems;
- RolesAuthority, Teller, Accountant, Manager, decoder/sanitizer, queue, and asset wiring;
- reviewed Manager Merkle-root history plus content-addressed supplied/independently sourced leaves and proofs for supported action classes;
- policy views showing allowed target, selector, assets, argument constraints, unsupported leaves, corpus source, and corpus coverage;
- Accountant rate-update timing/bounds, fees, pause state, and queue constraints;
- Rewind for one real policy, module, queue, or Accountant change;
- Rehearse for one real supported policy update or rebalance artifact;
- policy topology, decoded-action explorer, and semantic before/after UI.

### Exit gate

- One real supported vault can be reconstructed from code identity through policy commitments and modules.
- Aegis never infers a complete allowed-action set from a Merkle root alone; completeness requires a reviewed authoritative full leaf corpus.
- A malformed proof, unknown decoder, unexpected module, unsupported leaf, and bound violation have typed outcomes.
- One real historical change and one real rehearsal use the shared engine and canonical reports.
- A matching policy never becomes a profitability, liquidity, APY, or strategy-safety claim.

## Milestone 7 - Cash configuration and account effects

### Goal

Verify public Cash contract topology and policy, then explain exact supported onchain transaction/account effects without claiming knowledge of private card systems.

### Deliverables

- current OP proxy/implementation and dependency graph for CashModule, DataProvider, CashLens, PriceProvider, SafeFactory, event emitter, and RoleRegistry;
- collateral/borrow sets, LTV, liquidation, bonus, APY-per-second, minimum-share, oracle identity/callability, implementation-supported freshness, pause, and role configuration;
- conflict handling for official documents, deployment manifests, repositories, and observed state;
- exact block-bound account facts and spend-capacity/collateral arithmetic for supported public calls;
- Rewind for one real Cash configuration or implementation change;
- Rehearse for one supported configuration action or public account-effect scenario;
- explicit uncovered boundary for issuer, processor, banking, fraud, authorization, and settlement state.

### Exit gate

- Real canonical wiring and risk-configuration claims pass the full provider and provenance pipeline.
- Fixed-point and boundary tests cover all supported financial arithmetic.
- Oracle freshness is asserted only when a code-bound adapter exposes source time/round data and a reviewed heartbeat; otherwise it remains explicitly unknown or not applicable.
- One real change and one real rehearsal produce canonical semantic diffs.
- A liquidatable account is labeled account state, not protocol failure.
- The UI cannot imply that onchain capacity guarantees a card authorization.

## Milestone 8 - Governance and operator/AVS exposure graph

### Goal

Connect who can change the system and what public restaking exposure exists, while reporting source completeness instead of fabricating operator risk.

### Deliverables

- cross-domain Safe, timelock, owner, guardian, delegate, upgrader, and role graph with historical changes;
- validator-to-node-operator/DVT-cluster-to-AVS relationships for supported public sources;
- explicit onchain, declared, externally sourced, and deterministic-inference provenance labels;
- attributed, unattributed, stale, and unsupported population counts;
- attributed-subset top-N and HHI calculations plus explicit population bounds only where total exposure and allocation/granularity assumptions support them;
- exposure and authority change history in Rewind;
- blast-radius navigation from a governance/configuration change to affected contracts, routes, vaults, accounts, operators, or AVSs;
- source-refresh tooling and drift alerts that preserve historical attribution versions.

### Exit gate

- Every exposure metric discloses coverage and can be reproduced from its cited source snapshot.
- Unknown attribution cannot disappear from denominators or improve a conclusion.
- Incomplete attribution yields subset metrics and, only when justified, versioned lower/upper bounds; it never yields an unqualified population-wide HHI or top-N value.
- One historical authority change and one exposure change reproduce through the shared index and report model.
- No composite operator score, insurance status, competence claim, or infrastructure-independence claim exists.
- A reviewer can follow a governance action through the atlas to the exact supported affected surfaces.

## Domain-complete beta gate

Milestones 5 through 8 complete the factual multi-domain atlas when:

- all six evidence families contain meaningful real coverage;
- each domain has current Record output and reproducible history;
- governance/upgrades, bridge controls, Liquid, and Cash each expose at least one supported Rehearse workflow;
- coverage gaps are visible at the same level as findings;
- scheduled/release-triggered runs produce content-addressed notification artifacts;
- no domain introduces alternate truth states, hashing, provenance, or renderer verdicts.

## Milestone 9 - Cross-domain counterfactual lab

### Goal

Run deterministic, bounded what-if policies over immutable factual bundles without changing or relabeling history.

### Deliverables

- versioned incident/change-bundle and model schemas;
- immutable observed/documented event layer;
- model modules for supported questions such as rate caps, detection/pause latency, allowed-chain sets, governance delays, verifier availability, or policy constraints;
- explicit model applicability, assumptions, units, uncertainty, and unsupported inputs;
- side-by-side policy comparison and causal trace;
- separate hashes and namespaces for factual and modeled artifacts;
- boundary, property, and metamorphic tests.

### Exit gate

- At least three bounded models operate on real immutable bundles from at least two domains.
- Changing a model input cannot mutate or relabel a factual event.
- Repeated runs with injected time produce byte-identical outputs.
- The UI uses constrained language such as `bounded under model`, `delayed under model`, `unchanged under model`, or `indeterminate`, never `prevented`.
- No model produces an APY forecast, price path, optimal allocation, or generalized risk score.

## Milestone 10 - Finished public engineering release

### Goal

Turn the domain-complete system into a repository and running application an ether.fi engineer can clone, audit, break, operate, and extend.

### Deliverables

- one-command local deterministic demo plus explicit live configuration;
- reproducible manifest, source-snapshot, and fixture tooling requiring chain and block arguments;
- architecture decisions for finality, provider quorum, canonicalization, indexing, simulation, and domain plugins;
- scheduler, worker health, last-finalized-observation, index-lag, and coverage endpoints;
- structured logs, metrics, and traces without private preflight payloads or RPC secrets;
- bounded retries, rate limits, cache retention, provider budgets, and backfill controls;
- accessibility, responsive layouts, complete empty/error/loading/conflict states, and renderer conformance tests;
- dependency, secret, license, and supply-chain review;
- threat-model failure injection across every evidence family;
- a five-minute route demo, a multi-domain reviewer tour, extension guide, operating runbook, and disclosure procedure;
- measured performance and reliability targets with documented methodology.

### Exit gate

- A clean clone passes lint, typecheck, unit, property, fixture, integration, adversarial, and production-build checks.
- The deterministic suite runs without network access.
- No placeholder result is reachable in live production mode.
- Another engineer can add a supported manifest target or invariant through documented interfaces without changing UI verdict logic.
- Exported pinned evidence bundles across all evidence families reproduce byte-identical payloads and hashes offline.
- Independent re-observation at the same boundary agrees on the applicable semantic values/quorum while retaining its own acquisition evidence, evaluation time, and report hash.
- All required public-data limitations stay adjacent to the affected findings.
- The project and demo language match implemented coverage exactly.

## Parallel workstreams

These may progress concurrently, but a domain cannot claim completion before its dependency gates pass.

### Domain research and predicate review

For every check or derived metric, document the exact claim, why it matters, units, required observations, expected source, applicability, exclusions, and failure cases. Human/domain review of this material is the highest-value ownership surface.

### Source and manifest operations

Pin authoritative releases and source snapshots, resolve conflicts, record validity ranges and reviewers, bind ABIs to runtime code, and prevent observed values from silently populating expected policy.

### Evidence and reliability

Build provider adapters, finality rules, archive/backfill behavior, checkpoint reconciliation, reorg handling, typed failures, and deterministic recorded evidence alongside each live path.

### Simulation coverage

Add one explicitly supported action family at a time. Preserve exact input material, reject unknown identity before decoding, list unsupported effects, and invalidate results when their state boundary changes.

### Design quality

Make the Protocol Atlas and workbenches answer an operational question quickly, then descend to raw proof. Use topology, history, diffs, and coverage because they clarify real relationships, not because the product needs more screens.

### Reviewability and AI-assisted ownership

Keep domain logic pure, schemas explicit, fixtures small, adapters replaceable, and generated modules constrained by tests and interfaces. Generated code is acceptable; opaque generated behavior is not.

## Final definition of done

Aegis is ready to present as the fully featured finished project only when:

- Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS evidence families all contain real reviewed coverage;
- Record contains real coverage in all six evidence families; Rewind contains at least one real supported change/history in each family; Rehearse contains real supported workflows for governance/upgrades, bridge controls, Liquid, and Cash rather than only the bridge hero;
- the counterfactual lab operates on immutable real bundles with separate modeled provenance;
- scheduled monitoring, CI, API, CLI, web, and exports share canonical engine results;
- every positive onchain claim is bound to its exact execution block or consensus slot/root; every external-source claim is bound to a content-addressed snapshot; all follow the applicable reviewed manifest/source and provider policy;
- all six predicate-verification states and all neutral fact-availability states survive unchanged across engine, storage, API, CLI, CI, and UI;
- live, recorded, declared, derived, and modeled data cannot be mistaken for one another;
- incomplete source or attribution coverage remains visible;
- the full cross-domain threat-model and adversarial suite passes;
- the five-minute demo shows a real pass, intentional failure, provider uncertainty, transaction rehearsal, history, and hash reproduction;
- the deeper tour demonstrates how the same engine extends across the full ether.fi product and governance topology;
- the repository clearly states what is supported, what is recorded, what is modeled, and what remains unknowable from public data.

Until this gate passes, describe the implementation by the highest completed milestone. Do not use current progress to weaken the selected final product, and do not use the final specification to exaggerate current implementation.
