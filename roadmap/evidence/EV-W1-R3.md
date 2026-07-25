---
id: EV-W1-R3
type: evidence
title: W1 verification re-attested at the R-003 duplicate-key closure
status: recorded
work: W1
result: pass
commands:
  - npm test
observed_at: 2026-07-25T02:57:16Z
tested_commit: 3e70cf25c51fde08e8f8e3109a5b1fb143177cf5
contract_fingerprint: sha256:f493c51701753b96aed2e081c17728869cd1614c7837b91ac315396f6121e5da
input_fingerprint: sha256:66a1f18cd9f92e5c84366ef18fc8083de9c77f1252dd6ee0552ab9d8e2c5b1f4
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W1-R2]
updated: 2026-07-25
---

# EV-W1-R3 — W1 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> **384/384 pass**.
W1 attests the canonical report core — JCS serialization, strict validateReport and SHA-256 report identity; that claim is unchanged and re-verified on the new basis.

Why the basis moved: W5 slice S2 closed [[R-003]] by rejecting duplicate JSON keys at both
untrusted byte boundaries. `JSON.parse` silently keeps the LAST value for a duplicated key, so a
document could be hashed under one meaning and read under another.

`findDuplicateJsonKey` was ADDED to `report/canonical.ts` beside `jcsSerialize` and `assertJsonDomain`, keeping JSON discipline in one module. It is additive and pure: no existing export changed behaviour, and canonicalization/hashing paths are untouched.

`contract_fingerprint` is byte-identical to EV-W1-R2 — W1's declared contract did not
move. Only `input_fingerprint` did, which is what an input re-basis should look like.

Teeth carried by this change: seven scanner cases (per-object scoping, a colon inside a string
value, escaped quotes in keys) plus two boundary cases, the boundary pair negative-tested —
neutralising the guard at both call sites kills exactly those two and nothing else.
