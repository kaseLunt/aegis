---
id: D-009
type: decision
title: Commit policy under the bundle - linear history, no AI attribution (continuity)
status: accepted
approved_by: klunt (2026-07-22, W0F migration ratification)
date: 2026-07-22
supersedes: []
updated: 2026-07-22
---

# D-009 — Commit policy under the bundle

This file occupies the installer's create-only seed slot as an adopted record. Commit
policy continuity: [[D-002]] (no AI attribution, ever) remains binding; the bundle adds
the linear-chain integration rule — fast-forward or trivial two-parent merges whose tree
equals the up-to-date second parent; no squash/rebase integration (claim/evidence
bindings depend on it). Owner-gated transitions go through PRs with the server-side
CONTROL_PLANE_POLICY_APPROVAL token; historical AEGIS-OWNER-APPROVED markers remain
valid history.
