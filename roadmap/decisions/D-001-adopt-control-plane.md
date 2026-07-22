---
id: D-001
type: decision
title: Adopt the repo-native, evidence-derived control plane
status: accepted
date: 2026-07-21
supersedes: []
---

# D-001 — Adopt the control plane

## Context
This project needs a tracking system that does not go stale: long-term vision stays visible,
status reflects reality, and ideas/decisions survive the sessions that produce them.

## Decision
Adopt the repo-native control plane (`roadmap/`): **intent is stored; status is derived from
evidence.** One source of truth in version control; views are projections; capture is continuous;
enforcement is via hooks (nudge) and CI (gate). See `roadmap/SYSTEM.md`.

## Consequences
- The repo is the only authoritative project state. Nothing authoritative lives in chat.
- Status fields are commit-stamped and auto-invalidate when inputs change.
