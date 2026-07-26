---
id: EV-W0E-R6
type: evidence
title: W0E re-attested at the instructional-integrity guard (Codex round-3 disposition)
status: recorded
work: W0E
result: pass
commands:
  - python roadmap/tools/doctor.py && python roadmap/tools/selftest.py
observed_at: 2026-07-25T23:01:47Z
tested_commit: 17a7d5312a16026deab9b4b3b5012a5344350af3
contract_fingerprint: sha256:716684b2eeb35083e9a1cb59ed4134387333121bdc36f5ac19cfbe9ea19d189c
input_fingerprint: sha256:b2458c6c6ffc8169ffe566de69a8c6034a058698db43f5a5bcbc57e77123955b
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0E-R5]
updated: 2026-07-25
---

# EV-W0E-R6 — W0E verification receipt (re-attested)

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

The scope REDUCTION recorded in EV-W0E-R4 stands unchanged. W0E's central claim --
the doctor rejects what must not ship -- is directly extended by this round: instructional
integrity joins malformed-claim rejection in the enforced set, with the same evidence standard
(cases observed red first, mutants killing exactly their predicted cases).

**Six receipts this round** (doctor.py sits in W0's narrow basis), derived from a doctor
run rather than predicted ([[INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e]]).

`contract_fingerprint` is byte-identical to EV-W0E-R5's: W0E's declared contract did
not change. Only `input_fingerprint` moved.
