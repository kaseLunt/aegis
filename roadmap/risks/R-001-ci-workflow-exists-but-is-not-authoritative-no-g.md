---
id: R-001
type: risk
title: CI workflow exists but is not authoritative (no GitHub remote or branch protection)
status: closed
informs: []
review_when: date:2026-08-04
updated: 2026-07-22
---

# R-001 — CI workflow exists but is not authoritative (no GitHub remote or branch protection)

## Risk
`.github/workflows/control-plane.yml` exists, but the repository's only remote is the Codex
Sites remote — no GitHub remote, no upstream, no branch protection. Therefore:

- CI has never executed; "CI is the gate" (SYSTEM.md) is aspirational;
- local hooks are the only active enforcement, and hooks are bypassable by design
  (`--no-verify`, no python, other git clients);
- durable approval records (approved_by) are plain text any local actor could write.

## Bounding (updated 2026-07-21)
- RESOLVED IN PART: public GitHub remote created (https://github.com/kaseLunt/aegis); CI ran
  green on push (first-push run: doctor + 14/14 selftest on clean Linux checkout; repo recreated in W0C).
- RESIDUAL: branch protection on main is not enabled -- a direct push still bypasses PR
  gating, and local hooks remain bypassable by other git clients. Owner action: enable
  branch protection requiring the "Control plane" check when PR flow starts mattering.
- CLOSED 2026-07-22 (owner-directed, audit #2 follow-through): main protection enabled
  via API -- required checks "Control plane doctor" + "Product tests" (strict), force
  pushes and deletions blocked. Admins exempt (enforce_admins: false) BY DESIGN until
  [[D-007]]'s merge-queue machinery lands: the serial integrator pushes directly today,
  and required checks cannot pre-validate a direct push. D-007's pilot phase upgrades
  this to full enforcement + PR-only writers.

owner: klunt
