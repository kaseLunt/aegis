---
id: EV-W0A-R11
type: evidence
title: W0A re-attested at adjacent-pair standing windows (Codex round-8 disposition)
status: recorded
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-26T06:17:13Z
tested_commit: 77ffe9dad226bf67886d081dd0c321709828f310
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:74d1e70e220c182b054393ea36758b2612892a3d57b73a864fec922ce1364dc0
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R10]
updated: 2026-07-26
---

# EV-W0A-R11 — W0A verification receipt (re-attested)

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

Structural Markdown (lists, headings, intros) can no longer hide a directive from the standing tier.

`contract_fingerprint` is byte-identical to EV-W0A-R10's. Only `input_fingerprint` moved.
