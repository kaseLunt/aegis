---
id: W2
type: work
title: Manifest model + trust root (approved-hash policy, content addressing, applicability)
phase: P1
status: active
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
evidence_fingerprint: sha256:1a65636079b19a6c
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
- next: slice 1 + spine-review hardening DONE (P0#1 trust binding via recompute+freeze,
  P0#3 full schema, P1#5 normalize-before-hash; 90/90 incl. spine-review-fixes). Remaining:
  loader-from-bytes (binary, R-003 duplicate-aware parse deferred to untrusted boundary);
  wire policyTrust output shape into the report payload block; slice 1 (orig) (13 tests: content addressing excl. embedded hash, integrity, trust
  set-membership incl. fabricated-reviewer adversarial case, applicability windows/chains;
  trust-everything mutation kills 3 tests). Remaining: manifest fixture files under
  data/manifests/ + loader-from-bytes (binary read, INS-001); property tests (key-order
  hash invariance via fast-check, reviewer-field non-authentication sweep); wire
  policyTrust evaluation output shape to the report payload's policyTrust block; W1 Codex
  review disposition may add work here.
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
