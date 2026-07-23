---
id: EV-W1
type: evidence
title: W1 canonical verification passed at the W0F correction commit
status: recorded
work: W1
result: pass
commands:
  - npm test
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:35a0b37d1976caaa4ec481edacf630a9ce9ad597d471a6decb4d729a10c08d32
input_fingerprint: sha256:9bc4d6839ae14760307f998b5314b6c7ec8873763374afb16f6480738260243d
environment: node 22, vitest 4.1.10, local
updated: 2026-07-22
---

# EV-W1 — W1 verification receipt

Canonical command re-run honestly at `tested_commit`: `npm test` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
