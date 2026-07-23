---
id: EV-W0B
type: evidence
title: W0B canonical verification passed at the W0F correction commit
status: recorded
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py; python roadmap/tools/selftest.py
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:58374011114306e15ba1c88eb8e69c25f1dfc425e58161cd180b63f41a8d5246
environment: control-plane validators, local
updated: 2026-07-22
---

# EV-W0B — W0B verification receipt

Canonical command re-run honestly at `tested_commit`: `python roadmap/tools/doctor.py; python roadmap/tools/selftest.py` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
