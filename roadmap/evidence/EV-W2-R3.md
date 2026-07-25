---
id: EV-W2-R3
type: evidence
title: W2 verification re-attested at the R-003 duplicate-key closure
status: recorded
work: W2
result: pass
commands:
  - npm test
observed_at: 2026-07-25T02:57:16Z
tested_commit: 3e70cf25c51fde08e8f8e3109a5b1fb143177cf5
contract_fingerprint: sha256:6dea3c73050a47a58775b77df4a005fdccd3d1c4f6ce76f1d9fbbeb247be67c3
input_fingerprint: sha256:bdd743fb104efad7112c6d210e6ec81233a28074c6f696333fcbfea15f92c237
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W2-R2]
updated: 2026-07-25
---

# EV-W2-R3 — W2 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> **384/384 pass**.
W2 attests the manifest model and approved-hash trust root; that claim is unchanged and re-verified on the new basis.

Why the basis moved: W5 slice S2 closed [[R-003]] by rejecting duplicate JSON keys at both
untrusted byte boundaries. `JSON.parse` silently keeps the LAST value for a duplicated key, so a
document could be hashed under one meaning and read under another.

`loadManifestBytes` now rejects duplicate JSON keys BEFORE parsing, closing [[R-003]] — the deferral this very item recorded. Nothing else moved: the trust decision is still set membership of the recomputed content hash, and an invalid manifest is still never evaluated for trust.

`contract_fingerprint` is byte-identical to EV-W2-R2 — W2's declared contract did not
move. Only `input_fingerprint` did, which is what an input re-basis should look like.

Teeth carried by this change: seven scanner cases (per-object scoping, a colon inside a string
value, escaped quotes in keys) plus two boundary cases, the boundary pair negative-tested —
neutralising the guard at both call sites kills exactly those two and nothing else.
