---
id: EV-W0F-R7
type: evidence
title: W0F re-attested at the hardened instructional guard (Codex round-4 disposition)
status: superseded
superseded_by: EV-W0F-R8
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-26T01:09:54Z
tested_commit: b61369b5eacbf8aa7dc1ff43d06f05c1c8812c68
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:73ea6afe4f95fc704de82884a60f951a0df8a9654804d8ccbf1a1ed3b05df024
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0F-R6]
updated: 2026-07-26
---

# EV-W0F-R7 — W0F verification receipt (re-attested)

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

`npm test` -> **384/384**, `tsc --noEmit` -> exit 0: product untouched. **Bundle
divergence addendum** ([[INS-006]]): `doctor.py`'s RETIRED_NARRATIVE_RE broadened (slash
command lists + natural phrasing), STRIKE_SPAN_RE + `_match_is_struck` added (per-match
strike enclosure), and `selftest.py` gained the three bypass cases.

`contract_fingerprint`: unchanged.
