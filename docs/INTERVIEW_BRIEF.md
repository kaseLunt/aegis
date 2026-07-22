# Aegis Interview Brief

Status: owner narrative and defense guide
Last updated: 2026-07-21

## The honest headline

Aegis is an independent protocol flight recorder designed around ether.fi. It records safety-critical public configuration at exact finalized blocks, reconstructs how that state changed, and rehearses supported proposed transactions against the same explicit invariants.

The current repository contains a strong deterministic prototype and the specification for the production evidence pipeline. Do not present target features as implemented until their roadmap exit gates pass.

## Thirty-second pitch

> Ether.fi exposes meaningful safety properties onchain, but verifying them currently requires contract-specific knowledge, careful historical RPC reads, and a disciplined distinction between intended and observed state. I built Aegis to make that verification reproducible. It records narrow invariants at exact blocks, rewinds configuration changes, and rehearses proposed transactions. Every answer carries its evidence and limitations; missing or conflicting data can never turn green.

## Two-minute technical explanation

> The system has one pure assurance engine and three workflows: Record, Rehearse, and Rewind. A versioned manifest defines expected policy. Independent RPC adapters acquire observed evidence at one block hash. Code identity is resolved before ABI selection. Pure invariant evaluators return typed states rather than a universal score. Reports are canonicalized and content-addressed, then rendered identically through a CLI, API, and web UI. Rehearse simulates exact transaction material at pinned state, derives supported post-state changes, and reruns the affected invariants. Rewind adds a reorg-aware event index and explicit causal edges. Recorded facts and counterfactual output never share a provenance class.

## Why ether.fi specifically

This project is not a generic dashboard with an ether.fi logo. Ether.fi is a good fit because the public system has consequential, inspectable control surfaces:

- upgradeable contracts whose implementation identity matters;
- staking and withdrawal accounting boundaries;
- oracle quorum and rebase constraints;
- Cash collateral, oracle, and spend-cap configuration;
- weETH crosschain routes with LayerZero libraries, DVNs, roles, pause state, and pairwise rate limits.

Those surfaces create a real operational question: does production match the configuration engineers believe they deployed, and what will a proposed change do to that assertion set?

## The value, even if ether.fi never adopts it

Aegis demonstrates a reusable engineering capability: turning protocol-specific security claims into narrow, reproducible, evidence-backed checks. An ether.fi engineer should recognize value in a faster post-deployment verification, Safe-review, incident-triage, or auditor-handoff workflow even if the team prefers its internal tooling.

The hiring signal is the quality of the boundaries:

- expected state and observed state have independent provenance;
- all reads belong to one identified block;
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
6. proxy and ABI identity rules;
7. report canonicalization and reproducibility;
8. what preflight does not model;
9. how factual, declared, derived, and counterfactual data are separated;
10. which tempting checks were excluded because they would overclaim.

That is a realistic ownership boundary for an AI-assisted engineer: implementation was accelerated with agents, while the product contract, threat model, domain predicates, architecture, and validation gates received direct human judgment and review.

## Do not bluff about AI assistance

A good answer is direct:

> I used AI agents heavily for implementation throughput, test generation, research organization, and critique. I treated their output like contributions from a fast, untrusted team: explicit interfaces, small review surfaces, deterministic tests, independent evidence, and adversarial fixtures. I personally owned the claims the software makes, the threat model, the architecture, and the release gates. Here are the failures I injected to test those decisions.

This is stronger than pretending every line was typed manually. The proof of competence is that you can explain the important system behavior, reproduce a result, diagnose a failure, and change the design safely.

## Five-minute live demo

### 0:00-0:45 - Establish the contract

Open Record on a supported Ethereum/OP target. Say exactly what the selected invariant claims and point to source mode, finalized block hash, manifest, engine version, coverage, and report hash.

### 0:45-1:45 - Follow evidence

Open the evidence drawer for code identity or DVN quorum. Show address, method, raw-result hash, decoded value, expected value, provider agreement, block identity, derivation, and limitations. Follow one explorer or source link to demonstrate that the UI is not its own authority.

### 1:45-2:30 - Break it deliberately

Run a recorded fixture with an unexpected implementation or removed DVN. Then inject provider disagreement. The first should fail the narrow predicate; the second should become `conflict`, never pass.

### 2:30-3:40 - Rehearse

Load a supported Safe transaction. Show code-identity-aware decoding, exact simulation boundary, predicted configuration diff, affected invariants, expiry, and explicit non-guarantees.

### 3:40-4:35 - Rewind

Open one real configuration change or incident bundle. Select an event, show its causal parents and provenance, then enable a counterfactual policy. Emphasize that the factual timeline did not change.

### 4:35-5:00 - Reproduce

Export the canonical report, run the equivalent CLI command, and show the same hash. Close with one unsupported property visible in the coverage matrix.

## Likely questions and defensible answers

### Why not just use a block explorer or Dune?

Explorers expose transactions and state; Dune is strong for indexed analytics. Aegis adds a reviewed expected-state manifest, implementation-aware decoding, block-consistent multi-provider evidence, typed uncertainty, deterministic predicate evaluation, transaction preflight, and content-addressed reports. It is an assurance workflow, not a charting layer.

### Why is the manifest trustworthy?

It is not assumed to be truth. It is a versioned declaration of expected policy with source, review, applicability, and hash. Aegis keeps it independent from observed state and shows disagreements. A future signed-manifest process can strengthen authorship, but it still cannot prove the policy was wise.

### Why require two RPC providers?

One provider failure should not create a false positive. Agreement reduces ordinary lag and corruption risk, while disagreement becomes `conflict`. It does not create Byzantine certainty because providers may share infrastructure; that residual risk is explicit.

### What happens during a reorg?

Evidence and caches are keyed by block hash, not just height. If canonicality changes, the old artifact is preserved as superseded, conclusions are retracted from current state, and evaluation runs against the replacement block. Finalized state is the default for durable claims.

### How do you choose an ABI?

Resolve the proxy pattern and implementation first, hash runtime bytecode, then select an ABI registered for that code identity. If the identity is unknown, Aegis can report raw evidence but refuses semantic decoding.

### How can expected and observed values be independent?

Expected values come from a reviewed, pinned manifest and cited sources; observed values come from block-bound RPC reads. Fixture refresh cannot silently rewrite the manifest. A report exposes both provenance chains.

### Does a pass mean the protocol is safe?

No. It means mandatory evidence was available and one displayed predicate held at one identified boundary. Coverage, exclusions, and unsupported predicates remain visible.

### Why no aggregate risk score?

The underlying risks have different units, evidence quality, and consequence. Collapsing them creates false precision and hides unknowns. Aegis optimizes for falsifiable assertions that an engineer can inspect.

### What does preflight miss?

Future state, transaction ordering, private order flow, signer compromise, future prices, unmodeled external calls, provider behavior, and offchain systems. The result expires when its state boundary is no longer applicable.

### How do you order crosschain events?

Display can sort by timestamp for navigation, but inference uses explicit causal edges such as message origin, verification, and destination execution. Aegis does not claim one atomic clock across chains.

### How would you add another invariant?

Define its narrow claim, units, applicability, expected source, mandatory observations, pure evaluator, limitations, and negative cases. Add recorded evidence before enabling live mode. The renderer consumes the generic result schema and should need no verdict logic.

### What was hardest?

The hardest problem is epistemic, not visual: preventing stale, conflicting, declared, or modeled information from being presented as observed truth. That decision shapes the schema, provider policy, caching, result states, tests, and interface.

### What would you do differently with more time?

Increase independent review of each protocol predicate, add local-fork tracing for sensitive Safe batches, strengthen manifest signing and review workflows, and expand route coverage only after the first two routes remain reliable under adversarial provider tests.

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

1. `docs/PRODUCT_SPEC.md` - the user and product contract;
2. `docs/THREAT_MODEL.md` - what results can and cannot mean;
3. `docs/ENGINEERING_SPEC.md` - schemas, boundaries, and target architecture;
4. one invariant and its adversarial fixture;
5. canonical report generation;
6. one renderer using the shared schema;
7. `docs/ROADMAP.md` - honest implementation status and exit gates.

Avoid starting with component code. The important story is evidence becoming a constrained claim.

## Resume language

### Accurate today

> Built and deployed a deterministic TypeScript prototype for an ether.fi-focused protocol flight recorder, including evidence-oriented health checks, fixed-point transaction modeling, causal incident replay, canonical report hashes, property tests, and a production architecture and threat model.

### Use only after the final definition of done passes

> Built Aegis, an evidence-first TypeScript protocol flight recorder that verifies ether.fi configuration at finalized blocks, performs implementation-aware transaction preflights, and deterministically replays incident counterfactuals with reorg-safe caching, provenance, and adversarial tests.

## The desired interview reaction

The best result is not, "this has many features." It is:

> This person understands how to make a security-adjacent tool honest, knows what Ethereum evidence can and cannot prove, can design a complete backend-to-frontend system, and can use AI assistance without surrendering engineering ownership.
