---
id: EV-W0B-R5
type: evidence
title: W0B re-attested at the Codex P1/P2 dispositions for W0H
status: superseded
superseded_by: EV-W0B-R6
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-25T09:05:00Z
tested_commit: fc85b52021f8676ec8f4716739204ba0a9b88165
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:236ba21fa25ddea6ab7d5ce4f66d7839b07d2e7488bac5b4c447428a895b605d
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0B-R4]
updated: 2026-07-25
---

# EV-W0B-R5 — W0B verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex adversarial review of the W0H change (verdict
needs-attention; no P0, one P1, one P2). Both findings are closed here:

- **P2 (test teeth).** The single future-timestamp selftest case set BOTH `issued_at` and
  `updated_at` to 2999, so it would have stayed green if either half of the future check were
  deleted -- the surviving field still produced the same diagnostic. Replaced with three
  orthogonal fixtures (`claim:future-issued-rejected`, `claim:future-updated-rejected`,
  `claim:issued-after-updated-rejected`), each comparison mutation-tested INDEPENDENTLY:
  dropping `updated > now` kills only the second, dropping the ordering rule kills only the
  third, and dropping `issued > now` kills nothing -- because it is unreachable as a sole cause
  once ordering guarantees `issued <= updated`. That comparison is kept as defence in depth with
  a comment recording why it is redundant rather than dead code.
- **P1 (executor instructions).** `AGENTS.md:75` and `CLAUDE.md:80` still told agents that
  "leases expire -- renew or release". Those files are the first thing an executor reads, so
  leaving them stale would have shipped a stale-green: tooling and instructions disagreeing,
  with the instructions winning in practice. Both are PROTECTED surfaces, so W0H's
  `allowed_paths` were expanded under owner acknowledgement and the claim rotated to generation
  6. `roadmap/RULES.md:9` remains out of scope as an owner-only surface.

W0B's swarm-hardening gates are unchanged. The selftest corpus GREW by two cases
this round (three orthogonal timestamp fixtures replacing one), so mutation coverage strictly
increased. `selftest.py` -> **OK, 0 failing**.

**Five receipts this round, not six.** W0 is untouched because its `invalidated_by` is
the narrow `roadmap/tools/doctor.py`, which this round does not edit. Derived from a
doctor run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0B-R4's: W0B's declared contract did
not change. Only `input_fingerprint` moved.
