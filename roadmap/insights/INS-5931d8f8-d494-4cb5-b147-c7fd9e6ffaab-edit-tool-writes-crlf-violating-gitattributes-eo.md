---
id: INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab
type: insight
title: "Edit tool writes CRLF violating .gitattributes eol=lf; worktree-snapshot receipt validation fails at stamp time on Windows"
status: candidate
informs: [W4, W5]
review_when: date:2026-08-06
updated: 2026-07-23
---

# INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab — Edit tool writes CRLF violating .gitattributes eol=lf; worktree-snapshot receipt validation fails at stamp time on Windows

## Context
`.gitattributes` mandates `* text=auto eol=lf` — LF in the repo AND the working tree. But
the Edit tool, editing `lib/aegis/identity/compare.ts` and `observe.ts` repeatedly across
the W4 convergence, wrote CRLF into the worktree. git's normalized diff hid this (a
CRLF worktree file compares clean against its LF blob), so `git status` stayed clean and
nothing flagged it — until the achieved stamp.

## Evidence (W4 stamp, 2026-07-23)
- The pre-commit hook runs `doctor.py` with NO `--snapshot` → default `worktree`. The
  worktree Snapshot reads RAW filesystem bytes (CRLF), while the evidence receipt's
  input_fingerprint was minted via `--receipt-basis --snapshot HEAD` from git blobs (LF).
- Result: `EV-W4: current inputs/deliverables differ from the tested commit` at commit
  time, even though `git diff` was empty and `--snapshot index` (staged blobs, LF) passed.
  The mismatch was purely CRLF(worktree) vs LF(blob) on the two edited files.
- Fix that landed: strip `\r` from the fingerprinted worktree files (LF), bringing them
  into compliance with `.gitattributes eol=lf`. Byte count unchanged vs HEAD (identical
  content), `git diff` empty, doctor green under BOTH worktree and index. W3 stamped fine
  earlier only because its deliverable files happened to be LF in the worktree.

## Consequence — standing guidance
1. On Windows, after editing any file that feeds an evidence receipt (a work item's
   deliverables/invalidated_by paths), verify LF before minting/stamping:
   `python -c "print('CRLF' if b'\r\n' in open(P,'rb').read() else 'LF')"`, and strip `\r`
   if needed. The receipt basis is LF (git blobs); the pre-commit doctor reads worktree
   raw — they only agree when the worktree is LF.
2. A clean `git status` does NOT prove LF worktree — git's eol normalization hides CRLF in
   the diff. Check bytes directly.
3. Residual eol-index state: after normalizing, `git status` may still show the files `M`
   (a pending eol renormalization in the index) even though content is byte-identical to
   HEAD and `git diff` is empty. It is benign — it does not block commit or push (doctor
   reads worktree LF and passes) — but it is untidy. `git checkout -- <file>` to clear it
   was blocked by the auto-mode classifier this session; `git add --renormalize <file>`
   is the non-destructive alternative when a scoped claim permits touching those paths.
4. Proper durable fix (out of W4 scope): the doctor's worktree Snapshot should read files
   through git's eol filter (LF) rather than raw bytes, so a compliant CRLF-checked-out
   worktree cannot diverge from LF blob fingerprints. Candidate for a tooling-scoped task.
