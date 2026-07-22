# Aegis Threat Model

Status: target security contract
Version: 1.0
Last updated: 2026-07-21

## Purpose

Aegis is a read-only assurance engine. It compares independently observed public chain state with narrow predicates and a versioned expected-state manifest. It can also replay recorded changes and simulate supported proposed transactions.

The primary asset is not money or signing authority. It is the integrity of the answer: a reviewer must be able to tell what Aegis observed, what it expected, how it derived a result, and what it could not know.

Aegis does not prove that ether.fi, a bridge, or a transaction is safe. It proves only that the evidence attached to a report did or did not satisfy the displayed predicate at the displayed observation boundary.

## Assets to protect

1. **Claim integrity** - a result cannot be stronger than its evidence.
2. **Evidence integrity** - raw responses, block identity, decoded values, and derivations remain attributable and reproducible.
3. **Manifest integrity** - expected values are versioned, reviewable, and independent from observed values.
4. **Temporal integrity** - reports do not blend values from different blocks while presenting them as one state.
5. **Mode integrity** - observed facts, recorded fixtures, declared configuration, derived facts, and modeled counterfactuals stay visibly distinct.
6. **Availability of uncertainty** - missing, stale, conflicting, or unsupported evidence remains visible instead of being coerced into a pass.
7. **User intent privacy** - preflight input is not logged or transmitted beyond documented providers without explicit consent.

## System boundaries

```text
 manifest authors / reviewed sources
              |
              v
      expected-state manifest ------+
                                     |
 RPC provider A ----+                v
 RPC provider B ----+--> acquisition --> canonical evidence --> invariant engine
 archive/indexer ---+                       |                     |
                                             v                     v
                                      replay / simulation ----> report artifact
                                                                    |
                                                        CLI / API / web renderer
```

The following are outside Aegis's trust boundary:

- RPC providers and their transport;
- block explorers and labels;
- third-party source repositories;
- official prose descriptions of intended behavior;
- ABIs that have not been bound to verified runtime code identity;
- browser extensions and the user's local machine;
- Safe signers, governance participants, relayers, DVNs, or other offchain operators;
- external monitoring, custodian, issuer, card, banking, or settlement systems.

The renderer is not a source of truth. A valid report must remain inspectable and hash-verifiable without the web application.

## Actors and failure sources

A threat need not be malicious. Aegis treats operational mistakes and incomplete information as first-class failure sources.

- a Byzantine, censored, lagging, or misconfigured RPC provider;
- a chain reorganization or disagreement about finality;
- a malicious or stale manifest author;
- an authorized but dangerous governance action;
- a compromised admin or signer key;
- an unexpected proxy implementation, beacon, clone, or ABI epoch;
- a decoder, arithmetic, evaluator, or canonicalization defect;
- incomplete log history or a provider silently truncating queries;
- cache poisoning or reuse across chain IDs, block hashes, manifests, or engine versions;
- a simulation that diverges from eventual execution;
- a user who interprets `pass` as a universal safety guarantee;
- a UI defect that hides coverage gaps or blends modeled and observed data;
- malicious calldata, revert data, token metadata, or other untrusted chain-controlled strings;
- server-side request forgery through caller-selected RPC or source URLs;
- denial of service, provider rate limits, or partial multicall failure.

## Core assumptions

- Ethereum and each supported chain eventually provide a usable finalized state under their documented consensus model.
- At least one configured provider can return honest evidence. Critical positive findings require agreement from at least two administratively independent providers.
- The reviewed manifest represents a declared policy, not ground truth. A manifest can be wrong even when correctly signed and hashed.
- Public contract state cannot reveal undisclosed intent, secret compromise, or private operational systems.
- `eth_call` is a state-bound execution model, not a guarantee of ordering, inclusion, gas conditions, future prices, or later state.
- Crosschain observations have causal relationships but no universally atomic global order.

## Result semantics

Aegis uses six result states:

- `pass` - all mandatory evidence was available and the predicate held.
- `fail` - all mandatory evidence was available and the predicate did not hold.
- `unknown` - required evidence or a trustworthy derivation was unavailable.
- `stale` - evidence was valid but outside the declared freshness policy.
- `conflict` - required sources disagreed on block identity or value.
- `not_applicable` - the predicate does not apply to this target or action.

`unknown`, `stale`, and `conflict` are successful failure handling, not degraded forms of `pass`. Presentation code must not collapse them into a reassuring aggregate.

## Threats, controls, and residual risk

| Threat | Failure mode | Required control | Residual risk |
| --- | --- | --- | --- |
| Provider equivocation | False state or false block identity | Pin chain ID, block number, and block hash; compare independent providers; hash raw responses | Multiple providers may share infrastructure or a common upstream defect |
| Provider lag | Old state presented as current | Report provider head, finalized head, observation age, and freshness policy | A chain can be live while a specific archive method is unavailable |
| Reorganization | A previously valid report points to noncanonical state | Key caches by block hash; recheck canonicality; preserve and supersede reorged artifacts | Finality models differ by chain and can fail under consensus faults |
| Partial RPC failure | Empty or zero values become a pass | Typed per-call errors; no default substitution; mandatory evidence yields `unknown` | Provider bugs can return syntactically valid but wrong values |
| Manifest poisoning | Observed state is compared with attacker-selected expectations | Content-addressed manifests, source attribution, review history, validity window, explicit environment | A reviewed policy may still encode the wrong intent |
| Circular verification | Expected values are copied from the same read being checked | Separate acquisition paths and provenance classes for expected and observed values | Independent public sources can still originate from the same erroneous deployment |
| Proxy or ABI mismatch | Calls decode successfully against the wrong implementation | Resolve implementation and runtime code hash before selecting a code-hash-scoped ABI | Metamorphic or unusual proxy patterns require explicit adapters |
| Log gaps | Rewind omits a material change | Detect range gaps, overlap queries, bind logs to block hashes, reconcile derived state with direct checkpoints | Providers may share incomplete historical data |
| Arithmetic defect | Financial boundaries are evaluated incorrectly | Integer arithmetic, explicit units, checked conversions, boundary and property tests | Predicate design can be economically incomplete even when arithmetic is correct |
| Cache contamination | Evidence from another chain or manifest is reused | Cache key includes chain ID, block hash, request, manifest hash, and engine version | Application-layer caches outside Aegis can still serve stale artifacts |
| Simulation divergence | Rehearse result is treated as execution guarantee | Exact sender/target/calldata/value; pinned state; visible expiry; explicit exclusions | Mempool ordering, future state, external calls, and offchain behavior remain uncertain |
| Authorized unsafe action | Governance changes a critical value within its authority | Compare before/after state and policy; never infer safety from authorization | Aegis cannot determine social intent or stop execution |
| Signer compromise | Malicious but validly signed action | Decode and evaluate observable effects; surface signer and executor evidence | Aegis cannot identify compromise before behavior becomes observable |
| Counterfactual confusion | Modeled result is reported as historical fact | Immutable factual layer; separate model layer; visible inputs and constrained verdict language | Users can still quote a result without its assumptions |
| Renderer misrepresentation | UI omits limitations or provenance | Schema-required evidence and limitations; renderer conformance tests; JSON export | Screenshots can detach a finding from its context |
| Untrusted rendered data | Contract metadata or revert data injects markup or misleading content | Treat all chain and provider strings as untrusted; escape output; apply a strict content security policy | A compromised frontend can still alter what a user sees |
| Caller-selected endpoint | Public API is used to probe internal network resources | Server-controlled provider and source allowlists; reject arbitrary RPC URLs; bound redirects | CLI users remain responsible for local endpoints they configure |
| Denial of service | No report is produced | Bounded retries, provider health, cached finalized artifacts, explicit partial failure | Availability is not guaranteed during broad provider or chain outages |

## Forbidden inferences

The following shortcuts are specifically prohibited unless a future predicate supplies the missing evidence:

- `getTotalPooledEther()` or a similar accounting value is not proof of reserves.
- Local weETH wrapper-share backing is not proof of whole-protocol solvency.
- A matching runtime code hash is not proof that a contract is bug-free or safe.
- A paused contract is not, by itself, evidence of an exploit or policy breach.
- An implementation change is not, by itself, evidence of malicious behavior.
- A deployed OFT endpoint is not proof that a route is active or correctly configured in both directions.
- Deep liquidity, recent message traffic, or the absence of alerts is not proof that a route's security configuration matches policy.
- A route-control `pass` does not prove the messaging provider, destination chain, sequencer, or settlement assumptions are safe.
- A published four-of-four DVN description is not live configuration until the relevant contracts are decoded at an identified block.
- A liquidatable account is not, by itself, a protocol failure.
- Exchange-rate monotonicity cannot be assumed across a permitted negative rebase.
- A transaction authorized by governance is not necessarily intended, prudent, or safe.
- Public chain state cannot prove the health of Cash card processors, custodians, issuers, banks, or settlement systems.
- Absence of a finding means only that implemented checks found no violation within their declared coverage.

## Preflight privacy and safety

- Aegis never requests a seed phrase, private key, or signing permission.
- The default preflight path accepts public transaction material only and does not broadcast it.
- Server logs must exclude calldata and Safe payload bodies by default; debug logging requires an explicit local mode.
- A remote RPC can learn the exact simulated call. The UI and CLI must disclose that boundary before sending a private proposal.
- Future local-fork execution should be offered for sensitive, pre-publication governance payloads.
- Any remediation transaction is an exported proposal and must use a separate, explicit authorization path. Aegis itself remains read-only.

## Required adversarial tests

The production claim set is not complete until automated tests cover at least:

1. a stale provider;
2. two providers returning different block hashes;
3. two providers returning different values at the same claimed block;
4. a one-block reorganization and cache invalidation;
5. a missing log range;
6. an expired or inapplicable manifest;
7. an unexpected proxy upgrade;
8. an ABI/code-hash mismatch;
9. a reverted or malformed oracle read;
10. one failed element in a multicall;
11. a preflight invalidated by an intervening state change;
12. a renderer attempting to hide `unknown`, `stale`, or `conflict`;
13. factual and modeled replay events being mixed;
14. a reciprocal peer becoming asymmetric;
15. an explicit library reverting to inherited default configuration;
16. one required DVN being removed or its threshold reduced;
17. report reproduction with byte-identical canonical JSON.

## Disclosure policy

If Aegis reveals a plausible security-sensitive production mismatch, the public demo should not become the disclosure channel. Preserve the block-hash-bound evidence, validate through an independent path, avoid active exploitation or state-changing probes, and use the protocol's published security contact or bug-bounty process.

This document is reviewed whenever a new chain, provider class, invariant family, simulation capability, or privileged integration is added.
