---
id: WR5
type: work
title: Rehearse case selection (public proposal or historical Safe/timelock execution)
phase: P1
status: active
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR5/**
review_when: phase:P1:exit
updated: 2026-07-21
---

# WR5 — Rehearse case selection (public proposal or historical Safe/timelock execution)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Find candidates satisfying the strict retrospective_rehearsal contract
(docs/ENGINEERING_SPEC.md Preflight): one canonical execution transaction (atomic internal
batch allowed), parent state and same-block canonical prefix reconstructable, sender
semantics reproducible, actual effects isolable from later writes.

## Acceptance (evidence target: Correct)
- Deliverable: roadmap/research/WR5/rehearse-candidates.md — per candidate: tx hash,
  target block + index, parent block, batch structure, archive requirements, and an
  explicit feasibility verdict per contract clause.
- A public unsigned proposal candidate counts as a bonus alternative if found.
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.

## Handoff
- next: background research agent launched 2026-07-21; deliverables land under this lane's
  allowed path; orchestrator reviews, commits under AEGIS_AGENT=<lane agent>, then closes.
- read_first: this charter; docs/SOURCE_REGISTER.md (source-class limits).
- hazards: provenance required on every claim; no live-RPC 'expected' values; explorer
  labels are discovery only; WR6 additionally must stay blind to lib/ and W1 products.
