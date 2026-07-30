---
id: EV-W3-R6
type: evidence
title: W3 verification re-attested at the W6-S1 scenario-corpus landing
status: recorded
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-30T16:16:39Z
tested_commit: 7cbabfc8f32aca611e452728c7b6271da244632c
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:d94dd814cec89056447afbfefdfbeaa9cf86e11c26966ad52655cc6e5354137b
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W3-R5]
updated: 2026-07-30
---

# EV-W3-R6 — W3 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` → **456/456 pass**
(32 files), tsc clean, eslint 0 errors.

Why the basis moved: W6-S1 extended `data/recordings/README.md` with the scenario-corpus
outcome table — inside W3's `invalidated_by: data/recordings/**`. No code under
`lib/aegis/chain/**` or `lib/aegis/report/**` changed and no recording BUNDLE changed;
`contract_fingerprint` is byte-identical to EV-W3-R5's — W3's declared contract did not
move, only its input basis (documentation bytes). W3's attested claim — finalized-block
selection and provider quorum over verified recorded bundles — is unchanged and
re-verified on the new basis.
