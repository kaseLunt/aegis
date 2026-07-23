---
id: EV-W0F
type: evidence
title: W0F bundle migration verified at fa5c95c
status: superseded
superseded_by: EV-W0F-R2
work: W0F
result: pass
commands:
  - python roadmap/tools/doctor.py; python roadmap/tools/selftest.py; npm test
observed_at: 2026-07-22T23:55:00Z
tested_commit: fa5c95c2c0de856717dfaf2fb0f92545122076ed
contract_fingerprint: sha256:e62fbe0ef8b13f1bc41f6cb4b101d4ece44a60e53d4159a1144d79375a7d89d7
input_fingerprint: sha256:c6be61c2425906a809f181439b20fe60ef9170a4fbc1b5a960dff8dfe72557b8
environment: node 22 + python 3, local Windows checkout (core.fileMode=false)
updated: 2026-07-22
---

# EV-W0F — bundle migration verification receipt

The upgraded control plane is installed and self-consistent at `tested_commit`: the new
`doctor.py` reports zero errors on the full corpus, the mutation `selftest.py` passes
with no failures, and the product suite is 228/228. The installer wrote a clean receipt
(`.control-plane/receipt.json`) after its isolated self-check.

Honest deviation from the work item's "one atomic flip" acceptance line: the outgoing
validator could not parse or authorize a pre-migration base, so the adoption landed as a
short prepared chain — quote-fix, forward-compat fields, the tool/grammar flip, and three
small corrections (deliverable path, handoff hazard, and file-mode/line-ending
normalization forced by `core.fileMode=false` and `core.autocrlf=true` on this Windows
checkout). Every commit individually passed its own plane's gates with no manual hook
override; the "atomic" ideal was traded for a chain that is valid at each step. This
receipt binds the achieved state to the post-chain commit where all three canonical
commands pass together.
