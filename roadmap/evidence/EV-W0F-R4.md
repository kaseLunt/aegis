---
id: EV-W0F-R4
type: evidence
title: W0F verification re-attested at the lease-expiry retirement
status: superseded
superseded_by: EV-W0F-R5
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:a7bce5d02f7783b6401876c32ef8f954d04f37da114a5d0ded03a6a561378a3d
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0F-R3]
updated: 2026-07-25
---

# EV-W0F-R4 — W0F verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0F migrated the repo onto the upgraded control-plane bundle (receipts, snapshot
coherence, `writer_mode`). All of that is unchanged; only the input basis moved.

`npm test` -> **384/384** and `tsc --noEmit` -> exit 0, confirming the product surface is
untouched by a control-plane-only change.

**Bundle divergence, recorded rather than silently forked** ([[INS-006]]): W0H is a deliberate
local divergence from upstream bundle code in `roadmap/tools/**`. The delta to carry to the next
bundle sync is: `validate_lease` -> `validate_claim_timestamps`; removal of `claim.py renew`,
`--hours` and `MAX_LEASE_HOURS`; removal of `check_expiry` plumbing and `Authority.expired`;
removal of `scope_diff.validate_live_head` and both `--check-live-lease(s)` flags; and
`render_claim` becoming key-presence-aware so retired fields on historical records survive a
re-render. Snapshot coherence and the receipt machinery W0F installed are untouched, which is why
this re-attestation is a pure input re-basis.

`contract_fingerprint` is byte-identical to EV-W0F-R3's: W0F's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
