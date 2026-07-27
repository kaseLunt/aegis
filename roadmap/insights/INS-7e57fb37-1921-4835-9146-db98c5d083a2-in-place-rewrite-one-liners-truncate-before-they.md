---
id: INS-7e57fb37-1921-4835-9146-db98c5d083a2
type: insight
title: "in-place rewrite one-liners truncate before they read -- write-open evaluates first"
status: candidate
informs: ["INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab"]
review_when: date:2026-08-10
updated: 2026-07-27
---

# INS-7e57fb37-1921-4835-9146-db98c5d083a2 — in-place rewrite one-liners truncate before they read -- write-open evaluates first

**Context.** The G35 correction pass (2026-07-26) prescribed this CRLF-normalization
one-liner to a subagent:
`open(p,'wb').write(open(p,'rb').read().replace(b'\r\n',b'\n'))`.
Python evaluates the CALLEE expression before its argument: `open(p,'wb')` truncates the
file to 0 bytes, and only then does `open(p,'rb').read()` run — reading the now-empty
file. Both target files (the 86 KB dossier, the 84 KB blueprint) were zeroed mid-pass.

**Evidence.** Subagent incident disclosure in the correction-pass report (task
`a3168410f65d424fd`); recovery from HEAD blobs via read-only `git show HEAD:<path>`
verified byte-identical by `git hash-object` before the edits were re-applied. Recovery
was possible ONLY because both files were tracked and committed — an untracked draft
would have been unrecoverable.

**Consequence.** Same hazard family as [[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]]
(stamp-time hygiene commands destroying the work they groom). Binding pattern for every
normalization/rewrite command, especially any prescribed to a subagent verbatim:
1. READ FULLY into a variable first, THEN open for write:
   `b = open(p,'rb').read(); open(p,'wb').write(b.replace(...))` — never nest the read
   inside the write call.
2. Prefer an assertion that the written size is plausible (e.g. `assert len(n) > 0`).
3. Never run a hygiene rewrite on a file that is not committed or otherwise recoverable.
