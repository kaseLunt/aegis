---
id: EV-W3-R4
type: evidence
title: W3 verification re-attested at the residual-closure commit
status: recorded
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-23T06:08:07Z
tested_commit: 4e152e02905758cdeeeba791c3c08640cba72526
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:60b23e4589781aa513a503468a147e9fcc42d834165c439a630e54b7bce13b04
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W3-R3]
updated: 2026-07-23
---

# EV-W3-R4 -- W3 verification receipt (re-attested)

Supersedes EV-W3-R3 after the verification-pass residual closures moved W3's declared
inputs again (requireCanonical in the adapter read canon, resealed identity recording).
Honest re-run at `tested_commit`: npm test -> 305/305 pass (all W3 tests unchanged and
green). W3's own contract is unchanged; only its observed inputs moved.
