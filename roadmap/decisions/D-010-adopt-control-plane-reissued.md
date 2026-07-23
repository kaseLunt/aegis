---
id: D-010
type: decision
title: Adopt the repo-native, evidence-derived control plane
status: accepted
date: 2026-07-21
updated: 2026-07-22
approved_by: klunt (2026-07-21, session ratification)
supersedes: [D-001]
---

# D-010 — Adopt the control plane

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

---
*Re-issued verbatim as part of the W0F bundle migration: the upgraded control plane treats accepted decisions as byte-immutable, and the new object grammar (required `updated` field, strict frontmatter quoting) could not be applied to D-001 in place. D-001 is superseded by this record; its original ratification stands and is preserved above.*
