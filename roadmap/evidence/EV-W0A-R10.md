---
id: EV-W0A-R10
type: evidence
title: W0A re-attested at paragraph-logical instructional scanning (Codex round-7 disposition)
status: superseded
superseded_by: EV-W0A-R11
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-26T02:58:47Z
tested_commit: a29335208be5947dfe8a24579d4455d438feb706
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:523cef5543736347eb855fb2ebbdf4e77f7f90f4c0bd0931c647deac49c7b141
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R9]
updated: 2026-07-26
---

# EV-W0A-R10 — W0A verification receipt (re-attested)

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

Wrapping is formatting again, not camouflage -- the instructions-stay-true class now holds across line breaks.

`contract_fingerprint` is byte-identical to EV-W0A-R9's. Only `input_fingerprint` moved.
