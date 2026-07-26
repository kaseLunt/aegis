# Codex round-5 re-confirmation — wr4 residuals (review-ms29rcfs)

2026-07-26, pinned dfb674b (detached worktree, cleanly pruned), base a369751. Codex session
019fa02e-b7ec-7f41-b02d-c465943fb16c. Scope: the round-4 residuals only.

**Verdict: needs-attention — Finding 3 CLOSED, Finding 2 OPEN on two test-spec defects.**
Acknowledged sound: the loadRegister seven-step algorithm, R16, the pinned-read detection
citations, and the no-clock language. The document stays NOT-PROMOTABLE.

## Finding 3 — CLOSED

Lines 24, 59, 98 and the G10 recipe consistently require representation → negative-tested
refusal → window; no sentence anywhere still authorizes window-first closure.

## Finding 2 — OPEN (two defects, both in the test specifications)

1. **[high] Test 3(b) reinstates the forged-selector downgrade.** R15 requires every
   unanchored record to be unaimed and result-inert, but test 3(b) — round-4 text the
   round-5 patches left standing — still asserts that a hash-valid record outside the
   approved walk changes the verification *selected by its own `affectedArtifacts`* to
   `unknown`/`supersession_unanchored`. Implementing that assertion necessarily consumes an
   attacker-chosen selector before approval, restoring the attack R15 closes, and directly
   contradicts test 6(b). Fix: replace 3(b)'s targeted-unknown assertion with byte-for-byte
   unchanged verification/report assertions and no selector-derived output.
2. **[medium] Test 6's invariant is self-contradictory.** "X byte-for-byte unchanged in all
   four cases" cannot coexist with case (d)'s R16 blanket degradation (which changes
   non-finalized verifications by design; and if X were finalized, (d) demonstrates
   nothing). Fix: limit the unchanged-X invariant to cases (a)-(c); redesign (d) with a
   non-finalized verification expected to go blanket `unknown`, comparing refused registers
   with *different* selectors to prove the degradation is selector-independent, asserting
   the report hash changes accordingly.

## Header correction required

The round-5 stamp overstated: it implied Finding-2 closure and claimed "the remaining C5
hits are critique-item C5" — false; Candidate-5 C5 references remain at :98 and :165
(neither authorizes unsafe closure, but the sweep claim was literally wrong). Round 6 must
re-stamp accurately.

## Loop state

Round 6 routes the two test-spec fixes + header correction to the chain-historian instance.
Trajectory: 9 → 3 → 2 → line-level → two test-spec defects on one finding.
