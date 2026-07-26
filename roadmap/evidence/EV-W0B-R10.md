---
id: EV-W0B-R10
type: evidence
title: W0B re-attested at paragraph-logical instructional scanning (Codex round-7 disposition)
status: superseded
superseded_by: EV-W0B-R11
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-26T02:58:47Z
tested_commit: a29335208be5947dfe8a24579d4455d438feb706
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:6471a4311e14b91473adb0932b9f04d24989e969fd0c933e887c98470d8455a8
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0B-R9]
updated: 2026-07-26
---

# EV-W0B-R10 — W0B verification receipt (re-attested)

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

Fourteen instructional cases, all red-first. `selftest.py` -> **OK, 0 failing**.

`contract_fingerprint` is byte-identical to EV-W0B-R9's. Only `input_fingerprint` moved.
