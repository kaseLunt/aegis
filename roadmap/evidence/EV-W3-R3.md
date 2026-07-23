---
id: EV-W3-R3
type: evidence
title: W3 verification re-attested at the Codex W4 disposition commit
status: superseded
superseded_by: EV-W3-R4
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-23T05:36:11Z
tested_commit: 63dbfa7baf8589942fda79a6203294e57bd5aa35
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:9237208dfc983073babb26825d6ea22d255ad9c295c9758c790492fcd7bbb27c
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W3-R2]
updated: 2026-07-23
---

# EV-W3-R3 — W3 verification receipt (re-attested)

Supersedes EV-W3-R2 after the Codex W4 review disposition moved W3's declared inputs
again (adapter identity reads re-keyed by block hash, ProviderObservation response
provenance, resealed identity recording). Honest re-run at `tested_commit`: npm test ->
297/297 pass (all W3 boundary/quorum/adapter/engine tests unchanged and green). W3's own
contract is unchanged; only its observed inputs moved.
