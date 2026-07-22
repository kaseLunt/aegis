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

## Standing rules from the sibling orchestrator ([[D-004]])
Adopted 2026-07-21, right-sized: survive-many-sessions discipline, not certification-grade rigor.

13. **Derived facts have one home.** Anything computable (status copies, counts, freshness,
    review state) is written by a tool or doctor-validated; hand-maintained duplicates are
    commit-blocking errors. The ROADMAP work-ladder Status column is a validated copy of
    work-item frontmatter.
14. **Handoff at every transition.** The active work item carries `## Handoff` — `next:`
    (what landed / what's next, resumable cold in minutes), `read_first:` (files a resumer
    reads before editing their subjects), `hazards:`. Doctor-enforced. The handoff is the
    product of every session, not an end-of-session afterthought.
15. **The teeth habit** (highest ROI): every confirmed review finding or incident produces TWO
    artifacts — the fix, and a machine check that catches the CLASS, negative-tested at landing.
    The class returns through a different door; the tooth catches the recurrence. A safety
    property that exists only in prose does not exist. Product-side teeth live as adversarial
    fixtures/tests per `docs/THREAT_MODEL.md`; process-side teeth live in doctor/hooks.
16. **Plans are executable documents.** Must-not-touch lists come from a tool-enumerated census
    of what each change moves (freeze vs sanctioned-mover per binding) — never freeze-instinct;
    censuses are re-enumerated by tool at execution; a changelog line claims an edit only after
    a grep confirms the body carries it; review state lives in exactly one section of the plan.
    (No census tooling yet — apply manually to any multi-file plan.)
17. **Verify by re-running, not re-reading.** Commands prescribed in a work item or plan are
    executed against known-good state at authoring; evidence entries cite actual runs.
    Independent re-derivation (a second agent reproducing a value blind) is mandatory at
    milestone exit gates. Unrequested additions carry the same verification burden as requested
    ones.
18. **Executors fail closed and halt loudly.** A precondition you don't own (dirty tree, failing
    gate, unexpected state) → report root cause and STOP. Never delete, never `--no-verify`,
    never "helpfully" fix outside commit scope. Commit authority is scoped to the active item's
    `allowed_paths` (+ `roadmap/**` capture, always) — hook-enforced; overrides are human-only.
19. **Connective tissue gets mechanical homes.** Line endings vs hashed bytes (.gitattributes),
    worktree-vs-index drift (doctor tracked-state), console encoding, unpinned inputs — findable
    by tools, not vigilance. When a new member of the class bites, give it a home (rule 15).
20. **Doctor output stays high-signal.** New checks are deterministic errors or they don't ship;
    a warning that fires on every run trains everyone to ignore warnings — budget noise
    burn-downs at phase reviews.

Not adopted as process (D-004): byte-exact golden pinning, hash-frozen contracts, identity
closures, citation gates, re-pin waves. Byte-exactness here is a **product** requirement with
product tests (M1 canonical reports), not control-plane ceremony.

## Agent session protocol
- **Start:** read `roadmap/STATUS.md` → `roadmap/ROADMAP.md` → `roadmap/SYSTEM.md` → the active work item under `roadmap/work/`.
- **During — capture continuously, not at exit:** material discoveries → the work item; new ideas →
  `ideas/`; insights → `insights/` (with `informs:`); blockers → `STATUS.md` immediately. Write it
  the moment it appears — the user often just closes the terminal, and nothing runs after that.
- **End:** update `STATUS.md` on transitions; mark a task done only when its evidence passes.
