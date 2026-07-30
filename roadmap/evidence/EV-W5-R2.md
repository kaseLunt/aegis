---
id: EV-W5-R2
type: evidence
title: W5 verification re-attested at the W6-S1 scenario-corpus landing
status: recorded
work: W5
result: pass
commands:
  - npm test
observed_at: 2026-07-30T16:16:39Z
tested_commit: 7cbabfc8f32aca611e452728c7b6271da244632c
contract_fingerprint: sha256:9a82a480cf00b78ddda29b1e6e6aa95032187334fe8193368ce65171f800ecf6
input_fingerprint: sha256:d4a9e35bd5e6b2c7883822f188fede425b75fbf27cf228e99bde7ff418a06c7e
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W5]
updated: 2026-07-30
---

# EV-W5-R2 — W5 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` → **456/456 pass**
(32 files), tsc clean, eslint 0 errors.

Why the basis moved: W6-S1 landed the first scenario-corpus fixtures under `data/**`
(`data/manifests/scenario-pass.json`, `scenario-mismatch.json`, both README extensions) —
inside W5's `invalidated_by: data/**`. Nothing under `lib/aegis/**`, `bin/**`,
`components/**`, or `package.json` changed; `contract_fingerprint` is byte-identical to
EV-W5's — W5's declared contract did not move. Only `input_fingerprint` did, which is what
a data re-basis should look like.

W5's attested claim is unchanged and re-verified on the new basis: one engine behind four
byte-identical transports, the J1–J5 gate, and the Codex-converged correction set. The new
fixtures STRENGTHEN the surrounding evidence: the W6-S1 conformance tests re-derive both
scenario manifests from committed specs and byte-compare, and the pass/mismatch pairs are
outcome-pinned across all four surfaces with one hash each (`tests/corpus.test.ts`),
extending the four-surface identity claim from the reference trio to declared-outcome
fixtures. The honesty teeth were renegotiated, not weakened: B4/B5 now scope the
no-pass claim to the reference trio explicitly, and the corpus READMEs disclose the
co-authored (reference_scenario) provenance of every scenario expectation.

Chain note: `tested_commit` is the owner-authorized doctor-RED middle commit of the
INS-58ac6162 re-attestation recipe; this receipt rides in the immediately following
commit, restoring a fully green push head.
