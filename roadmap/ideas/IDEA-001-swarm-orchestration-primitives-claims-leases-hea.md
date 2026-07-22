---
id: IDEA-001
type: idea
title: Swarm orchestration primitives: claims, leases, heartbeats, worktree ownership, merge owner
status: inbox
informs: []
review_when: date:2026-08-04
updated: 2026-07-21
---

# IDEA-001 — Swarm orchestration primitives: claims, leases, heartbeats, worktree ownership, merge owner

## Idea
If/when more than one independently COMMITTING agent works this repo, the governance layer
needs first-class concurrency primitives (external review, gap 1):

- agent identity + task claims (claimed_by, claimed_at)
- lease expiry + heartbeat so dead agents release work
- branch/worktree ownership per claim
- dependency readiness signaling
- a designated integration/merge owner
- result + failure handoff states (achieved / failed / abandoned -> re-queue)

## Trigger
Park until the scheduler actually runs concurrent committing agents (see D-005 contract
item 4). Do NOT build ahead of need — reviewer and owner agree the priority is Aegis itself.
