---
id: EV-W0F-R12
type: evidence
title: W0F re-attested at unbounded standing co-occurrence (Codex round-9 disposition)
status: recorded
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-26T06:51:20Z
tested_commit: caaac45634a5509809d80a0b5d5eeb16994d8a1c
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:a1b3753139d6875def2ea0bb77a2748fc176c8ae695288530e21b44fc3b328ca
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0F-R11]
updated: 2026-07-26
---

# EV-W0F-R12 — W0F verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-9 review, which closed the round-8 finding and, as
the round-9 brief demanded, delivered its new P2 WITH the terminating fix shape: the bounded
{0,40} proximity gap let an ordinary qualifying clause separate the claim token from the renew
stem in an adjacent-block window. The cap is now dropped entirely: standing windows use
UNBOUNDED co-occurrence, either order -- the fixed point of the class, since no gap length,
wrap, split, or phrasing can place both tokens on a standing surface without flagging, and the
zero-legitimate-renewal-language invariant (verified empirically: zero live flags) guarantees
no false positive. One red-first case with Codex's exact construction brings the instructional
family to sixteen, all green. Codex again could not run selftest in its sandbox (disclosed);
selftest evidence is local runs at `tested_commit`.

`npm test` -> **384/384**, `tsc` -> exit 0. Bundle divergence addendum (INS-006): proximity gap cap removed on the standing tier; selftest.py +1 case.

`contract_fingerprint` is byte-identical to EV-W0F-R11's. Only `input_fingerprint` moved.
