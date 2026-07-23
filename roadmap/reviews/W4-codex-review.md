# W4 Codex senior review — findings and dispositions

Review run 2026-07-23 against a66837e (Codex session 019f8d60-130c-75a3-b98a-e4fd8ac09b06),
per the ratified senior-reviewer decision. Verdict: 4 P0 + 5 P1 + test-quality gaps;
not ready for the achieved stamp. Both ERC constants and the exact EIP-1167 pattern
decode were independently confirmed correct.

Discipline: every confirmed finding is reproduced as a failing test first, then fixed
(tests/w4-codex-fixes.test.ts unless noted).

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | P0 | Identity reads not bound to the pinned block hash; observe stamps `pinned.hash` onto observations (fabricated binding); reorg at same number can pass citing the wrong block | ACCEPTED — reads re-keyed by block hash (EIP-1898 request form `{blockHash}` in the recording canon); adapters take the pin, the envelope/key binds the hash, live adapters must use EIP-1898 (WR3-confirmed support) |
| 2 | P0 | `target.identityStrategy` never compared to `observed.identity.strategy`; resolved identity with zero reads passes | ACCEPTED — typed `strategy_mismatch` + `missing_observation_evidence` caller defects |
| 3 | P0 | `selectAbi` gated only on registry membership, not the manifest expectation | ACCEPTED — selection now requires the observed terminal hash to EQUAL `expectedRuntimeCodeHash` (spec: "selects an ABI only after the terminal runtime hash matches"); refusals: `manifest_mismatch`, `missing_expectation` |
| 4 | P0 | Length-only `hasCode` lets non-hex agreed code resolve through intermediate steps; malformed terminal/storage data escapes as exceptions; beacon decode accepts nonzero ABI padding | ACCEPTED — strict hex on every code read (typed `malformed_code_hex`); observe maps data-malformation errors to typed unknown with reads retained; beacon word decode requires zero-padded ABI `address` |
| 5 | P1 | Provider conflict collapsed into `observation_unresolved`; comparison has no `conflict` state | ACCEPTED — `ObservationUnavailable` carries `observation_conflict` vs `observation_unresolved`; comparison maps conflict to the canonical `conflict` state (never pass) |
| 6 | P1 | Beacon strategy skips the ERC-1967 rule that the logic slot must be empty before the beacon applies | ACCEPTED — beacon walk reads the implementation slot first; populated slot is typed `logic_slot_populated` (ambiguous identity, never resolved through the beacon) |
| 7 | P1 | Freshness `not_applicable` misused for an unassessed applicable predicate; manifest-side evidence optional | ACCEPTED — aggregate becomes `unknown` (assessed-never is not inapplicable); `manifestEvidenceId` is now required (typed `invalid_context`) so every verification carries expected-side provenance |
| 8 | P1 | Evidence refs insufficient to audit: slot omitted, response `capturedAt` replaced by caller context, `sourceMode` caller-labelable, no decoded value | ACCEPTED — storage reads carry the slot as `calldata`; `capturedAt` + `sourceMode` now travel from the adapter response (recorded envelope) through the observation into the ref; `decodedResult` carries the agreed value |
| 9 | P1 | Indirection path lost on unresolved reads and for `custom`; compare discards the structured path | ACCEPTED for resolution: `ObservationUnavailable` is caught inside resolve.ts at each read site, so unknown results retain the path walked so far; `custom` retains its root step. DECLINED for report composition: `Verification` is a spec-fixed canonical type — embedding a nonstandard `path` field would drift the schema; the retained path lives on the identity result and surfaces in reports as W5 composition scope (e.g. an EvidenceFact), recorded in the W4 handoff |
| T1 | P1 | No negative tests for the above classes | ACCEPTED — every fix lands with its failing test in tests/w4-codex-fixes.test.ts |
| T2 | P2 | Slot tests derive fixtures from the exported constants (self-referential) | ACCEPTED — literal ERC-1967 hex values asserted |
| T3 | P2 | Byte-mutation property covers only direct terminal code; conditional property can skip its assertion | ACCEPTED (narrow) — mutation coverage extended to intermediate reads via the malformed-data tests; full per-strategy property sweep deferred to the W5 composition suite |
| T4 | P2 | EIP-1167 rejection covers one wrong-length case, not same-length mutations | ACCEPTED — same-length prefix/suffix mutation tests added |

Non-finding notes: the reviewer confirmed quorum fan-out, administrative-domain
independence, non-agreed-value exclusion, independent expectation IDs, and
drift-requiring-review wording as correct. The reviewer's environment could not spawn
vitest (`spawn EPERM`); the 277/277 baseline is attested by EV-W3-R2 and re-verified at
disposition landing.

## Verification pass (2026-07-23, Codex session 019f8d80-2df6-7e53-93bd-5956dc9d5923)

Scoped re-review of the disposition diff (a66837e..885ce8e): findings 3, 4, 5, 6, 8, 9
CLOSED (incl. the finding-9 DECLINED rationale assessed as sound); F1, F2, F7 PARTIALLY
CLOSED with four high residuals — all accepted and fixed TDD same-day (8 more tests,
suite 305/305):

| Residual | Disposition |
|----------|-------------|
| F1: `{blockHash}` alone permits EIP-1898 serving a known-but-orphaned block (requireCanonical defaults false) | ACCEPTED — the read canon is `{blockHash, requireCanonical: true}` everywhere (recorded keys + live instruction); a noncanonical answer is a failed read, missing evidence. Boundary revalidation before report emission recorded as W5 composition scope |
| F2: the evidence gate accepted ANY nonempty evidence — conflicted/unrelated reads satisfied it | ACCEPTED — resolved identities require a coherent derivation transcript: every read quorum-agreed, read addresses ≡ path addresses, and the claimed terminal hash REPRODUCED from the transcript's terminal code read (typed `inconsistent_observation`) |
| F7a: pass emitted alongside freshness unknown | ACCEPTED — freshness is an evaluated INPUT: stale caps the state at `stale`, unassessed at `unknown`, only current/aging can pass or fail; typed limitations |
| F7b: manifestEvidenceId was format-checked only | ACCEPTED — the comparison takes the full manifest EvidenceRef bound to the trusted manifest hash (raw hash + snapshot hash both must equal it), emits it itself, and cites it in expectedEvidenceIds |

## Confirmation pass (2026-07-23, Codex session 019f8d9a-4468-76a2-8a9b-6c811b59f114)

Scoped to the four residual closures (885ce8e..5930a4f): F1 and F7b CONFIRMED; F2 and
F7a NOT CONFIRMED — each survived in a narrower shape. Both accepted and closed TDD
(5 more tests, suite 310/310):

| Survivor | Disposition |
|----------|-------------|
| F2: transcript values were hashed but never AUTHENTICATED against the quorum-committed raw hashes — forging agreedValue + the claimed hash together passed while the providers' raw hashes attested different code | ACCEPTED — every agreeing observation's rawResultHash must equal sha256(jcs(agreedValue)); the identity claim must then be REPRODUCED by re-running the pure derivation over the authenticated transcript with exact (canonical) equality |
| F7a: the claimed aggregate was trusted over its own assessments — "current" over stale or empty assessments passed | ACCEPTED — assessments are typed (policyId, boundary, state); the aggregate must equal the worst-of derivation; empty assessments can only ever be "unknown" |

Under [[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]] (convergence gate) the achieved stamp
remains blocked until a Codex pass returns clean at HEAD.

## Convergence pass 4 (2026-07-23, Codex session 019f8daf-a92f-7fb1-8418-d2ccabf6620d)

Scoped to the two survivor closures (5930a4f..7b804ba): both NOT CONFIRMED again, in
narrower shapes, plus one new medium — all accepted and fixed TDD (4 more tests, suite
314/314):

| Finding | Disposition |
|---------|-------------|
| F2: the recorded quorum verdict (outcome/agreeingProviders) was trusted — forged membership turned two-provider disagreement into a unilateral "agreement" | ACCEPTED — the applied QuorumPolicy travels in the comparison context and every read's quorum is RECOMPUTED from its observations with exact canonical equality required; contradictory duplicate request keys are rejected |
| F7a: `in`-operator membership accepted prototype-chain names ("toString", "__proto__") as freshness states, deriving an optimistic aggregate | ACCEPTED — own-property membership only (Object.hasOwn) for both states and the aggregate |
| NEW (medium): the worst-of ranking put stale above unknown, reversing ENGINEERING_SPEC §Freshness ("unknown outranks stale, which outranks aging, which outranks current") | ACCEPTED — rank reordered to the canonical precedence, verified against the spec text; mixed stale+unknown derives to unknown |

## Convergence pass 5 (2026-07-23, Codex session 019f8dbe-8d50-7bc1-adb5-2acc39851dcc)

Scoped to the three pass-4 closures (7b804ba..59b11e5): F7a and the freshness precedence
CONFIRMED; F2 NOT CONFIRMED a THIRD time — a relabeled observation clone (one provider's
authentic response re-tagged as a second provider/domain) still forged administrative
independence, because the comparator was authenticating a caller-supplied structural
object. Root-cause fix accepted (net −5 tests after consolidation; suite 309/309):

- The comparator now accepts ONLY observations produced by observeIdentity — a
  WeakSet provenance brand (mirroring the chain adapter's VERIFIED_BUNDLES idiom).
  A hand-built observation carries no brand and is refused (`unverified_observation`)
  BEFORE any independence logic runs. The provider/administrative-domain labels on a
  branded observation are exactly those observeIdentity read from the reviewed adapter
  configs — which is the established WR3/W3 independence trust boundary; authenticating
  them inside the comparator was the wrong layer and could never be complete (three
  passes of relabel-a-different-field proved it).
- Consequently the entire transcript-authentication apparatus built over passes 2–4
  (quorum recompute, raw-hash authentication, derivation replay, duplicate-key checks)
  was REMOVED: a branded observation is internally consistent by construction
  (its identity IS deriveIdentity over exactly its reads, each a quorum-agreement
  outcome). Less code, and the forgery class is closed at the source rather than chased
  field-by-field. Guard mutation-tested (removing it fails the relabeled-clone and
  hand-built-observation tests).

Methodology note: F2 recurred three times because each fix authenticated a forgeable
input instead of refusing forgeable inputs. The lesson (captured as an insight) — when
review keeps finding new forgery shapes against a validator, the validator is at the
wrong layer; make the input unforgeable (provenance) instead.

## Convergence pass 6 (2026-07-23, Codex session 019f8dd9-585e-7ba2-a363-7a184d7c0853)

WeakSet mechanics and the F7a/F7b/precedence closures CONFIRMED intact. Three integrity
gaps in the provenance model itself — two real software defects fixed TDD (4 new tests,
suite 313/313), one adapter-configuration boundary documented + deferred:

| Finding | Sev | Disposition |
|---------|-----|-------------|
| P0 in-place mutation preserves the brand: WeakSet authenticates the reference, not contents — a caller could mutate a genuine branded observation into a resolved match | ACCEPTED — the observation graph is DEEP-FROZEN before branding; a branded observation's contents are exactly what the pipeline produced. Mutation-tested |
| P0 value↔rawResultHash not bound: observeIdentity used the value for derivation and the hash for quorum without checking they agree | ACCEPTED — observeIdentity verifies sha256(jcs(value)) == rawResultHash per read; a mismatch is a malformed observation, never agreed. Mutation-tested |
| P1 pin rebinding: evidence boundary came from the caller's pin arg, allowing observe-at-A/compare-at-B | ACCEPTED — the pin is bound INTO the observation (frozen); compareIdentityTarget requires the caller's declared pin to equal it (pin_mismatch) and derives all evidence from the observation's own pin. Negative-tested |
| P0 (second half) adapter-config independence: two dishonest adapter configs / a forged recording over one backend could present as two independent providers | BOUNDARY + DEFERRED — see below |

### Adapter-configuration independence (Codex P0 second half) — trust boundary + deferred

In recorded mode (W4's scope; live probes are an explicit W4 non-goal), a "provider" is a
reviewed recording bundle + a reviewed ProviderConfig. Administrative-domain distinctness
IS enforced (evaluateQuorum) against the REVIEWED domain (W3 P0#1). The residual — a
caller supplying two configs that both back one real endpoint, or a forged bundle whose
second provider duplicates the first — cannot be detected by the identity evaluator: it
is the same trust boundary the whole recorded-evidence model rests on (a reviewed fixture
is assumed honestly reviewed; W2's approved-hash list is assumed honestly curated). The
mechanical closures are known deferred work, NOT identity-evaluator scope:
- recording bundle-digest anchoring binding all providers' responses to one reviewed
  digest (deferred in the W3 handoff);
- live endpoint/client-identity binding (the WR3 probe step — a W4 non-goal).
Captured as [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] for owner visibility; W4's evidence claims only recorded-scenario
identity over reviewed fixtures, which is accurate. Framed for Codex re-assessment.

## Convergence pass 7 (2026-07-23, Codex session 019f8dee-2324-7bc3-9d07-920d4762bcf8)

Items 1–3 (freeze, value↔hash, pin binding) CONFIRMED closed; item-4 boundary rationale
CONFIRMED sound and adequately tracked; all prior closures (canonicality, conflict,
beacon, F7a/F7b, precedence, provenance brand) CONFIRMED non-regressed. One new high —
the last thread of the freshness-honesty class — fixed TDD (1 test, 314/314):

| Finding | Disposition |
|---------|-------------|
| high: freshness assessments were not bound to the observed block — a `current` assessment for block B could certify evidence observed at block A (pin_mismatch only guarded the identity read, not the freshness boundary) | ACCEPTED — validateContext now requires every freshness assessment's execution-block boundary to equal observed.pinned (chainId/number/hash). A foreign-block assessment is invalid_context; an empty set still derives to unknown (never pass), so absence stays honest. Mutation-tested |

## Convergence pass 8 (2026-07-23, Codex session 019f8dfb-ce84-71c3-8e02-d226aaf04bef)

Scope: the pass-7 freshness-boundary fix (diff dfb9074..d138818). Q2 CONFIRMED — the
(chainId, number, hash) tuple is the correct canonical execution-block boundary identity
(parentHash/timestamp/finality are metadata); Q3 CONFIRMED — no regression to freeze,
value↔hash, pin binding, F7a, precedence, or the provenance brand. Verdict
needs-attention: one new high, the boundary check itself was bypassable.

| Finding | Disposition |
|---------|-------------|
| high: caller-controlled `Array.every` could bypass the freshness-boundary binding — `validateContext` dispatched `fresh.assessments.every(...)`, so a real array holding a foreign-block `current` assessment plus a forged non-enumerable own `every` returning true passed validation, while array serialization (indices, not methods) carried the foreign assessment into report data — recreating observe-at-A/current-for-B | ACCEPTED, fixed at the class root — the comparator now snapshots the ENTIRE context once into plain data (JSON round-trip: the exact view any serializer sees, toJSON applied, own methods/iterators dropped) and both validates and emits ONLY the snapshot; the binding and aggregate checks run as internal indexed loops, never caller-dispatched methods or for..of. Closes the whole validate-one-channel/emit-another class: shadowed methods, forged Symbol.iterator, lying getters, toJSON splits, and post-call mutation of the caller's context (the emitted manifest ref + freshness are detached copies). 5 tests written RED (tests/w4-codex-fixes.test.ts, pass-8 block); 319/319; both guards mutation-tested (snapshot bypass reds toJSON/getter/detachment; neutered binding loop reds the forgery repros) |

Class note: this is the same lesson as pass 5 (INS-a6fc2796) one level down — after
"make the input unforgeable" comes "read the input over exactly one channel." The
snapshot also retires the residual noted there: `evidence[0]` was previously the
caller's live manifestEvidence object.

## Convergence pass 9 (2026-07-23, Codex session 019f8e10-4560-72f0-9e43-44dfef576b1c)

Scope: the pass-8 snapshot fix (diff d138818..2fd0ba8, reviewed pinned at 2fd0ba8).
Verdict needs-attention: the snapshot closed the array bypass but introduced a
re-entrancy path. Caveat: the review's own `npm test` could not run (no node_modules in
the pinned worktree), so its finding is static reasoning; execution evidence for the fix
below is the local 321/321 run + mutation tests.

| Finding | Disposition |
|---------|-------------|
| high: context serialization could rewrite the already-validated target — validateTarget(target) ran BEFORE snapshotContext(context), and JSON.stringify invokes caller-controlled toJSON/getters that can synchronously mutate the still-live target, whose chainId/strategy/address/expected values the comparator re-read afterwards; a context toJSON could flip a declared mismatch into `pass` citing a rewritten expectation | ACCEPTED — every caller-owned input is now detached BEFORE any validation runs: snapshotPlain (generalized from pass-8's snapshotContext) copies target and context first, then validateTarget/validateContext run on the copies, and only the copies are consumed/emitted. 2 tests written RED (toJSON rewriting expectedRuntimeCodeHash → must stay `fail` citing the declared hash; toJSON rewriting identityStrategy → must stay strategy_mismatch); target-snapshot bypass mutation reds both; 321/321 |
| recommendation: additionally bind the target to a trusted LoadedManifest whose content hash equals context.manifestHash | DEFERRED to W5 wiring, tracked in [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §Mechanical closures — the comparator has no manifest bytes in scope; target extraction from the trusted manifest happens where the manifest is loaded (W5), and W4's evidence claims recorded-scenario identity over reviewed fixtures, which does not overstate this |

Class note: pass-8's rule ("read untrusted input over exactly one channel") gains its
corollary — snapshotting IS caller-code execution, so all inputs detach before any
validates. TOCTOU applies across sibling arguments, not just within one object.

## Convergence pass 10 (2026-07-23, Codex sessions 019f8e26… [terminal] → 019f8e3a-3470-7d53-9bbf-79bd41fbffc6)

First dispatch failed terminally (no verdict): Codex sandbox EPERM spawning Vitest, then
a moderation false-positive on defensive vocabulary — 2nd [[INS-004]] recurrence, logged
there. Re-dispatched under the INS-004 default (neutral correctness/determinism framing +
static-only scope; the integrator owns test execution). Verdict needs-attention: 3 P1 + 1
P2, all one root cause — the pass-8/9 snapshot NEUTRALIZED active caller objects
(JSON.parse(JSON.stringify())) instead of REFUSING them, and stringify itself runs caller
code and is lossy.

| Finding | Disposition |
|---------|-------------|
| P1: snapshots are ordered, not isolated — stringify runs getters/toJSON, so one argument's accessor can still mutate a sibling mid-clone (target→context, and a `pinned` getter→target), in the direction pass-9 didn't cover | ACCEPTED at the root — replaced snapshotPlain with `snapshotInert`, a DESCRIPTOR-walk clone that copies only data properties and invokes NO getter or toJSON. Zero caller code runs during the comparison, so no input can steer or mutate another in any direction. Inputs snapshotted+validated one at a time (pin → target → context). Tests: target→context refusal + sibling-untouched, pinned-getter refusal + getter-never-ran, both mutation-tested |
| P1: `snapshotPlain` is lossy — JSON silently drops function/symbol/undefined props and coerces NaN/Infinity→null, so a function-valued `expectedRuntimeCodeHash` vanished and SUPPRESSED a comparison (fail-open) instead of throwing | ACCEPTED — snapshotInert fails closed on functions/symbols/BigInt/non-finite; an unset optional (`undefined`) is treated as absent exactly as JSON objects do, so legitimate unset fields still validate. Tests: function-valued expected field → invalid_target; non-finite chainId → invalid_target; undefined optional → still passes with one verification |
| P1: caller code can still dispatch inherited Array behavior after validation (`.map`/`.includes`/`for..of` on frozen observation arrays) if a snapshot callback poisoned `Array.prototype` | PARTIAL / PUSHED BACK — the IN-scope half (caller code running DURING the comparison) is eliminated: snapshotInert runs none, so nothing can poison a prototype mid-call. Poisoning `Array.prototype` BEFORE the call is same-realm arbitrary code — out of the threat model (a pre-call realm attacker is already unbounded), consistent with the pass-8 scoping note. Not hardening post-validation intrinsics against pre-existing global pollution; recorded as a conscious boundary |
| P2: error precedence changed — a serializable-but-invalid target combined with a throwing context reported invalid_context before invalid_target | ACCEPTED — validate the target's inert copy fully BEFORE the context is snapshotted (the reviewer's suggested structure), restoring target-before-context precedence. Test: bad-address target + toJSON context → invalid_target |

Deferred (Codex recommendation, not a defect): bind the target to a trusted LoadedManifest
whose content hash equals context.manifestHash — the comparator has no manifest bytes in
scope; this is W5 wiring, tracked in [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3.

Class note (completes the INS-a6fc2796 arc): forged construction (brand) → forged
observation channel (snapshot, pass 8) → forged timing across siblings (pass 9) → the root:
don't consume an active object at all. REFUSE non-inert input. Every earlier "read it
safely" step was treating a symptom of accepting caller behavior into a pure evaluator.
328/328, lint clean.

## Convergence pass 11 (2026-07-23, Codex session 019f8e60-eed6-7203-aa8e-50e002cd02d6)

Scoped re-verify of the inert-input contract (ec3b637..773b46c), neutral+static brief.
Verdict needs-attention: no P0, 2 P1 + 3 P2 — the descriptor walk was necessary but not
sufficient. All accepted; none warranted pushback.

| Finding | Disposition |
|---------|-------------|
| P1: Proxy reflection dispatches traps — `getOwnPropertyDescriptor`/`ownKeys`/`getPrototypeOf`/`.length` on a Proxy run caller code, so a pin/target proxy could still mutate a sibling mid-clone (re-entrancy restored), and a trap could throw a non-typed error | ACCEPTED — snapshotInert now rejects proxies via `util.types.isProxy` (a native check that fires no trap) BEFORE any reflection, at every nesting level. The "descriptors are inert" assumption was wrong for proxies; this closes it. Tests: proxy target (trap never fires, sibling untouched) / proxy context / proxy pinned / nested proxy in a data property — all refused. Mutation-tested (removing the isProxy guard reds 4) |
| P1: `undefined` can suppress the REQUIRED runtime-hash verification — a target declaring neither expected field emitted ZERO verifications (vacuous pass) instead of invalid_target; the manifest schema makes expectedRuntimeCodeHash mandatory (trust.ts TARGET_MANDATORY). Pre-existing (JSON.stringify dropped it too); surfaced by the deeper pass | ACCEPTED — validateTarget now REQUIRES expectedRuntimeCodeHash (string + SHA256), matching the manifest contract. A target without it → invalid_target; the evaluator can never emit an empty comparison. Test + mutation-tested (reverting to optional reds 1). Every existing target already declares it, so no legit regression |
| P2: required manifest-evidence `sourceId` not revalidated — `sourceId: undefined` was dropped by the snapshot and incomplete evidence emitted | ACCEPTED — validateContext now requires `boundary.snapshot.sourceId` (non-empty string). Test: missing sourceId → invalid_context |
| P2: lone-surrogate strings passed through — snapshotInert returned every string unchanged, so a non-I-JSON string validated here only to fail later canonicalization | ACCEPTED — snapshotInert rejects lone surrogates in string VALUES and KEYS, matching the canonical guard. Test: lone-surrogate targetId → invalid_target |
| P2: nesting caps differ — snapshotInert rejected at 256 what the manifest loader accepts to 1024, so a deeply-nested-but-valid target could load yet fail comparison | ACCEPTED — MAX_INPUT_DEPTH raised to 1024 to match canonical MAX_NESTING_DEPTH. Test: 300-deep extension accepted, 2000-deep refused |

Deferred (unchanged): manifest→target binding is W5 wiring ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3).
Process note: `git checkout` on the uncommitted file during mutation testing reverted the
whole pass-11 delta (recurrence of the observe.ts hazard) — re-applied from context, then
finished mutation tests with in-place Python reverts only. 336/336, lint clean.

## Disposition landing (2026-07-23)

All ACCEPTED rows implemented TDD in one pass: 20 new tests in
tests/w4-codex-fixes.test.ts (each written RED against the pre-fix contracts), the
slice-1/2/3 suites re-contracted where the review changed semantics (malformed observed
data, conflict reason codes, EIP-1898 read keys, 3-argument ABI selection, required
manifest evidence), and the reference recording resealed under the hash-keyed canon.
Full suite 297/297; lint clean. Mechanical changes: resolve.ts restructured around
path-retaining walks (DerivationHalt/ObservationUnavailable), adapter reads keyed by
`{blockHash}`, ProviderObservation carries response provenance, compare.ts binds
strategy + requires manifest evidence + emits `conflict`, selectAbi requires
observed == expected == registered.
