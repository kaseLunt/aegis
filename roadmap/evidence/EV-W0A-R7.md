---
id: EV-W0A-R7
type: evidence
title: W0A re-attested at the hardened instructional guard (Codex round-4 disposition)
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-26T01:09:54Z
tested_commit: b61369b5eacbf8aa7dc1ff43d06f05c1c8812c68
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:729d3bacc5c17b36f5fb12935a74a6ed99d9eaa0bee48a0b27335cd13b6f0763
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R6]
updated: 2026-07-26
---

# EV-W0A-R7 — W0A verification receipt (re-attested)

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

W0A's guarantees are unchanged; the instructions-stay-true class its doctor now
enforces simply got harder to bypass. The demonstrated-bypass-becomes-red-test pattern is the
one to reuse: when a reviewer shows a concrete evasion, that evasion IS the next fixture.

`contract_fingerprint`: unchanged.
