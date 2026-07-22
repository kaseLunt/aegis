---
id: W1
type: work
title: Canonical report core — schemas, JCS canonicalization, SHA-256 report identity
phase: P1
status: committed
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W0]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - roadmap/work/W1-canonical-report-core.md
invalidated_by:
  - lib/**
  - package-lock.json
  - roadmap/work/W1-canonical-report-core.md
review_when: phase:P1:entry
updated: 2026-07-21
---

# W1 — Canonical report core

**Why this advances the vision:** every other Aegis capability terminates in the canonical report
contract (`docs/ENGINEERING_SPEC.md` §Canonical domain types, §Canonicalization and hashing).
Byte-identical, content-addressed reports are the spine everything in M1–M4 depends on.

## Hypothesis / objective
Implement the canonical domain types (VerificationState, FactAvailabilityState, PolicyTrustState,
ObservationBoundary, EvidenceRef, Verification, EvidenceFact, AssurancePayload), domain array
normalization, RFC 8785 JSON canonicalization, and `reportHash = sha256(JCS(payload))` — as pure,
I/O-free modules with JSON Schema + TypeScript types in lockstep.

## Acceptance (evidence target: Correct + Robust)
- Correct: identical inputs produce byte-identical canonical reports and hashes, offline, no
  network dependency; schema validation rejects missing evidence-role IDs, duplicate set members,
  and noncanonical numeric/hex encodings.
- Robust: property tests (fast-check) — randomized provider-completion order and set-input order
  produce the same payload/hash while semantic-order arrays (batches, prefixes, tapes) remain
  order-significant; changing policy trust, source mode, freshness, coverage, or any referenced
  policy hash changes the report hash.

## Non-goals
- No live RPC acquisition (W3), no manifest trust root (W2), no identity resolution (W4).
- No UI beyond keeping existing prototype checks green.

## Canonical commands
```bash
npm test
npm run test:property
```

## Evidence
(none yet — Declared)
