---
id: D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c
type: decision
title: "Retire claim lease expiry; keep claims as scope bindings"
status: accepted
approved_by: klunt (2026-07-25, "we need to get rid of the leasing system", restated after an investigation reply)
date: 2026-07-25
supersedes: []
updated: 2026-07-25
---

# D-9646fc3c — Retire claim lease expiry; keep claims as scope bindings

Amends [[D-006]] "Claims model v1" (the `lease` element, and the word *unexpired* in its
doctor-enforcement clause). D-006's parallelism doctrine is untouched.

## Context

Owner directive, stated twice on 2026-07-25: *"we need to get rid of the leasing system."*

The lease bundles three separable properties under one field, and only one of them failed:

| Property | Mechanism | Load-bearing? |
|---|---|---|
| **Scope** — which paths this agent may write | `allowed_paths` + `scope_hash`, enforced by `scope_gate.py` against the staged index | **Yes.** This is the whole point of a claim. |
| **Binding** — which branch/worktree the claim authorizes | `branch` + `worktree_id`, rotated only by `rebind --owner-reviewed` | **Yes.** Stops a claim taken in one worktree authorizing output in another. |
| **Expiry** — a clock deciding whether authority is still valid | `lease_expires`, `renew`, `--hours`, `MAX_LEASE_HOURS`, `check_expiry`, `--check-live-lease(s)` | **No.** Retired here. |

### Why expiry specifically

Expiry exists to reclaim a lane abandoned by a crashed concurrent agent. Aegis runs
`writer_mode: serial` with one human owner, so the reclamation case has never occurred. What
has occurred, twice, is the failure mode — and its shape is the worst available:

1. **Silent.** The lease lapsed at 03:47Z and every subsequent commit was refused, while
   `doctor.py` continued to report `OK 0 errors`. The gate that blocked the work and the gate
   that reports health disagreed, so the diagnosis cost far more than the block.
2. **Deferred.** The failure fires long after the mistake, at an arbitrary later commit,
   with no relationship to what the agent was doing.
3. **Non-recoverable by the obvious command.** `renew` on an expired lease is refused *by
   design* — `selftest.py::lease:expired-output-blocked-cleanup-allowed` asserts
   `renewal.returncode == 1`. `rebind` then refuses too, with a message pointing back at
   `renew` ("claim already belongs to this branch and worktree; use renew or rescope"), which
   is a genuine dead-end for a reader who does not already know the answer.

### The near-miss that makes this a decision rather than a preference

Trusting that dead-end message, an agent (me) diagnosed a tool bug and patched `claim.py`:
`renew` with `check_expiry=False`, `MAX_LEASE_HOURS` 24 -> 720, default 8 -> 168. It worked on
the live repo. Two independent guards caught it:

- `selftest.py::lease:expired-output-blocked-cleanup-allowed` asserts the refusal is intended.
- `_control_plane.py::validate_lease` enforces the 24-hour window independently, so raising
  only `claim.py`'s constant manufactures claims that fail validation in the gate and in CI.

Both edits were reverted in full. Recorded in
[[INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7]]. The lesson generalizes past leases: **when a
control surface refuses something four different ways, the strong prior is that it means it —
read the tests that defend a rule before concluding it is broken.** The lease is being removed
by owner decision on cost/benefit grounds, NOT because that diagnosis was right. It was wrong.

## Decision

**Claims stay. Expiry goes.** A claim is a task/scope binding with an explicit lifecycle, not
a time-boxed distributed lock — which is what `CLAIM-*.md` bodies have said all along:
*"This is a serial task/scope binding, not a distributed lock."*

Removed:

- `lease_expires` is no longer written or validated. `validate_lease` becomes
  `validate_claim_timestamps`, keeping `issued_at`/`updated_at` ordering and the
  not-in-the-future check, and dropping every expiry rule.
- `claim.py renew` and `--hours`; `MAX_LEASE_HOURS`.
- `check_expiry` plumbing in `scope_gate.py` / `scope_diff.py`; the `expired` authority field;
  the "expired claim may only perform an isolated roadmap cleanup transition" branch.
- `doctor.py --check-live-leases` and `scope_diff.py --check-live-lease`, plus their seven
  call sites in `.github/workflows/control-plane.yml`.

Kept unchanged: WIP=1 per agent, one active claim per active work item, scope containment and
`scope_hash`, branch/worktree binding, `rebind --owner-reviewed`, the
`active -> released|failed|abandoned` lifecycle, and every owner-only bypass.

**Abandonment recovery becomes explicit:** `claim.py release <agent> --status abandoned`. It
already exists, already works, needs no owner token, and states in the record that the lane was
abandoned rather than letting a timestamp revoke authority silently.

`rebind` stays owner-reviewed. Retiring expiry is not an argument for relaxing it: rebind
redirects an existing claim's authority to a different location, which is a real authority
change. Expiry was a *clock* asserting authority, which is not.

### Historical claim records are NOT rewritten

All seven `CLAIM-*.md` files are `status: released` and carry `lease_expires`. The field is left
in place as inert historical metadata. Deleting a column from closed audit records would erase
the fact that leases ever governed them; the correct retirement in an append-only ledger is to
stop writing the field, not to backfill-delete it. No validator requires its absence.

## Consequences

- **Cost, stated plainly:** the code lives under `roadmap/tools/**`, an owner-gated protected
  surface whose modification invalidates five live receipts (W0A, W0B, W0D, W0E, W0F). This
  change therefore carries a protected-surface acknowledgement and a five-receipt
  re-attestation chain, per [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]. Filed as W0H.
- **Deliberately NOT bundled with [[W0G]] defect 1** (worktree CRLF/control-char snapshot
  reading), even though bundling would pay the five-receipt chain once instead of twice. Defect
  1 edits `snapshot_fingerprint`'s input rule — the basis of every receipt in the repo.
  Landing a governance-model removal and a fingerprint-semantics change under one review makes
  a regression in the evidence root harder to attribute, and attributable evidence is the
  product. One extra receipt round is cheap insurance.
- **Teeth (D-004):** the five lease selftest cases are replaced, not deleted, by cases asserting
  the new invariants — a claim with no expiry still gates scope; an old claim is releasable
  without an owner token; no time-based refusal exists on any surface.
- **Owner-only follow-up:** `roadmap/RULES.md:9` reads "exactly one active, unexpired claim".
  The word *unexpired* becomes false. `RULES.md` is an owner-only surface, so the edit is
  prepared for the owner and not applied by an agent.
- Removes the recurring class of silent, deferred, dead-ended commit blocks that has twice
  interrupted product work — the concrete benefit being bought.
