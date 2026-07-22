---
id: WR1
type: work
title: ETH-OP expected-policy research (route manifest inputs)
phase: P1
status: committed
evidence_target: "Correct"
priority: 2
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/research/WR1/**
review_when: phase:P1:entry
updated: 2026-07-21
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
