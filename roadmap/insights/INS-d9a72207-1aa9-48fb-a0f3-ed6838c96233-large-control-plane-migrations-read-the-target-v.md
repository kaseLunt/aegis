---
id: INS-d9a72207-1aa9-48fb-a0f3-ed6838c96233
type: insight
title: "Large control-plane migrations: read the target validator fully first; budget for the Windows byte/mode tax and the bootstrap barrier"
status: candidate
informs: [D-007]
review_when: date:2026-08-06
updated: 2026-07-23
---

# INS-d9a72207-1aa9-48fb-a0f3-ed6838c96233 — Large control-plane migrations: read the target validator fully first; budget for the Windows byte/mode tax and the bootstrap barrier

The W0F bundle adoption took far longer than its diff size suggests (~2h). The cost split
three ways; only the third is avoidable, and it is the lesson.

## 1. Intentional bootstrap barrier (inherent)
The upgraded validator cannot parse or authorize a PRE-migration base: strict frontmatter
(an unquoted apostrophe title = unterminated string), required STATUS authority fields,
and claim fencing fields must already exist on the parent before the flip commit can be
authorized. "One atomic flip" is therefore impossible; the migration is a prepared chain
(quote-fix -> forward-compat fields -> flip -> corrections). Each prerequisite was
revealed by hitting the gate, not read ahead.

## 2. Stronger evidence model (inherent, correct)
Achieved status now needs evidence receipts bound to a tested commit with contract +
input fingerprints that must match at both the tested and current snapshots. Corrections
that touch a work item's contract must land in their own commit so the receipt's tested
ancestor stays coherent (why W0F needed B0/B1 correction commits before the receipts).

## 3. Windows connective-tissue tax (INS-001 class, amplified)
core.autocrlf=true + core.fileMode=false: the new fingerprint hashes raw bytes AND file
mode, so CRLF-in-worktree/LF-in-git files and 100644-vs-100755 hooks broke fingerprints
while `git diff` showed nothing. The old system did not hash bytes+mode, so this class was
invisible before.

## The avoidable part — the actual lesson
Most self-inflicted time came from discovering the ~4000-line validator's constraints
reactively (block -> diagnose -> fix) instead of reading doctor/scope_gate/claim grammar
fully FIRST and preparing the base in one or two deliberate commits. Plus concrete
own-goals: a regex  backreference wrote a literal 0x01 byte into STATUS; a /tmp path
resolved differently in Python-on-Windows than bash (silent no-op copies); cp dropped an
exec bit; a -u stash half-failed on permission-denied dirs and split state across tree +
stash; a double-quoted heredoc executed a backticked token.

## Standing practice for the next large control-plane change (e.g. D-007 machinery)
- Read the target validator's grammar END TO END before touching the corpus; enumerate
  every required field, status vocabulary, immutability rule, and fingerprint input.
- Plan the prep chain up front: what must the base carry so the flip authorizes cleanly?
- Renormalize line endings and file modes to match git BEFORE relying on any byte/mode
  fingerprint (git add --renormalize; check `ls-files --eol` and staged modes).
- Author corpus edits in Python files (Write tool), not inline shell heredocs — no regex
  backreferences in shell-expanded strings, no backticks/$() in double-quoted heredocs,
  no /tmp assumptions from Python on Windows.
- Prefer a fresh `git clone --local` sandbox for dry-runs over `-u` stashes on a tree with
  permission-locked untracked dirs (node_modules, build output).
