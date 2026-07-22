---
id: WR6
type: work
title: Adversarial vectors (designed blind to W1 implementation)
phase: P1
status: committed
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR6/**
review_when: phase:P1:entry
updated: 2026-07-21
---

# WR6 — Adversarial vectors (designed blind to W1 implementation)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Design the adversarial test corpus for the canonical spine WITHOUT reading W1's
implementation: golden hash vectors (hand-computed canonical JSON + SHA-256 from the
ENGINEERING_SPEC schema alone), malformed evidence, provider disagreement, stale evidence,
reorg sequences, and identity-mismatch scenarios.

## Acceptance (evidence target: Correct)
- Deliverable: roadmap/research/WR6/adversarial-vectors.md + vector files under
  roadmap/research/WR6/vectors/ — each vector: inputs, expected canonical bytes or expected
  typed failure, and the spec clause it tests.
- HARD constraint: the authoring agent must not read lib/ or W1 work products; vectors
  derive from docs/ENGINEERING_SPEC.md and docs/THREAT_MODEL.md only (D-006 independence).
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.
