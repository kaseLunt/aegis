# Control Plane — Constitution

> The rules that govern how this project tracks itself. Designed around one property:
> **it must not go stale.** Changing this file requires a Decision record.

> **Enforcement status — bootstrap+.** The model below is the *target*. A structural validator
> (`roadmap/tools/doctor.py`), a staged-index scope gate, and minimal evidence fingerprints for
> achieved items run locally (pre-commit) **now**, with a mutation selftest
> (`roadmap/tools/selftest.py`). The CI workflow exists but is **not yet authoritative** — the
> repo has no GitHub remote or branch protection ([[R-001]]); "CI is the gate" below describes
> the target, and local hooks remain bypassable conveniences until then. Fuller lifecycle
> automation is staged hardening. Attained `evidence_level` is derived, never hand-set.

## Governing principle

**Store intent; derive status from evidence.** The authoritative objects are truth; every view
(roadmap, timeline, dashboard) is a projection that may never invent state.

But **derived ≠ true.** A derived fact is only *mechanically consistent with the evidence
available at a specific commit.* Evidence can be incomplete, derivation logic buggy, an artifact
stale. So every derived fact is **stamped, not timeless**: `<level> as of commit X — valid only
while its inputs are unchanged.`

## Five categories (every object is exactly one)

| Category | Examples | Treatment | Why it resists staleness |
|---|---|---|---|
| **Asserted intent** | vision, priority, current focus | Human-owned, `review_by` dated | Minimal surface + forced review |
| **Asserted reality** | external blockers, risks, access gaps | Owner + `review_when` trigger | Surfaced; never silently derived |
| **Immutable records** | decisions, run artifacts, observations | Append-only; status may supersede | Content can't drift; status only by supersession |
| **Derived mechanics** | dependency closure, readiness, progress, evidence level | Validator-generated, never hand-written | Recomputed every check; false claim = red CI |
| **Human judgment** | relevance, promotion, keep-vs-rebuild | Surfaced for decision; **never silently automated** | Promotion barrier (HITL) |

The classic failure is filing **facts** as **asserted intent** and never recomputing them.

## The irreducible asserted kernel (keep it tiny)
- **North star** (Goal) — long review cadence.
- **NOW** — active phase + active task (singleton pointer: `STATUS.md`).
- **External blockers / risks** — asserted reality, with owner + review trigger.
- **Ideas / Insights** — candidate knowledge, lifecycle'd.
- **Decisions** — immutable content; status ∈ {`accepted`, `superseded`, `deprecated`}.

Everything else is **derived** and never hand-claimed: `evidence_level`, dependency-block /
readiness, progress, ready-queue, dossiers, the timeline.

## Evidence & invalidation (without this, the rest is theatre)

An artifact proves a claim **only about the build that produced it.** Every Evidence object
fingerprints its relevant inputs: commit, toolchain, lockfile hash, the work-item's
`invalidated_by` path set (hashed), contract version, seed(s).

**Rule:** a derived `evidence_level` counts **only while the current build's fingerprint matches
the artifact's.** On any relevant input change the evidence **auto-invalidates** and degrades
visibly: `Correct (commit X) → input changed → was Correct at X, now UNVERIFIED`.
Start conservative (over-invalidate), narrow the path set later — under-invalidation passes stale-green.

## Lifecycle (no object lives un-reviewed forever)

States: `inbox → candidate → committed → active → {achieved | superseded | rejected | archived}`.
`inbox` = captured but not yet triaged (cheap capture); `candidate` = triaged, `informs:` set.

- Agents may **create** Ideas/Insights/Risks and **propose**; only a phase review may **promote**
  to `committed` (HITL barrier).
- Items **never auto-delete.** On `review_when` — or a **backstop max-age TTL** — an item becomes
  **`review_due`** and surfaces for a human decision: promote / defer / reject / archive.
- **Phase boundaries gate on the review queue:** a phase can't be crossed while `review_due` items
  remain in scope — so the review queue can't itself go stale, and nothing is immortal by accident.

## Capture — nothing dies with a session
1. **In-session obligation:** the instant something outlives the current task, write it to its
   typed home **before continuing** (`ideas/`, `insights/`, `decisions/`, `risks/`), linked by
   `informs:`. Capture continuously, not at session end — the user often just exits.
2. **Session-end harvest (safety net):** re-scan the session for anything unfiled and create it.
3. **Survival:** captured objects are committed repo files (not chat memory), sit as `candidate`
   with a `review_when`; the promotion barrier means they can't become requirements silently.

## Enforcement (where the guarantee lives)
- **CI is the gate, not hooks.** Pre-commit/PreToolUse hooks are bypassable conveniences that
  *nudge*; **CI + branch protection enforce.**
- **Validator (CI, every PR):** unique IDs · valid references · exactly one active phase · exactly
  one active task · NOW points to live items · active task ∈ active phase · no dependency cycles ·
  no blocked-and-active · every evidence claim backed by a fingerprint-current artifact · `review_due` warnings.
- **NOW updates on transitions** (work starts / changes scope / finishes), not every commit.
- **The validator is code with its own tests.**

## Object format
Markdown + flat YAML frontmatter. **Content lives once, referenced by ID.** Dossiers are
**queries** (`everything where informs: <horizon>`), never pasted text — no copies to drift.

## The honest guarantee
- **Facts:** consistent-with-evidence-at-commit-X, CI-enforced, auto-invalidated on input change.
  Not timeless truth. The only escape is disabling CI, which is itself loud.
- **Intent:** can't be absolutely guaranteed (no validator detects that "this still matters"
  became subtly false). Bounded instead: tiny surface, dated, forced review, backstop TTL —
  stale in *quantity* (small) and *duration* (≤ one review cycle), **never silent.**
