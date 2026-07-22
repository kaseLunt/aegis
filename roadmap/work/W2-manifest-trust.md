---
id: W2
type: work
title: Manifest model + trust root (approved-hash policy, content addressing, applicability)
phase: P1
status: achieved
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W1]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - data/manifests/**
  - roadmap/work/W2-manifest-trust.md
invalidated_by:
  - lib/aegis/report/**
  - lib/aegis/manifest/**
  - roadmap/work/W2-manifest-trust.md
review_when: phase:P1:exit
updated: 2026-07-22
evidence_fingerprint: sha256:5193ff42e0bd2d97
---

# W2 — Manifest model + trust root

**Why this advances the vision:** a manifest declares expected state; the trust root is what
stops a caller-supplied, self-consistent manifest from replacing canonical live policy
(THREAT_MODEL "Manifest poisoning", adversarial test 30). Everything M1 verifies compares
observed state against THIS.

## Hypothesis / objective
Implement per ENGINEERING_SPEC §Manifest model + §Manifest trust root: typed manifest schema
(v1 scope: what deployment.code_identity needs — identity strategies, expected
implementations/runtime hashes, addresses, chain IDs, policy refs, provenance metadata),
content addressing via the single JCS implementation (hash computed over content with the
embedded hash excluded), ManifestTrustPolicy evaluation (approved-hash set →
trusted/untrusted/invalid with reason codes and validation evidence), and applicability
checks (validity window, chain/environment) against an observation boundary.

## Acceptance (evidence target: Correct + Robust)
- Correct: valid manifest loads with computed content hash; hash in approved set + valid
  structure → trusted; structurally valid but unapproved (incl. fabricated reviewer
  metadata) → untrusted with manifest_hash_not_approved — NEVER trusted (adversarial test
  30); malformed → invalid, never evaluated; embedded-hash mismatch → invalid
  (integrity_mismatch); expired/inapplicable window or wrong chain → typed applicability
  failure (adversarial test 6).
- Robust: property tests — hash invariant under key order; any content change changes the
  hash; author/reviewer fields provably non-authenticating (mutating them never flips
  untrusted→trusted).

## Non-goals
- Reviewer-signature threshold path (spec allows approved-hash OR signatures; signatures are
  a later hardening item with key custody questions for the owner).
- Live manifest data for ether.fi (WR1's research feeds manifest AUTHORING, a separate
  reviewed step per SOURCE_REGISTER promotion checklist).

## Canonical commands
```bash
npm test
```

## Handoff
- next: W2 COMPLETE — all slices landed and adversarial-review round 2 dispositioned.
  Shipped: manifest schema + content addressing + trust root (slice 1); spine-review
  hardening (P0#1 recompute+freeze, P0#3 full schema, P1#5 normalize-before-hash);
  loadManifestBytes (strict in-memory UTF-8, typed invalid_utf8/malformed_json; R-003
  duplicate-aware parse still deferred to the W3/W5 untrusted boundary); sealed
  data/manifests/reference-code-identity.json fixture; policyTrustFromBytes wiring
  (trusted/untrusted/invalid blocks proven against W1 strict validateReport); property
  tests (key-order invariance, 21 per-site hash-sensitivity mutators, isolated
  author-only/reviewers-only non-authentication sweeps, unicode/latin1-collision);
  review round 2 fixes: fail-closed boundary validation in checkApplicability
  (noncanonical decimals + chainId types throw), environment_mismatch applicability
  (deploymentEnvironment comparand — deployment config, like ManifestTrustPolicy),
  duplicate/mixed-type set-member rejection (chainIds/invariantIds/uncovered/policyRefs
  identity/targetIds), nesting depth cap 1024 in assertJsonDomain (typed
  nesting_depth_exceeded; killed a real RangeError escape probed at depth ~10k).
  Follow-ups live elsewhere: W4 consumes the manifest at identity-verification time;
  [[IDEA-002]] (invalid-block manifestHash domain separation) queued for W3/W5 spec review.
- read_first: docs/ENGINEERING_SPEC.md §Manifest model + §Manifest trust root;
  docs/THREAT_MODEL.md manifest-poisoning row + adversarial tests 6 and 30;
  lib/aegis/report/canonical.ts (delegate, never duplicate).
- hazards: the manifest hash must be computed over content WITHOUT the embedded hash field
  (else circular); author/reviewer text must never participate in trust decisions; do not
  let W1's report-payload validation vocabulary leak into manifest schema errors (separate
  contract, same error class is fine).

## Evidence
- 2026-07-22: TDD slice 1 — RED 13 (module missing), GREEN 13/13; full suite 72/72; lint
  clean; trust-everything mutation killed by 3 tests incl. adversarial test 30 form.
- 2026-07-22: spine-review hardening — 90/90 incl. spine-review-fixes.
- 2026-07-22: loader + fixture + wiring + property slices — RED observed per slice
  (5 loader / 5 wiring failures for the right reason), GREEN at 105/105; fixture sealed
  sha256:d460baab…, CRLF-immunity + tamper-fails-closed pinned.
- 2026-07-22: adversarial review round 2 (4 lenses, 3-skeptic verification; conclusions
  in-session after panel usage cap): 2 confirmed findings fixed TDD (P1 boundary
  fail-open — "0024999999" silently applied, now typed noncanonical_unsigned_decimal;
  P2 environment applicability — environment_mismatch reason code added); RangeError
  depth escape verified real by probe and fixed at root (assertJsonDomain cap, 3 tests);
  set-member dedup 6 tests; test-quality gaps closed (author-only/reviewers-only sweeps,
  unicode, tamper-with-approved-hash e2e, fixture trust eval, deterministic mutators).
  Final: `npm test` 144/144, lint clean, doctor OK.
- 2026-07-22: Codex cross-vendor review of the delta (roadmap/reviews/
  W2-delta-codex-review.md): 3 P1s, all verified via RED tests then fixed same-day —
  container/component type gates (invalid_field_type; coercion class killed), depth cap
  swept across validateReport/validateReportStructure/normalizeReport, applicability
  boundary-kind + environment validation. 17 new tests; suite 176/176. Clean per Codex:
  approved-hash membership, invalid-byte anchoring.
