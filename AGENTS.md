# Aegis — Protocol Flight Recorder (ether.fi)

Independent Record / Rehearse / Rewind assurance workbench for ether.fi's public control and
exposure surfaces. Currently **milestone 0** (deterministic prototype); target defined in `docs/`.

## Authority (read before claiming anything)
- **Product canon:** `docs/` — hierarchy in `docs/README.md` (threat model wins on claim strength;
  engineering spec on machine behavior; product spec on UX language; `docs/ROADMAP.md` on status).
- **Execution cockpit:** `roadmap/` — derives from `docs/`; on conflict `docs/` wins
  (see `roadmap/decisions/D-003-docs-canon-authority.md`).
- No UI label, commit message, or status note may claim more than the canonical result schema and
  current milestone allow. Describe the implementation by the highest completed milestone.

<!-- BEGIN control-plane session protocol (injected by the control-plane skill) -->

## Project Context (control plane)

This project uses a repo-native control plane. **Read `roadmap/VISION.md` first**, then
`roadmap/SYSTEM.md` (how the project tracks itself). **Intent is stored; status is derived from evidence.**

## Session Protocol

### On Session Start
Read, in order: `roadmap/STATUS.md` (current task, blockers) → `roadmap/ROADMAP.md` (active phase)
→ `roadmap/SYSTEM.md` (the rules) → the active work item under `roadmap/work/`.

### During Work — capture is MANDATORY, continuously (not at exit)
The instant something outlives the current task, write it to its home **before continuing** — never
leave a first-class idea living only in chat. The user often just closes the terminal; nothing runs
after that, so capture as you go.
- future feature / tangent → `roadmap/ideas/IDEA-*.md` (`status: inbox` for a raw dump to triage later)
- reusable knowledge / finding → `roadmap/insights/INS-*.md` (with `informs:`)
- chosen direction + rationale → `roadmap/decisions/D-*.md`
- blocker → `roadmap/STATUS.md`; plan-threatening risk → `roadmap/risks/`

Agents may **create** ideas/insights freely; only a phase review may **promote** them (HITL barrier).

### On Session End — harvest safety net
Scan the session for ideas/insights/decisions/blockers/**future-progress** not yet filed; create the
missing objects in `roadmap/{ideas,insights,decisions,risks}/`; update `roadmap/STATUS.md` on
transitions; give a one-line sync summary. No narrative session-dumps.

## Git Rules
- **NEVER add Co-Authored-By lines to commits.** No AI/agent attribution in git history — trailer,
  author field, or body. Ever. (See `roadmap/decisions/D-002-no-ai-attribution.md`.)
- Conventional commits (feat/fix/refactor/docs); status updates ride with the work, on transitions.

## Autonomy Rules
- **Proceed without asking:** the active work item, queued work, bug fixes, tests, docs, and capturing ideas/insights.
- **Ask first:** new architectural decisions, reprioritizing phases, editing `VISION.md`, new dependencies, promoting an idea into committed work.

Full model: `roadmap/RULES.md` and `roadmap/SYSTEM.md`.

<!-- END control-plane session protocol -->

## Executor Discipline (D-004 — binding for every agent)

- **Fail closed, halt loudly.** On any precondition you don't own — dirty tree, failing gate,
  unexpected state — report the root cause and STOP. Never delete, never `--no-verify`, never
  "helpfully" fix outside your commit scope. Bypass switches (`--no-verify`,
  `AEGIS_SCOPE_OVERRIDE=1`) are for the human owner only.
- **Commit scope = the active work item's `allowed_paths`** (plus `roadmap/**` capture, always).
  Enforced by `roadmap/tools/scope_gate.py` against the **staged index** when a task is active;
  fails closed on missing scope state. `roadmap/{VISION,SYSTEM,RULES}.md` are owner-only
  surfaces regardless of task. Out-of-scope work: park the task or get `allowed_paths`
  amended — don't push through. (Local hooks nudge; authoritative CI pends a remote — R-001.)
- **Handoff at every transition.** Keep the active item's `## Handoff` (next / read_first /
  hazards) current enough that a cold session resumes in minutes. Doctor-enforced.
- **Teeth habit.** A confirmed finding lands TWO artifacts: the fix and a machine check that
  catches the class (test, fixture, doctor rule, hook), negative-tested at landing.
- **Verify by re-running, not re-reading.** Commands you prescribe must have been executed;
  evidence cites real runs. Your unrequested additions carry the same verification burden.
- **Capture with one command:** `python roadmap/tools/new.py <idea|insight|decision|risk> "title"`.

Full standing rules: `roadmap/RULES.md` §13–20.
