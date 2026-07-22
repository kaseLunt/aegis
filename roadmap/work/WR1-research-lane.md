---
id: WR1
type: work
title: ETH-OP expected-policy research (route manifest inputs)
phase: P1
status: achieved
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR1/**
deliverables:
  - roadmap/research/WR1/expected-route-policy.md
invalidated_by:
  - roadmap/research/WR1/**
review_when: phase:P1:exit
updated: 2026-07-21
evidence_fingerprint: sha256:db0b0b7b9fa62572
---

# WR1 — ETH-OP expected-policy research (route manifest inputs)

**Why this advances the vision:** research lane per D-006; feeds the hiring-ready route
gate's expected-policy side without touching the codebase.

## Hypothesis / objective
Pin, with provenance, everything the ROUTE-ETH-OP-v1 manifest needs: releases and
deployment commits, contract addresses, EIDs, reciprocal peers, send/receive libraries,
DVNs and thresholds, confirmations, route lifecycle intent, and rate-limit intent — from
etherfi-protocol/weETH-cross-chain, the bridge-hardening post, and LayerZero docs
(docs/SOURCE_REGISTER.md rows).

## Acceptance (evidence target: Correct)
- Deliverable: roadmap/research/WR1/expected-route-policy.md — every value carries
  source URL, retrieval date, and full commit SHA or content hash; conflicts between
  sources retained visibly, never resolved silently.
- Declared intent only: nothing in the deliverable may be read from live RPC (that is the
  observed side; independence rule D-006).
- Every factual claim carries provenance (URL + retrieval date + commit/content hash where
  applicable); docs/SOURCE_REGISTER.md source-class limits apply (research rationale, not
  deployment evidence).

## Non-goals
- No manifest promotion (requires the SOURCE_REGISTER checklist + owner review).
- No production code, no live-RPC-derived "expected" values.

## Handoff
- next: DELIVERED (595 lines, 4-source corroboration) and committed under lane wr1; won the timelock-delay adjudication vs WR2 (259200s confirmed); closed. Open items for manifest owner recorded in deliverable §open questions.
- read_first: this charter; docs/SOURCE_REGISTER.md (source-class limits).
- hazards: provenance required on every claim; no live-RPC 'expected' values; explorer
  labels are discovery only; WR6 additionally must stay blind to lib/ and W1 products.
