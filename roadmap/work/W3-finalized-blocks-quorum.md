---
id: W3
type: work
title: Finalized-block selection + two independent RPC adapters + quorum/conflict semantics
phase: P1
status: achieved
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W1]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - data/recordings/**
  - .github/workflows/control-plane.yml
  - roadmap/work/W3-finalized-blocks-quorum.md
deliverables:
  - lib/aegis/chain/quorum.ts
  - lib/aegis/chain/selection.ts
  - lib/aegis/chain/adapter.ts
  - lib/aegis/chain/engine.ts
  - data/recordings/reference-eth-op-heads.json
evidence_receipts:
  - roadmap/evidence/EV-W3-R2.md
invalidated_by:
  - lib/aegis/chain/**
  - lib/aegis/report/**
  - data/recordings/**
review_when: phase:P1:exit
updated: 2026-07-22
evidence_fingerprint: sha256:df7715c6269e28c13153d4ad05009ba57141ec90f5f9d79bec63f9d11a1c6e0b
---

# W3 — Finalized-block selection + quorum/conflict semantics + RPC adapters

**Why this advances the vision:** W1 defined what a canonical report IS; W2 defined what
Aegis expects; W3 defines how Aegis OBSERVES — which block, from whom, and when two
observers count as one truth. Every critical pass/fail in M1+ rides on these semantics
(ENGINEERING_SPEC §Block selection and finality, §Provider quorum and conflicts,
§Evidence acquisition).

## Hypothesis / objective
Implement per spec: (1) quorum/conflict evaluation — agreement requires matching block
hashes AND canonicalized raw results from ≥2 administratively independent providers;
number-match/hash-mismatch is a conflict; decoded-match/raw-mismatch is retained as
separate evidence for policy review; timeout/malformed is missing evidence, never a zero
value; insufficient responses yield unknown; a critical fail needs the same quorum as a
critical pass. (2) Finalized-block selection — single-chain: finalized head, configured
confirmation-depth fallback, pin to exact block hash, expose any finality downgrade;
multi-chain: asOfTimestamp no later than the oldest finalized head, one canonical block
per chain at/before it, labeled time_aligned, never atomic. (3) An adapter interface
where adapters perform I/O and evaluators never do; a recorded-fixture adapter (binary
reads, INS-001) plus provider adapter configs for the WR3 pair-1 recommendation
(Alchemy + QuickNode), no credentials in the repo.

## Acceptance
- Correct: each spec quorum rule maps to a typed outcome + reason code (agreement /
  conflict / unknown; block_hash_mismatch, raw_result_mismatch, missing-evidence,
  insufficient-responses, required-provider rules); block selection returns hash-pinned
  boundaries and surfaces finality downgrades as typed downgrade records; multi-chain
  selection produces time_aligned boundaries with asOfTimestamp ≤ oldest finalized head.
- Robust: property tests — provider response order never changes the outcome or the
  agreeing set; a timeout/malformed response can never be read as a value or flip an
  outcome to agreement; no single provider's responses alone can produce agreement or a
  canonical fail (two-provider floor holds under sweep).

## Non-goals
- Live provider probes of WR3 capability cells (separate probe step before any cell is
  trusted configuration — WR3 §Legend).
- Credentials/API keys anywhere in the repo; live-network calls in tests.
- Identity resolution / ABI registry (W4); CLI/API/CI/web surfaces (W5).
- Multicall batching (spec allows it only when reports preserve individual logical calls
  — defer until the report wiring exists).

## Canonical commands
```bash
npm test
```

## Handoff
- next: slice 1 DONE (lib/aegis/chain/quorum.ts — evaluateQuorum: agreement/conflict/
  unknown with typed reason codes; fail-closed preconditions throw ChainError incl.
  duplicate-provider self-corroboration; decoded-match/raw-mismatch retained as unknown
  for policy review, not auto-conflict; optional-provider raw disagreement conflicts
  fail-closed — over-strict by design, revisit if the provider_quorum policy grows a
  knob). Slice 2 DONE (lib/aegis/chain/selection.ts — selectFinalizedBoundary pins the
  exact hash and refuses non-finalized heads; confirmationDepthTarget/
  selectConfirmationDepthBoundary implement the QuickNode-OP fallback with a typed
  FinalityDowngrade record, target-mismatch and underflow fail closed;
  selectTimeAligned: asOf = oldest head via fixed-width UTC-Z lexicographic compare,
  max-by-number pick per chain from head+candidates, boundaries sorted by chainId,
  candidates cannot introduce chains). Slice 3a DONE (ChainAdapter interface +
  loadRecordingBytes: strict UTF-8, per-response JCS-sha256 integrity, typed failures;
  recordedAdapter: declared_absent finalized tag → null (never a guess), missing
  recording → typed recording_missing; providers.ts: Alchemy+QuickNode declared-only
  capabilities, keyEnvVar names, QUORUM_PAIR_1; sealed reference-eth-op-heads bundle).
  Slice 3b DONE (lib/aegis/chain/engine.ts — establishBoundary: every provider proposes
  a pin (finalized head, or depth target when tag declared absent), engine pins the
  conservative MINIMUM and re-fetches all providers AT it, quorum over consensus-content
  hashes with `finality` STRIPPED before hashing (request-derived annotation, not
  response content — a live adapter must instead thread its captured raw-response hash
  through; probe-step work); quorum failure → unresolved with observations preserved,
  never a boundary; chain finality = weakest level with downgrades exposed). Composition
  test: engine boundaries + evidence + trusted policyTrust assemble into a payload that
  passes W1 strict validateReport with a stable reportHash. Codex review DONE and
  dispositioned (roadmap/reviews/W3-codex-review.md): 2 P0 + 4 P1 + 2 P2, all fixed TDD
  same-day — administrative-domain independence in quorum, returned-block validation in
  the engine, envelope-bound recording integrity + verified-bundle gate, catch-all
  failure mapping, head-divergence leash (maxHeadLagBlocks) with proposal diagnostics,
  time-aligned finality gates, real-instant timestamps, payload-carrying non-ok quorum
  tests. W3 COMPLETE. For W4/W5: live adapters must thread captured raw-response hashes
  (engine header note); the live-recording pipeline should anchor recordingId to a
  whole-bundle digest; multi-chain time-aligned ENGINE composition (candidate walk-back
  across recorded blocks) is the W5 report-assembly seam — selectTimeAligned itself is
  tested pure.
- read_first: docs/ENGINEERING_SPEC.md §Block selection and finality + §Provider quorum
  and conflicts + §Evidence acquisition; roadmap/research/WR3/provider-matrix.md §5
  (quorum pairs + do-not-pair rationale); docs/THREAT_MODEL.md provider rows;
  lib/aegis/report/canonical.ts (boundary shapes the selectors must emit).
- hazards: QuickNode declares NO finalized/safe tags on OP (WR3 [P-Q2]) — the fallback
  path and the finality-downgrade exposure are mandatory, not edge cases; Infura DIN can
  route to third-party backends (pair 2) — raw-response hashing + client fingerprinting
  must treat backend swaps as identity changes; a provider timeout is missing evidence —
  any code path that defaults a missing response to 0/null/empty is a defect (spec);
  never source an expected value from the same RPC state it will verify (RULES role
  separation); single-provider contradiction is unknown + provisional alert, never a
  canonical fail.

## Evidence
- 2026-07-22: TDD slice 1 — RED (module missing, import fails), GREEN 15/15: one test per
  spec quorum rule (agreement, block_hash_mismatch conflict, raw_result_mismatch conflict,
  decoded-match retained-unknown, timeout/malformed/incomplete-ok = missing evidence,
  required-provider missing/disagreement, policy floor, cross-chain + block-number +
  duplicate-provider fail-closed throws) + 30-run order-invariance property. Full suite
  159/159; lint clean.
- 2026-07-22: TDD slice 2 — RED (module missing), GREEN 14/14: finalized pin + refusal of
  non-finalized heads; confirmation-depth fallback (WR3 QuickNode-OP shape) with typed
  downgrade record, target-mismatch/underflow/cross-chain fail-closed; time-aligned
  multi-chain selection (asOf = oldest head, per-chain max ≤ asOf, sorted, never atomic;
  no-eligible-block / duplicate-head / stray-candidate / single-chain typed failures) +
  25-run order-invariance property. Full suite 190/190; lint clean.
- 2026-07-22: TDD slice 3a — RED (modules + fixture missing), GREEN 12/12: recording
  loader (integrity per response, CRLF-immune, tamper fails closed, typed
  invalid_utf8/malformed_json); recorded adapter (deterministic replay, declared_absent
  → null per WR3 P-Q2, recording_missing typed, composes with both selection paths);
  provider configs (distinct administrative domains, declared-or-absent capabilities,
  env-var names with a no-key-material regex test). Bundle sealed (5 responses,
  reference-scenario provenance documented in data/recordings/README.md). Full suite
  202/202; lint clean.
- 2026-07-22: TDD slice 3b — engine pass; composition test proves adapters → boundaries
  + evidence + trusted policyTrust assemble into a strict-validated payload with stable
  reportHash. 209/209.
- 2026-07-22: Codex cross-vendor review (BEFORE stamp): 2 P0 + 4 P1 + 2 P2, all
  reproduced as RED tests then fixed (19 tests, tests/codex-w3-fixes.test.ts) —
  alias-independence, wrong-chain certification, provenance-bound recordings,
  native-error resilience, divergence leash, alignment finality gates, real-instant
  timestamps, status-payload sweeps. Final: 228/228, lint clean; dispositions in
  roadmap/reviews/W3-codex-review.md.
