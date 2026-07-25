---
id: EV-W0B-R4
type: evidence
title: W0B verification re-attested at the lease-expiry retirement
status: recorded
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:4391cafd08ff4cb2f997c03361b13f8380cd5486722d69470321c70ac7be6b52
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0B-R3]
updated: 2026-07-25
---

# EV-W0B-R4 — W0B verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0B's swarm-hardening gates are unchanged in behaviour; only its input basis moved,
because `roadmap/tools/**` sits in its `invalidated_by`.

The selftest corpus W0B depends on did change shape: five lease-specific cases were **replaced,
not deleted**, so mutation coverage did not shrink. The replacements were red-green verified (four
failed against the pre-change tools) and negative-tested with two mutants at landing -- a
reintroduced time-based refusal killed all three stale-claim cases, and a reintroduced
`lease_expires` write killed the open-writes case uniquely. `selftest.py` reports **OK, 0
failing**.

`contract_fingerprint` is byte-identical to EV-W0B-R3's: W0B's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
