---
id: D-002
type: decision
title: No AI attribution in git history — ever
status: accepted
date: 2026-07-21
supersedes: []
---

# D-002 — No AI attribution in git history

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
