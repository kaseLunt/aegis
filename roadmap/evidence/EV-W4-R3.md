---
id: EV-W4-R3
type: evidence
title: W4 verification re-attested at the R-003 duplicate-key closure
status: recorded
work: W4
result: pass
commands:
  - npm test
observed_at: 2026-07-25T02:57:16Z
tested_commit: 3e70cf25c51fde08e8f8e3109a5b1fb143177cf5
contract_fingerprint: sha256:2dfafe2e60b9e0ee0c2a0cd8abc96cf8d43c58f6f3a45f610521530b484537db
input_fingerprint: sha256:f95111a06a578f88ba525a5b51a293c61eaa14e0f972532729aad92567421055
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W4-R2]
updated: 2026-07-25
---

# EV-W4-R3 — W4 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> **384/384 pass**.
W4 attests the four identity strategies over the W3 adapter seam and the code-hash-scoped ABI registry; that claim is unchanged and re-verified on the new basis.

Why the basis moved: W5 slice S2 closed [[R-003]] by rejecting duplicate JSON keys at both
untrusted byte boundaries. `JSON.parse` silently keeps the LAST value for a duplicated key, so a
document could be hashed under one meaning and read under another.

Nothing under `lib/aegis/identity/**` changed; the thirteen-pass Codex-converged hardening on `compareIdentityTarget` is byte-identical. W4's basis moved only because it lists `manifest/**`, `chain/**` and `report/**`, all of which gained the duplicate-key guard.

`contract_fingerprint` is byte-identical to EV-W4-R2 — W4's declared contract did not
move. Only `input_fingerprint` did, which is what an input re-basis should look like.

Teeth carried by this change: seven scanner cases (per-object scoping, a colon inside a string
value, escaped quotes in keys) plus two boundary cases, the boundary pair negative-tested —
neutralising the guard at both call sites kills exactly those two and nothing else.
