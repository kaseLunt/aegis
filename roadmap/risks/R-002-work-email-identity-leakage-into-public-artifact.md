---
id: R-002
type: risk
title: Work-email identity leakage into public artifacts (residuals beyond this repo)
status: open
informs: []
review_when: date:2026-08-04
updated: 2026-07-21
---

# R-002 — Work-email identity leakage into public artifacts (residuals beyond this repo)

## Risk
The owner's work email was the machine-wide git default and appeared as author/committer on
all commits of this repo's first public push. Scrubbed here (W0C), but residuals remain
OUTSIDE this repo's control:

1. **Another project** (owner-reported) has public commits/interactions under the work
   email — needs its own audit + rewrite pass (same playbook as W0C).
2. **GitHub account settings** (browser-only, owner action):
   - Settings → Emails: remove/unverify the work email from the personal account if present;
   - enable "Keep my email addresses private" and "Block command line pushes that expose my
     email".
3. **The sites remote** for this repo may retain pre-rewrite history until the next
   authenticated push replaces it.
4. Any other repos on this machine created before global useConfigOnly was set may carry the
   work identity in local config or history.

## Bounding (this repo)
- History rebuilt with personal identity only; public repo deleted and recreated so no cached
  objects survive; zero work-domain occurrences verified via GitHub API at close of W0C.
- Pre-commit identity allowlist blocks non-allowlisted user.email/env identities
  (negative-tested; the allowlist never names the excluded domain).
- Machine-wide: git config --global user.useConfigOnly=true with no default email — a repo
  without explicit identity fails to commit instead of leaking.

owner: klunt
