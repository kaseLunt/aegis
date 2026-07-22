---
id: WR3
type: work
title: Provider and archive feasibility (independence, finality, EIP-1898, forks)
phase: P1
status: committed
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR3/**
review_when: phase:P1:entry
updated: 2026-07-21
---

# WR3 — Provider and archive feasibility (independence, finality, EIP-1898, forks)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Prove which RPC providers are administratively independent (infrastructure, not brand),
and verify finalized-tag behavior, EIP-1898 block-hash reads, archive depth, and
historical-fork capability on Ethereum mainnet and OP mainnet.

## Acceptance (evidence target: Correct)
- Deliverable: roadmap/research/WR3/provider-matrix.md — capability matrix with test
  method per cell and independence rationale (shared-upstream analysis).
- Free/keyed tiers documented with limits; no credentials in the repo, ever.
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.
