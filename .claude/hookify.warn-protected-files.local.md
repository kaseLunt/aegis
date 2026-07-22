---
name: warn-protected-files
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: roadmap[/\\]archive[/\\]|roadmap[/\\](VISION|SYSTEM)\.md$
---

PROTECTED / approval-gated file.

- roadmap/archive/**  -- quarantined legacy with zero authority; should almost never change.
- roadmap/VISION.md / roadmap/SYSTEM.md  -- the north star and the control-plane constitution;
  changes need explicit user approval and a Decision record.

Confirm this edit is intended and approved before proceeding.
