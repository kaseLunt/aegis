---
id: D-007
type: decision
title: Concurrent writers - wave model with serialized integrator, atomic claim allocator, worktree lanes
status: accepted
approved_by: klunt (2026-07-22, in-session concurrency directive)
date: 2026-07-22
supersedes: []
informs: [R-005]
updated: 2026-07-22
---

# D-007 — Concurrent writers: wave model with serialized integrator

Owner directive (2026-07-22, verbatim intent): concurrent writers require ONE serialized
authority around several isolated coding lanes. Never multiple agents editing the same
checkout; never lanes pushing directly to main.

## Shape
Green main commit → Fable allocates a writer wave → N worktrees (one branch, one lane
each, narrow scope) → PRs → exact merge-candidate checks → serialized integrator →
protected main.

## Minimum requirements (owner-specified)
1. **Immutable wave base** — every writer starts from the same pushed CI-green commit;
   dependencies and shared interfaces frozen for the wave.
2. **One lane per writer** — exactly one task, claim ID + generation, branch, worktree,
   full base SHA, non-overlapping path/resource scope, lease.
3. **Atomic claim registry** — current claim files are branch-local (two branches can
   both observe "unclaimed"). Fable is the ONLY claim allocator, using a shared registry
   under Git's common directory protected by an OS lock; committed claim files remain
   the human-readable audit projection. Cross-machine later = transactional service /
   GitHub App with fencing generations.
4. **Mechanically disjoint ownership** — path ownership checked globally before launch
   AND before merge. Integrator-only surfaces: canonical schemas/states, hashing and
   provenance rules, shared identifiers/registries, root dependency files and lockfiles,
   database migrations, STATUS/claims/work-item transitions, milestone acceptance,
   shared UI composition until decomposed.
5. **Branch/worktree-bound enforcement** — every commit/PR verifies: claim authoritative
   + generation current, branch/worktree match the claim, base commit exists and is an
   ancestor, lease valid, COMPLETE diff within scope (additions, deletions, both sides
   of renames), dependencies unchanged underneath the lane. AEGIS_AGENT stays
   cooperative identity, never sufficient authority.
6. **Protected main + serialized merge queue** — writers push branches only; integrator
   merges one at a time after testing the exact prospective merge commit (doctor +
   mutation tests, full diff-to-claim validation, lint/typecheck, unit/property/
   integration, production build, recorded-fixture conformance). Catches independently-
   correct-but-jointly-incompatible branches.
7. **Explicit recovery** — claim lifecycle claimed → running → handoff-ready →
   integrating → merged, plus failed/expired/abandoned/transferred. Lease expiry must
   NOT auto-reassign without fencing; branches and dirty worktrees preserved until
   explicitly reconciled.

## Sequencing (accepted)
Finish W3 serially → restore and protect green main → build allocator/worktree/merge
machinery → rehearse with exactly two disposable, disjoint lanes. First production
pilot AFTER W4 freezes the identity/report contracts: separate CLI, API, evidence-UI,
and conformance-test lanes. Rationale: safe concurrency without pretending the semantic
spine itself can be parallelized (extends [[D-006]]'s asymmetric model).

## Consequences
- R-005 items 1/2/5 are now REQUIREMENTS of this decision's machinery phase, not just
  bounded risks.
- W3's broad lib/**+tests/** charter is acceptable precisely because it is the last
  serial spine item before the pilot boundary.
