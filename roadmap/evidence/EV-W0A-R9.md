---
id: EV-W0A-R9
type: evidence
title: W0A re-attested at the per-tier renewal matchers (Codex round-6 disposition)
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-26T02:20:24Z
tested_commit: 76ce0da31fdd7e50ec9b4145721903ce623d1fd1
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:d2980e7d3ef3b5e221821fe24d08e1bd1147b2fe34acb4987796e6bf7c081bb0
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R8]
updated: 2026-07-26
---

# EV-W0A-R9 — W0A verification receipt (re-attested)

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

W0A's instructions-stay-true enforcement reaches its designed operating point: proximity where executors read first, prescriptive forms where history legitimately lives.

`contract_fingerprint` is byte-identical to EV-W0A-R8's. Only `input_fingerprint` moved.
