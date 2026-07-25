---
id: W0H
type: work
title: Retire claim lease expiry — claims become task/scope bindings without a clock
phase: P1
status: active
evidence_target: "Correct + Robust"
priority: 1
depends_on: []
blocked_by: []
informs: []
allowed_paths:
  - roadmap/tools/**
  - .github/workflows/control-plane.yml
deliverables:
  - roadmap/tools/_control_plane.py
  - roadmap/tools/claim.py
  - roadmap/tools/scope_gate.py
  - roadmap/tools/scope_diff.py
  - roadmap/tools/doctor.py
  - roadmap/tools/selftest.py
  - .github/workflows/control-plane.yml
evidence_receipts: []
invalidated_by:
  - roadmap/tools/**
review_when: phase:P1:exit
updated: 2026-07-25
---

# W0H — Retire claim lease expiry

Implements [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] (owner directive, 2026-07-25). Read that
decision first: it carries the three-property breakdown (scope / binding / expiry), the reason
only expiry is being removed, and the near-miss that made a written decision necessary.

## Objective

Remove the lease *clock* from the claims model, keeping claims themselves intact, so that
authority is revoked only by an explicit lifecycle transition and never by elapsed time.

## Scope of the change

### 1. `_control_plane.py` — `validate_lease` -> `validate_claim_timestamps`
Keeps: `issued_at`/`updated_at` parsing, `issued_at <= updated_at`, neither in the future.
Drops: the required `lease_expires` field, `expires > issued`, the `max_hours` window, the
active-lease ordering rule, and the live `check_live` expiry refusal. Returns
`(issued, updated)`.

### 2. `claim.py`
Remove the `renew` subcommand, every `--hours` argument, `MAX_LEASE_HOURS`, its range check, and
`lease_expires` from the written frontmatter (`open`, `rescope`, `rebind`). `rebind`'s dead-end
message must stop naming `renew`.

### 3. `scope_gate.py`
Remove the `check_expiry` parameter and all four call-site values, the `expired` field on the
authority record, the `lease_expires` read, and the `expired and not binding_mismatch` branch
that restricts an expired claim to an isolated roadmap cleanup transition.

### 4. `scope_diff.py`
Remove `--check-live-lease`, the `check_expiry` arguments, and the live-lease tail check.

### 5. `doctor.py`
Remove `--check-live-leases` and pass the claim through `validate_claim_timestamps`.

### 6. `.github/workflows/control-plane.yml`
Remove all seven `--check-live-lease(s)` occurrences (lines ~35, 78, 85, 93, 149, 150, 161).
Verify the flags are gone from every job, not just the first.

### 7. Historical claim records — DO NOT EDIT
All seven `CLAIM-*.md` are `status: released` and retain `lease_expires` as inert historical
metadata, per the decision. No validator requires its absence. Editing closed audit records to
erase a retired field is explicitly out of scope.

## Acceptance

- **Correct:** `claim.py open` writes no `lease_expires`; a claim whose `updated_at` is days old
  still authorizes in-scope output and still refuses out-of-scope output; no surface
  (`doctor.py`, `scope_gate.py`, `scope_diff.py`) refuses anything on a time basis; the seven
  released claim files still validate untouched.
- **Robust (teeth, D-004):** the five lease cases in `selftest.py` —
  `doctor:invalid-calendar-lease`, `lease:future-issued-rejected`,
  `lease:overlong-window-rejected`, `lease:expired-output-blocked-cleanup-allowed`,
  `claim:renewal-transition` — are **replaced**, not deleted, by cases asserting the new
  invariants. Each new case negative-tested at landing (written RED against the pre-change
  tools where the invariant is new, and watched red after reverting the fix where it is not).
- **Non-regression:** `issued_at`/`updated_at` sanity is still enforced — a future `issued_at`
  is still rejected. Removing the clock must not remove timestamp validation.

## Non-goals

- [[W0G]] defect 1 (worktree CRLF/control-char snapshot reading). Deliberately not bundled;
  the decision records why (fingerprint semantics vs governance model, attributability).
- Any relaxation of `rebind --owner-reviewed`, of scope containment, or of WIP=1.
- `roadmap/RULES.md:9` ("exactly one active, **unexpired** claim") — owner-only surface. Prepare
  the exact one-word edit for the owner; do not apply it.

## Canonical commands

```text
python roadmap/tools/doctor.py
python roadmap/tools/selftest.py
npm test
```

## Handoff

- next: CANDIDATE — activate, open a claim, then work the numbered scope list in order.
  `_control_plane.py` first (the shared validator all four gates call), then the gates, then
  `claim.py`, then CI, then selftest last so the new cases run against finished code.
- read_first: [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] (the decision and its cost section);
  [[INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7]] (why `renew` refuses, and the reverted patch);
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]] (the five-receipt re-attestation recipe).
- hazards: `roadmap/tools/**` is a PROTECTED surface — expect a doctor-red mid-chain commit
  needing owner authorization, exactly as W5 S0 and W0G defect 2 did. Budget for the full
  **six**-receipt chain — W0, W0A, W0B, W0D, W0E, W0F — before starting; a half-landed
  protected-tools change leaves the doctor red for everyone. (Six, not the five W0G's note
  quotes: W0's `invalidated_by` is the narrow `roadmap/tools/doctor.py`, which W0G's change did
  not touch and this one does. Derived from a doctor run, not predicted —
  [[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]].) `roadmap/tools/**` is also upstream bundle code
  ([[INS-006]]) — write the divergence up for the next bundle sync rather than silently forking.
- do NOT: patch around a refusal you do not understand. That is exactly what produced the
  reverted `claim.py` change this item supersedes.

## Evidence

No attained evidence yet.
