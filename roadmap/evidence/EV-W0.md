---
id: EV-W0
type: evidence
title: W0 canonical verification passed at the W0F correction commit
status: superseded
superseded_by: EV-W0-R2
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py; python roadmap/tools/selftest.py
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:eef3ca791d60dd087cbf7db59838bc7162b52cfa6a0cfab47f741a25b4d640c1
environment: control-plane validators, local
updated: 2026-07-22
---

# EV-W0 — W0 verification receipt

Canonical command re-run honestly at `tested_commit`: `python roadmap/tools/doctor.py; python roadmap/tools/selftest.py` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
