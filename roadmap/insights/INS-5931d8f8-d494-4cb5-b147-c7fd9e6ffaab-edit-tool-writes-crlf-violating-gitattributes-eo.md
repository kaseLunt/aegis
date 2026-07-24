---
id: INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab
type: insight
title: "Edit tool writes CRLF violating .gitattributes eol=lf; worktree-snapshot receipt validation fails at stamp time on Windows"
status: candidate
informs: [W4, W5]
review_when: date:2026-08-06
updated: 2026-07-24
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

## Addendum (W5 S0, 2026-07-24): the same tool also emits raw CONTROL characters, silently
The CRLF finding above is one instance of a wider class: **the Write/Edit path interprets
escape sequences instead of writing them literally.** Asking it to write the six characters
`\u0000` inside a template literal produced a single raw NUL byte in the file. This happened
THREE times in one session — in lib/aegis/surfaces/request.ts, in a new test's regex character
class, and even in the prepared git commit message — each time silently.

Why it is dangerous, and why nothing caught it:
- A raw control character makes git classify the file as BINARY. It is then exempt from
  `.gitattributes * text=auto eol=lf` and lands in history as an opaque blob that diffs as
  `Bin 0 -> 5736 bytes` and cannot be reviewed line by line.
- Every normal gate stays GREEN: the code compiles, `tsc --noEmit` is clean, eslint is clean,
  and the whole suite passes — because a control character is a perfectly legal string
  character. It was found only by reading a diffstat.
- Same root as the CRLF case: the editor writes bytes the repo forbids, and git's own
  normalisation/rendering hides the divergence until stamp time.

Standing guidance:
1. NEVER author `\uXXXX` / `\xXX` escape sequences through Write/Edit. Build such content
   with Bash + python using numeric byte construction (`bytes([0])`, `bytes([92]) + b'u0000'`),
   which is how all three instances above were repaired. The Bash tool additionally refuses
   commands containing raw control characters, so numeric construction is required there too.
2. The tooth for this class now exists: `tests/repo-source-hygiene.test.ts` fails on any raw
   control character (other than tab/newline, and INCLUDING carriage return, so it doubles as a
   CRLF check) across lib/, app/, tests/, components/. It was written RED against the live NUL
   and immediately found two pre-existing instances nobody knew about:
   tests/manifest-properties.test.ts (two NULs that are DELIBERATE test data for the
   latin1-collision property — re-encoded as escapes, identical runtime value, intent intact)
   and tests/w4-codex-fixes.test.ts (a CRLF worktree, the exact residue this insight predicted,
   invisible in `git diff` because its committed blob was always LF).
3. Consequence for item 4 of the Consequence list above: the durable doctor fix should read
   worktree files through git's eol filter AND reject control characters, since both defects
   are the same failure — worktree bytes diverging from what the repo permits.
