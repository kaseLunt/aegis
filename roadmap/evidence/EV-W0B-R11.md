---
id: EV-W0B-R11
type: evidence
title: W0B re-attested at adjacent-pair standing windows (Codex round-8 disposition)
status: recorded
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-26T06:17:13Z
tested_commit: 77ffe9dad226bf67886d081dd0c321709828f310
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:c675e2d61dcd2ee9144918350ed5f8ba1c6b675bc75d24b8d060456a62cd5d2a
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0B-R10]
updated: 2026-07-26
---

# EV-W0B-R11 — W0B verification receipt (re-attested)

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

Fifteen instructional cases, all red-first. `selftest.py` -> **OK, 0 failing**.

`contract_fingerprint` is byte-identical to EV-W0B-R10's. Only `input_fingerprint` moved.
