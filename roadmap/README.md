# Project Cockpit

This folder is the **single source of truth** for where this project is going and where it is
right now. It exists so long-term vision never gets buried under tangential work.

## How to view it
Plain Markdown — open in VS Code (`Ctrl+Shift+V` preview), Obsidian (open the repo as a vault),
or GitHub. Daily glance: **`STATUS.md`** ("where are we") next to **`ROADMAP.md`** ("the plan").

## The files
| File | Answers | Changes |
|------|---------|---------|
| `VISION.md`  | Why we're doing this; what "done" ultimately looks like | Rarely (phase reviews) |
| `ROADMAP.md` | The plan from here → there | Per phase |
| `STATUS.md`  | Where we are *right now*: phase, the one current task, blockers | Every work session |
| `IDEAS.md`   | How tangents/future ideas are captured (parking lot) | — |
| `RULES.md`   | Scope discipline + session protocol | Rarely |
| `SYSTEM.md`  | The control-plane constitution: how state stays non-stale | Rarely (Decision required) |

## Typed objects
`horizons/` goals & stages · `work/` work-orders · `ideas/` · `insights/` · `decisions/` ADRs ·
`risks/` · `evidence/` · `archive/` quarantined legacy · `views/` generated projections.

## The one law
**The repo is the only authoritative state.** Status changes ship with the work, on transitions.
Nothing authoritative lives in chat, agent memory, or an external tool.
