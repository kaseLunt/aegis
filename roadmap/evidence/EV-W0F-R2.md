---
id: EV-W0F-R2
type: evidence
title: W0F verification re-attested at the historical-receipt fix commit
status: recorded
work: W0F
result: pass
commands:
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-23T04:11:28Z
tested_commit: 979bff6ecb821d34c2128f0429771b82b3d06e08
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:4cacf806414f2b7a8f400e8bea8c6ead92646f7f14e33fcd52c3263bfd073c4d
environment: python 3.x, node 22.20.0, local win32-x64
supersedes: [EV-W0F]
updated: 2026-07-22
---

# EV-W0F-R2 — W0F verification receipt (re-attested)

Supersedes EV-W0F after roadmap/tools/** changed at `tested_commit` (the doctor fix
making superseded receipts historical records). Honest re-run at that exact tree:
selftest 0 failing (all mutation cases incl. the new supersession-lifecycle case); npm test 228/228.
The doctor at `tested_commit` reports exactly the six self-referential staleness errors
this supersession resolves and nothing else; the landing commit's pre-commit doctor
runs fully green over the re-attested corpus.
