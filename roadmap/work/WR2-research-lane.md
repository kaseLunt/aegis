---
id: WR2
type: work
title: Authority research (owners, delegates, roles, Safes, timelocks, guardians)
phase: P1
status: committed
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR2/**
deliverables:
  - roadmap/research/WR2/authority-map.md
evidence_receipts: []
invalidated_by:
  - roadmap/research/WR2/**
review_when: phase:P1:exit
updated: 2026-07-21
---

# WR2 — Authority research (owners, delegates, roles, Safes, timelocks, guardians)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Independently map who can change the ETH-OP route surfaces: owners, delegates, role
holders, Safes and their signers/thresholds, timelocks and delays, guardians, and
revocation authorities — from independent public sources (repos, docs, explorers as
discovery only).

## Acceptance
- Deliverable: roadmap/research/WR2/authority-map.md with per-claim provenance and an
  explicit unknown/unverified section.
- Explorer labels are discovery leads, never evidence (threat model: outside trust
  boundary); anything only explorer-sourced is marked unverified.
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.

## Canonical commands

```text
review the committed deliverables under roadmap/research/WR2/
```

## Handoff
- next: DELIVERED and committed under lane wr2; reviewed by orchestrator; closed.
- read_first: this charter; docs/SOURCE_REGISTER.md (source-class limits).
- hazards: provenance required on every claim; no live-RPC 'expected' values; explorer
  labels are discovery only; WR6 additionally must stay blind to lib/ and W1 products.
