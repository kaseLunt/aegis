---
id: EV-W0D-R7
type: evidence
title: W0D re-attested at the hardened instructional guard (Codex round-4 disposition)
status: superseded
superseded_by: EV-W0D-R8
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/claim.py list
observed_at: 2026-07-26T01:09:54Z
tested_commit: b61369b5eacbf8aa7dc1ff43d06f05c1c8812c68
contract_fingerprint: sha256:43801eb64c910d49944012e008fa2a7fe4e70669d62f7b44de8aa187d95613ab
input_fingerprint: sha256:b84a02f981ce350ed16b98b7ba2c4a6155829716cab10c57e829bc7e9439aa79
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0D-R6]
updated: 2026-07-26
---

# EV-W0D-R7 — W0D verification receipt (re-attested)

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

**This is a CONTRACT re-basis, unlike every prior receipt in the W0H chains.**
`contract_fingerprint` moved (sha256:e8016e57... -> sha256:43801eb6...) because W0D's OWN
ACCEPTANCE text changed: "claim.py open/renew/release/list works" was the round-4 bypass
instance, and the fix strikes the retired elements in place -- open/~~renew~~/release/list,
~~lease~~, ~~expiry flagged~~, ~~expired lease~~ -- under a charter note naming
[[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]] as the retiring authority and [[EV-W0D-R6]]'s
scope-reduction record as the current attestation. The proactive strikes cover the stale
phrases a later review round would otherwise have found one at a time.

The doctor itself distinguished this case: it reported "verification contract differs from
the tested commit" for W0D while reporting "inputs/deliverables differ" for the other five --
the receipt machinery separating WHAT an item promises from WHAT it was tested against,
exactly as designed. What W0D promises after the strike is precisely what EV-W0D-R4 through
R6 already attested it delivers: claims without a clock. The contract text now says what the
receipts said.

`contract_fingerprint`: CHANGED -- deliberate contract re-basis, see body.
