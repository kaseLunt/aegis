---
id: INS-fa971e14-587c-4565-907e-839ec51a3101
type: insight
title: "codex-reviewer worktree dispatch: Windows MAX_PATH failure triggers destructive rm -rf of shared temp"
status: candidate
informs: [W4, W5]
review_when: date:2026-08-06
updated: 2026-07-23
---

# INS-fa971e14-587c-4565-907e-839ec51a3101 — codex-reviewer worktree dispatch: Windows MAX_PATH failure triggers destructive rm -rf of shared temp

## Context
The codex-reviewer dispatch pins its review to a specific commit by creating a detached
git worktree. On Windows it defaulted the worktree under the deeply-nested session
scratchpad path (`C:/Users/kasel/AppData/Local/Temp/claude/C--Users-kasel-.../<session>/
scratchpad/...`). Checking out the roadmap tree there exceeded the Windows MAX_PATH limit
(long roadmap object filenames on top of the already-deep base), so `git worktree add`
failed with "Filename too long".

## Evidence (W4 pass 12, 2026-07-23)
- After the failed worktree add, the subagent ran
  `rm -rf "C:/Users/kasel/AppData/Local/Temp/claude/C--Users-kasel-source-repos-etherfi-aegis"`
  intending to clean "its own" remnants — but that path is the SHARED per-repo parent for
  ALL sessions. It deleted the integrator session's task-tracking dir
  (`c74afffe-…`), which surfaced as an ENOENT on the very next tool's output file.
- Blast radius was ephemeral only: the git repo at
  `C:\Users\kasel\source\repos\etherfi\aegis` was untouched; the in-flight push still
  completed (verified HEAD == origin/main afterward); `git worktree list` stayed clean (no
  prune needed). Temp task dirs are recreated by the harness on the next tool call.
- The subagent correctly HALTED and reported instead of trying to recover — the D-004
  fail-closed reflex worked; the defect was the destructive cleanup attempt itself.

## Consequence — standing guardrails for codex-reviewer dispatch (Windows)
1. Always instruct a SHORT worktree path directly under a drive root (e.g. `C:/wt/<tag>`),
   never under the nested Temp scratchpad — avoids MAX_PATH entirely.
2. Explicitly forbid `rm -rf` / `git worktree remove --force` of any path the dispatch did
   not itself create this run, and NEVER any shared Temp parent. On setup failure: halt and
   report, do not "clean up" (D-004).
3. Prefer no-worktree review when main is quiet: serial-writer mode means the only thing
   advancing main during a review is the integrator's own STATUS commits — holding those
   until the verdict lands removes the diff-skew that motivated pinning.
4. These constraints are now part of every codex-reviewer brief (see the pass-12 re-dispatch).
