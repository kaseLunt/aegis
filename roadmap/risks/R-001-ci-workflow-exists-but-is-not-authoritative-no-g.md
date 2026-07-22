---
id: R-001
type: risk
title: CI workflow exists but is not authoritative (no GitHub remote or branch protection)
status: open
informs: []
review_when: date:2026-08-04
updated: 2026-07-21
---

# R-001 — CI workflow exists but is not authoritative (no GitHub remote or branch protection)

## Risk
`.github/workflows/control-plane.yml` exists, but the repository's only remote is the Codex
Sites remote — no GitHub remote, no upstream, no branch protection. Therefore:

- CI has never executed; "CI is the gate" (SYSTEM.md) is aspirational;
- local hooks are the only active enforcement, and hooks are bypassable by design
  (`--no-verify`, no python, other git clients);
- durable approval records (approved_by) are plain text any local actor could write.

## Bounding
- Local gates fail closed on staged state (W0B) and the selftest suite runs wherever CI
  eventually does.
- Owner decision pending: create a GitHub remote + branch protection, or accept local-only
  enforcement and keep prose narrowed accordingly.

owner: klunt
