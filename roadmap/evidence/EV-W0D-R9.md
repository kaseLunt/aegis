---
id: EV-W0D-R9
type: evidence
title: W0D re-attested at the per-tier renewal matchers (Codex round-6 disposition)
status: recorded
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/claim.py list
observed_at: 2026-07-26T02:20:24Z
tested_commit: 76ce0da31fdd7e50ec9b4145721903ce623d1fd1
contract_fingerprint: sha256:43801eb64c910d49944012e008fa2a7fe4e70669d62f7b44de8aa187d95613ab
input_fingerprint: sha256:254c808539993cfa4cb501228c80e909a34d61b80365031d66dac2ee41edaa1b
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0D-R8]
updated: 2026-07-26
---

# EV-W0D-R9 — W0D verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-6 review, which closed the W0D-note finding and
demonstrated the obligation-form bypass ("Active claims require renewal before committing.").
The adopted fix is PER-TIER matchers: standing instruction surfaces now get full either-order
proximity between claim/lease and the renew stem with no strike exemption (pure-instruction
files have no legitimate renewal language in any voice, so maximal strictness there terminates
the phrase-enumeration game), while live narrative gets prescriptive-form matching -- now
including obligation forms -- with the per-match strike exemption, because narrative
legitimately DESCRIBES the retired mechanism. Raw proximity applied everywhere had been tried
first and derived twelve live flags, nearly all legitimate history (including the incident
record's own title); the split resolves all twelve to zero without rewording any history,
verified by doctor run. Two new red-first cases from Codex's bypass examples bring the
instructional family to eleven, all green.

Codex round-6 again could not run selftest in its sandbox (no writable temp, disclosed);
selftest evidence is local runs at `tested_commit`.

Pure input re-basis; the R7 contract value stands. The narrative tier's design explicitly protects this item's struck acceptance history from matcher damage.

`contract_fingerprint` is byte-identical to EV-W0D-R8's. Only `input_fingerprint` moved.
