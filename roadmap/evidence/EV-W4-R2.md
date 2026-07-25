---
id: EV-W4-R2
type: evidence
title: W4 verification re-attested at the W5 S0 manifest->target trust seam commit
status: superseded
superseded_by: EV-W4-R3
work: W4
result: pass
commands:
  - npm test
observed_at: 2026-07-24T23:14:56Z
tested_commit: 06f44c65d12f396525cf196ced763bb8d7398e78
contract_fingerprint: sha256:2dfafe2e60b9e0ee0c2a0cd8abc96cf8d43c58f6f3a45f610521530b484537db
input_fingerprint: sha256:bbb9f3f1e77131297e459544d7a361f39446fff50a7b6e5124ce172bb72eaae2
environment: node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: [EV-W4]
updated: 2026-07-25
---

# EV-W4-R2 — W4 verification receipt (re-attested)

Honest re-run of the canonical command at `tested_commit`: `npm test` -> 368/368 pass. Covers
all four identity strategies (direct / eip1967 / beacon / eip1167_clone) over the W3 adapter
seam, the pure derivation and comparison evaluators, and the code-hash-scoped ABI registry —
the same scope EV-W4 attested, re-verified on the new basis.

W4's basis changed because W5 slice S0 modified `lib/aegis/manifest/trust.ts`, which sits inside
W4's `invalidated_by` (`lib/aegis/manifest/**`). The receipt auto-invalidated — correct
behavior, anticipated in the W5 kickoff and executed via the documented recipe
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

Why the W4 claim still holds under the change:
- Nothing under `lib/aegis/identity/**` was touched. The thirteen-pass input-domain hardening
  arc on `compareIdentityTarget` (provenance brand, single-channel snapshot, refuse active
  inputs, reject proxies, require the runtime-hash expectation, type-guard every format check)
  is byte-identical to the Codex-converged state.
- The manifest change is purely ADDITIVE (`trustedManifestFromBytes`) plus a delegation:
  `policyTrustFromBytes` keeps its exact behavior, asserted by a test comparing the two.
  W4 consumes `policyTrustFromBytes` and the manifest's expected values; neither changed shape.
- The seam does not weaken any W4 boundary. It strengthens the one W4 explicitly left open:
  `compareIdentityTarget` still accepts a caller-supplied `IdentityTarget`, but S0 makes a
  manifest-bound target set reachable so W5's comparison call can be fed from the trusted
  manifest rather than from caller input ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3).
  The comparator itself is unchanged and still refuses unbranded observations.

`contract_fingerprint` is byte-identical to EV-W4's — W4's declared contract did not change;
only `input_fingerprint` moved.

Still deferred and NOT claimed by this receipt (unchanged from EV-W4):
[[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §1 recording bundle-digest anchoring and §2 live
endpoint/client-identity binding. Recorded identity over reviewed reference fixtures remains
exactly what is attested.
