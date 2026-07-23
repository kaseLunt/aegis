---
id: EV-W0D-R2
type: evidence
title: W0D verification re-attested at the historical-receipt fix commit
status: recorded
work: W0D
result: pass
commands:
  - python roadmap/tools/selftest.py
observed_at: 2026-07-23T04:11:28Z
tested_commit: 979bff6ecb821d34c2128f0429771b82b3d06e08
contract_fingerprint: sha256:e8016e57f9163a5fc28a3ff47e743faaf4bd1e347567ff0d23e3fced0d1499d7
input_fingerprint: sha256:3321cccd0537e459567377b3573a3d41daaeb543d282b4208c70b9731b465c2d
environment: python 3.x, node 22.20.0, local win32-x64
supersedes: [EV-W0D]
updated: 2026-07-22
---

# EV-W0D-R2 — W0D verification receipt (re-attested)

Supersedes EV-W0D after roadmap/tools/** changed at `tested_commit` (the doctor fix
making superseded receipts historical records). Honest re-run at that exact tree:
selftest 0 failing (all mutation cases incl. the new supersession-lifecycle case).
The doctor at `tested_commit` reports exactly the six self-referential staleness errors
this supersession resolves and nothing else; the landing commit's pre-commit doctor
runs fully green over the re-attested corpus.
