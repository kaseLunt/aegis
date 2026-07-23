---
id: W4
type: work
title: Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry
phase: P1
status: active
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
  - lib/aegis/identity/**
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
  - data/recordings/**
review_when: phase:P1:exit
updated: 2026-07-23
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

- next: Codex senior review of all three slices (per the ratified senior-reviewer
  decision), disposition findings TDD, then narrow invalidated_by (see hazards) and stamp
  achieved. DONE: slice 3 — compareIdentityTarget (one W1-shaped Verification per
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

No attained evidence yet.
