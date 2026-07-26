---
id: EV-W0B-R6
type: evidence
title: W0B re-attested at the instructional-integrity guard (Codex round-3 disposition)
status: recorded
work: W0B
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-25T23:01:47Z
tested_commit: 17a7d5312a16026deab9b4b3b5012a5344350af3
contract_fingerprint: sha256:3e6dab9fddcbf7d8cdbc8e3b0b2587df02c7646312e696bd42df245f870f23ce
input_fingerprint: sha256:36e7268791e5d1f5d5ac4be116af26588aaafc1b96f1bb184e8a73f64f35ff9d
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0B-R5]
updated: 2026-07-25
---

# EV-W0B-R6 — W0B verification receipt (re-attested)

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

W0B's swarm-hardening gates are unchanged. The selftest corpus grew by three cases
(the instructional-integrity family), all mutation-verified at landing, so coverage strictly
increased again. `selftest.py` -> **OK, 0 failing**.

**Six receipts this round** (doctor.py sits in W0's narrow basis), derived from a doctor
run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0B-R5's: W0B's declared contract did
not change. Only `input_fingerprint` moved.
