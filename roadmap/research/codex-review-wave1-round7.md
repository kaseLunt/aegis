# Codex round-7 re-confirmation — CONVERGENCE (review-ms2bpdrw)

2026-07-26, pinned 369ca50 (detached worktree, git-level cleanup confirmed), base f13cb59
(diff: exactly the 2-line round-7 patch). Codex session 019fa060-99a1-7451-b2f2-88bfc4995b92.

**Verdict: APPROVE — no material findings. The wave-1 wr4 review loop is CONVERGED.**

- Round-6 defect CLOSED: the impossible exactly-d2 claim explicitly withdrawn with correct
  reasoning; the three mutations carry honest observable outcomes (R15-guard deletion →
  (a)-(c) fail with all additional failures reported; digest-leakage mutant preserves d1/d3,
  leaves d4 green because no identifier appears verbatim, fails exactly d2 — supporting
  d2/d4 non-redundancy; crude wiring mutant → both d1 and d2 fail). No contradiction with
  R15/R16. No new material defect. Header judged ACCURATE.
- Standing DISCLOSED BOUNDS (not defects, acknowledged by the reviewer): the
  coherent-rewrite forgery remains open pending the external timestamp anchor
  (custody-chain.md:59-60); Candidate-5 closure is gated on the unscheduled trust.ts
  per-chain-validity schema change; INS-a76edd46 remains `candidate`.

## Loop record (the full arc)

| Round | Reviewer scope | Outcome |
|---|---|---|
| 1 (wave review) | 4 documents, 9 findings | 8→1 headline, GUID join, supersession, C5, custody claim … |
| 2 (confirmation) | 9 findings | 6 CLOSED, 3 OPEN with named fixes |
| 3 | 3 open findings | blueprint CLOSED; wr4 2 OPEN, sharper defects |
| 4 | 2 wr4 findings | still OPEN; residuals line-level |
| 5 | line-level residuals | Finding 3 CLOSED; Finding 2 → 2 test-spec defects |
| 6 | 2 test-spec defects | both CLOSED; 1 new clause defect |
| 7 | 1 clause | **APPROVE — CONVERGED** |

Findings narrowed monotonically: 9 → 3 → 2 → line-level → 2 test-spec → 1 clause → 0.
Corrections were authored by the originating personas throughout (chain-historian instance
carried rounds 3-7 with accumulated context); three of the loop's defects were the
personas' own round-N fixes caught at round N+1 — the gate cut both ways, which is the
point.

## Disposition

wr4-ruling.md's correction packages (Finding 2: supersession register design; Finding 3:
Candidate-5 closure ordering) are COMPLETE at research grade — header stamped PROMOTABLE
(loop-converged) with the disclosed bounds carried visibly. Actual promotion of any wave-1
document into committed work remains a phase-review / owner action per the HITL barrier;
nothing self-promotes on this verdict.
