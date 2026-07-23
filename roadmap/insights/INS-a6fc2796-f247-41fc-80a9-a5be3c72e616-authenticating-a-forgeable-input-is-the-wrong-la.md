---
id: INS-a6fc2796-f247-41fc-80a9-a5be3c72e616
type: insight
title: "authenticating a forgeable input is the wrong layer — make the input unforgeable (provenance)"
status: candidate
informs: [W4, W5]
review_when: date:2026-08-06
updated: 2026-07-23
---

# INS-a6fc2796-f247-41fc-80a9-a5be3c72e616 — authenticating a forgeable input is the wrong layer — make the input unforgeable (provenance)

## Context
W4's `compareIdentityTarget` accepted a structural `ObservedIdentity` and made a
security-critical decision from it (does this identity match the manifest, backed by
independent providers?). Codex found a false-pass path through it FOUR times, each a
different forged field:
- pass 1: a hand-built resolved identity with no reads passed;
- pass 2: forge the agreed value + the claimed hash together;
- pass 3: forge the quorum `agreeingProviders` label;
- pass 5: clone one provider's authentic observation, relabel it as a second
  independent provider/domain.

Each fix authenticated the previously-forged field (check reads present → authenticate
value against raw hash → recompute quorum from observations → ...). Every round closed
one shape and exposed another, because the input itself was caller-constructible: there
is always one more label to relabel.

## Evidence
- The class closed only when the input was made UNFORGEABLE: `compareIdentityTarget`
  now accepts only observations produced by `observeIdentity`, enforced with a WeakSet
  provenance brand (the repo already used this idiom — `VERIFIED_BUNDLES` in
  lib/aegis/chain/adapter.ts gates recorded bundles the same way). A hand-built
  observation carries no brand → refused before any logic runs.
- The ~90 lines of transcript authentication accreted over passes 2–4 were then DELETED:
  a branded observation is internally consistent by construction (its identity is
  `deriveIdentity` over exactly its reads, each a quorum-agreement outcome), so there is
  nothing left to re-authenticate. Net less code, class closed.
- Trust boundary landed in the right place: the provider/administrative-domain labels on
  a branded observation come from the reviewed adapter configs (WR3 provider matrix /
  W3 P0#1 "independence is enforced against the reviewed domain"). That is where
  independence is legitimately established; the comparator cannot and need not re-derive
  it.

## Consequence
- Heuristic: when review keeps finding NEW forgery shapes against a validator, stop
  hardening the validator — the validator is at the wrong layer. Make the input
  unforgeable (a provenance brand / verified handle / capability) so untrusted
  constructions never reach the logic. Authenticate at the boundary that owns the trust,
  not at every downstream consumer.
- Applies directly to W5: surfaces consume engine output; they must trust
  provenance-branded engine results, not re-validate structural copies.
- Mirrors the control-plane's own design (evidence is valid only for its recorded
  fingerprint/provenance, not re-checked structurally) — same principle, code layer.

## Addendum (pass 8, 2026-07-23): after unforgeable, read over exactly ONE channel
The brand closes forged CONSTRUCTION; pass 8 showed the remaining hole is forged
OBSERVATION of a legitimate-typed input: JS exposes multiple read channels (own methods
like `every`, Symbol.iterator, live getters, toJSON), and a validator that reads one
channel while serialization reads another can be shown two different values without any
mutation — `validateContext` dispatched the caller array's `every` while JSON
serialization read its indices. Fix idiom: SNAPSHOT the untrusted input once into plain
data (JSON round-trip = exactly the serializer's view), then validate AND emit only the
snapshot; internal indexed loops, never caller-dispatched methods. A hostile object can
still lie, but only consistently — the report carries exactly what was validated.
Same W5 consequence: engine output handed across a trust boundary should be plain
frozen data, so surfaces cannot be channel-split either.

## Addendum 2 (pass 10, 2026-07-23): the terminal form — REFUSE active inputs, don't consume them
Passes 8–9 kept trying to consume an active caller object safely (snapshot it, read it over
one channel, snapshot all args before validating). Pass 10 showed the residuals were all
symptoms of the same root: `JSON.parse(JSON.stringify(x))` RUNS the object's getters/toJSON
(so a sibling argument can still be mutated mid-clone, either direction, incl. via a
`pinned` getter) and is LOSSY (a function-valued expected field is silently dropped →
comparison suppressed, fail-open). The terminal fix is not a better neutralizer but a
REFUSAL: `snapshotInert` walks property DESCRIPTORS, copies only data properties, invokes
no getter/toJSON, and fails closed on functions/symbols/BigInt/non-finite. A pure evaluator
must accept only inert plain data; anything with behavior is rejected at the boundary.
Full arc: forged construction (brand) → forged observation channel (single-read) → forged
timing across siblings (snapshot-all-first) → REFUSE active inputs entirely. Each step
treated a symptom; the last removes the cause (caller behavior entering the evaluator).
Note the scoping line this draws: same-realm prototype pollution BEFORE the call stays out
of the threat model — the guarantee is only that no caller code runs DURING the evaluation.
