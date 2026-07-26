---
id: EV-W0D-R11
type: evidence
title: W0D re-attested at adjacent-pair standing windows (Codex round-8 disposition)
status: superseded
superseded_by: EV-W0D-R12
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/claim.py list
observed_at: 2026-07-26T06:17:13Z
tested_commit: 77ffe9dad226bf67886d081dd0c321709828f310
contract_fingerprint: sha256:43801eb64c910d49944012e008fa2a7fe4e70669d62f7b44de8aa187d95613ab
input_fingerprint: sha256:54a2bb4cd6bb785c8ff9693c415c5d8c8fad1e09b79d13b89ca0f6d7d17cfbd3
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0D-R10]
updated: 2026-07-26
---

# EV-W0D-R11 — W0D verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-8 review, which closed the round-7 line-wrap finding
and found the colon-introduced-list construction: a blank line between a directive's subject
("Active claims require:") and its list item ("- renewal before committing.") split the two
across paragraph boundaries. Standing surfaces now scan single paragraphs AND adjacent
paragraph pairs, closing the entire split-across-one-blank-line family where instruction files
are read; this cannot false-positive because standing files carry no legitimate renewal
language at all (derived: zero live flags). Narrative remains paragraph-logical with its
documented, standing-backstopped residue. One red-first case
(instructional:list-intro-standing-rejected, Codex's exact construction) brings the
instructional family to fifteen, all green. Codex again could not run selftest in its sandbox
(no writable temp, disclosed); selftest evidence is local runs at `tested_commit`.

Pure input re-basis; the R7 contract value stands.

`contract_fingerprint` is byte-identical to EV-W0D-R10's. Only `input_fingerprint` moved.
