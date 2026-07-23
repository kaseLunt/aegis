---
id: EV-W3-R2
type: evidence
title: W3 verification re-attested after the W4 slice-2 adapter-seam extension
status: superseded
superseded_by: EV-W3-R3
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-23T04:46:05Z
tested_commit: a72d52fd249f082ef0dfb6afb3c0e9c714306a51
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:99d6ba0f0a11712c82067205b6c4c24b693623aa9dd7e23c7c5d1ca1d51206a2
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W3]
updated: 2026-07-23
---

# EV-W3-R2 — W3 verification receipt (re-attested)

Supersedes EV-W3 after W4 slice 2 extended the adapter seam (IdentityReadAdapter in
lib/aegis/chain/adapter.ts) and added the sealed identity-reads reference recording —
both inside W3's declared input basis. Honest re-run at `tested_commit`: npm test ->
265/265 pass (the full suite includes all W3 boundary/quorum/adapter/engine tests
unchanged). W3's own contract is unchanged; only its observed inputs moved.
