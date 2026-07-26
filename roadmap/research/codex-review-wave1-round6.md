# Codex round-6 re-confirmation — wr4 test-spec defects (review-ms2arsye)

2026-07-26, pinned 04cb78b (detached worktree), base 974e818. Codex session
019fa048-b059-7883-85b4-a03009757706. Scope: the two round-5 test-spec defects + header.

**Verdict: needs-attention — both round-5 defects CLOSED; ONE NEW medium defect in the
round-6 patch itself. Loop NOT converged; wr4 stays NOT-PROMOTABLE.** Header accuracy:
judged ACCURATE, including Finding-3 closure and the corrected Candidate-5 references.

## Closed

- Defect 1 CLOSED: test 3(b), R11, R15, R16 and §4.4 no longer permit unanchored selectors
  to change targeted result state; `supersession_unanchored` has no live emitter.
- Defect 2 CLOSED as to the original all-cases immutability contradiction; the (a)-(c)/(d)
  split and the finalized-boundary assertion match R2/R16.

## New defect (round-7 scope)

- **[medium] Test 6(d)'s mutation tooth contradicts d1** (wr4-ruling.md test 6). The tooth
  says wiring the R16 degradation to `affectedArtifacts` must make "exactly (d2)" fail — but
  under the defined fixtures (register A cites V; register B cites only absent
  observations), a selector-driven mutant degrades V only under A, so **d1's
  V-unknown-under-both assertion fails too**, before or alongside d2. The claimed failure
  isolation is impossible to report honestly and could pressure implementers to weaken d1.
  Fix named: state that the selector-driven mutant must fail BOTH d1 and d2, or design a
  precise mutant that preserves d1 while changing only the selector-independence output
  checked by d2 — then negative-run that exact mutation.

## Operational notes

- The reviewer flagged an untracked 83MB `foundry.zip` in the main working tree as an
  unattributed mutation and correctly took no action. **Attribution resolved by the
  orchestrator: it was the orchestrator's own toolchain download** (G-01.A closure) whose
  `cd` to the temp dir failed silently, landing the zip in the repo root. Removed by its
  author in the same commit that persists this review. The reviewer's refusal-to-touch
  discipline worked exactly as designed; the multi-tenant hypothesis in its report is
  superseded by this attribution.
- Three stale job-state files from the reviewer's own mis-dispatched attempts (foreground
  backgrounding instead of the tool's background mode) remain in the plugin state dir with
  dead pids — inert, documented, no live wedge.

## Loop state

Round 7 routes the single mutation-tooth clause to the chain-historian instance.
Trajectory: 9 → 3 → 2 → line-level → 2 test-spec defects → **1 clause**.
