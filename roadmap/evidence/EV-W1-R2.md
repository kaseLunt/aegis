---
id: EV-W1-R2
type: evidence
title: W1 canonical verification passed at the module-scoped basis commit
status: recorded
work: W1
result: pass
commands:
  - npm test
  - npm run test:property
observed_at: 2026-07-23T03:43:29Z
tested_commit: 69f64de0d8adbd22538edaab55da69c7faaf2f48
contract_fingerprint: sha256:f493c51701753b96aed2e081c17728869cd1614c7837b91ac315396f6121e5da
input_fingerprint: sha256:34a9574f9b0fbd79d1694835c16000ed43310e2cb90ed125ab32ec2951b995cd
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W1]
updated: 2026-07-22
---

# EV-W1-R2 — W1 verification receipt (module-scoped basis)

Supersedes EV-W1 after the owner-reviewed re-scope of W1's verification basis from
`lib/** + package-lock.json` to `lib/aegis/report/**` (commit 69f64de). Both canonical
commands re-run honestly at `tested_commit`: `npm test` -> 228/228 pass;
`npm run test:property` -> 9/9 pass. The verification content is unchanged — only the
invalidation scope narrowed to W1's own module plus its named deliverables, matching
the W2/W3 convention.
