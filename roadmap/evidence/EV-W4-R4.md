---
id: EV-W4-R4
type: evidence
title: W4 verification re-attested at the W6-S1 scenario-corpus landing
status: recorded
work: W4
result: pass
commands:
  - npm test
observed_at: 2026-07-30T16:16:39Z
tested_commit: 7cbabfc8f32aca611e452728c7b6271da244632c
contract_fingerprint: sha256:2dfafe2e60b9e0ee0c2a0cd8abc96cf8d43c58f6f3a45f610521530b484537db
input_fingerprint: sha256:706de9452b04f09f0630d1a358b318d4bd88477dea70038b8655d9d53382f13a
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W4-R3]
updated: 2026-07-30
---

# EV-W4-R4 — W4 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` → **456/456 pass**
(32 files), tsc clean, eslint 0 errors.

Why the basis moved: W6-S1 extended `data/recordings/README.md` with the scenario-corpus
outcome table — inside W4's `invalidated_by: data/recordings/**`. No code under
`lib/aegis/identity/**`, `chain/**`, `report/**`, or `manifest/**` changed and no
recording BUNDLE changed; `contract_fingerprint` is byte-identical to EV-W4-R3's — W4's
declared contract did not move, only its input basis (documentation bytes). W4's attested
claim — the four identity strategies over the W3 adapter seam and the code-hash-scoped ABI
registry — is unchanged and re-verified on the new basis.
