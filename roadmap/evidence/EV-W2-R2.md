---
id: EV-W2-R2
type: evidence
title: W2 verification re-attested at the W5 S0 manifest->target trust seam commit
status: recorded
work: W2
result: pass
commands:
  - npm test
observed_at: 2026-07-24T23:14:56Z
tested_commit: 06f44c65d12f396525cf196ced763bb8d7398e78
contract_fingerprint: sha256:6dea3c73050a47a58775b77df4a005fdccd3d1c4f6ce76f1d9fbbeb247be67c3
input_fingerprint: sha256:fa1ba3a210c48c4c6e44ebdbbd19c741eaeededa8593e1968aa79c6ab40b4cc4
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W2]
updated: 2026-07-24
---

# EV-W2-R2 — W2 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> 368/368 pass.

W2's basis changed because W5 slice S0 modified `lib/aegis/manifest/trust.ts`, which is both
a W2 **deliverable** and inside W2's `invalidated_by` (`lib/aegis/manifest/**`). The receipt
therefore auto-invalidated — correct control-plane behavior, not a defect
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]] recipe: change the basis, then mint the
replacement at the commit that carries the change and supersede in place).

What changed in the W2 surface, and why the W2 claim still holds:
- `trustedManifestFromBytes` was ADDED, returning the trust block together with the loaded
  manifest, and `loaded` is non-null only when the state is `trusted` — the W5 seam that binds
  compared targets to the manifest whose recomputed content hash the report carries
  ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3).
- `policyTrustFromBytes` now DELEGATES to it rather than duplicating the logic, so the two
  cannot diverge. Its behavior is unchanged, and that is asserted directly: a test compares
  its output against `trustedManifestFromBytes(...).block` for the same inputs.
- No W2 semantics were altered — the trust decision is still set membership of the RECOMPUTED
  content hash against the deployment-configured approved set, an invalid manifest is still
  never evaluated for trust and still anchors to the sha256 of the exact rejected bytes, and
  applicability is unchanged. Every pre-existing W2 test passes untouched.

`contract_fingerprint` is byte-identical to EV-W2's: W2's declared contract (allowed paths,
deliverables, invalidated_by) did not change. Only `input_fingerprint` moved, which is exactly
what an input re-basis should look like.

Also in this commit and inside W2's basis: two raw NUL bytes in
`tests/manifest-properties.test.ts` were re-encoded as ASCII escape sequences. They are
deliberate test data for the latin1-collision property (U+0100 vs U+0000 must not collide under
a broken encode); the runtime values are identical and the property still holds — the raw bytes
had been making the file register as binary to git
([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]] addendum).
