---
id: EV-W0A-R4
type: evidence
title: W0A verification re-attested at the lease-expiry retirement
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:7b6cef07bd1183799bd657d23bb8cdde8b3ef8a83dfc27ee04e82c11d763cdd3
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R3]
updated: 2026-07-25
---

# EV-W0A-R4 — W0A verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0A attests ladder-drift and handoff doctor checks, the pre-commit scope gate, and
one-command capture. None of those behaviours changed; `roadmap/tools/**` is simply in its
`invalidated_by`, and W0H edits five files there.

One-command capture was exercised for real during this change rather than merely asserted:
`new.py decision` and `new.py insight` both produced schema-valid objects (D-9646fc3c and
INS-ede05c7a), and `capture:all-types-match-schema` passes.

The scope gate W0A installed demonstrated its value twice during this very change, which is worth
recording as evidence rather than anecdote: it refused the W0H kickoff commit pending owner
acknowledgement of durable governance transitions, and it refused an edit to an already-accepted
decision record with `immutable lifecycle record may only transition to superseded`. Both
refusals were correct and both were honoured rather than bypassed.

`contract_fingerprint` is byte-identical to EV-W0A-R3's: W0A's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
