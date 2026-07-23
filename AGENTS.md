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

This project uses a repository-native control plane. Read `roadmap/VISION.md` first, then
`roadmap/SYSTEM.md`. Durable project authority lives in the repository, not in chat or agent
memory.

## Session Protocol

### On Session Start

Read, in order: `roadmap/STATUS.md` (current task and blockers), `roadmap/ROADMAP.md` (active
phase), `roadmap/SYSTEM.md` (governance model), and the active work item under `roadmap/work/`.

### During Work

Capture material that outlives the current task before continuing:

- future feature or tangent -> `roadmap/ideas/`
- reusable knowledge or finding -> `roadmap/insights/`
- proposed or accepted direction -> `roadmap/decisions/`
- blocker or plan-threatening risk -> `roadmap/STATUS.md` or `roadmap/risks/`

Capture does not imply promotion. Project-owned rules determine who may accept decisions,
change priorities, or edit protected governance files.

### On Session End

Check for uncaptured ideas, insights, decisions, risks, blockers, and resumability details.
Update status only for real transitions. Do not create narrative session dumps.

## Repository Rules

Preserve existing project policy. Work only inside the active task's declared scope, run its
real verification commands, and report local hooks, CI checks, and protected merge gates
accurately. Default to one repository writer unless the project has explicitly activated and
verified a concurrent-writer contract.

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
- **Parallel lanes run under claims** (D-006): `python roadmap/tools/claim.py open <agent> <task>`;
  commit a lane's work with `AEGIS_AGENT=<agent>` set so the scope gate judges the claim's
  scope. One active claim per agent; leases expire — renew or release. Never source an
  expected value, implement its observed-side check, AND certify it — pick at most one role.

Full standing rules: `roadmap/RULES.md` §13–20.
