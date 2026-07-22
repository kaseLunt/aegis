# Aegis Interview Brief

Status: owner narrative and defense guide
Last updated: 2026-07-21

## The honest headline

Aegis is an independent protocol flight recorder and change-assurance workbench for ether.fi's Stake, crosschain, Liquid, Cash, governance, and operator/AVS control and exposure surfaces. It binds execution state to finalized block hashes, consensus state to finalized slots/roots, and external attribution to content-addressed source snapshots, then reconstructs change and rehearses supported proposed transactions against the same explicit assertions.

The Ethereum and OP weETH route is the first complete vertical slice and five-minute hero demonstration, not the whole product. The current repository contains a deterministic prototype and the specification for the production evidence pipeline. Do not present target features as implemented until their roadmap exit gates pass.

## Thirty-second pitch

> I built Aegis as an independent protocol flight recorder for ether.fi. One evidence engine records deployed Stake, crosschain, Liquid, Cash, governance, and operator/AVS state, rewinds real changes, and rehearses supported proposals. Onchain facts carry exact blocks; external attribution carries content-addressed source snapshots. Every answer exposes derivation, coverage, and limitations, and missing or conflicting data can never turn green. The Ethereum and OP weETH route is the first end-to-end demonstration of that larger system.

## Two-minute technical explanation

> The system has one pure assurance engine and three workflows: Record, Rehearse, and Rewind. A versioned manifest defines expected policy. Independent RPC adapters acquire observed evidence at one block hash. Code identity is resolved before ABI selection. Pure invariant evaluators return typed states rather than a universal score. Reports are canonicalized and content-addressed, then rendered identically through a CLI, API, and web UI. Rehearse simulates exact transaction material at pinned state, derives supported post-state changes, and reruns the affected invariants. Rewind adds a reorg-aware event index and explicit causal edges. Recorded facts and counterfactual output never share a provenance class.

## Why ether.fi specifically

This project is not a generic dashboard with an ether.fi logo. Ether.fi is a good fit because the public system has consequential, inspectable control surfaces:

- upgradeable contracts whose implementation identity matters;
- staking and withdrawal accounting boundaries;
- oracle quorum and rebase constraints;
- Cash collateral, oracle, and spend-cap configuration;
- Liquid vault wiring, policy commitments, accounting bounds, queues, and supported rebalance actions;
- weETH crosschain routes with LayerZero libraries, DVNs, roles, pause state, and pairwise rate limits.
- public validator, operator, AVS, authority, and exposure relationships with completeness stated relative to a declared source snapshot and population denominator.

Those surfaces create a real operational question: does production match the configuration engineers believe they deployed, and what will a proposed change do to that assertion set?

The first vertical slice answers that question through the most legible surface: one real, bidirectional Ethereum and OP weETH route. The completed Protocol Atlas extends the same engine across Stake/core, wider routes, Liquid, Cash, governance, and factual operator/AVS exposure. Their later delivery order protects the shared evidence contract; it does not remove them from the selected product.

## The value, even if ether.fi never adopts it

Aegis demonstrates a reusable engineering capability: turning protocol-specific security claims into narrow, reproducible, evidence-backed checks. An ether.fi engineer should recognize value in a faster post-deployment verification, Safe-review, incident-triage, or auditor-handoff workflow even if the team prefers its internal tooling.

The hiring signal is the quality of the boundaries:

- expected state and observed state have independent provenance;
- all onchain reads in an evaluation belong to an explicit execution-block or consensus-state boundary, while external attribution uses a cited content-addressed snapshot;
- provider disagreement is a visible result, not an implementation detail;
- ABI decoding follows verified code identity;
- replay respects reorgs and crosschain causal ambiguity;
- simulation never becomes an execution guarantee;
- the UI exposes limitations next to findings.

## What you should personally own

You do not need to memorize or defend every generated line. You do need to own the decisions that make the system trustworthy:

1. the exact claim made by every invariant;
2. why the selected observations are sufficient for that narrow claim;
3. where expected values came from;
4. finality and provider-quorum policy;
5. `pass`, `fail`, `unknown`, `stale`, `conflict`, and `not_applicable` semantics;
6. why neutral facts use availability/coverage states instead of pass/fail;
7. proxy and ABI identity rules;
8. report canonicalization and reproducibility;
9. what preflight does not model;
10. how factual, declared, derived, and counterfactual data are separated;
11. which tempting checks were excluded because they would overclaim.

That is a realistic ownership boundary for an AI-assisted engineer: implementation was accelerated with agents, while the product contract, threat model, domain predicates, architecture, and validation gates received direct human judgment and review.

## Do not bluff about AI assistance

A good answer is direct:

> I used AI agents heavily for implementation throughput, test generation, research organization, and critique. I treated their output like contributions from a fast, untrusted team: explicit interfaces, small review surfaces, deterministic tests, independent evidence, and adversarial fixtures. I personally owned the claims the software makes, the threat model, the architecture, and the release gates. Here are the failures I injected to test those decisions.

This is stronger than pretending every line was typed manually. The proof of competence is that you can explain the important system behavior, reproduce a result, diagnose a failure, and change the design safely.

## Five-minute hero demo

The route demo is intentionally the fastest way to understand Aegis. A deeper reviewer tour follows the same report, evidence, and history contracts into the other completed domains.

### 0:00-0:45 - Establish the contract

Open the directed Ethereum and OP topology. Select one direction, say exactly what its assertions claim, and point to source mode, finalized block hashes, manifest, engine version, coverage, and report hash.

### 0:45-1:45 - Follow evidence

Open the evidence drawer for code identity or DVN quorum. Show address, method, raw-result hash, decoded value, expected value, provider agreement, block identity, derivation, and limitations. Follow one explorer or source link to demonstrate that the UI is not its own authority.

### 1:45-2:30 - Break it deliberately

Run a local fork or recorded fixture with an unexpected implementation, wrong peer, default library, or removed DVN. Then inject provider disagreement. The first should fail only the affected predicates; the second should become `conflict`, never pass.

### 2:30-3:40 - Rehearse

Load a public unsigned Safe proposal or one canonical historical execution reconstructed by forking its parent block and replaying the target block's earlier transaction prefix. Show code-identity-aware decoding, stateful execution, exact simulation boundary, predicted configuration diff, affected invariants, expiry, and explicit non-guarantees. For a retrospective case, show that the prediction hash existed before the separate actual-result comparison.

### 3:40-4:35 - Rewind

Open one real route or implementation configuration change. Show its transaction, initiator, executor, before and after values, affected route edges, assertion transitions, and evidence provenance.

### 4:35-5:00 - Reproduce

Export the pinned evidence bundle, reproduce it offline with the CLI, and show the same hash. Explain that a fresh independent acquisition may agree semantically while producing its own evidence artifact and hash. Close with one unsupported property visible in the coverage matrix.

After the counterfactual milestone, an extended demo may add a separately labeled bounded policy run. It is not part of the intermediate route-release gate.

## Likely questions and defensible answers

### Why not just use a block explorer or Dune?

Explorers expose transactions and state; Dune is strong for indexed analytics. Aegis adds a reviewed expected-state manifest, implementation-aware decoding, block-consistent multi-provider evidence, typed uncertainty, deterministic predicate evaluation, transaction preflight, and content-addressed reports. It is an assurance workflow, not a charting layer.

### Why not build a crosschain health monitor?

The directed topology deliberately borrows the monitor's immediate legibility, but "health" is too vague for the conclusion. Aegis states exactly which peer, library, DVN, role, or limit matched which reviewed expectation at which block. It also reconstructs configuration changes and rehearses proposed ones using the same assertions. Liquidity, traffic, and lack of alerts cannot silently become a safety verdict.

### If Aegis is broader, why start with one bridge route?

The route is a dependency-rich proof, not a scope compromise. It forces the system to solve chain-scoped code identity, multi-chain finality, provider conflict, directed policy, versioned manifests, reorg-aware history, governance rehearsal, adversarial forks, and a legible topology in one slice. Once those contracts survive review, Stake, Liquid, Cash, governance, and operator/AVS adapters can reuse them instead of becoming separate dashboards with inconsistent semantics.

### Why is the manifest trustworthy?

It is not assumed to be truth. It is a versioned declaration of expected policy with source, review, applicability, and hash, authenticated for the default production view by a deployment-configured approved hash/release root or reviewer-signature threshold. Caller-supplied custom manifests are labeled untrusted and cannot replace the canonical live verdict. Aegis keeps policy independent from observed state and shows disagreements. Authentication still cannot prove the policy was wise.

### Why require two RPC providers?

One provider should not create either a false pass or a false critical failure. Matching independent evidence is required for both critical verdicts; disagreement becomes `conflict`, while a unilateral contradiction without quorum remains `unknown` with a provisional alert. This reduces ordinary lag and corruption risk but does not create Byzantine certainty because providers may share infrastructure; that residual risk is explicit.

### What happens during a reorg?

Evidence and caches are keyed by block hash, not just height. If canonicality changes, the old artifact is preserved as superseded, conclusions are retracted from current state, and evaluation runs against the replacement block. Finalized state is the default for durable claims.

### How do you choose an ABI?

Use the identity strategy declared in the reviewed manifest: direct code, EIP-1967/transparent/UUPS, beacon, minimal clone, or a separately reviewed adapter. Resolve the full indirection path, hash terminal runtime bytecode, then select an ABI registered for that identity. If the pattern or identity is unknown, Aegis can report raw evidence but refuses semantic decoding.

### How can expected and observed values be independent?

Expected values come from a reviewed, pinned manifest and cited sources; observed values come from block-bound RPC reads. Fixture refresh cannot silently rewrite the manifest. A report exposes both provenance chains.

### Does a pass mean the protocol is safe?

No. It means mandatory evidence was available and one displayed predicate held at one identified boundary. Coverage, exclusions, and unsupported predicates remain visible.

### Why no aggregate risk score?

The underlying risks have different units, evidence quality, and consequence. Collapsing them creates false precision and hides unknowns. Aegis optimizes for falsifiable assertions that an engineer can inspect.

### Why doesn't an operator concentration metric pass or fail?

HHI or top-N share is a neutral derived fact, not a policy verdict. Aegis reports its formula, inputs, units, source snapshot, population denominator, and unattributed coverage using availability states such as `available` or `partial`. With incomplete attribution it reports an attributed-subset value and only emits population bounds when the missing-mass and granularity assumptions are explicit. A separate reviewed predicate would be required to compare that fact with an explicit policy, and even then it would not prove operator competence, independence, insurance, or overall risk.

### What does preflight miss?

Future state, transaction ordering, private order flow, signer compromise, future prices, unmodeled external calls, provider behavior, and offchain systems. The result expires when its state boundary is no longer applicable.

### How do you order crosschain events?

Display can sort by timestamp for navigation, but inference uses explicit causal edges such as message origin, verification, and destination execution. Aegis does not claim one atomic clock across chains.

### How would you add another invariant?

Define its narrow claim, units, applicability, expected source, mandatory observations, pure evaluator, limitations, and negative cases. Add recorded evidence before enabling live mode. The renderer consumes the generic result schema and should need no verdict logic.

### What was hardest?

The hardest problem is epistemic, not visual: preventing stale, conflicting, declared, or modeled information from being presented as observed truth. That decision shapes the schema, provider policy, caching, result states, tests, and interface.

### What would you do differently with more time?

Increase independent review of every domain predicate, add local-fork tracing for sensitive Safe batches, strengthen manifest signing and review workflows, and improve attribution coverage. The roadmap already includes facts-only operator exposure, Liquid policy inspection, exact Cash capacity views, Stake/core verification, and wider routes; more time should deepen their evidence and adversarial coverage rather than add composite scores or recommendations.

## Subtle exclusions worth volunteering

These demonstrate domain judgment better than a long feature list:

- local wrapper backing is not whole-protocol solvency;
- an accounting getter is not proof of reserves;
- exchange-rate monotonicity can be invalid across an allowed negative rebase;
- a deployed bridge endpoint is not proof of an active bidirectional route;
- published DVN policy is not observed live configuration;
- a valid governance signature is not proof of sound intent;
- a preflight is not a guarantee of execution;
- offchain Cash settlement cannot be proven from public contracts.

## Repository tour

Use this order when sharing the code:

1. `docs/PROJECT_SELECTION.md` - why the finished multi-domain project wins and why the bridge is only the first slice;
2. `docs/PRODUCT_SPEC.md` - the user and product contract;
3. `docs/THREAT_MODEL.md` - what results can and cannot mean;
4. `docs/ENGINEERING_SPEC.md` - schemas, boundaries, and target architecture;
5. one route assertion and its adversarial fixture;
6. canonical report generation;
7. the directed topology consuming the shared schema;
8. `docs/ROADMAP.md` - honest implementation status and exit gates.

Avoid starting with component code. The important story is evidence becoming a constrained claim.

## Resume language

### Accurate today

> Built and deployed a deterministic TypeScript prototype for an ether.fi-focused protocol flight recorder, including evidence-oriented health checks, fixed-point transaction modeling, causal incident replay, canonical report hashes, property tests, and a production architecture and threat model.

### Use after the hiring-ready route gate passes

> Built Aegis, an evidence-first TypeScript assurance system that verifies ether.fi's bidirectional Ethereum and OP weETH route controls at finalized blocks, reconstructs configuration changes, and preflights Safe transactions with redundant RPC evidence, reorg-safe indexing, canonical reports, and adversarial fork tests.

### Use only after the final definition of done passes

> Built Aegis, an evidence-first TypeScript protocol flight recorder spanning ether.fi Stake, crosschain, Liquid, Cash, governance, and operator/AVS surfaces, with finalized multi-provider verification, implementation-aware preflights, reorg-safe history, bounded counterfactuals, and canonical reports shared by web, CLI, API, and CI.

## The desired interview reaction

The best result is not, "this has many features." It is:

> This person understands how to make a security-adjacent tool honest, knows what Ethereum evidence can and cannot prove, can design a complete backend-to-frontend system, and can use AI assistance without surrendering engineering ownership.
