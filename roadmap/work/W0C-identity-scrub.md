---
id: W0C
type: work
title: Purge work-email identity from history and prevent recurrence mechanically
phase: P0
status: committed
evidence_target: "Correct"
priority: 1
depends_on: [W0B]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
deliverables:
  - .githooks/pre-commit
evidence_receipts: []
review_when: event:repo-deletion-auth
invalidated_by:
  - .githooks/**
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

## Acceptance
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
- next: DONE: rewrite, identity tooth (negative-tested), R-002, re-stamps, global
  useConfigOnly, force-push (browsable repo clean; API confirms only personal email on main).
  REMAINING (owner-blocked): old commits still fetchable by direct SHA from GitHub cache --
  owner either runs `gh auth refresh -h github.com -s delete_repo` (then agent deletes) or
  deletes via web Settings -> Danger Zone; then agent recreates `aegis` public, pushes,
  re-verifies zero occurrences, closes this item.
- read_first: .githooks/pre-commit, roadmap/risks/R-002-*.md, this file.
- hazards: the tooth allowlist must NEVER contain the work domain string (it ships in a
  public file — the tooth must not leak the secret it guards); commit SHAs cited in roadmap
  files were remapped after the rewrite (old history no longer exists); the sites remote may
  still hold pre-rewrite history until next authenticated push.

## Evidence
- 2026-07-21: all 12 commits rebuilt via git commit-tree; `git log --format='%ae %ce' --all`
  → only kaselunt.dev@gmail.com; no file contents ever contained the domain (git grep, all revs).
- 2026-07-21: identity tooth blocked user.email=blocked@example.com (negative test).
- 2026-07-21: forced update pushed (45496b1 -> ea4ba3d); GitHub commits API on main lists
  only the personal email. Direct-SHA fetch of old history still returns cached objects --
  deletion pending owner auth (see handoff).
- 2026-07-21: global git config: user.useConfigOnly=true, user.email unset.
