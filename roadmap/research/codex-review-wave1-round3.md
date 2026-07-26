# Codex round-3 re-confirmation — wave-1 open findings (review-ms280w41)

2026-07-26, pinned 554a0cf (detached worktree), base 0aa42dc. Codex session
019fa002-3ff0-7fd0-a76b-12b956b33e4f. Scope: exactly the three open confirmation findings
(codex-review-wave1-confirmation.md). Dispatch note: first attempt (review-ms27vv2b) died on
the known dead-pid wedge and was discarded; this is the verified replacement. Document/code
reading only; no selftest attempted (known sandbox constraint).

**Verdict: needs-attention — Finding 1 CLOSED, Findings 2 and 3 OPEN with new named defects.**
Per-document: blueprint stays PROMOTABLE-WITH-CORRECTIONS (its round-3 stamp judged
accurate); wr4 stays NOT-PROMOTABLE (its round-3 stamp overstated completion — corrected in
the same commit that persists this review).

## Finding 1 — blueprint G-01: CLOSED

Manifest-grade fallback removed; identity stays unknown and ABI-dependent cells blocked;
observational baseline quarantined behind the required typed schema + tests. trust.ts /
compare.ts / abi.ts citations verified accurate. No other fallback remains anywhere in the
document.

## Finding 2 — wr4 supersession: OPEN

- [high] Ordering remains self-contradictory and under-enforced (wr4-ruling.md:251-300).
  The anchoring heading says "no-backdating come[s] from the register," contradicting the
  body's own correct bound (relative order only, until an external anchor exists). Register
  position is defined by BOTH self-declared `seq` AND the `prevEntryHash` chain, with no
  genesis rule, no contiguity/monotonicity rule, and no statement of which source wins on
  conflict; test 4(c) only catches seq-swaps *without* re-chaining — a coherently authored
  and rehashed register with seq 2 before seq 1 stays reachable from the approved head while
  supporting contradictory orders. The trust.ts:214-219 analogue cited for unreachable
  records is the manifest content-hash integrity path; approved-hash evaluation is at
  266-278 and yields policy state `untrusted`, not result state `unknown`.
- Fix named: bound the heading to tamper-evident relative order; derive ordering SOLELY by
  walking `prevEntryHash` from the approved head (or require + test canonical genesis and
  contiguous increments); add a negative test for a fully rehashed approved chain with
  nonmonotonic/duplicate seq; define the supersession trust/result-state mapping without
  citing the unrelated manifest integrity path.

## Finding 3 — wr4 Candidate 5: OPEN

- [high] The reframe is correct (same-chain applicability verified), but the closing recipe
  cannot be encoded (wr4-ruling.md:321): `validity` holds exactly ONE fromBlock/toBlock pair
  (trust.ts:196-206), so authoring the chain-10 lower bound necessarily leaves chain 1
  without one — and checkApplicability treats the missing same-chain bound as applicable.
  The proposed closure would itself fail open on the other covered chain.
- Fix named: specify a per-chain validity map (or split into single-chain manifests with a
  reviewed composition rule); the loader/applicability evaluator must REFUSE every covered
  chain lacking its own bound, negative-tested, before Candidate 5 may be described as
  closable by authoring an OP window. (Strengthens [[INS-a76edd46]]: the fail-open property
  is not merely a missing authoring convention — the schema cannot represent the fix.)

## Round-4 work

Both open findings route back to the chain-historian persona (same instance, accumulated
context) for diff-only patches, then one more scoped re-confirmation. Blueprint needs no
further rounds for this loop.
