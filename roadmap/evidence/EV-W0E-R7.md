---
id: EV-W0E-R7
type: evidence
title: W0E re-attested at the hardened instructional guard (Codex round-4 disposition)
status: superseded
superseded_by: EV-W0E-R8
work: W0E
result: pass
commands:
  - python roadmap/tools/doctor.py && python roadmap/tools/selftest.py
observed_at: 2026-07-26T01:09:54Z
tested_commit: b61369b5eacbf8aa7dc1ff43d06f05c1c8812c68
contract_fingerprint: sha256:716684b2eeb35083e9a1cb59ed4134387333121bdc36f5ac19cfbe9ea19d189c
input_fingerprint: sha256:11a3ff9ebe87cef624d062aa63657ea887da72d5a8a4af279cacac288a7802b8
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0E-R6]
updated: 2026-07-26
---

# EV-W0E-R7 — W0E verification receipt (re-attested)

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

W0E's hazards note was reworded ("that carve-out was retired") so DESCRIBING the
retirement no longer uses the retired phrase un-struck -- a narrative edit, not a contract
edit, and the fingerprints agree: only `input_fingerprint` moved. The malformed-claim
rejection W0E attests now extends to the hardened instructional patterns.

`contract_fingerprint`: unchanged.
