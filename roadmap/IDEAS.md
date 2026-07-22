# Ideas Hangar — how capture works

> Ideas and future-feature thinking are **first-class artifacts**, not bullets in a notes file.
> Each lives as its own file in `ideas/` so it survives the session that produced it and can be
> linked, reviewed, and promoted. This file explains the mechanism; it does **not** list the ideas
> (a hand-maintained list would drift — browse `ideas/`, or query by `informs:`).

## Where things go (capture the instant they appear)
| You have… | It becomes… | In… |
|---|---|---|
| a future feature / tangent | an **Idea** (`status: inbox` raw, or `candidate`) | `ideas/IDEA-*.md` |
| reusable knowledge / a finding | an **Insight** (`informs:` a horizon) | `insights/INS-*.md` |
| a chosen direction + rationale | a **Decision** | `decisions/D-*.md` |
| something that may invalidate the plan | a **Risk** | `risks/*.md` |

## The guarantee (why nothing dies with a session)
1. **In-session:** capture is mandatory (`RULES.md`) — write it before continuing, not at exit.
2. **Session-end harvest:** a safety-net pass files anything not captured in-session.
3. **Survival:** it's a committed repo file, not chat memory.
4. **No silent loss:** it sits as `candidate` with a `review_when` until a human reviews it — and a
   phase boundary can't be crossed while `review_due` items remain (`SYSTEM.md`).

## Promotion barrier (HITL)
Agents may **create** ideas/insights freely. Only **you, at a phase review**, may promote one into
committed roadmap work. An idea cannot become a requirement just by sitting here.
