---
id: INS-8ae8601e-5d15-4a36-8412-0e08504abcb1
type: insight
title: "local tooling caches must be git-excluded or every D-004 clean-tree gate halts"
status: candidate
informs: ["D-004"]
review_when: date:2026-08-10
updated: 2026-07-27
---

# INS-8ae8601e-5d15-4a36-8412-0e08504abcb1 — local tooling caches must be git-excluded or every D-004 clean-tree gate halts

**Context.** The independent Codex review of the G35 dossier (job `task-ms2nossx-hnnne2`,
2026-07-26) self-halted per D-004 fail-closed discipline: `git status --short --branch`
reported an untracked `.serena/` directory (the Serena MCP language-server cache, created
at session start), so the worktree was "not clean" and the reviewer refused to certify.
No verdict was issued; the lane lost a full dispatch round-trip to tooling lint.

**Evidence.** Codex session `019fa193-bbd6-7513-b4d7-bce1f25cf65b` terminal output:
"Blocked by repository policy D-004 … untracked `.serena/` directory … no verdict is
issued." The directory was visible as `?? .serena/` from the very first `git status` of
the session — the halt was predictable.

**Consequence.** Any local-only tooling artifact that git reports as untracked will block
EVERY downstream clean-tree gate (Codex dispatches, scope-gate preconditions, doctor
checks) until classified. Fix pattern: classify it truthfully at first sight — local
tooling caches go in `.git/info/exclude` (local, no commit, no `allowed_paths` collision);
project-conventional files (e.g. `.serena/project.yml`) may instead be committed via an
owner-approved `.gitignore`/tracking decision. Deleting the artifact or bypassing the gate
is never the fix (D-004). Applied 2026-07-26: `.serena/` added to `.git/info/exclude`,
tree reports clean, review re-dispatched.
