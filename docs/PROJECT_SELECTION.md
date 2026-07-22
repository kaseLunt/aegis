# Project Selection Decision

Status: accepted
Decision date: 2026-07-21

## Decision

Build the fully featured Aegis Protocol Flight Recorder. Do not replace it with a portfolio dashboard, generalized risk score, Monte Carlo optimizer, or consumer analytics application.

The finished product is:

> **Aegis: an independent Record, Rehearse, and Rewind workbench for ether.fi's Stake, crosschain, Liquid, Cash, governance, and operator/AVS control and exposure surfaces.**

The Ethereum and OP weETH route is the first production-grade vertical slice and the five-minute hero demonstration. It is not the definition or ceiling of Aegis.

## Comparison boundary

This decision compares each idea as a completed, high-quality product at its intended scope. Current repository status, elapsed build time, and milestone progress are intentionally excluded from selection scoring. Status is recorded in the [delivery roadmap](ROADMAP.md) and clearly labeled repository status sections.

The question is not whether today's Aegis prototype is better than somebody else's finished application. The question is which finished system would create the strongest ether.fi-specific engineering signal and remain defensible under serious technical review.

## Context

The Aegis direction was compared with five alternative full-stack concepts:

1. restaking risk surface and operator intelligence;
2. unified Stake, Liquid, and Cash portfolio command center;
3. Liquid vault strategy analyzer and Monte Carlo simulator;
4. Cash spend intelligence and collateral optimizer;
5. weETH crosschain liquidity and health monitor.

The objective is to earn respect from ether.fi engineers and produce a credible mid-level hiring signal while using AI agents heavily for implementation.

Difficulty and code volume are not selection constraints. The relevant constraints are whether the completed result is useful, ether.fi-specific, visibly full-stack, falsifiable, defensible in an interview, and resistant to looking like generated dashboard slop.

## Evaluation criteria

- **Engineering depth:** meaningful backend, data, chain, protocol, reliability, and frontend work.
- **Five-minute legibility:** a reviewer can see why the product exists without reading the repository first.
- **Claim defensibility:** the product can explain why its inputs and conclusions mean what it says they mean.
- **AI-assisted ownership:** the owner can defend a bounded set of architecture and domain decisions rather than every generated line.
- **Ether.fi specificity:** the project depends on real ether.fi topology and workflows rather than branding a generic product.
- **Growth clarity:** a non-protocol stakeholder can explain the value to another person.
- **Data feasibility:** required facts are public, attributable, and reproducible.
- **Slop resistance:** visual polish cannot hide mocked inputs, arbitrary scores, or unjustified models.

## Completed-product assessment

Ratings describe the intended finished implementation. For slop resistance, a higher rating is better.

| Direction | Depth | Demo | Defensibility | AI ownership | Ether.fi specificity | Growth clarity | Data feasibility | Slop resistance | Primary completed-product risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Aegis Protocol Flight Recorder | Exceptional | Exceptional | Exceptional | Exceptional | Exceptional | Strong | Strong | Exceptional | Integrating and validating sources and predicates across six families without diluting claim semantics or review quality | Build as the core |
| Crosschain monitor | Strong | Strong | Strong | Strong | Exceptional | Strong | Strong | Strong | "Health" can become vague; liquidity and optimal routing add unrelated claims | Absorb route topology and history into Aegis |
| Operator intelligence | Strong | Strong | Medium | Medium | Strong | Strong | Medium | Medium | Attribution, correlation, insurance, uptime proxies, and risk scoring require difficult assumptions | Absorb facts-only exposure context into Aegis |
| Unified portfolio | Medium | Exceptional | Medium | Strong | Strong | Exceptional | Strong | Low | Common wallet-dashboard pattern; recommendations outgrow balance evidence | Do not make it the primary project |
| Cash optimizer | Medium | Exceptional | Low | Medium | Exceptional | Exceptional | Low | Low | Card authorization and settlement are offchain; "optimal" collateral requires market and preference assumptions | Absorb exact onchain capacity and transaction effects, not optimization |
| Vault Monte Carlo | Strong | Strong | Low | Medium | Strong | Strong | Medium | Low | A correct engine can still implement an unjustified market model with false precision | Absorb policy and rebalance verification, not return forecasting |

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

This creates an honest ownership boundary for AI-assisted engineering. Agents can accelerate adapters, schemas, tests, indexers, and UI implementation. The project owner remains responsible for:

- which claims are made;
- why the selected evidence supports those narrow claims;
- finality and provider policy;
- implementation and ABI identity;
- expected-state provenance;
- failure semantics;
- explicit exclusions;
- adversarial release gates.

Correct code proves that a computation was implemented correctly. It does not prove that an operator risk score measures risk, a Monte Carlo regime models the future, an APY comparison is economically complete, or a collateral recommendation is suitable. Aegis exposes those non-code judgments instead of hiding them behind a polished result.

## Fully featured product scope

The completed system is one evidence platform, not a collection of unrelated dashboards.

### Shared evidence engine

Every domain uses the same versioned manifests/policies, typed observation-boundary contract, evidence schema, pure evaluators, canonical report hash, and coverage language. Falsifiable predicates use the six verification states; neutral facts and metrics use a separate availability/coverage contract and can never render as a green safety verdict. Onchain observations are bound to finalized block hashes, consensus-layer observations to finalized slots/roots, and external attribution to content-addressed source snapshots. Implementation-aware ABIs and provider quorum apply where the evidence type requires them. The web application never invents a verdict that the engine did not produce.

### Record

The Protocol Atlas continuously records and explains:

- **Stake and core:** implementation identity, weETH local wrapper backing, withdrawal escrow, oracle quorum, positive-rebase bounds, timelocks, roles, and documented operational state;
- **Crosschain:** directed route topology, peers, endpoint IDs, send/receive libraries, DVNs, thresholds, confirmations, pause controls, roles, and pairwise rate limits;
- **Liquid:** BoringVault identities and wiring, authority and module relationships, Manager Merkle-policy commitments, decoded independently supplied/sourced action proofs with corpus coverage, Accountant bounds, queue configuration, pause roles, and supported rebalance effects;
- **Cash:** contract wiring, collateral and borrow configuration, oracle dependencies, account state, and exact onchain spend-capacity or collateral effects at a cited block;
- **Governance:** Safe, timelock, role, implementation, policy, and configuration history across the other domains;
- **Operator and AVS exposure:** observed validator-to-operator-to-AVS relationships, attribution completeness, source coverage, attributed-subset and explicitly bounded top-N/HHI concentration where the population permits it, and change history without a composite risk score.

Scheduled verification creates an append-only configuration history, explicit drift findings, coverage gaps, and optional webhook/CI notifications. Aegis reports only the public surfaces it can actually observe.

### Rehearse

The same engine evaluates proposed or exactly reconstructed actions before describing their consequences:

- upgrades and role changes;
- bridge peer, library, DVN, and limit changes;
- Safe and timelock batches;
- Liquid policy, module, queue, and supported rebalance changes;
- Cash collateral, oracle, configuration, and supported account-state effects.

Rehearse provides a pinned-state simulation, semantic before/after diff, affected assertions, expiry conditions, unsupported effects, and limitations. It never says `safe to sign`, recommends an allocation, or broadcasts a transaction.

### Rewind

A durable, reorg-aware index reconstructs real implementation, configuration, governance, route, policy, and exposure changes. It preserves ABI epochs, missing-range detection, block and log identity, causal edges, checkpoint reconciliation, and content-addressed incident bundles.

### Counterfactual lab

Versioned, deterministic models can test bounded questions against immutable evidence, such as how a different rate cap, pause delay, allowed-chain set, or governance timing would have changed a recorded sequence. Modeled artifacts remain separate from factual history and never become market forecasts or claims that an exploit would have been prevented.

### Product surfaces

- a web Protocol Atlas spanning all supported ether.fi domains;
- focused Record, Rehearse, Rewind, and counterfactual workbenches;
- evidence drawers and content-addressed report permalinks;
- a CLI for local reproduction and release checks;
- an HTTP API for integrations;
- CI policies and scheduled drift monitoring;
- exportable before/after, incident, and coverage bundles.

## First vertical slice and hero demo

The directed Ethereum and OP weETH route is built first because one coherent slice exercises code identity, multi-chain finality, provider disagreement, expected-state manifests, change indexing, governance rehearsal, adversarial forks, and a visually legible topology.

It must demonstrate all three workflows:

### Record

At identified finalized blocks, display both route directions and verify code identity, peers, endpoint IDs, explicit libraries, DVNs, pause/control roles, rate limits, provider agreement, freshness, manifest version, and coverage.

### Rehearse

Load one public unsigned Safe/timelock proposal or reconstruct one canonical public historical execution transaction. For a retrospective, fork its parent block, replay the target block's earlier canonical transaction prefix, and execute the target statefully. Show code-identity-aware decoding, the exact simulation boundary, semantic before/after state, affected assertions, uncertainty, expiry, and limitations. If exact context or post-state execution is unavailable, the effect is indeterminate rather than inferred from ordinary `eth_call`.

A historical artifact is labeled `retrospective_rehearsal`. Its receipt and observed post-state are used only after Aegis hashes its prediction, preventing execution results from leaking into the predicted delta.

### Rewind

Index one real route or implementation configuration change with block, transaction, caller, executor, before/after values, affected routes and assertions, reorg-aware identity, and explicit crosschain causal relationships.

### Failure proof

The demonstration also includes a deliberately corrupted fork, provider timeout, provider disagreement, narrow affected-predicate failures, and identical canonical report hashes through CLI, API, and web.

This route slice is the first intermediate release gate. It proves the shared architecture before domain expansion; it does not reduce the selected product to a bridge monitor.

## Ideas adopted from the alternatives

- Directed topology, visible coverage, and configuration history from the crosschain-monitor concept.
- Operator/AVS exposure graphs, attribution completeness, and factual concentration history from the operator-intelligence concept.
- A unified protocol atlas from the command-center concept, organized around engineering evidence rather than wallet balances.
- Exact onchain Cash capacity and proposed-action consequences without offchain authorization claims.
- Liquid vault role, module, Merkle-policy, Accountant, queue, and rebalance inspection without return forecasting.
- Interactive what-if controls implemented as versioned counterfactual models with explicit assumptions.
- Durable indexing, strong partial/failure states, shareable reports, and institutional-style exports across all domains.

These are planned parts of the finished product. Their later position in the roadmap is an implementation-order choice, not a judgment that they lack value.

## Ideas explicitly rejected

- universal protocol, route, operator, vault, or account risk scores;
- `safe route`, `safe to sign`, or `would have prevented` language;
- APY forecasts and projected equity curves presented as product truth;
- rebalancing, route, operator, or collateral recommendations;
- Monte Carlo output presented as a decision recommendation;
- insurance status without contract- and policy-level evidence;
- offchain Cash authorization, issuer, processor, fraud, or settlement conclusions;
- optimal-route claims without complete fee, liquidity, delay, failure, and bridge-semantics models.

These features are rejected because their conclusions are hard to justify, not because they are difficult to code.

## Growth narrative

The public narrative is:

> Aegis provides public, reproducible evidence for supported ether.fi deployments and attributed exposure, shows how those observed surfaces changed, and explains what a supported proposed onchain action would do.

The shareable artifact is not a generic dashboard screenshot. It is a stable evidence report that can support release verification, governance review, incident triage, integration review, auditor handoff, and public security communication.

The bridge topology makes the idea legible in five minutes. The full Protocol Atlas demonstrates that the underlying engine is a reusable product, not a one-off route visualization.

## Consequences

### Positive

- Backend, protocol research, indexing, simulation, reliability, and frontend work form one coherent system.
- The finished product incorporates the strongest observable parts of all five alternatives.
- The failure demo is as important as the success demo.
- The owner can defend shared system rules plus the exact predicates, source boundaries, and limitations activated in each domain, without memorizing every generated implementation line.
- Each new domain extends the same evidence model rather than creating another disconnected app.

### Negative

- Every evidence family needs its own domain review, source provenance, adapters, and adversarial fixtures.
- The atlas can become visually and conceptually noisy unless coverage and claim categories remain explicit.
- Multi-domain completion is substantially larger than the intermediate route release.
- The product must resist pressure to turn factual context into simplistic scores or recommendations.

## Reconsideration triggers

Revisit the domain order or a specific evidence family if:

- authoritative expected configuration cannot be sourced independently;
- public providers cannot supply reproducible historical or finalized evidence;
- ether.fi materially replaces the relevant control surface;
- a domain reviewer demonstrates that a predicate does not support its narrow claim;
- another facts-only workflow exposes substantially better public evidence and operational value.

Those conditions may change sequencing or coverage. They do not revive a comparison between a partially implemented Aegis and a completed alternative.
