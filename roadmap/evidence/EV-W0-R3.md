---
id: EV-W0-R3
type: evidence
title: W0 verification re-attested at the lease-expiry retirement
status: superseded
superseded_by: EV-W0-R4
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:5fb89441d0285f58753c2440b2f68fb80bd076b6810a6223f3a50f48ac33db31
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R2]
updated: 2026-07-25
---

# EV-W0-R3 — W0 verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0's basis moved because its `invalidated_by` names `roadmap/tools/doctor.py`
specifically, and W0H edits that file. Two changes, both narrow:

- the `--check-live-leases` CLI flag is gone;
- the per-claim call `validate_lease(...)` became `validate_claim_timestamps(claim, path, now)`.

No structural rule W0 attests changed: the ladder projection, object-schema validation, required
frontmatter, id/filename agreement, receipt-basis computation, and the phase/status machine are
all identical in behaviour. Claim timestamp validation is *retained* -- `issued_at`/`updated_at`
still must parse as strict UTC, still must be ordered, and still may not be in the future, pinned
by `doctor:invalid-calendar-timestamp` and `claim:future-issued-rejected`.

**This item is why the cost estimate was wrong, and the receipt should say so.** W0H's decision
predicted five invalidated receipts, copying a figure from W0G that was correct for W0G's file
set. W0's `invalidated_by` is narrow (`roadmap/tools/doctor.py`, `.githooks/**`), so W0G's change
-- which touched `_control_plane.py` and `selftest.py` -- genuinely missed it, and W0H's does not.
The set is a function of the file list, never of the directory
([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0-R2's: W0's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
