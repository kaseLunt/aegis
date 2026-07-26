---
id: EV-W0-R4
type: evidence
title: W0 re-attested at the instructional-integrity guard (Codex round-3 disposition)
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-25T23:01:47Z
tested_commit: 17a7d5312a16026deab9b4b3b5012a5344350af3
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:7aa0ba11047f7aa9df0009198b34ba7c120032b52b1a484060666146b8b955f9
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R3]
updated: 2026-07-25
---

# EV-W0-R4 — W0 verification receipt (re-attested)

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

W0's basis moved because `doctor.py` -- its narrow `invalidated_by` -- gained the
instructional-integrity rule. The rule is purely ADDITIVE on the validation surface W0 attests:
every pre-existing doctor check (ladder projection, schema validation, receipt bases, phase
machine, claim accountability) is byte-identical in behaviour, and the new rule ran with ZERO
errors on the live repo at `tested_commit` -- proof the fixed surfaces comply rather than an
untested assertion.

**Six receipts this round** (doctor.py sits in W0's narrow basis), derived from a doctor
run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0-R3's: W0's declared contract did
not change. Only `input_fingerprint` moved.
