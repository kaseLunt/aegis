---
id: INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7
type: insight
title: "an expired claim lease is not renewable BY DESIGN — release + task transition is the recovery, and I nearly weakened the invariant"
status: candidate
informs: [W0G, H0]
review_when: date:2026-08-08
updated: 2026-07-25
---

# INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7 — an expired lease is not renewable by design; release + task transition is the recovery

> **HISTORICAL INCIDENT RECORD — the mechanism this insight navigates no longer exists.**
> [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] (W0H, 2026-07-25) retired lease expiry outright:
> claims no longer lapse, the renew subcommand is deleted, and no recovery-from-expiry procedure
> can ever be needed again. Read this document ONLY for its failure analysis — §"What I got
> wrong" and Consequence item 4 — which remain the canonical record of why an agent must read
> the tests defending a rule before concluding the rule is broken. Every operational directive
> below is struck and non-actionable.

## Context
A lease lapsed mid-session (`fable-main` on W5, expired 03:47Z, noticed 04:03Z). Every commit was
then refused by the scope gate — while the DOCTOR stayed green, because it counts an expired
record as an active claim and only the gate checks expiry. The tree looked healthy and nothing
could land.

## What I got wrong, and how it was caught
Every recovery I tried was refused: `renew` and `rescope` (lease expired), `open` (agent already
has a live claim), `open --owner-reviewed` (that authorises takeover of a TERMINAL record, and
expired-active is not terminal), and `rebind` ("claim already belongs to this branch and
worktree; use renew or rescope"). Since `rebind` recommends `renew` and `renew` refuses, I
concluded the tool contradicted itself, and set out to "fix" it: I made `renew` pass
`check_expiry=False`, raised `MAX_LEASE_HOURS` 24 -> 720, and moved the default lease 8h -> 168h.
It worked on the live repo — the lapsed lease renewed cleanly.

Then the mutation selftest failed, and the failure was the point:

```
lease:expired-output-blocked-cleanup-allowed
    blocked.returncode == 1 and renewal.returncode == 1
    and released.returncode == 0 and cleanup.returncode == 0
```

`renewal.returncode == 1` is an ASSERTION. An expired lease is deliberately not renewable. The
same test shows the intended path: `release`, then `set_work_state(..., "candidate", ...)`, then
one gated commit with owner acknowledgement — cleanup is allowed, output is not. Losing a lease
means losing your turn; you close out and re-take the task deliberately rather than silently
resuming. That is a governance choice with a rationale, not an oversight.

A second, independent guard also caught the lease-length half: `validate_claim` in the shared
runtime enforces "lease window exceeds 24 hours from updated_at". Raising only `claim.py`'s
`MAX_LEASE_HOURS` therefore manufactures claims that fail validation everywhere else — including
in the gate and CI. Any real change to lease length must move BOTH.

Both edits were reverted in full. `selftest.py` returned to 0 failing.

## Consequence
1. ~~**The recovery, for the next lapse:** release the claim, transition the task out of active,
   stage `roadmap/`, and commit with owner acknowledgement; re-activate and re-open when work
   resumes.~~ **OVERTAKEN by [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]]:** lapses cannot occur.
   The live lifecycle guidance is in CLAUDE.md/AGENTS.md: close a lane explicitly with
   `claim.py release <agent>`, `--status abandoned` if the work is being dropped.
2. ~~**Renew early.** A lease is cheap to extend and expensive to lose; renew at natural
   breakpoints rather than discovering expiry at commit time.~~ **OVERTAKEN:** the renew
   subcommand was deleted by W0H; there is no clock to outrun.
3. **Rejected at the time, recorded so the reasoning survives:** opening a NEW agent identity for
   the same task was refused by serial mode ("new claim is not the selected serial binding" —
   `scope_gate.py` resolves authority to the bound claim path); hand-editing a control-plane
   record's timestamp forges evidence; and `git commit --no-verify` spends an owner-only bypass
   on bookkeeping. The first and third rejections remain live rules today.
4. **The real lesson is about ME, not the tool — and it outlives the mechanism.** I diagnosed
   "bug" from an error-message contradiction, in bundle-owned governance code, under time
   pressure and an owner's frustration, and I was one green selftest away from shipping it. What
   stopped me was a pre-existing mutation test that encoded the invariant explicitly. When a
   control surface refuses something four different ways, the strong prior is that it MEANS it —
   read the tests that defend it before concluding it is broken.
5. ~~Optional [[W0G]] item: correct `rebind`'s error text; have the doctor surface an expired
   lease as a warning.~~ **OVERTAKEN and superseded by more than was asked:** W0H fixed
   `rebind`'s dead-end message AND removed the expiry mechanism the warning would have watched.
   The doctor-green-while-commits-blocked hazard this item described is structurally gone.
