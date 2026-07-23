---
id: W4
type: work
title: Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry
phase: P1
status: candidate
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W2, W3]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
deliverables:
  - lib/aegis/identity/**
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
review_when: phase:P1:exit
updated: 2026-07-22
---

# W4 — Identity adapters + code-hash-scoped ABI registry

**Why this advances the vision:** deployment.code_identity is M1's target invariant — W4
resolves each manifest target's identity strategy against W3's pinned boundaries and
compares against W2's expected values (ENGINEERING_SPEC §Target invariant).

## Objective

Implement the four identity strategies (direct, eip1967, beacon, eip1167_clone) over the
W3 adapter/engine seam, plus the code-hash-scoped ABI registry, producing Verification
results in W1's canonical shape.

## Acceptance

- Each identity strategy resolves against recorded fixtures with typed failures for
  unknown code identity (spec: cannot produce pass).
- ABI selection is scoped by runtime code hash, never by address alone.
- Kickoff refines these criteria before status: active (candidate placeholder).

## Non-goals

- Report surfaces (W5); live provider probes.

## Canonical commands

```text
npm test
```

## Evidence

No attained evidence yet.
