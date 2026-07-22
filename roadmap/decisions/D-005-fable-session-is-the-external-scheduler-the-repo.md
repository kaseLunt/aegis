---
id: D-005
type: decision
title: Fable session is the external scheduler; the repo is the governance layer
status: accepted
date: 2026-07-21
approved_by: klunt (2026-07-21, session ratification)
supersedes: []
updated: 2026-07-21
---

# D-005 — Fable session is the external scheduler; the repo is the governance layer

## Context
External review verdict: "External tools orchestrate the agents; this repository governs the
work they are supposed to perform. That can be a perfectly good architecture — but the
interface between those two layers has not been implemented yet." The repo has one global
active_task and no agent identity, lease, heartbeat, worktree-ownership, or merge model.

## Decision
Adopt the two-layer architecture explicitly:

- **Scheduler layer (external): the Fable/Claude Code session.** It assigns work, runs
  subagents (which share the session's working tree and NEVER commit independently),
  sequences merges, and handles retries/cancellation. Parallelism today is session-internal
  fan-out under the ONE active work item.
- **Governance layer (this repo): roadmap/ + gates.** It owns intent, scope, evidence,
  capture, and transition rules. It is deliberately scheduler-agnostic.

## Repository contract for any scheduler
1. Serial commit authority: one active work item repo-wide (WIP=1); doctor-enforced.
2. Commits judged against staged control-plane state (scope gate); protected files are
   owner-only.
3. All work products, capture objects, and status transitions land as commits — chat and
   agent memory are never authoritative.
4. A scheduler wanting CONCURRENT committing agents must first implement the lease model
   (IDEA-001); until then, concurrent commits are out of contract.

## Consequences
- The honest claim is "governed serial development with session-internal parallelism",
  not "swarm orchestration".
- IDEA-001 records the upgrade path and its trigger.
