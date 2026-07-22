# RULES — scope discipline & how this stays true

> These rules are the actual fix for scope drift. The tool is secondary. They override
> convenience. Full data model and staleness guarantees: [`SYSTEM.md`](SYSTEM.md).

## Scope control
1. **One active phase.** Everything else is planned or parked.
2. **One current task at a time** per agent (WIP = 1). Starting something else means explicitly
   parking the current task in `STATUS.md` first.
3. **No work without a roadmap entry.** If it isn't in `ROADMAP.md` / `STATUS.md`, it isn't worked on.
4. **Every task names what it advances** — which phase/work-item and which VISION goal.
5. **Tangents go to `ideas/`** immediately and do not interrupt the current task — *unless* a genuine blocker.
6. **Agents may not reprioritize phases or edit `VISION.md`** without explicit approval.
7. **Phase completion requires a VISION review** — and can't proceed while `review_due` items remain in scope.

## Definition of done
8. Code written ≠ done. **Done = commit/PR + the work-item's acceptance evidence linked**, at or above its evidence target.
9. Evidence level is **derived from CI / artifacts**, never hand-claimed, and is **commit-stamped** —
   it auto-invalidates when its inputs change (`SYSTEM.md`).

## Keeping state true
10. **Status updates happen on transitions** (start / scope change / finish), enforced at **CI/PR** —
    never reconstructed later from chat, not ceremonially on every commit.
11. **Blockers recorded when discovered** — dependency blockers are *derived*; external/semantic
    blockers are *asserted* with an owner + review trigger.
12. **Chat and agent memory are never authoritative.** If it matters, it's in `roadmap/` or `docs/`.

## Agent session protocol
- **Start:** read `roadmap/STATUS.md` → `roadmap/ROADMAP.md` → `roadmap/SYSTEM.md` → the active work item under `roadmap/work/`.
- **During — capture continuously, not at exit:** material discoveries → the work item; new ideas →
  `ideas/`; insights → `insights/` (with `informs:`); blockers → `STATUS.md` immediately. Write it
  the moment it appears — the user often just closes the terminal, and nothing runs after that.
- **End:** update `STATUS.md` on transitions; mark a task done only when its evidence passes.
