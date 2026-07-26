---
id: EV-W0A-R6
type: evidence
title: W0A re-attested at the instructional-integrity guard (Codex round-3 disposition)
status: superseded
superseded_by: EV-W0A-R7
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/new.py idea "title here"
observed_at: 2026-07-25T23:01:47Z
tested_commit: 17a7d5312a16026deab9b4b3b5012a5344350af3
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:46b1f66e9e249b83ab9e26c09ecd9fbbb55cb8131dca74a4fa0cbe9c593d5fbe
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R5]
updated: 2026-07-25
---

# EV-W0A-R6 — W0A verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-3 review of W0H (all three round-2 findings CLOSED;
one new high finding). The defect: [[INS-c80e5b1e-d02d-4d0d-a48f-167aacf2eef7]] -- the incident
record that live handoffs route readers to -- still PRESCRIBED the deleted renew command in its
normative Consequence, so the round-1 dead end survived through a referenced document. The fix
marks that insight a historical incident record with every operational directive struck; the
tooth is a new doctor rule, `validate_instructional_surfaces`: standing instruction files
(CLAUDE.md, AGENTS.md, RULES.md, SYSTEM.md, VISION.md) may carry no retired lease/renewal
phrases at all, and live roadmap narrative may not carry the dead command literal on an
un-struck line (~~struck~~ text is marked-historical and exempt; decisions/evidence/archive
remain untouched records by construction). Three selftest cases were written first and observed
RED (2 failing) against the unmodified doctor; two mutants then killed exactly their predicted
cases (removing the rule call -> the two detection cases; dropping the strike-through
exemption -> the exemption case).

W0A's own guarantees (ladder-drift and handoff doctor checks, the pre-commit scope
gate, one-command capture) are unchanged; the doctor W0A installs simply enforces one more
class. Notably the class is W0A's own concern -- executor-facing instructions staying true --
extended from structure to CONTENT: the doctor now rejects instructions that prescribe retired
mechanics, which is the exact failure mode that let a stale insight recreate a known dead
end.

**Six receipts this round** (doctor.py sits in W0's narrow basis), derived from a doctor
run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0A-R5's: W0A's declared contract did
not change. Only `input_fingerprint` moved.
