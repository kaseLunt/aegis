---
id: EV-W0-R2
type: evidence
title: W0 verification re-attested at the historical-receipt fix commit
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/selftest.py
observed_at: 2026-07-23T04:11:28Z
tested_commit: 979bff6ecb821d34c2128f0429771b82b3d06e08
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:808ced73dfdf2fca3c07465d26bef319b2162a1a7eb4123dffdd318cf9007dc0
environment: python 3.x, node 22.20.0, local win32-x64
supersedes: [EV-W0]
updated: 2026-07-22
---

# EV-W0-R2 — W0 verification receipt (re-attested)

Supersedes EV-W0 after roadmap/tools/** changed at `tested_commit` (the doctor fix
making superseded receipts historical records). Honest re-run at that exact tree:
selftest 0 failing (all mutation cases incl. the new supersession-lifecycle case).
The doctor at `tested_commit` reports exactly the six self-referential staleness errors
this supersession resolves and nothing else; the landing commit's pre-commit doctor
runs fully green over the re-attested corpus.
