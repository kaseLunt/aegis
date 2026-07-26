---
id: EV-W0F-R10
type: evidence
title: W0F re-attested at paragraph-logical instructional scanning (Codex round-7 disposition)
status: superseded
superseded_by: EV-W0F-R11
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-26T02:58:47Z
tested_commit: a29335208be5947dfe8a24579d4455d438feb706
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:77448f3b0d6be557eee4dce9d6be9c65bea06b75177d245dcf3d98b626f08d8b
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0F-R9]
updated: 2026-07-26
---

# EV-W0F-R10 — W0F verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-7 review, which closed the round-6 finding, audited
all six receipts to the fingerprint, verified the tier split protects history while catching
every prior bypass form, and found one mechanical gap: ordinary Markdown hard-wrapping split
directives across the per-line scanners. Both tiers now scan blank-line-separated LOGICAL
PARAGRAPHS (wrapped lines joined, start line preserved, strike spans working across wraps).
Three red-first cases from the wrapped forms bring the instructional family to fourteen, all
green; the live repo shows zero flags under paragraph joining, so no history needed rewording.
Codex's TMPDIR workaround also failed in its read-only sandbox (disclosed); selftest evidence
remains local runs at `tested_commit`.

`npm test` -> **384/384**, `tsc` -> exit 0. Bundle divergence addendum (INS-006): `_paragraphs` helper added, both scan loops paragraph-logical; selftest.py +3 wrapped cases.

`contract_fingerprint` is byte-identical to EV-W0F-R9's. Only `input_fingerprint` moved.
