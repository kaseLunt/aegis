---
id: WR5
type: work
title: Rehearse case selection (public proposal or historical Safe/timelock execution)
phase: P1
status: committed
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR5/**
deliverables:
  - roadmap/research/WR5/rehearse-candidates.md
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
- next: critic returned 17 findings; disposition applied in deliverable (delay corrected to 259200s -- the truncation error recurred here, catch #2 for the class). ROUND 2 scope: critic items 2-15 (see roadmap/research/WR5/completeness-critique.md). Lane stays open; round 2 deferred until M4 planning unless owner pulls it earlier -- several EXTEND items are cheaper with real archive/trace providers in hand.
- read_first: this charter; docs/SOURCE_REGISTER.md (source-class limits).
- hazards: provenance required on every claim; no live-RPC 'expected' values; explorer
  labels are discovery only; WR6 additionally must stay blind to lib/ and W1 products.
