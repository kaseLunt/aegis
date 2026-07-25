---
id: INS-fe09afdb-676b-42f6-9a60-0b1e61fa7978
type: insight
title: "D-007 allocator leases and D-9646 claim-clock retirement govern different mechanisms"
status: candidate
informs: [R-005, W0H]
review_when: date:2026-08-08
updated: 2026-07-25
---

# INS-fe09afdb — D-007 allocator leases and D-9646 claim-clock retirement govern different mechanisms

## Context

The Codex round-2 re-review of W0H found that accepted decision [[D-007]] (requirements 2, 5,
and 7) still requires lanes to carry a *lease* and requires per-commit verification that the
*"lease [is] valid"*, with a lifecycle including `expired` — while
[[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] (W0H) retired lease expiry, and neither decision
cites the other. Both are `accepted`, therefore immutable; neither can be annotated in place.
This insight is the reconciliation record.

## Evidence — why this is a reader hazard, not a contradiction

The two decisions govern **different mechanisms in different concurrency regimes**:

| | D-9646 (W0H) | D-007 |
|---|---|---|
| Mechanism | Repo-native cooperative claim files (`roadmap/claims/CLAIM-*.md`) | Future allocator-issued leases: shared registry under Git's common dir, OS lock, fencing generations |
| Regime | `writer_mode: serial`, one human owner | Concurrent writer waves, N isolated worktree lanes |
| Is expiry load-bearing? | **No** — reclaiming a crashed concurrent writer's lane cannot occur with one writer; the clock only ambushed legitimate work (silent, deferred, dead-ended) | **Yes** — a crashed lane must be reclaimable, and D-007 req 7 already prescribes the sophisticated form: *"Lease expiry must NOT auto-reassign without fencing"* |

Three pre-existing texts already draw this line; the decisions just never cross-referenced it:

- D-9646's own rationale: *"Expiry exists to reclaim a lane abandoned by a crashed concurrent
  agent. Aegis runs `writer_mode: serial` ... so the reclamation case has never occurred."*
- `claim.py`'s docstring (unchanged through W0H): *"A real concurrent writer wave requires an
  external transactional allocator with fencing tokens."*
- D-007 §3: cooperative claim files are explicitly demoted to *"the human-readable audit
  projection"* of the real allocator registry — i.e. D-007's enforcement object is the
  allocator's lease, not the claim file W0H de-clocked.

## Consequence — binding reading for the D-007 machinery phase

1. **D-9646 governs the cooperative serial claims that exist today.** Nobody may reintroduce a
   clock on `CLAIM-*.md` records citing D-007; the selftest teeth
   (`claim:stale-claim-authorizes-in-scope-output` and siblings) enforce this class.
2. **D-007 governs the future allocator, where leases WITH expiry are a requirement, not an
   option** — expiry plus fencing generations is precisely how a transactional allocator makes
   crash recovery safe. W0H did not amend, weaken, or satisfy D-007 requirements 2/5/7; they
   bind the machinery phase (post-W3 build, post-W4 pilot, per D-007's sequencing and [[R-005]]).
3. When the allocator is designed, its lease semantics start from D-007 req 7, and the designer
   must read this insight plus [[INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7]] (why the cooperative
   clock failed: silent, deferred, dead-ended) so the allocator's expiry is none of those three —
   loud, immediate, and with a documented recovery command.
4. If the owner wants this reconciliation at decision grade rather than insight grade, promote it
   through a phase review (HITL barrier); the text above is written to be promotable verbatim.
