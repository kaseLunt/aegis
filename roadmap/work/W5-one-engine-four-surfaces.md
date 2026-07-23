---
id: W5
type: work
title: aegis verify CLI + report API + CI adapter + web evidence drawer over one engine
phase: P1
status: candidate
evidence_target: "Correct + Robust + Demonstrated"
priority: 1
depends_on: [W4]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - app/**
deliverables:
  - lib/aegis/surfaces/**
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
review_when: phase:P1:exit
updated: 2026-07-22
---

# W5 — One engine, four surfaces

**Why this advances the vision:** M1's exit gate is the identical canonical report via
CLI, API, CI, and web (docs/ROADMAP.md M1) — one engine, byte-identical reportHash on
every surface.

## Objective

Wire the W1–W4 spine into `aegis verify` CLI, the report API, a CI adapter, and the web
evidence drawer, all consuming one engine and emitting byte-identical canonical reports.

## Acceptance

- The same request yields the same reportHash across all four surfaces (recorded mode).
- Kickoff refines these criteria before status: active (candidate placeholder).

## Non-goals

- Live production monitoring; M2 route matrix.

## Canonical commands

```text
npm test
```

## Evidence

No attained evidence yet.
