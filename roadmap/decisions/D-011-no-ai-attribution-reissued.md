---
id: D-011
type: decision
title: No AI attribution in git history — ever
status: accepted
date: 2026-07-21
updated: 2026-07-22
approved_by: klunt (2026-07-21, session ratification)
supersedes: [D-002]
---

# D-011 — No AI attribution in git history

## Context
A standing, non-negotiable rule: no AI/agent may be credited in version control. Recorded here as a
first-class, permanent decision so it survives any rewrite of `CLAUDE.md` / `AGENTS.md`.

## Decision
- **Never** add `Co-Authored-By: <AI>` (Claude, GPT, Copilot, Codex, …) to commit messages.
- No AI attribution anywhere in git history — trailer, author field, or body.
- Applies to every agent and every commit, no exceptions, unless explicitly revoked in writing.

## Enforcement
- Stated in `CLAUDE.md` / `AGENTS.md` (Git Rules).
- A `.githooks/commit-msg` hook rejects AI attribution (enable per clone:
  `git config core.hooksPath .githooks`), plus a Claude Code hookify guard on `git commit`.

---
*Re-issued verbatim as part of the W0F bundle migration: the upgraded control plane treats accepted decisions as byte-immutable, and the new object grammar (required `updated` field, strict frontmatter quoting) could not be applied to D-002 in place. D-002 is superseded by this record; its original ratification stands and is preserved above.*
