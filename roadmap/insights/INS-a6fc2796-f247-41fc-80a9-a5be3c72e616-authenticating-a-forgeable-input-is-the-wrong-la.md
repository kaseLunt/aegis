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
