---
id: W0D
type: work
title: Parallelism prep — claims model, lane charters, doctrine (D-006)
phase: P0
status: committed
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W0B]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
  - CLAUDE.md
  - AGENTS.md
deliverables:
  - roadmap/tools/claim.py
  - roadmap/decisions/D-006-asymmetric-parallelism-one-spine-owner-research-.md
evidence_receipts: []
review_when: phase:P2:entry
invalidated_by:
  - roadmap/tools/**
updated: 2026-07-21
---

# W0D — Parallelism prep

**Why this advances the vision:** D-006's asymmetric-parallelism doctrine needs a control
plane that can represent multiple accountable lanes without losing WIP discipline or scope
enforcement — the IDEA-001 trigger has fired.

## Hypothesis / objective
Per-agent claims (lease, base commit, narrowable scope) + doctor accountability (every
active item claimed, one claim per agent, expiry flagged) + claim-aware scope gate
(AEGIS_AGENT, staged index, fail closed) + six chartered research lanes (WR1–WR6) let
independent lanes run now and committing writers later, without weakening any W0B guarantee.

## Acceptance
- Correct: claim.py open/renew/release/list works; doctor enforces claim accountability;
  scope gate resolves AEGIS_AGENT claims from the staged index.
- Robust: selftest extended with claims mutations (unclaimed active item, double claim,
  expired lease) and claim-scope gate tests (narrowed scope blocks, unknown agent fails
  closed) — all passing locally and in CI.

## Non-goals
- Provisioning per-writer worktrees/branches (needed only when concurrent committing
  writers actually launch).
- Launching the research lanes (owner call, separate step).

## Canonical commands
```bash
python roadmap/tools/doctor.py
python roadmap/tools/selftest.py
python roadmap/tools/claim.py list
```

## Handoff
- next: COMPLETE (commit e0cbf8f; owner approved full launch). P1 opened; W1 active under
  fable-main; WR1–WR6 active under wr1–wr6 claims with background agents running.
- read_first: roadmap/decisions/D-006-*.md, roadmap/tools/claim.py, the claims section in
  roadmap/tools/doctor.py, roadmap/tools/scope_gate.py (AEGIS_AGENT branch).
- hazards: claims live under roadmap/claims/ and are read from the STAGED index by the gate
  — stage the claim before committing under it; claim allowed_paths may only narrow (must be
  literal members of the task's list); an expired lease is a commit-blocking doctor error —
  renew or release promptly; WR researchers must never later implement the observed-side
  acquisition for the same values (D-006 independence rule).

## Evidence
- 2026-07-21: doctor + 19/19 selftests green locally; CI on push e0cbf8f.
- 2026-07-21: owner approved: launch all six lanes; open P1; W1 single-owner = fable-main.
