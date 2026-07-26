---
id: EV-W0-R10
type: evidence
title: W0 re-attested at unbounded standing co-occurrence (Codex round-9 disposition)
status: superseded
superseded_by: EV-W0-R11
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-26T06:51:20Z
tested_commit: caaac45634a5509809d80a0b5d5eeb16994d8a1c
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:b17a550511661dcb9e0370a91dc98a50c2508399c4948b217d77a87e6e856935
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R9]
updated: 2026-07-26
---

# EV-W0-R10 — W0 verification receipt (re-attested)

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

W0's basis moved through `doctor.py` (the unbounded standing co-occurrence). Additive; zero live hits.

`contract_fingerprint` is byte-identical to EV-W0-R9's. Only `input_fingerprint` moved.
