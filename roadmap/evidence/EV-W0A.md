---
id: EV-W0A
type: evidence
title: W0A canonical verification passed at the W0F correction commit
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py; python roadmap/tools/selftest.py
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:314a6c320872c6a117baac6f2cf4c4c4ae1dafbb5679161cd680320f5724b1b9
environment: control-plane validators, local
updated: 2026-07-22
---

# EV-W0A — W0A verification receipt

Canonical command re-run honestly at `tested_commit`: `python roadmap/tools/doctor.py; python roadmap/tools/selftest.py` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
