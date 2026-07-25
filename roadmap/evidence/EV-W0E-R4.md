---
id: EV-W0E-R4
type: evidence
title: W0E re-attested with an explicit scope REDUCTION: strict-lease checks retired
status: superseded
superseded_by: EV-W0E-R5
work: W0E
result: pass
commands:
  - python roadmap/tools/doctor.py && python roadmap/tools/selftest.py
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:716684b2eeb35083e9a1cb59ed4134387333121bdc36f5ac19cfbe9ea19d189c
input_fingerprint: sha256:ab06fde0abbc7e910c42c3511c39da1d4fb6331f6030dabf68b724537497be60
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0E-R3]
updated: 2026-07-25
---

# EV-W0E-R4 — W0E verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

**This receipt narrows what W0E attests.**

W0E's acceptance names lease validation among the cooperative-gate holes it closed: *"doctor
rejects none-with-active-work, malformed claims (agent/filename, lease ...)"*, *"strict
lease/filename"*, and it scoped lane permissions as *"lanes cannot edit charters, claims (beyond
lease renewal), STATUS"*.

Retired by [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] via W0H:

- strict `lease_expires` validation (presence, ordering against `issued_at`, the 24-hour window,
  and the live-expiry refusal);
- the carve-out permitting lanes to perform *lease renewal* -- there is no renewal, so the
  exception is simply gone, which makes the lane permission set strictly SMALLER, not larger;
- the scope-gate branch confining an expired claim to an isolated roadmap cleanup transition.

Intact and re-verified: doctor still rejects an active work item with no claim, still enforces
agent/filename agreement, claim_id UUID form, positive generation, explicit integrator under
serial mode, `base_commit` ancestry, and scope containment; the charter-edit block and deliverable
checks are unchanged; lanes still cannot edit charters, claims beyond their own lifecycle
transitions, or STATUS.

**Timestamp strictness was NOT relaxed** -- this is the part most likely to be misread as a
loosening. `issued_at`/`updated_at` still must be strict UTC, correctly ordered, and not in the
future, pinned by `doctor:invalid-calendar-timestamp` and `claim:future-issued-rejected`. What was
removed is a clock deciding *authority*, not validation of the timestamps themselves.

`contract_fingerprint` is byte-identical to EV-W0E-R3's: W0E's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
