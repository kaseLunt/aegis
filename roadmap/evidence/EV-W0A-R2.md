---
id: EV-W0A-R2
type: evidence
title: W0A verification re-attested at the historical-receipt fix commit
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/selftest.py
observed_at: 2026-07-23T04:11:28Z
tested_commit: 979bff6ecb821d34c2128f0429771b82b3d06e08
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:ed74180a4b7c003b50ff3e7c63f0ccb051e97c4cbae46d9cc6a2760d9132f7d5
environment: python 3.x, node 22.20.0, local win32-x64
supersedes: [EV-W0A]
updated: 2026-07-22
---

# EV-W0A-R2 — W0A verification receipt (re-attested)

Supersedes EV-W0A after roadmap/tools/** changed at `tested_commit` (the doctor fix
making superseded receipts historical records). Honest re-run at that exact tree:
selftest 0 failing (all mutation cases incl. the new supersession-lifecycle case).
The doctor at `tested_commit` reports exactly the six self-referential staleness errors
this supersession resolves and nothing else; the landing commit's pre-commit doctor
runs fully green over the re-attested corpus.
