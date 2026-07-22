# Aegis Product Specification

Status: canonical product direction
Version: 1.1
Updated: 2026-07-21

## One-sentence definition

Aegis is an independent protocol flight recorder that records ether.fi's Stake, crosschain, Liquid, Cash, governance, and operator/AVS control and exposure surfaces at explicit reproducible observation boundaries, explains how they changed, and simulates supported proposed transactions against the same independently verifiable assertions. Execution-layer state is block-hash-bound, consensus-layer state is slot/root-bound, and external source material is content-addressed and timestamped.

## Product thesis

Onchain protocols publish audits, deployment files, governance transactions, contract source, and security claims. An engineer who wants to determine whether production still matches those claims must manually reconcile block explorers, repositories, proxy slots, ABIs, RPC output, multisig transactions, and spreadsheets.

Aegis turns that work into a deterministic assurance report with three connected workflows:

- **Record:** verify declared configuration against observed production state.
- **Rehearse:** simulate a proposed transaction or Safe/timelock bundle and evaluate the resulting state.
- **Rewind:** reconstruct a configuration change or incident from immutable evidence, then run clearly separated counterfactual models.

The website exists to make the evidence legible. The product is the shared verification engine, manifest format, evidence bundle, and reproduction workflow underneath it.

## Why ether.fi

Ether.fi is a strong target because its public system exposes meaningful, falsifiable properties:

- upgradeable core staking and Cash contracts;
- contract-enforced backing, withdrawal, rebase, and quorum constraints;
- timelocked governance and role separation;
- crosschain peers, message libraries, DVN quorums, and pairwise rate limits;
- Liquid vault roles, modules, policy commitments, accounting bounds, and queues;
- Cash dependency wiring, collateral policy, price providers, and account state;
- public validator, operator, and AVS relationships whose coverage and concentration can be reported without inventing a risk score;
- public deployment manifests, verified source, audits, and documented hardening work.

Aegis does not assume ether.fi lacks internal monitoring. Its value is independent reproducibility, public-state evidence, intended-versus-deployed comparison, and a coherent engineering interface over information that is otherwise fragmented.

The [source and provenance register](SOURCE_REGISTER.md) records the official research basis for these choices and, critically, what each source cannot prove.

## First hiring-ready vertical slice

The first intermediate release is positioned as:

> **Aegis: ether.fi Change Assurance and weETH Route Readiness**

The [project selection decision](PROJECT_SELECTION.md) compares the intended completed products and selects the larger Aegis Protocol Flight Recorder. The route release below is the first proof of its shared engine, not the final product scope used in that comparison.

The hero experience is a live, directed Ethereum and OP weETH route topology. It makes both directions inspectable and connects every visible edge to exact configuration evidence. The initial release verifies code identity, peers, endpoint identifiers, explicit send and receive libraries, DVNs and thresholds, pause and control roles, and pairwise rate limits.

This topology is not a liquidity dashboard or route optimizer. It does not add TVL, token prices, APYs, decorative message traffic, or a vague route-health score. Its purpose is to make deployed control state, configuration change, and proposed change immediately legible.

The route release requires more than Record. It also reconstructs one real configuration change through Rewind and evaluates one public unsigned proposal or exact retrospective Safe/timelock transaction through Rehearse.

The Rehearse acceptance artifact may be either:

- a public unsigned Safe or timelock proposal evaluated at a captured applicable block before execution; or
- one canonical historical execution transaction (including an atomic internal batch) evaluated against an exact pre-transaction state reconstructed from its parent block plus the target block's canonical transaction prefix.

A historical case is labeled `retrospective_rehearsal`. Aegis statefully replays any earlier transactions in the target block before executing the target; ordinary `eth_call` is not sufficient for a claimed after-state. Its receipt and observed effects are excluded from prediction inputs and used only afterward to compare Aegis's hashed predicted delta with an independent trace/state diff or an end-block checkpoint proven free of later relevant writes. If exact prefix/context replay or isolated actual-effect evidence is unavailable, the result is indeterminate and does not pass the release gate. This provides a public, non-sensitive test without presenting hindsight as a prospective review.

## Fully featured target

The completed product is a multi-domain assurance platform with one semantic contract. It does not become six separate dashboards and it does not weaken evidence rules to gain breadth.

### Protocol Atlas

The web application presents a chain- and source-aware map of ether.fi's supported public control and exposure surfaces:

- **Stake and core:** proxy and runtime identity, weETH local wrapper backing, withdrawal escrow, oracle quorum, rebase limits, roles, and upgrade delays;
- **Crosschain:** bidirectional route topology, peers, libraries, DVNs, thresholds, confirmations, pause controls, rate limits, and configuration coverage;
- **Liquid:** BoringVault identities and dependencies, authority and module wiring, Manager Merkle-policy commitments, decoded independently supplied/sourced action proofs with explicit corpus coverage, Accountant bounds, withdrawal or deposit queues, and supported rebalance transitions;
- **Cash:** canonical component wiring, collateral and borrow policy, oracle dependencies, contract roles, public account state, and exact onchain spend-capacity or collateral effects;
- **Governance:** Safes, timelocks, role assignments, proposal payloads, execution histories, and the changes they produce in every other domain;
- **Operator and AVS exposure:** public validator/operator/AVS relationships, source and attribution completeness, attributed-subset concentration plus explicit top-N/HHI bounds where the population supports them, and exposure change history without a composite safety judgment.

Each domain view is an evidence navigator over canonical reports. A universal score, decorative activity stream, or inferred recommendation cannot replace the underlying claims.

### Continuous Record

Workers execute reviewed manifests/source policies on schedules and release hooks, retain append-only observation-bound reports, index supported events and source revisions, detect configuration or exposure drift, supersede reorged observations, and deliver optional CI or webhook notifications. Every alert links to the exact report and can be reproduced locally.

### Multi-domain Rehearse

The preflight workbench supports reviewed action families for upgrades, roles, bridge controls, governance batches, Liquid policy/module/queue changes, supported Liquid rebalances, and Cash configuration or account-state effects. It shows the decoded intent, simulation boundary, semantic delta, affected assertions, expiration conditions, and unsupported effects. It never signs, broadcasts, recommends an allocation, or guarantees eventual execution.

### Multi-domain Rewind

The history workbench reconstructs real deployment, upgrade, role, route, vault-policy, Cash-configuration, governance, and exposure changes. It understands implementation and ABI epochs, detects missing log ranges, reconciles indexed state with checkpoints, and preserves explicit causal edges where chronological order alone is insufficient.

### Counterfactual lab

Deterministic, versioned models may answer bounded questions over an immutable event bundle: for example, the effect of a different rate cap, pause delay, allowed-chain set, governance delay, or supported policy constraint. Model inputs, assumptions, limitations, and outputs are content-addressed separately from observed history. Aegis does not produce market forecasts or say a policy would have prevented an exploit.

### Shared delivery surfaces

The same canonical engine powers the web Protocol Atlas, CLI, HTTP API, scheduled monitor, CI policy, evidence permalinks, and exported release/change/incident bundles. Identical inputs must yield identical payloads and hashes on every surface.

### Finished web information architecture

| Surface | Primary question | Backing artifact |
| --- | --- | --- |
| Protocol Atlas | What supported ether.fi contracts, authorities, routes, policies, and exposure relationships exist, and what is uncovered? | Latest canonical reports, topology edges, and coverage records |
| Domain detail | What exactly was observed for Stake, crosschain, Liquid, Cash, governance, or operator/AVS scope? | Verifications, neutral facts, observation boundaries, and evidence |
| Changes | What changed, when, through which transaction/source revision, and which findings or facts moved? | Reorg-aware history, source-snapshot lineage, checkpoints, and semantic diffs |
| Rehearse | What would this supported proposal or batch change at the cited state boundary? | Identity-aware simulation and before/after report |
| Rewind | How did this real change or incident sequence unfold? | Immutable event bundle, ABI epochs, and causal edges |
| Counterfactual lab | Under explicit bounded assumptions, how would a different policy alter that immutable sequence? | Separately hashed model artifact |
| Exposure | What operator/AVS relationships and concentration are supported by this declared source population? | Neutral facts, denominator/coverage, and source snapshots |
| Report permalink | Can another engineer inspect and reproduce this exact result? | Content-addressed canonical payload and reproduction command |
| Coverage and service status | Which claims, actions, chains, contracts, sources, and histories are supported or impaired? | Coverage registry, provider/source health, and indexer status |

The route topology is the first hero view within this architecture. The finished frontend demonstrates breadth through coherent navigation and relationship views, not duplicated dashboards or invented filler data.

## Success criterion

The primary goal is not adoption. The primary goal is for an ether.fi engineer to inspect the system for ten minutes and conclude:

> The author understood our topology and threat model, chose defensible assertions, handled uncertainty correctly, and built a reproducible full-stack system rather than a mocked dashboard.

Production adoption would be a bonus. Engineering respect is the required outcome.

## Primary users

### 1. Protocol and security engineer

Needs to answer:

- Does production match the intended release?
- What changed, at which block, and through which transaction?
- Which assertions are affected?
- Is the observation reproducible?
- What is unknown because evidence is missing or conflicting?

### 2. Release engineer or governance signer

Needs to answer:

- What will this Safe or timelock bundle change?
- Which implementations, roles, dependencies, routes, or limits move?
- Does simulation succeed at a pinned state?
- Which policy findings require review before execution?

### 3. On-call or incident responder

Needs to answer:

- What was the last known verified configuration?
- What changed before the alert or incident?
- Which systems and routes are plausibly affected?
- Can another engineer reproduce the evidence without access to an internal dashboard?

### Secondary users

- auditors and risk teams;
- integrators validating deployments;
- technically sophisticated users seeking public assurance;
- product and support engineers explaining an onchain transaction outcome.

Retail users are not the primary audience for the assurance engine.

## Core jobs to be done

### Record production state

When a release is deployed or a periodic check runs, produce a block-hash-pinned report comparing versioned expected state with independently observed RPC state.

The report must answer:

- what was checked;
- why the predicate matters;
- expected versus observed values;
- exact evidence and freshness;
- result and limitations;
- how to reproduce it.

### Detect and explain drift

Given two reports or one report plus a manifest, identify:

- implementation and bytecode changes;
- role-holder and timelock changes;
- contract dependency rewiring;
- bridge peer, library, DVN, or rate-limit changes;
- oracle and collateral-configuration changes;
- newly unknown, stale, conflicting, or violated assertions.

An authorized upgrade is drift, not automatically an exploit. A pause is an operational state, not automatically a protocol failure.

### Rehearse a proposed transition

Given unsigned transaction calldata or a Safe/timelock bundle:

1. pin a finalized block;
2. identify target implementations by runtime code hash;
3. decode using only the ABI pinned to that identity;
4. simulate execution;
5. calculate relevant before/after state;
6. rerun affected assertions;
7. report blocking findings, warnings, unknowns, and limitations.

Aegis never requests private keys, signs, or broadcasts.

### Rewind a real sequence

Given an evidence bundle, reconstruct a deterministic event tape using block, transaction, and log identities plus explicit causal edges.

Counterfactual controls create a separate model run. They never modify the factual timeline or claim an incident "would have been prevented."

## Product surfaces

### Record: Assurance report

The completed default screen is the Protocol Atlas, with domain navigation for Stake, crosschain, Liquid, Cash, governance, and operator/AVS exposure. The first fully implemented and default hero instrument is the directed Ethereum and OP route. It should identify the target and evidence boundary immediately:

```text
ether.fi production assurance
Ethereum finalized block 25,577,369
OP finalized block 154,496,611
Manifest weeth-crosschain@e30c859 / route-policy@sha256:...
```

Selecting a direction opens its assurance matrix. The matrix contains falsifiable claims, not a risk score. Each row shows:

- claim identifier and category;
- expected source;
- observed source;
- current value and guardrail;
- freshness;
- result state;
- evidence access.

The page also supports:

- reciprocal-route comparison;
- a topology coverage matrix with unsupported routes still visible;
- current report versus prior report;
- current report versus intended manifest;
- configuration-change tape;
- explicit uncovered surfaces;
- export and CLI reproduction.

As additional evidence families pass their roadmap gates, the atlas adds them through the same report and evidence-drawer schema. A domain without verified coverage stays visible as unsupported; it is never filled with placeholder metrics.

### Rehearse: Transaction preflight

The engineering-first preflight accepts:

- chain ID;
- sender;
- target;
- calldata;
- value;
- optional Safe or timelock batch;
- finalized or explicit block reference;
- manifest version.

It returns:

- recognized or unknown implementation identity;
- decoded intent;
- simulation success, revert, unsupported, or unavailable state;
- touched contracts and configuration;
- before/after semantic delta;
- affected assertions;
- policy findings;
- unmodeled effects.

The interface must never say "safe to sign." Preferred wording is:

> Simulation succeeded at finalized block N. No encoded blocking findings were found. Future prices, ordering, offchain behavior, and later upgrades were not modeled.

Supported Liquid and Cash modes may explain policy, rebalance, onchain spend-capacity, and collateral effects, but they must not forecast returns or claim to predict processor or issuer authorization.

### Rewind: Incident and change replay

The replay workbench shows:

- immutable observed events;
- source chain, block, transaction, and log index;
- explicit causal edges;
- state deltas;
- assertions changing state;
- operations affected;
- evidence provenance;
- separately labeled modeled alternatives.

The first replay should be narrow and evidence-rich, such as a bridge-hardening sequence, a production upgrade, or a documented withdrawal stress period.

### Shared evidence drawer

The same assertion opens the same evidence view everywhere. It contains:

- what the assertion protects;
- exact predicate and evaluator version;
- contract, implementation, method, and calldata;
- applicable observation boundary: execution block/hash/finality, consensus slot/root/finality, or content-addressed source snapshot and retrieval time;
- expected-manifest source and commit;
- decoded and raw observed values;
- raw-response cryptographic hash;
- provider agreement and freshness;
- limitations;
- result hash;
- one-command reproduction.

This shared drawer is the product's central interaction, not secondary detail.

## Provenance classes

Every datum is labeled independently:

- **Observed public state:** obtained from an identified provider at an identified execution block or consensus slot/root.
- **Observed external attribution:** obtained from a content-addressed, timestamped source snapshot under a reviewed source policy.
- **Deployment-bound code property:** derived from observed runtime bytecode plus source/ABI that has been bound to that exact code identity.
- **Reviewed research rationale:** a pinned audit, source tree, specification, or test that supports predicate design but does not by itself establish a live deployed property.
- **Declared configuration:** expected value from a versioned manifest, governance proposal, or release artifact.
- **Derived result:** output of a versioned evaluator over named inputs.
- **Reference scenario:** deterministic fixture used for tests or demonstrations.
- **Modeled counterfactual:** alternate outcome produced under explicit assumptions.

The interface must never silently promote recorded, modeled, or stale evidence into current public state.

## Result states

Canonical verification states for falsifiable predicates:

- `pass`: all mandatory evidence exists, is acceptably fresh, agrees across required providers, and satisfies the predicate;
- `fail`: mandatory evidence, including the required quorum for a critical conclusion, falsifies the predicate;
- `unknown`: mandatory evidence is missing or unsupported;
- `stale`: evidence exists but violates freshness policy;
- `conflict`: required sources disagree;
- `not_applicable`: the assertion does not apply to the target deployment or transaction.

Presentation may use friendlier labels such as Holding or Violated, but exported reports use the canonical states.

Neutral observed or derived facts use a separate availability vocabulary:

- `available`: the displayed fact was reproducibly acquired or calculated at the cited boundary;
- `partial`: a value is available for only the explicitly quantified covered population;
- `unknown`: mandatory evidence or a trustworthy derivation is unavailable;
- `stale`: the evidence violates its applicable freshness policy;
- `conflict`: required sources disagree;
- `not_applicable`: the fact does not apply to the selected scope.

Facts such as an account value, attribution edge, top-N share, or HHI never return `pass` or `fail`. `available` is a neutral evidence state, not a green health verdict. Missing evidence can never improve a verification to `pass` or make fact coverage appear complete.

Manifest/source-policy trust is another independent axis: `trusted`, `untrusted`, or `invalid`. An untrusted custom policy is useful for isolated analysis but makes policy-dependent verifications `unknown`; it cannot create or replace a canonical live verdict. An invalid policy is not evaluated.

## UX principles

- Open as a working instrument, not a marketing landing page.
- State the protocol, observation boundaries, manifest/source policy, and coverage before showing results.
- Prefer exact claims over aggregate health language.
- Use progressive disclosure: consequence first, reproduction beneath it.
- Never use color as the only status signal.
- Preserve user input after errors.
- Display absolute timestamps with relative time as secondary copy.
- Make uncertainty visible and useful.
- Avoid generic Web3 imagery, token-price charts, TVL charts, and decorative activity feeds.
- Do not add an AI chat surface unless every answer is grounded in deterministic report evidence and the chat solves a demonstrated workflow.

## Hiring-ready five-minute demonstration

1. Open the live Ethereum and OP directed-route topology at named finalized blocks.
2. Select one direction and expand code identity, peer, library, or DVN evidence through raw calls and the expected manifest commit.
3. Run an intentionally broken fork with one wrong implementation, peer, default library, or missing DVN; show only affected claims failing.
4. Inject provider disagreement and show the route becoming `conflict`, never pass.
5. Rehearse one public unsigned proposal or exact pre-transaction reconstruction of one historical Safe/timelock execution and inspect its predicted before and after route controls.
6. Rewind one real configuration change from transaction to affected assertion.
7. Export the canonical bundle and reproduce its hash from the CLI.

The strongest moment is Aegis becoming visibly uncertain when a provider fails or disagrees.

## Non-goals

Aegis does not:

- prove protocol safety or solvency;
- replace formal verification, audits, bug bounties, or internal monitoring;
- predict or prevent exploits;
- infer whether an authorized signer is malicious or compromised;
- verify private card-processor, issuer, KYC, fraud, or backend-service behavior;
- guarantee the eventual outcome of a preflighted transaction;
- claim an atomic crosschain snapshot;
- collapse unrelated contract, governance, bridge, operational, and account risks into one score;
- broadcast transactions or custody keys;
- claim endorsement by ether.fi;
- become a general wallet portfolio command center;
- recommend APY, vault, operator, route, or collateral allocations;
- produce Monte Carlo forecasts or composite operator risk scores as product truth;
- infer route safety from liquidity, traffic, or the absence of alerts.

## Public-data boundary

With public information, Aegis can verify bytecode, proxy implementations, public configuration, roles, timelocks, onchain events, balances, allowances, oracle outputs, bridge configuration, and transaction simulation.

It cannot observe private monitoring signals, card authorization webhooks, issuer policy, fraud decisions, internal deployment intent not published in a manifest, signer-device security, or unpublished runbooks. Those surfaces must be labeled uncovered rather than inferred.

## Current implementation versus target product

The current deployed prototype is the interaction shell and executable product hypothesis. It includes deterministic fixtures, simplified Cash arithmetic, an authored replay, and current chain-head context.

It is not the assurance system described above. In particular:

- control observations are not yet read from production contracts;
- expected and observed implementation identity are not independent;
- preflight does not accept or simulate real calldata;
- replay is not derived from indexed logs;
- report identifiers are not cryptographic;
- no durable indexer, provider quorum, or reorg invalidation exists.

These limitations are intentional documentation of the starting point, not accepted final behavior. Current implementation status does not affect project selection; it determines only the next roadmap gate. The Ethereum and OP route is the first block-hash-bound vertical proof of the shared engine, while the fully featured target remains the multi-domain Protocol Flight Recorder defined above.

## Hiring-ready route acceptance criteria

The first intermediate release is satisfied only when:

- a new engineer can identify the target protocol and evidence boundary within 30 seconds;
- the default screen is a live, directed Ethereum and OP route topology rather than a generic health dashboard;
- every mandatory cell in the engineering spec's `ROUTE-ETH-OP-v1` matrix passes in both directions against real finalized-block data;
- both route directions expose each matrix cell, evidence, and optional/unsupported coverage independently;
- one assertion can be reproduced from raw RPC through CLI, API, CI, and web with the same report hash;
- a deliberately corrupted configuration creates a precise failure;
- a provider failure or disagreement creates uncertainty rather than a false pass;
- one real transaction bundle is simulated and produces a semantic before/after diff;
- one real route or implementation change is reconstructed from immutable evidence;
- every exported claim includes limitations;
- the default production surface contains no invented healthy values.

Passing this gate makes Aegis a strong hiring artifact. It does not complete the selected product.

## Finished product acceptance criteria

The selected product direction is complete only when:

- Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS exposure each have real, reviewed, public-data coverage rather than decorative placeholder views;
- every domain plugs into the same observation-boundary, manifest/source-policy, evidence, canonicalization, report, and coverage contracts; predicates use verification states and neutral facts use availability states;
- Record continuously retains reproducible state and material configuration changes across all supported domains;
- Rehearse contains real supported workflows for governance/upgrades, route controls, Liquid policies or rebalances, and Cash configuration or account effects;
- Rewind reconstructs at least one real supported change/history in each of Stake/core, crosschain, Liquid, Cash, governance, and operator/AVS exposure, preserving ABI or source epochs, detecting gaps, and handling reorg/snapshot supersession;
- the counterfactual lab produces deterministic, separately labeled artifacts with explicit model bounds;
- operator/AVS exposure metrics always disclose subset/bound semantics, attribution, denominator, and source completeness and never become a composite risk score;
- the web Protocol Atlas, CLI, API, CI, scheduled monitor, and exported bundles render or transport the same canonical engine output;
- one domain adapter can be added through documented interfaces without changing renderer verdict logic;
- every enabled assertion or fact has the applicable expected-state/source-policy provenance, real observation coverage, limitations, and adversarial fixtures;
- no surface presents forecasts, recommendations, offchain Cash behavior, private operational state, or universal safety claims as observed fact;
- a clean clone can reproduce representative real reports and the complete deterministic failure suite.
