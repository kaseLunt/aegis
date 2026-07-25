---
id: EV-W0D-R4
type: evidence
title: W0D re-attested with an explicit scope REDUCTION: the lease element is retired
status: recorded
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/claim.py list
observed_at: 2026-07-25T08:30:37Z
tested_commit: 6850f1a907482a05a63a8c4789fc2b3dd135e683
contract_fingerprint: sha256:e8016e57f9163a5fc28a3ff47e743faaf4bd1e347567ff0d23e3fced0d1499d7
input_fingerprint: sha256:e8bbda13c5da49dcb57ac2d4201b2c3671d0f88b2b5d65198608f3ce897bac80
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0D-R3]
updated: 2026-07-25
---

# EV-W0D-R4 — W0D verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete. Before it,
the doctor's only complaint was the staleness this receipt set resolves — the
self-referential step the re-attestation recipe exists to walk
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

**This receipt narrows what W0D attests. Read the reduction before the pass.**

W0D delivered the claims model, and its acceptance text names lease behaviour directly:
*"Per-agent claims (lease, base commit, narrowable scope) + doctor accountability (every active
item claimed, one claim per agent, expiry flagged)"*, *"claim.py open/renew/release/list works"*,
and a handoff line reading *"an expired lease is a commit-blocking doctor error -- renew or
release promptly"*.

By owner decision [[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]], executed as W0H, the following parts
of that attestation are **retired and no longer true**:

- `claim.py renew` does not exist; `--hours` and `MAX_LEASE_HOURS` are gone.
- The doctor no longer flags expiry, and an old claim is no longer a commit-blocking error.
- `lease_expires` is neither written nor validated for new claims.

Everything else W0D delivered is intact and re-verified at `tested_commit`:

- per-agent claims with `base_commit` and narrowable scope, contained by the task's
  `allowed_paths` and pinned by `scope_hash` (`claim:scope-hash-enforced`);
- doctor accountability -- every active work item carries exactly one active claim, one claim per
  agent, integrator explicit under `writer_mode: serial`;
- the claim-aware scope gate: narrowed scope blocks out-of-scope paths, unknown agents fail;
- `claim.py open/rescope/rebind/release/list` all work. `list` now prints `updated=` in place of
  `expires=`, verified by running it.

The replacement for the retired part is `release --status abandoned`, pinned by
`claim:abandon-recovers-without-time-travel`. That a *stale* claim remains fully authoritative is
now itself an asserted invariant (`claim:stale-claim-authorizes-in-scope-output`), while scope
enforcement on that same claim is separately pinned
(`claim:stale-claim-still-refuses-out-of-scope-output`, which asserts the refusal message is
`outside committed authority` so it cannot pass for a time-based reason).

W0D's `## Handoff` has been annotated so its now-false operational advice does not mislead a cold
reader. The historical acceptance text is left standing as the record of what was delivered.

`contract_fingerprint` is byte-identical to EV-W0D-R3's: W0D's declared contract
(allowed paths, deliverables, `invalidated_by`) did not change. Only `input_fingerprint`
moved, which is exactly what an input re-basis should look like.
