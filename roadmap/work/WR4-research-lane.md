---
id: WR4
type: work
title: Rewind case selection (one real reconstructable configuration change)
phase: P1
status: active
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR4/**
deliverables:
  - roadmap/research/WR4/rewind-candidates.md
review_when: phase:P1:exit
updated: 2026-07-21
---

# WR4 — Rewind case selection (one real reconstructable configuration change)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Find at least two candidate real route/implementation configuration changes (M3 needs
one) with reconstructable logs, state, ABI epochs, and affected assertions — e.g. from the
bridge-hardening rollout window.

## Acceptance (evidence target: Correct)
- Deliverable: roadmap/research/WR4/rewind-candidates.md — per candidate: tx hashes,
  blocks, emitting contracts, event signatures, before/after values, why it is
  reconstructable, and what could block reconstruction (log gaps, provider depth).
- Ranked recommendation with rationale; no indexing code.
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.

## Handoff
- next: ROUND 2 per completeness critique (roadmap/research/WR4/completeness-critique.md): EXTEND items A1-A7 (implementation upgrades, setPeer, send/receive libs, full ULN+executor matrix, owner/delegate, pause/roles, timelock pairs), B1-B6 search angles, C2-C5 hazards, D3/D4/D6/D7 corrections. Recommendation stands downgraded to promising-lead meanwhile.
- read_first: this charter; docs/SOURCE_REGISTER.md (source-class limits).
- hazards: provenance required on every claim; no live-RPC 'expected' values; explorer
  labels are discovery only; WR6 additionally must stay blind to lib/ and W1 products.
