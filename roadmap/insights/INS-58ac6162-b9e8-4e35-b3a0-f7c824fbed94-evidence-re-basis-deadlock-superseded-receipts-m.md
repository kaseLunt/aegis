---
id: INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94
type: insight
title: "evidence re-basis deadlock: superseded receipts must be historical records"
status: candidate
informs: [W4]
review_when: date:2026-08-06
updated: 2026-07-23
---

# INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94 — evidence re-basis deadlock: superseded receipts must be historical records

## Context
W4 slice 1 added lib/aegis/identity/, which sat inside W1's over-broad
`invalidated_by: lib/**` — invalidating EV-W1. Narrowing W1's basis to its own
module (the W2/W3 convention) exposed a control-plane defect: the doctor
revalidated SUPERSEDED receipts' contract/input basis against the CURRENT work
record forever. Combined with the append-only law (a changed recorded receipt
must transition to superseded with `superseded_by` pointing at a live typed
record), every honest basis change was structurally incompletable:
- the old receipt cannot coexist with the new contract (basis check fails);
- it cannot leave roadmap/evidence/ while recorded (append-only), and archiving
  it after supersession dangles the `supersedes` pointer the transition law
  itself required (archive ids leave the object namespace);
- the replacement receipt's tested_commit must already carry the new contract,
  which no ancestor can until the change lands.

## Evidence
- Deadlock demonstrated live across commits 69f64de / a6f4c6b (every alternate
  ordering was derived and shown blocked before touching anything).
- Fix at 979bff6: doctor validates basis only for `status: recorded` receipts;
  superseded/rejected records keep grammar + the append-only transition law and
  rest in place — exactly how superseded decisions (D-001..D-004 → D-010..D-013)
  already behave.
- Teeth: selftest case `evidence:superseded-receipt-is-historical-recorded-
  stays-validated` fails on both bad mutations (revert → superseded receipt goes
  red; over-broad skip → stale recorded receipt goes green). Negative-tested at
  landing (stash-revert run showed exactly that case failing).
- Re-attestation procedure that works (the general recipe):
  1. narrow/change the work basis (owner-acknowledged; doctor red mid-chain —
     owner-authorized commit);
  2. mint the replacement receipt with tested_commit = that commit, honest
     re-run, supersede the old receipt in place (same commit);
  3. chain head is fully green; CI validates push heads, scope_diff replays
     per-commit transitions (both green).
- Touching roadmap/tools/** honestly invalidated the six W0-family receipts;
  all six re-attested at 979bff6 and superseded in place (da8ba6e).

## Consequence
- Scope `invalidated_by` to the module a work item actually depends on from day
  one; over-broad scopes (lib/**) tax every future neighbor. W1 was the last
  broad-scoped product item.
- Superseded lifecycle records REST IN PLACE across all types (decisions,
  evidence, enforcement); archive is for retired non-lifecycle objects only.
- Upstream: this fix belongs in the control-plane skill bundle (the deadlock is
  inherent to the shipped doctor semantics, not Aegis-specific) — report at the
  next bundle sync; local divergence is one guarded call + one selftest case.
