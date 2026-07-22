---
id: W0C
type: work
title: Purge work-email identity from history and prevent recurrence mechanically
phase: P0
status: active
evidence_target: "Correct"
priority: 1
depends_on: [W0B]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
review_when: phase:P1:entry
invalidated_by:
  - .githooks/**
  - roadmap/work/W0C-identity-scrub.md
updated: 2026-07-21
---

# W0C — Identity scrub (work email must never appear publicly)

**Why this advances the vision:** this is a portfolio project; its public artifacts must be
associated only with the owner's personal identity. An identity leak is the connective-tissue
class again — mechanical homes, not vigilance (D-004 rule 9).

## Hypothesis / objective
Remove the work email from all git history, replace the public repo so no cached objects
survive, and make wrong-identity commits mechanically impossible in this repo (pre-commit
allowlist tooth) and unlikely machine-wide (global useConfigOnly).

## Acceptance (evidence target: Correct)
- Correct: zero work-domain occurrences across all refs/history locally and on the recreated
  public repo (verified via GitHub API); identity tooth blocks a non-allowlisted
  user.email, negative-tested; global git config has useConfigOnly=true and no default email.

## Non-goals
- Auditing the OTHER affected project (owner-flagged; tracked in R-002, needs its own pass).
- GitHub account-level email settings (browser-only; owner action, listed in R-002).

## Canonical commands
```bash
git log --format='%ae %ce' --all | sort -u
python roadmap/tools/doctor.py
```

## Handoff
- next: history rewritten (commit-tree rebuild, identities only, dates/trees/messages
  preserved); remaining: identity tooth in pre-commit (negative-test), R-002 capture,
  re-stamp W0/W0A/W0B (githooks changed), global useConfigOnly, delete+recreate GitHub repo,
  push, API-verify zero occurrences.
- read_first: .githooks/pre-commit, roadmap/risks/R-002-*.md, this file.
- hazards: the tooth allowlist must NEVER contain the work domain string (it ships in a
  public file — the tooth must not leak the secret it guards); commit SHAs cited in roadmap
  files were remapped after the rewrite (old history no longer exists); the sites remote may
  still hold pre-rewrite history until next authenticated push.

## Evidence
(pending — filled at close)
