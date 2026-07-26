---
id: EV-W0E-R11
type: evidence
title: W0E re-attested at adjacent-pair standing windows (Codex round-8 disposition)
status: recorded
work: W0E
result: pass
commands:
  - python roadmap/tools/doctor.py && python roadmap/tools/selftest.py
observed_at: 2026-07-26T06:17:13Z
tested_commit: 77ffe9dad226bf67886d081dd0c321709828f310
contract_fingerprint: sha256:716684b2eeb35083e9a1cb59ed4134387333121bdc36f5ac19cfbe9ea19d189c
input_fingerprint: sha256:9295aa5db511e6c9ac63aad507a2eb4c85454eaa3ffecd8a39291f8de76567f2
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0E-R10]
updated: 2026-07-26
---

# EV-W0E-R11 — W0E verification receipt (re-attested)

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

W0E's rejection surface holds across split-block constructions on standing surfaces.

`contract_fingerprint` is byte-identical to EV-W0E-R10's. Only `input_fingerprint` moved.
