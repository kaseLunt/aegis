---
id: EV-W0-R5
type: evidence
title: W0 re-attested at the hardened instructional guard (Codex round-4 disposition)
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-26T01:09:54Z
tested_commit: b61369b5eacbf8aa7dc1ff43d06f05c1c8812c68
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:0c2b3b394bfabc22660e555ae02478baa281863a7dbb96874c818cc1423d998f
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R4]
updated: 2026-07-26
---

# EV-W0-R5 — W0 verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-4 review, which CLOSED the round-3 finding and then
demonstrated a live bypass of the new instructional guard: W0D's acceptance still read
"claim.py open/renew/release/list works", which the spaced literal matched by the round-3 rule
does not catch, and the per-LINE strike exemption would let an unrelated ~~strike~~ shield a
live directive. The guard now catches slash command lists and adjacent natural renewal
phrasing, and its exemption requires the MATCHED SPAN itself to be enclosed by strike markers.
Three new selftest cases were each observed RED against the round-3 guard using the exact
bypass inputs Codex demonstrated -- the strongest available negative test -- and all three
round-3 cases stayed green (the broadening loosened nothing).

Recorded honestly: Codex's round-4 sandbox had no writable temp directory and could not run
selftest itself; the selftest evidence in this receipt is local runs at `tested_commit`.

W0's basis moved because `doctor.py` (its narrow `invalidated_by`) gained the
broadened narrative patterns and the per-match strike check. Additive on W0's attested
surface; every pre-existing check is behaviourally identical, and the broadened rule ran with
ZERO hits on the live repo at `tested_commit`.

`contract_fingerprint`: unchanged.
