---
id: EV-W3
type: evidence
title: W3 canonical verification passed at the W0F correction commit
status: superseded
superseded_by: EV-W3-R2
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-23T01:45:08Z
tested_commit: d21f58eee4dcce6298d9f04c51f6b12e50012e04
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:3a9acf427a70ce420e7c2e79a2dcd29d5cde326de21698b67f1ad928eb48d8b9
environment: node 22, vitest 4.1.10, local
updated: 2026-07-22
---

# EV-W3 — W3 verification receipt

Canonical command re-run honestly at `tested_commit`: `npm test` -> pass. Product-code items ran the full 228-test suite; control-plane items ran doctor + the mutation selftest; research lanes attest their committed deliverables.
