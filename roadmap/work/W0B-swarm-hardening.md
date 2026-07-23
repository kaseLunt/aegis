---
id: W0B
type: work
title: Harden the control plane per external review (enforcement gaps, honest claims)
phase: P0
status: achieved
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W0A]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
  - .github/**
  - .claude/**
  - CLAUDE.md
  - AGENTS.md
deliverables:
  - roadmap/tools/scope_gate.py
  - .github/workflows/control-plane.yml
evidence_receipts:
  - roadmap/evidence/EV-W0B.md
invalidated_by:
  - roadmap/tools/**
  - .githooks/**
review_when: phase:P2:entry
updated: 2026-07-21
evidence_fingerprint: sha256:c0055f66dfd5f914bb97fc8f48b978b99b40126a888509bda294ef0b5522ae8d
---

# W0B — Control-plane hardening (external review response)

**Why this advances the vision:** the review found the prose promised more enforcement than
the implementation delivered — the exact failure Aegis's own doctrine forbids at product
level. Closing the gap (or narrowing the claim) keeps the control plane honest.

## Hypothesis / objective
Close the enforceable gaps cheaply (staged-index scope gate, fail-closed states, protected
files, minimal evidence fingerprints, HITL decision records, lifecycle checks, codified gate
selftests); narrow every remaining claim to what is enforced; explicitly defer swarm
orchestration primitives with a documented trigger.

## Acceptance
- Correct: doctor + scope gate enforce the new checks; `selftest.py` passes locally.
- Robust: selftest mutation suite (ladder drift, missing STATUS, dual in-progress phases,
  unapproved acceptance, handoff absence, unachieved deps, staged-vs-worktree bypass,
  fail-closed states, protected files, fingerprint invalidation) passes; runs in CI workflow.

## Non-goals
- Agent leases, heartbeats, worktree ownership, merge coordination, retries, cancellation —
  deferred with trigger (see IDEA-001); reviewer concurs: "I would not spend weeks building a
  grand orchestration platform before Aegis itself."
- Cryptographic/server-side authority for approvals (residual: any local field is writable;
  authoritative enforcement requires remote CI + branch protection — R-001).

## Canonical commands
```bash
python roadmap/tools/doctor.py
python roadmap/tools/selftest.py
```

## Handoff
- next: COMPLETE (commit 6bf2c03; CI green on GitHub run 29891851579). Follow-on: owner
  opens P1/W1 when ready; enable branch protection when PR flow starts (R-001 residual).
- read_first: roadmap/tools/{scope_gate,doctor,selftest}.py, roadmap/decisions/D-004-*.md,
  the external review (session context; key points recorded in this item + D-005/R-001).
- hazards: scope gate now reads the STAGED INDEX — `git add` control-plane state before
  expecting the gate to see it; doctor --stamp writes the work file but you must re-add it;
  fingerprints hash INDEX blobs, so unstaged edits are invisible to them by design;
  VISION/SYSTEM/RULES are protected files — owner override required to commit changes.

## Evidence
- 2026-07-21: selftest 14/14 locally (6 doctor mutations + 8 staged-index gate integration
  tests incl. bypass closure, fail-closed states, protected files, fingerprint invalidation).
- 2026-07-21: fingerprint gate blocked this task's own landing commit once (stale W0A stamp
  after a tools edit) -- live proof of the invalidation mechanism, then re-attested.
- 2026-07-21: public remote created; CI green on first push (doctor + selftest, Linux); repo recreated during W0C identity scrub -- current runs live on the recreated repo.
- Owner ratifications recorded: D-001..D-005 approved_by klunt.
