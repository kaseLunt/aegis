# Aegis Product Specification

Status: canonical product direction
Version: 1.0
Updated: 2026-07-21

## One-sentence definition

Aegis records what ether.fi's safety-critical contracts were configured to do at an exact finalized block, explains what changed, and simulates proposed transactions against the same independently verifiable assertions.

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
- Cash dependency wiring, collateral policy, price providers, and account state;
- public deployment manifests, verified source, audits, and documented hardening work.

Aegis does not assume ether.fi lacks internal monitoring. Its value is independent reproducibility, public-state evidence, intended-versus-deployed comparison, and a coherent engineering interface over information that is otherwise fragmented.

The [source and provenance register](SOURCE_REGISTER.md) records the official research basis for these choices and, critically, what each source cannot prove.

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

The default screen should identify the target immediately:

```text
ether.fi production assurance
Ethereum finalized block 25,577,369
OP finalized block 154,496,611
Manifest core@b4a0968 / cash-v3@247faab
```

The primary matrix contains falsifiable claims, not a risk score. Each row shows:

- claim identifier and category;
- expected source;
- observed source;
- current value and guardrail;
- freshness;
- result state;
- evidence access.

The page also supports:

- current report versus prior report;
- current report versus intended manifest;
- configuration-change tape;
- explicit uncovered surfaces;
- export and CLI reproduction.

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

A secondary Cash-member mode may explain onchain spend capacity and collateral effects, but it must not claim to predict processor or issuer authorization.

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
- chain, block number, block hash, and finality;
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

- **Observed public state:** obtained from an identified provider at an identified block hash.
- **Code property:** derived from pinned source, ABI, bytecode, or an audited specification.
- **Declared configuration:** expected value from a versioned manifest, governance proposal, or release artifact.
- **Derived result:** output of a versioned evaluator over named inputs.
- **Reference scenario:** deterministic fixture used for tests or demonstrations.
- **Modeled counterfactual:** alternate outcome produced under explicit assumptions.

The interface must never silently promote recorded, modeled, or stale evidence into current public state.

## Result states

Canonical engine states:

- `pass`: all mandatory evidence exists, is acceptably fresh, agrees across required providers, and satisfies the predicate;
- `fail`: adequate evidence falsifies the predicate;
- `unknown`: mandatory evidence is missing or unsupported;
- `stale`: evidence exists but violates freshness policy;
- `conflict`: required sources disagree;
- `not_applicable`: the assertion does not apply to the target deployment or transaction.

Presentation may use friendlier labels such as Holding or Violated, but exported reports use the canonical states.

Missing evidence can never improve a result to `pass`.

## UX principles

- Open as a working instrument, not a marketing landing page.
- State the protocol, chains, blocks, and manifest before showing results.
- Prefer exact claims over aggregate health language.
- Use progressive disclosure: consequence first, reproduction beneath it.
- Never use color as the only status signal.
- Preserve user input after errors.
- Display absolute timestamps with relative time as secondary copy.
- Make uncertainty visible and useful.
- Avoid generic Web3 imagery, token-price charts, TVL charts, and decorative activity feeds.
- Do not add an AI chat surface unless every answer is grounded in deterministic report evidence and the chat solves a demonstrated workflow.

## Five-minute demonstration

1. Open a current report verified at named finalized blocks.
2. Expand one passing bridge or implementation assertion to raw calls and the expected manifest commit.
3. Run an intentionally broken fixture or fork with one wrong implementation, default library, or missing DVN; show only affected claims failing.
4. Preflight a real Safe or timelock bundle and inspect before/after configuration.
5. Replay one evidence-derived sequence, then run a separately labeled counterfactual.
6. Export the canonical bundle and reproduce its hash from the CLI.

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
- claim endorsement by ether.fi.

## Public-data boundary

With public information, Aegis can verify bytecode, proxy implementations, public configuration, roles, timelocks, onchain events, balances, allowances, oracle outputs, bridge configuration, and transaction simulation.

It cannot observe private monitoring signals, card authorization webhooks, issuer policy, fraud decisions, internal deployment intent not published in a manifest, signer-device security, or unpublished runbooks. Those surfaces must be labeled uncovered rather than inferred.

## Current prototype versus target product

The current deployed prototype is the interaction shell and executable product hypothesis. It includes deterministic fixtures, simplified Cash arithmetic, an authored replay, and current chain-head context.

It is not the assurance system described above. In particular:

- control observations are not yet read from production contracts;
- expected and observed implementation identity are not independent;
- preflight does not accept or simulate real calldata;
- replay is not derived from indexed logs;
- report identifiers are not cryptographic;
- no durable indexer, provider quorum, or reorg invalidation exists.

These limitations are intentional documentation of the starting point, not accepted final behavior.

## Product acceptance criteria

The product direction is satisfied only when:

- a new engineer can identify the target protocol and evidence boundary within 30 seconds;
- at least five ether.fi-specific assertions execute against real finalized-block data;
- one assertion can be reproduced from raw RPC through CLI, API, and web with the same report hash;
- a deliberately corrupted configuration creates a precise failure;
- a provider failure or disagreement creates uncertainty rather than a false pass;
- one real transaction bundle is simulated and produces a semantic before/after diff;
- one replay is constructed from immutable evidence;
- every exported claim includes limitations;
- the default production surface contains no invented healthy values.
