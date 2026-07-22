# Project Selection Decision

Status: accepted
Decision date: 2026-07-21

## Decision

Continue building Aegis. Do not replace it with a portfolio dashboard, generalized risk score, Monte Carlo optimizer, or consumer analytics application.

The first hiring-ready release is narrowed and positioned as:

> **Aegis: ether.fi Change Assurance and weETH Route Readiness**

It combines Aegis's evidence discipline with the strongest product and visual idea from the alternatives: a live, directed crosschain route instrument.

## Context

The original Aegis direction was compared with five alternative full-stack concepts:

1. restaking risk surface and operator intelligence;
2. unified Stake, Liquid, and Cash portfolio command center;
3. Liquid vault strategy analyzer and Monte Carlo simulator;
4. Cash spend intelligence and collateral optimizer;
5. weETH crosschain liquidity and health monitor.

The comparison was made for one specific objective: earn respect from ether.fi engineers and produce a credible mid-level hiring signal while using AI agents heavily for implementation.

Difficulty and code volume were not selection constraints. The relevant constraints were whether the result would be useful, ether.fi-specific, visibly full-stack, falsifiable, defensible in an interview, and resistant to looking like generated dashboard slop.

## Evaluation criteria

- **Engineering depth:** meaningful backend, data, chain, protocol, reliability, and frontend work.
- **Five-minute legibility:** a reviewer can see why the product exists without reading the repository first.
- **Claim defensibility:** the product can explain why its inputs and conclusions mean what it says they mean.
- **AI-assisted ownership:** the owner can defend a bounded set of architecture and domain decisions rather than every generated line.
- **Ether.fi specificity:** the project depends on real ether.fi topology and workflows rather than branding a generic product.
- **Growth clarity:** a non-protocol stakeholder can explain the value to another person.
- **Data feasibility:** required facts are public, attributable, and reproducible.
- **Slop resistance:** visual polish cannot hide mocked inputs, arbitrary scores, or unjustified models.

## Comparative assessment

| Direction | Engineering depth | Demo impact | Defensibility | Primary weakness | Decision |
| --- | --- | --- | --- | --- | --- |
| Aegis target | Exceptional | Strong | Exceptional | The current implementation is still fixture-driven | Keep as the core |
| Crosschain monitor | Strong | Strong | Strong when limited to observable controls | "Health" can become vague; liquidity and optimal routing add unrelated claims | Absorb into Aegis |
| Operator intelligence | Strong | Strong | Medium | Operator attribution, correlation, insurance, uptime proxies, and risk scoring require difficult assumptions | Consider later as facts-only exposure context |
| Unified portfolio | Medium | Exceptional | Strong for balances, weaker for recommendations | Common wallet-dashboard pattern; easy to dismiss as API aggregation | Do not make the primary project |
| Cash optimizer | Medium | Exceptional | Low to medium | Card authorization and settlement are offchain; "optimal" collateral requires market and preference assumptions | Keep only exact onchain capacity as a later Rehearse view |
| Vault Monte Carlo | Strong computation | Strong | Low | A correct engine can still implement an unjustified market model with false precision | Replace with policy and rebalance verification if pursued |

## Key judgment

Aegis has the strongest technical thesis:

```text
reviewed expected state
          +
finalized independent observations
          |
          v
versioned pure predicates
          |
          v
typed uncertainty and limitations
          |
          v
one canonical report rendered by CLI, API, CI, and web
```

This creates an honest ownership boundary for AI-assisted engineering. Agents can accelerate adapters, schemas, tests, and UI implementation. The project owner remains responsible for:

- which claims are made;
- why the selected evidence supports those narrow claims;
- finality and provider policy;
- implementation and ABI identity;
- expected-state provenance;
- failure semantics;
- explicit exclusions;
- adversarial release gates.

Correct code proves that a computation was implemented correctly. It does not prove that an operator risk score measures risk, a Monte Carlo regime models the future, an APY comparison is economically complete, or a collateral recommendation is suitable. Aegis exposes those non-code judgments instead of hiding them behind a polished result.

## Strongest synthesis

The initial product is not a generic protocol-health matrix. Its hero experience is a directed Ethereum and OP weETH route topology backed by the shared Aegis engine.

### Record

At identified finalized blocks, display both route directions and verify:

- proxy and runtime code identity;
- reciprocal peers and endpoint identifiers;
- explicit send and receive libraries;
- required DVN membership and threshold;
- pause state and relevant owner, delegate, or role configuration;
- pairwise inbound and outbound rate-limit policy;
- provider agreement, freshness, manifest version, and coverage.

The topology is an evidence navigator. It does not label a route "safe" and does not add token price, APY, TVL, or decorative traffic data.

### Rehearse

Load one public unsigned Safe/timelock proposal or reconstruct one public historical execution at its parent block and show:

- code-identity-aware calldata decoding;
- exact pinned-state simulation boundary;
- semantic before and after route configuration;
- affected assertions;
- blocking findings, warnings, uncertainty, expiry, and limitations.

A historical artifact is labeled `retrospective_rehearsal`. Its receipt and observed post-state are used only after Aegis hashes its prediction, preventing execution results from leaking into the predicted delta.

### Rewind

Index one real route or implementation configuration change and show:

- block, transaction, caller, and executor;
- before and after values;
- affected directed routes and assertions;
- reorg-aware event identity;
- explicit causal relationships without implying atomic crosschain order.

### Failure proof

The public demonstration must also include:

- a local fork or deterministic fixture with one wrong peer, library, DVN, limit, or implementation;
- only the predicates affected by that corruption failing;
- an injected provider timeout producing incomplete evidence;
- injected provider disagreement producing `conflict`;
- the same canonical report hash through CLI, API, and web.

## The implementation gate

The target design is stronger than the alternative ideas. The current milestone 0 implementation is not.

A genuinely live implementation of the standalone crosschain monitor or operator-intelligence concept would be a stronger hiring artifact than a fixture-only Aegis. Therefore:

> No additional page, animation, modeled scenario, invariant card, or prose counts as meaningful completion until one real block-hash-bound vertical slice works end to end.

The minimum hiring-ready Aegis is:

1. real code identity;
2. one real bidirectional Ethereum and OP route;
3. one real configuration change reconstructed from evidence;
4. one public unsigned proposal or exact retrospective Safe/timelock rehearsal at pre-execution state;
5. one deliberately broken fork;
6. one provider-conflict demonstration;
7. reproducible CLI, API, and web report identity.

## Ideas adopted from the alternatives

- A directed topology and visible coverage matrix as the landing instrument.
- Configuration and exposure history as a first-class time series.
- A durable, reorg-aware index rather than repeated RPC-only page loads.
- Clear loading, stale, missing, conflict, partial, and provider-failure states.
- Shareable content-addressed report permalinks.
- An institutional-style export and before/after digest that Growth, auditors, and integrators can share.
- Operational consequences explained above raw evidence without weakening the underlying claim.
- Later, facts-only operator and AVS exposure context with source completeness.
- Later, an exact "spend capacity at block N" Cash explainer using the same Rehearse engine.
- Later, Liquid vault role, module, Merkle-policy, Accountant, queue, and rebalance verification rather than return forecasting.

## Ideas explicitly rejected or deferred

- universal protocol, route, operator, or account risk scores;
- "safe route," "safe to sign," or "would have prevented" language;
- APY forecasts and projected equity curves as product truth;
- rebalancing or collateral recommendations;
- Monte Carlo output presented as a decision recommendation;
- insurance status without contract- and policy-level evidence;
- offchain Cash authorization, issuer, processor, fraud, or settlement conclusions;
- an all-products command center before the bridge and governance slice is real;
- broad chain coverage before Ethereum and OP survive the full adversarial test suite;
- optimal-route claims without complete fee, liquidity, delay, failure, and bridge-semantics models.

## Growth narrative

The portfolio and Cash alternatives are easier to understand immediately, so Aegis must not require a security engineer to explain its value.

The public narrative is:

> Aegis provides public, reproducible proof of what ether.fi deployed, what changed, and what a proposed configuration transaction would do.

The shareable artifact is not a generic dashboard screenshot. It is a stable evidence report that can support release verification, governance review, incident triage, integration review, auditor handoff, and public security communication.

## Consequences

### Positive

- The first release is visually legible without becoming generic.
- Backend, protocol, indexing, simulation, reliability, and frontend work form one coherent system.
- The failure demo is as important as the success demo.
- The owner can defend the project through a small set of consequential decisions.
- Future Stake, Liquid, Cash, operator, and wider bridge coverage extend the same evidence model.

### Negative

- The release cannot claim completeness after only a polished UI or code-identity check.
- Supporting two route directions correctly is more valuable than showing many shallow chains.
- Growth-oriented portfolio features remain deferred even if they are visually attractive.
- Every new assertion requires domain research, independent expected-state provenance, and negative fixtures.

## Reconsideration triggers

Revisit this decision only if:

- authoritative expected configuration for a real route cannot be sourced independently;
- public providers cannot supply the historical or finalized evidence required for a reproducible report;
- ether.fi removes or materially replaces the relevant bridge control surface;
- a domain reviewer demonstrates that the selected predicates do not support their narrow claims;
- a narrower facts-only operator or vault-policy workflow exposes substantially better public evidence and direct operational value.

Absent one of those conditions, finish the live bridge and governance slice before expanding or changing project direction.
