---
id: EV-W0B-R2
type: evidence
title: W0B verification re-attested at the historical-receipt fix commit
status: recorded
work: W0B
result: pass
commands:
  - python roadmap/tools/selftest.py
observed_at: 2026-07-23T04:11:28Z
tested_commit: 979bff6ecb821d34c2128f0429771b82b3d06e08
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:653f70187980901ff4404a9ebf60d39e672b634eb8a8c7215b1257cfa29e4818
environment: python 3.x, node 22.20.0, local win32-x64
supersedes: [EV-W0B]
updated: 2026-07-22
---

# EV-W0B-R2 — W0B verification receipt (re-attested)

Supersedes EV-W0B after roadmap/tools/** changed at `tested_commit` (the doctor fix
making superseded receipts historical records). Honest re-run at that exact tree:
selftest 0 failing (all mutation cases incl. the new supersession-lifecycle case).
The doctor at `tested_commit` reports exactly the six self-referential staleness errors
this supersession resolves and nothing else; the landing commit's pre-commit doctor
runs fully green over the re-attested corpus.
