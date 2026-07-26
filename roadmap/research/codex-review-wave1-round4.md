# Codex round-4 re-confirmation — wr4 open findings (review-ms28wava)

2026-07-26, pinned 6c5b447 (detached worktree C:/wt/aegis-r4, since unregistered; empty dir
awaits manual deletion — transient handle), base b5e7378. Codex session
019fa018-9c6e-72e0-ade3-5c9dbc53615f. Scope: the two open wr4 findings only.

**Verdict: needs-attention — Finding 2 OPEN, Finding 3 OPEN; wr4 stays NOT-PROMOTABLE.**
Round-4 repairs acknowledged as present (heading rebounded; R12-R14 + rehashed-seq test
exist; coherent-rewrite bound explicit; corrected trust/state citations verified accurate
against trust.ts:213-219,266-278,299-320, engine.ts:199-201,293-296, ENGINEERING_SPEC:150-166,
canonical.ts:434). Residual defects are narrower and line-level.

## Finding 2 residuals (wr4-ruling.md:263-314)

1. **Pending-tail position is undefined.** Position = backward walk from the approved head,
   but pending successors beyond the head cannot be reached by that walk — yet R14 requires
   their `seq` to equal position. "Single unbroken continuation" names no fork/outdegree
   algorithm.
2. **Forged-selector downgrade (the serious one).** An integrity-invalid record is "never
   evaluated for anchoring," yet the result-state mapping lets non-anchored/invalid records
   downgrade targeted verifications using `affectedArtifacts` selectors read from those
   integrity-failed bytes — corrupt or forged record content can select arbitrary
   observations and force `unknown` without any approval.
3. **Register-wide failure mapping missing.** R12-R14 refuse the whole file, but the state
   mapping never says whether that throws, invalidates every record, or degrades results.
4. **"Chronology test"** label on test 4 contradicts the document's own no-clock bound.

Fix named: one executable graph algorithm (verify all entry hashes; require the approved
head; walk uniquely to genesis; outdegree ≤ 1 beyond the head; reject forks/unvisited
entries; pending position = validated prefix + forward hop count); a register-level
structural-failure mapping; never consume affected-observation selectors from an
integrity-invalid record, negative-tested; structural relative-order language everywhere.

## Finding 3 residuals (wr4-ruling.md:24-98, 336)

The machinery-first recipe at §1.5 and G10 is correct, but **three authoritative summaries
still authorize the unsafe window-first closure**: the candidate table row (:24 "unblocks
when a reviewed chain-10 applicability window covering the block is authored"), the §1.5
verdict line (:59 "the moment a reviewed historical OP window is authored"), and the §2 C5
summary (:98 "close it by authoring a reviewed fromBlock.chainId: 10 window"). Following any
of them under the current one-pair schema strips chain 1's bound — the exact round-3 defect.
G10 (:336) also leads with the struck stale recipe before its correction.

Fix named: rewrite :24, :59, :98 and the G10 opening so pass/fail closure requires, in
order: per-chain validity representation (or reviewed single-chain composition) → fail-closed
refusal of any covered chain without its own bound (negative-tested) → then the reviewed OP
window; until then C5 is a neutral fact only.

## Process note

The round-4 application missed a consistency sweep: the three stale C5 sentences were all
round-3 text that the round-4 patch set corrected in two places but not in the other three.
Lesson for round 5: a correction to a claim must be swept across every restatement of that
claim (table row, verdict line, summary bullet, gap ledger), not just the section where the
claim is defined.

Round 5 routes both residual sets back to the chain-historian instance.
