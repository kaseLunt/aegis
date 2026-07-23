---
id: W4
type: work
title: Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry
phase: P1
status: achieved
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W2, W3]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - data/recordings/**
deliverables:
  - lib/aegis/identity/resolve.ts
  - lib/aegis/identity/observe.ts
  - lib/aegis/identity/compare.ts
  - lib/aegis/identity/abi.ts
evidence_receipts:
  - roadmap/evidence/EV-W4.md
invalidated_by:
  - lib/aegis/identity/**
  - lib/aegis/chain/**
  - lib/aegis/report/**
  - lib/aegis/manifest/**
  - data/recordings/**
review_when: phase:P1:exit
updated: 2026-07-23
evidence_fingerprint: sha256:1483528113e92b272549db0bbf77d0706352a0cba44f065f4c1d3276cd1f6b23
---

# W4 — Identity adapters + code-hash-scoped ABI registry

**Why this advances the vision:** deployment.code_identity is M1's target invariant — W4
resolves each manifest target's declared identity strategy against W3's pinned
boundaries and compares against W2's expected values, producing Verifications in W1's
canonical shape (ENGINEERING_SPEC §Target invariant and evidence registry).

## Objective

Implement the four identity strategies over the W3 adapter/engine seam and the
code-hash-scoped ABI registry: observation (adapter reads: runtime code, proxy slots)
stays in adapters; derivation and comparison are pure evaluators. Every strategy
verifies that code exists, retains the full indirection path, compares each expected
identity from the manifest, and selects an ABI only after the terminal runtime hash
matches. An undeclared or unsupported pattern yields unknown for dependent reads —
Aegis never guesses a proxy type.

## Acceptance

- Correct: direct hashes runtime code at the address; eip1967 resolves the
  implementation slot and hashes implementation code; beacon resolves the beacon then
  its implementation; eip1167_clone decodes the minimal-proxy target from bytecode and
  hashes target code. Absent code, zero slots, malformed clone bytecode, and
  undeclared/unsupported patterns are typed non-pass outcomes (never a guessed
  identity); the full indirection path is retained in every result; comparison flags
  each manifest expectation independently (expectedImplementation,
  expectedRuntimeCodeHash) with drift-requiring-review semantics, never
  proof-of-compromise language; the ABI registry is keyed by runtime code hash and
  refuses selection until the terminal hash matches.
- Robust: property tests — any observed-byte mutation changes the derived identity; a
  mismatched or unknown identity can never produce pass; observation input order never
  changes results; recorded fixtures are integrity-bound per the W3 envelope model.

## Non-goals

- Live provider probes and transports (WR3 probe step); report surfaces (W5).
- The separately reviewed custom-adapter path for documented indirection patterns
  (spec allows it; needs a real case and owner review).
- Semantic reads beyond identity (weETH backing, escrow, oracle geometry — later M1/M2
  registry entries).

## Canonical commands

```text
npm test
```

## Handoff

- next: W4 ACHIEVED — invalidated_by narrowed, deliverables made explicit, verified at
  4fcfa17 (EV-W4, 339/339), Codex convergence clean (13 passes, session 019f8e98). Next is
  W5 (one engine, four surfaces): it must TRUST provenance-branded engine output, not
  re-validate structural copies ([[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]]). DONE: Codex senior review dispositioned — 4 P0 + 5 P1 +
  test gaps, all accepted rows fixed TDD same-day (roadmap/reviews/W4-codex-review.md;
  20 new tests, 297/297): reads hash-keyed via EIP-1898 form, strategy binding +
  evidence-required comparison, ABI selection gated on observed==expected==registered,
  malformed observed data typed (never resolution, never a throw), conflict distinguished
  from missing evidence end to end, ERC-1967 logic-slot-empty precondition for beacons,
  required manifest evidence + honest freshness, audit-sufficient evidence refs,
  path retention on every unknown. DONE: slice 3 — compareIdentityTarget (one W1-shaped Verification per
  declared manifest expectation, invariantId deployment.code_identity/<targetId>/<kind>;
  drift-requiring-review language; unknown identity can never pass, reasons travel as
  typed limitations; evidence refs from ok-observations at the pinned boundary) +
  createAbiRegistry/selectAbi (keyed by runtime code hash, refuses until terminal hash
  match); 12 tests incl. two mutation checks and a strict validateReport e2e. DONE:
  slice 2 — IdentityReadAdapter (getCode / getStorageWord / call at the pinned block,
  values travel with loader-verified raw hashes) + observeIdentity trampoline (pure
  derivation over quorum-agreed reads; non-agreed read -> observation_unresolved with the
  full read trail; agreed "0x" IS evidence -> derivation-typed outcomes); 16 tests incl.
  quorum-gate mutation check and heads+identity fixture e2e. DONE: slice 1 — pure
  identity derivation (lib/aegis/identity/resolve.ts, 21 tests): four strategies over a
  CodeObservation seam, typed non-pass outcomes (code_absent, implementation_slot_empty,
  beacon_slot_empty, beacon_implementation_unresolved, not_eip1167_clone,
  clone_target_zero, unsupported_strategy), full indirection path retained, sha256 over
  code BYTES (never hex strings), property tests for byte-mutation sensitivity and
  observation-order invariance.
- read_first: docs/ENGINEERING_SPEC.md §Target invariant and evidence registry +
  §Evidence acquisition; docs/THREAT_MODEL.md proxy/identity rows; W3 handoff notes
  (live adapters must thread captured raw-response hashes; recordingId bundle-digest
  anchoring is deferred); lib/aegis/chain/* (adapter seam), lib/aegis/manifest/trust.ts
  (expected values).
- hazards: runtime code hashes are OUR sha256 content addressing over returned code
  bytes, not on-chain keccak codehashes — never conflate them; a zero/absent
  implementation slot is unknown, not a direct fallback; clone decoding must match the
  exact EIP-1167 pattern (variants are unsupported → unknown); ABI selection before a
  terminal hash match is the failure mode the registry exists to prevent; identity
  mismatch is drift requiring review — never assert compromise; BEFORE the achieved
  stamp, narrow invalidated_by from lib/aegis/** to the modules W4 actually consumes
  (identity/chain/report/manifest, excluding surfaces/**) — contract changes are free
  pre-receipt, and W5's surfaces work must not tax W4's receipt the way W4 taxed W1
  ([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

## Evidence

ACHIEVED (EV-W4, tested_commit 4fcfa17, npm test 339/339). Landed under the Codex
convergence gate ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]): the review loop ran to a
clean SHIP-READY pass (session 019f8e98, no material findings) after thirteen passes down
the input-domain hardening arc on compareIdentityTarget — full disposition table in
roadmap/reviews/W4-codex-review.md. Non-blocking boundary (recorded-fixture independence;
manifest→target binding) deferred to W5, tracked in
[[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]].
