---
id: IDEA-003
type: idea
title: Adopt upgraded control-plane bundle (receipts, snapshot coherence, server-side approval) - full migration inventory
status: promoted
informs: [R-005, D-007]
review_when: date:2026-08-05
updated: 2026-07-22
---

# IDEA-003 — Adopt upgraded control-plane bundle (receipts, snapshot coherence, server-side approval) - full migration inventory

Owner upgraded the control-plane skill after a deep audit; this repo runs the previous
generation, locally hardened through audits #1–#2. Empirical reconciliation (2026-07-22,
throwaway clone, no changes to the live tree):

- `manage.py plan` (read-only) REFUSES: 6 managed tools diverge with no prior receipt +
  an old-format AGENTS.md managed block. Correct fail-closed behavior, and the reason a
  blind `apply` is impossible by design.
- Bundled doctor vs our corpus: 88 errors in 9 classes — exact `## Acceptance` headers
  (11), `evidence_receipts` on achieved work (11 — receipts are staged files under
  roadmap/evidence/, stamped via `--receipt-basis`), `deliverables` (7), `claim_id` (7),
  insight/goal status vocabulary (6), `## Canonical commands` (4), missing `updated`
  (3), STATUS `project_state` + `writer_mode`, changed fingerprint algorithm +
  invalidated_by scope grammar (self-path no longer implicit), frontmatter quoting (2).
- Seed collision: installer seeds D-001/D-002 under different filenames → duplicate ids
  vs our existing D-001/D-002; must be skipped/reconciled, not applied.

## Why adopt (in full, as a migration)
The bundle mechanically closes MOST of R-005 and pre-builds D-007 prerequisites:
snapshot-coherent validation (`--snapshot index|commit` — kills the doctor-worktree vs
gate-index split, R-005 item 2), real lease/base_commit/ancestry validation (items 3–4),
`claim_id` + generation shape (D-007 fencing), fully-synthetic selftests that build
disposable git repos (the stale-green class we patched twice today, solved
architecturally), evidence receipts (stronger than frontmatter stamps), and SERVER-SIDE
owner approval (repository-variable/PR token) replacing the cooperative
AEGIS-OWNER-APPROVED commit marker.

## Migration inventory (one tracked work item, est. W0F)
1. Replace 6 tools + add `_control_plane.py` + receipt via the installer's conflict
   resolution path; regenerate AGENTS.md managed block (preserve project-owned text).
2. Convert ~35 roadmap objects: section headers, deliverables/evidence_receipts/
   claim_id/updated fields, status vocabulary, STATUS writer_mode+project_state.
3. Author evidence receipts for 11 achieved items — HONESTLY: re-run each item's
   canonical commands and record real receipts (npm test for W-items; WR lanes need an
   owner call on what a research receipt is).
4. Port repo-specific policy the bundle doesn't know: pre-commit identity allowlist
   (R-002), pre-push selftest gate, CI workflow charter (owner-approved in 9e4d0d8),
   ladder-table projection if kept. Historical AEGIS-OWNER-APPROVED markers remain
   valid history; new protocol applies forward.
5. Re-stamp all fingerprints under the new algorithm; full selftest + CI green before
   any claim of completion.

## Why NOT blind-apply today
Fail-closed refusal is the system working; receipts require real re-runs, policy
porting is judgment work, and per our own rules a change of this scope is a committed
work item with owner approval — not a side effect of an audit question.
