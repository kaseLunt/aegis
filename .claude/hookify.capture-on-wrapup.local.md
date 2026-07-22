---
name: capture-on-wrapup
enabled: true
event: prompt
action: warn
conditions:
  - field: user_prompt
    operator: regex_match
    pattern: "wrap up|wrapping up|stopping|call it a day|end the session|done for (the day|now|today)|let'?s (stop|end|wrap)"
---

CAPTURE REMINDER (triggered by wrap-up language).

NOTE: this is NOT a true session-end hook -- nothing runs after the terminal closes. Continuous
in-session capture is the real safety net (see RULES.md). This is only a bonus nudge.

Re-scan the session for anything unfiled: future features -> roadmap/ideas/, knowledge ->
roadmap/insights/ (with informs:), decisions -> roadmap/decisions/, blockers -> roadmap/STATUS.md.
Then update STATUS.md on transitions. Capture is not commitment -- only a phase review promotes.
