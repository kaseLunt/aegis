---
id: W0E
type: work
title: Lane hardening per second review — close cooperative-gate holes before lane commits
phase: P1
status: achieved
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W0D]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
  - .github/**
  - CLAUDE.md
  - AGENTS.md
review_when: phase:P2:entry
invalidated_by:
  - roadmap/tools/**
  - roadmap/work/W0E-lane-hardening.md
updated: 2026-07-22
evidence_fingerprint: sha256:f6d931480ede222e
---

# W0E — Lane hardening (second external review)

**Why this advances the vision:** the first lane outputs land soon; the gate must hold each
lane to its charter BEFORE any lane commit exists, and CI must catch what local cooperative
gates cannot.

## Hypothesis / objective
Close: active_task:none bypass; optional agent identity; universal roadmap/** lane access;
weak claim validation; missing deliverable checks; CI without product tests or diff-aware
scope review. Document what stays cooperative (env identity, optimistic claims, integrator
self-expansion locally).

## Acceptance (evidence target: Correct + Robust)
- Correct: doctor rejects none-with-active-work, malformed claims (agent/filename, lease
  format), duplicate effective paths, achieved-without-deliverables; gate blocks
  none-with-claims, requires AEGIS_AGENT with >1 active staged claim, confines lanes to
  charter+capture paths, blocks lane charter/claim tampering.
- Robust: selftest extended for each new behavior; CI runs product tests and base-to-head
  scope diff.

## Non-goals
- Authenticated agent identity, scheduler-grade leases, per-writer worktrees (R-002-class
  residuals; wait for concurrent-writer launch).

## Canonical commands
```bash
python roadmap/tools/doctor.py && python roadmap/tools/selftest.py
```

## Handoff
- next: implement gate v3 (modes: lane vs integrator), doctor strict claims + deliverables,
  claim.py task-refusal, scope_diff.py + CI product job, prose/state cleanup, selftests,
  restamp, commit, resume W1.
- read_first: roadmap/tools/scope_gate.py, roadmap/tools/doctor.py claims section, the
  second external review (key items recorded in this charter).
- hazards: 7 active claims exist in the index — after this lands, EVERY commit needs
  AEGIS_AGENT set (fable-main for integration); lane capture is narrowed to
  ideas/insights/risks — lanes cannot edit charters, claims (beyond lease renewal), STATUS,
  or other lanes' outputs.

## Evidence
- 2026-07-22: 28/28 selftests (incl. none-with-claims block, identity-mandatory, lane
  confinement, charter-edit block, strict lease/filename, deliverable checks); doctor green.
- 2026-07-22: commit 7196c94; first three real lane commits (wr2/wr3/wr6) passed gate v3.
- 2026-07-22: STALE-GREEN INCIDENT (external audit #2): the achieved-deps mutation
  depended on live W1 being unachieved — W1 achieving made it vacuous, selftest went red
  in CI for 4 runs while this item stayed achieved (fingerprint covers tools, not live
  roadmap state). Fixed: mutation now fully synthetic; the promised duplicate-effective-
  path check (declared, never enforced) implemented in doctor + negative-tested
  (A:lane-path-overlap-rejected). 30/30 selftests; re-stamped. Honest note: between the
  W1 status flip and this fix, "28/28 selftests" above was no longer reproducible.
