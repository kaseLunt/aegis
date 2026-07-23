---
id: EV-W4
type: evidence
title: W4 identity adapters + ABI registry verified at the Codex-converged commit
status: recorded
work: W4
result: pass
commands:
  - npm test
observed_at: 2026-07-23T14:54:17Z
tested_commit: 4fcfa1785c1f9d7686c9b9dc40391e4dbebd7847
contract_fingerprint: sha256:2dfafe2e60b9e0ee0c2a0cd8abc96cf8d43c58f6f3a45f610521530b484537db
input_fingerprint: sha256:5c15c03c46d81601066b1da70283740c14edb3c18a0e5d72009ea5fd29cbd13d
environment: node 22.20.0, vitest 4.1.10, local win32-x64
updated: 2026-07-23
---

# EV-W4 — W4 verification receipt

Honest re-run of the canonical command at `tested_commit`: `npm test` -> 339/339 pass.
Covers all four identity strategies (direct / eip1967 / beacon / eip1167_clone) over the
W3 adapter seam, the pure derivation + comparison evaluators, and the code-hash-scoped ABI
registry. `tested_commit` is the pre-receipt contract-correction commit (deliverables
narrowed from the `lib/aegis/identity/**` glob to the four explicit files); the code under
`lib/aegis/identity/**` is byte-identical to the Codex-reviewed commit e971bef.

W4 landed under the Codex convergence gate ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]):
the review loop ran to a clean pass (session 019f8e98, verdict SHIP-READY, no material
findings) after thirteen passes down the input-domain hardening arc on
compareIdentityTarget — provenance brand, single-channel snapshot, refuse active inputs,
reject proxies, require the runtime-hash expectation, and type-guard every format check
against RegExp.test coercion. Full disposition table in
roadmap/reviews/W4-codex-review.md. Known non-blocking boundary (recorded-fixture
independence; manifest->target binding) tracked in
[[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] for W5.
