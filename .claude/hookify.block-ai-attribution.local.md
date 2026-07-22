---
name: block-ai-attribution
enabled: true
event: bash
action: block
conditions:
  - field: command
    operator: contains
    pattern: git commit
  - field: command
    operator: regex_match
    pattern: "[Cc]o-?[Aa]uthored-?[Bb]y|[Gg]enerated with"
---

COMMIT BLOCKED -- no AI attribution in git history.

This `git commit` contains an AI/agent attribution line (Co-Authored-By or "Generated with...").
Remove it and re-issue with a clean message. No AI or agent may be credited anywhere in git history.
Rule of record: roadmap/decisions/D-002-no-ai-attribution.md.

(ASCII-only on purpose: emoji broke the hookify parser on Windows. Robot-emoji footers are still
caught by the git commit-msg hook, which reads UTF-8 reliably.)
