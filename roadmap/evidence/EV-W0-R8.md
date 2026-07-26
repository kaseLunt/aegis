---
id: EV-W0-R8
type: evidence
title: W0 re-attested at paragraph-logical instructional scanning (Codex round-7 disposition)
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-26T02:58:47Z
tested_commit: a29335208be5947dfe8a24579d4455d438feb706
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:6c41c7de59fe778e428a61f27740eeab67ff232a300c8094a53d291f7e3bab75
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R7]
updated: 2026-07-26
---

# EV-W0-R8 — W0 verification receipt (re-attested)

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

W0's basis moved through `doctor.py` (`_paragraphs` + both loops). Additive; zero live hits.

`contract_fingerprint` is byte-identical to EV-W0-R7's. Only `input_fingerprint` moved.
