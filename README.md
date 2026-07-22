# Aegis — Protocol Flight Recorder

Aegis is an independent, evidence-first verifier for onchain financial systems. It is a focused engineering prototype built around ether.fi's public architecture and safety doctrine.

> Observe state. Test intent. Reconstruct impact.

Aegis does not connect a wallet, request keys, sign transactions, or broadcast user intent. It separates public state, code properties, and reference scenarios instead of presenting every successful check as a live safety guarantee.

## Canonical specification

The repository now distinguishes the current prototype from the full production target. Start with the [documentation index](docs/README.md), then use these documents as the design contract:

- [Product specification](docs/PRODUCT_SPEC.md) - users, Record/Rehearse/Rewind workflows, evidence language, scope, and acceptance criteria.
- [Threat model](docs/THREAT_MODEL.md) - trust boundaries, failure semantics, forbidden inferences, and adversarial tests.
- [Engineering specification](docs/ENGINEERING_SPEC.md) - target architecture, domain model, manifests, providers, finality, APIs, CLI, and verification strategy.
- [Source and provenance register](docs/SOURCE_REGISTER.md) - official research inputs, evidentiary limits, and the backlog required before live claims.
- [Delivery roadmap](docs/ROADMAP.md) - milestone 0 prototype status, several-engineer-week target scope, and objective exit gates.
- [Interview brief](docs/INTERVIEW_BRIEF.md) - an honest technical narrative and the decisions the project owner should be able to defend.

The current application is a working prototype, not the completed assurance platform described by those specifications. It becomes the finished project only when the roadmap's final definition of done passes.

## Current prototype surfaces

- **Protocol health** evaluates seven falsifiable controls and exposes the exact expression, inputs, evidence anchors, result hash, and limitations behind each result.
- **Transaction preflight** models Direct Pay and Borrow Mode with fixed-point arithmetic, stale-oracle handling, funding boundaries, collateral stress, and a deterministic decision trace.
- **Incident replay** presents an authored reference scenario for the documented oracle-staleness/public-fallback sequence and reruns it under explicit counterfactual policy inputs. It is not indexed ether.fi history.

The shared evidence drawer ties the three experiences together: a control can be observed in the matrix, tested through a proposed state transition, and followed through a causal replay.

## Current prototype trust contract

The current prototype uses five presentation states: `holding`, `advisory`, `violated`, `unknown`, and `stale`. The target engine replaces that vocabulary with the six canonical states defined in the [product specification](docs/PRODUCT_SPEC.md#result-states): `pass`, `fail`, `unknown`, `stale`, `conflict`, and `not_applicable`. `holding` maps to `pass`, `violated` maps to `fail`, and `unknown`/`stale` remain unchanged. `advisory` becomes severity or policy metadata rather than a truth state; `conflict` and `not_applicable` are added explicitly.

- Missing or stale evidence cannot become a green result.
- A passing assertion proves only its encoded predicate at its stated observation boundary.
- Recorded data never silently becomes public state when an RPC is unavailable.
- Counterfactual output is stored separately from the immutable reference scenario.
- Token and currency arithmetic uses integer fixed-point values, not floating point.

The default control suite deliberately uses narrow claims: local weETH wrapper-share backing rather than whole-protocol solvency; implementation identity rather than “safe contract”; quorum geometry rather than broad oracle health.

## Current prototype architecture

```text
app/
  api/health/       Ethereum + OP chain-head context with explicit fallback
  api/preflight/    Strictly validated transition evaluation
  api/replay/       Deterministic counterfactual runs
components/
  aegis-dashboard   Connected, accessible three-mode instrument
data/manifests/     Versioned blocks, commits, and deployments
lib/aegis/
  canonical         Stable JSON and report identifiers
  fixtures          Recorded inputs and evidence sources
  invariants        Pure protocol-control evaluation
  preflight         BigInt state-transition engine
  replay            Injected-clock causal model
tests/
  aegis-engine      Determinism, boundary, property, and trust-language tests
```

The UI is server-rendered with vinext/React. Route handlers are deployable to Cloudflare Workers. Core evaluators are pure TypeScript; only the health adapter performs external I/O.

## Reference state

[`data/manifests/etherfi-reference-v1.json`](data/manifests/etherfi-reference-v1.json) pins:

- Ethereum block `25,577,369` and OP Mainnet block `154,496,611`
- ether.fi core commit `b4a0968`, Cash v3 commit `247faab`, and crosschain commit `e30c859`
- representative proxy and implementation addresses for core staking and Cash v3

The demonstration control values are deterministic fixtures. Current chain heads provide context only and do not upgrade those fixture values into production telemetry.

## Verification

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The test suite includes property checks for backing failures, positive-rebase boundaries, spend-capacity enforcement, fixed-point borrow arithmetic, stale evidence, deterministic reports, and causal timing.

## Current prototype API

```text
GET  /api/health
POST /api/preflight
POST /api/replay
```

Every report includes an engine version, source mode, generated time, evidence limitations, and a deterministic report hash.

## Scope and limitations

This is a portfolio prototype, not an audit, monitoring service, or transaction-safety warranty. The preflight surface models Cash semantics but does not yet run `eth_call` against production contracts. The health adapter currently fetches chain heads, while verifier inputs remain pinned and reproducible. The next production step would add code-hash-pinned ABI decoding, finalized-block multicalls, conflict-aware provider quorum, and raw RPC response hashes.

The project is not affiliated with ether.fi.
