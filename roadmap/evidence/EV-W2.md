---
id: EV-W2
type: evidence
title: W2 canonical verification passed at the W0F correction commit
status: recorded
work: W2
result: pass
commands:
  - npm test
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:6dea3c73050a47a58775b77df4a005fdccd3d1c4f6ce76f1d9fbbeb247be67c3
input_fingerprint: sha256:4a6548f4cd36d55897eaa142afeb98a890a8f65a1b4537d03690a0b17dc0e0cb
environment: node 22, vitest 4.1.10, local
updated: 2026-07-22
---

# EV-W2 — W2 verification receipt

Canonical command re-run honestly at `tested_commit`: `npm test` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
