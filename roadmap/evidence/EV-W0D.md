---
id: EV-W0D
type: evidence
title: W0D canonical verification passed at the W0F correction commit
status: recorded
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py; python roadmap/tools/selftest.py
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:e8016e57f9163a5fc28a3ff47e743faaf4bd1e347567ff0d23e3fced0d1499d7
input_fingerprint: sha256:f00f1a40bcd8908cffdaeb5af1dd2f24235bb4fe3a7bbb034f3d607fae864628
environment: control-plane validators, local
updated: 2026-07-22
---

# EV-W0D — W0D verification receipt

Canonical command re-run honestly at `tested_commit`: `python roadmap/tools/doctor.py; python roadmap/tools/selftest.py` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
