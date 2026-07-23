---
id: W0
type: work
title: Stand up the repo-native control plane for agent-swarm coordination
phase: P0
status: committed
evidence_target: "Correct"
priority: 1
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
  - .claude/**
  - .github/workflows/control-plane.yml
  - CLAUDE.md
  - AGENTS.md
deliverables:
  - roadmap/tools/doctor.py
  - roadmap/SYSTEM.md
evidence_receipts: []
invalidated_by:
  - roadmap/tools/doctor.py
  - .githooks/**
review_when: phase:P2:entry
updated: 2026-07-21
---

# W0 — Stand up the control plane

**Why this advances the vision:** an agent swarm without a durable, evidence-derived coordination
surface loses ideas, drifts scope, and inflates status — the exact failure modes VISION's
"AI-assisted engineering maturity" goal exists to disprove.

## Hypothesis / objective
A repo-native cockpit (`roadmap/`), typed capture objects, git/CI enforcement, and a session
protocol let multiple agents work in parallel without losing intent or overstating progress.

## Acceptance
- Correct: `python roadmap/tools/doctor.py` passes with 0 errors/warnings; pre-commit and CI run
  it; SessionStart hook surfaces `roadmap/STATUS.md`; CLAUDE.md/AGENTS.md carry the session
  protocol; all control-plane files are committed (durable).

## Non-goals
- No product feature work rides on this item.
- The control plane does not replace `docs/` as product canon ([[D-003]]).

## Canonical commands
```bash
python roadmap/tools/doctor.py
```

## Handoff
- next: COMPLETE — the control plane this file describes is installed and superseded in mechanics by the W0F bundle migration; read roadmap/SYSTEM.md.
- read_first: roadmap/SYSTEM.md
- hazards: superseded in mechanics by the W0F bundle migration — do not reintroduce the pre-bundle tool grammar; the cockpit files remain the authored authority.

## Evidence
- 2026-07-21: installer ran clean; doctor OK (0 errors, 0 warnings).
- 2026-07-21: commit 3d01b6c — cockpit + hooks + CI + session protocol committed; pre-commit
  doctor gate executed and passed (13/13 roadmap files tracked).
