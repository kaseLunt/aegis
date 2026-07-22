---
id: R-005
type: risk
title: Control-plane residual gaps from external audit 2 - scope-diff breadth, atomicity, lease semantics
status: open
informs: []
review_when: date:2026-08-05
updated: 2026-07-22
---

# R-005 — Control-plane residual gaps from external audit #2

Source: owner-commissioned Codex audit of the control plane itself
(roadmap/reviews/control-plane-codex-audit-2026-07-22.md). Items verified real but NOT
fixed in the immediate pass — each is bounded today by the single-writer model and
becomes live when concurrent repository writers start (pre-W5/M2 planning gate).

## Deferred items (verbatim classes from the audit)
1. scope_diff reviews metadata (protected files, charter/claim changes) but does not
   check ordinary changed files against the authoring lane's scope; misses some
   addition/rename/deletion and malformed-frontmatter cases. Needs commit→lane
   attribution design (e.g. AEGIS_AGENT trailer) before it can be closed.
2. Doctor reads working-tree control state; scope gate reads the staged index — a
   staged-vs-tree divergence can pass one and fail the other.
3. Lease validation checks timestamp SHAPE only (regex), not real-datetime validity.
4. base_commit is format-checked, never verified to exist / be an ancestor.
5. Claim `worktree` field unused; claim acquisition optimistic, not atomic across
   worktrees; claim transition + archival not atomic (evidenced by the orphaned
   untracked archive claim this audit found); lane self-release does not work as
   documented.
6. Deliverables need only exist in the working tree — not staged or tracked.
7. Git command failures in several permission paths unchecked.
8. Capture ID allocation can race across different filenames.
9. Phase review/event triggers informational, not executable.
10. Doc conflicts: D-005/D-006/SYSTEM/AGENTS WIP language; AGENTS still describes
    unrestricted roadmap/** capture (gate v3 narrowed it); W0C vs R-002 disagree on
    repo-recreation status.

## Bounding
- Single serial writer (fable-main) + read-only reviewers today: items 1–8 have no
  reachable failure path that the gate v3 + doctor + CI metadata review doesn't already
  fence for one writer.
- Trigger to act: BEFORE opening a second concurrent WRITER lane (D-006 round 2), items
  1, 2, 5 are prerequisites; the rest ride along in the same hardening pass.

owner: klunt · review_when: phase:P1:exit

