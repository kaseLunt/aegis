---
id: EV-W0F-R5
type: evidence
title: W0F re-attested at the Codex P1/P2 dispositions for W0H
status: recorded
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-25T09:05:00Z
tested_commit: fc85b52021f8676ec8f4716739204ba0a9b88165
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:10b538a0b064bb798e4813a5fa5a42c147e99ea102f74b5f79da75ee47662924
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0F-R4]
updated: 2026-07-25
---

# EV-W0F-R5 — W0F verification receipt (re-attested)

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

`npm test` -> **384/384** and `tsc --noEmit` -> exit 0: the product surface remains
untouched by a control-plane-only change.

**Bundle divergence addendum** ([[INS-006]]), extending the list in EV-W0F-R4 for the next sync:
`validate_claim_timestamps` gains a comment documenting that `issued > now` is redundant-by-
construction rather than dead; `selftest.py` gains `claim:future-updated-rejected` and
`claim:issued-after-updated-rejected`; and `AGENTS.md`/`CLAUDE.md` executor instructions no
longer describe expiring leases.

**Five receipts this round, not six.** W0 is untouched because its `invalidated_by` is
the narrow `roadmap/tools/doctor.py`, which this round does not edit. Derived from a
doctor run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0F-R4's: W0F's declared contract did
not change. Only `input_fingerprint` moved.
