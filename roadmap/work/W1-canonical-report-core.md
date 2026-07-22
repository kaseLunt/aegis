---
id: W1
type: work
title: Canonical report core — schemas, JCS canonicalization, SHA-256 report identity
phase: P1
status: active
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W0]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - docs/ENGINEERING_SPEC.md
  - roadmap/work/W1-canonical-report-core.md
invalidated_by:
  - lib/**
  - package-lock.json
  - roadmap/work/W1-canonical-report-core.md
review_when: phase:P1:exit
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

## Hazards
- CRLF class ([[INS-001]]): hash UTF-8 bytes produced in memory, never strings round-tripped
  through the filesystem; fixture readers use binary mode; include a CRLF-injected fixture in
  the property suite to prove translation-immunity.

## Canonical commands
```bash
npm test
npm run test:property
```

## Evidence
- 2026-07-22: spec v1.2 clarifications adopted (commit 9d212cb); 15/18 SPEC-QUESTIONs
  answered, 3 deferred with owners; zero vectors adjusted.
- 2026-07-22: TDD slice 1 — RED (module missing), GREEN 5/5 golden+ordering vectors
  BYTE-IDENTICAL to Codex blind derivation incl. 1973/2870/2908-byte payloads; mutation
  check (evidence-sort disabled) kills 4/5 tests, restore passes; full suite 14/14; lint
  clean on project code.
- 2026-07-22: slices 2-3 — RED 7 failing rejection tests, GREEN three-phase validation
  (schema/referential/domain_normalization) passing all M-01..M-06 with vector-exact codes,
  phases, and input-order paths; property suite: 50-run set-shuffle invariance, 10-field
  hash sensitivity (one vacuous mutation caught and fixed in the TEST, engine was right),
  determinism, CRLF-injected fixture reproduces the G-01 golden hash; sort-mutation kills
  4 property/golden tests; 35/35 green.

## Handoff
- next: slices 1-3 DONE (goldens/ordering; M-01..M-06 typed rejections + referential
  validation + cardinality; property suite incl. CRLF fixture — 35 tests, all
  mutation-checked). Remaining cycles: (c) strict schema layer `validateReport` (32/20-byte
  lengths, sha256 64-hex, enum membership — full-length fixtures, RED first), (e) vectors
  THEN implementation for unexercised normalization surfaces (verification/fact array
  sorting by (invariantId|factId, evaluatorVersion), role-ID set sorting, freshness
  assessments, limitations by (code,text)), then wire reportHash into engine output and
  supersede M0 lib/aegis/canonical.ts report identifiers.
- read_first: docs/ENGINEERING_SPEC.md §Canonical domain types + §Canonicalization and
  hashing + §Tests; roadmap/insights/INS-001 (bytes-in-memory rule); WR6 vectors when they
  land (golden vectors are authored blind — do NOT adjust them to match implementation;
  investigate every mismatch as a spec question first).
- hazards: CRLF class (INS-001): hash in-memory UTF-8 bytes only, binary-mode fixture IO;
  arrays: set-like sorted with documented keys, semantic-order arrays keep explicit index;
  evidence-role IDs must reject dangling references at schema level.
