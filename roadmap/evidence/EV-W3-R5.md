---
id: EV-W3-R5
type: evidence
title: W3 verification re-attested at the R-003 duplicate-key closure
status: recorded
work: W3
result: pass
commands:
  - npm test
observed_at: 2026-07-25T02:57:16Z
tested_commit: 3e70cf25c51fde08e8f8e3109a5b1fb143177cf5
contract_fingerprint: sha256:9dc5a8416e4d9250c5952f9b74ebde2283d02cd5764d6fabebf3fcd5109c1796
input_fingerprint: sha256:665b769b93e6097d9dba0710d250ef01e0856c95a1fdbdcc1b98c678364bf743
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W3-R4]
updated: 2026-07-25
---

# EV-W3-R5 — W3 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> **384/384 pass**.
W3 attests finalized-block selection, two administratively independent RPC adapters and quorum/conflict semantics; that claim is unchanged and re-verified on the new basis.

Why the basis moved: W5 slice S2 closed [[R-003]] by rejecting duplicate JSON keys at both
untrusted byte boundaries. `JSON.parse` silently keeps the LAST value for a duplicated key, so a
document could be hashed under one meaning and read under another.

`loadRecordingBytes` now rejects duplicate JSON keys before parsing. This strengthens the envelope model it already enforces: a duplicated key could otherwise let a response re-serialize to a different value than the one whose envelope hash was verified. Selection, quorum and the boundary engine are untouched.

`contract_fingerprint` is byte-identical to EV-W3-R4 — W3's declared contract did not
move. Only `input_fingerprint` did, which is what an input re-basis should look like.

Teeth carried by this change: seven scanner cases (per-object scoping, a colon inside a string
value, escaped quotes in keys) plus two boundary cases, the boundary pair negative-tested —
neutralising the guard at both call sites kills exactly those two and nothing else.
