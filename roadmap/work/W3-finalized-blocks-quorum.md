---
id: W3
type: work
title: Finalized-block selection + two independent RPC adapters + quorum/conflict semantics
phase: P1
status: active
evidence_target: "Correct + Robust"
priority: 1
depends_on: [W1]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - data/recordings/**
  - roadmap/work/W3-finalized-blocks-quorum.md
invalidated_by:
  - lib/aegis/chain/**
  - lib/aegis/report/**
  - data/recordings/**
  - roadmap/work/W3-finalized-blocks-quorum.md
review_when: phase:P1:exit
updated: 2026-07-22
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

## Acceptance (evidence target: Correct + Robust)
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
- next: slice 1 — quorum/conflict evaluator (pure module lib/aegis/chain/quorum.ts, TDD
  from the spec rules verbatim). Then slice 2 — block selection (single-chain finalized +
  confirmation-depth fallback with downgrade exposure; multi-chain time-aligned). Then
  slice 3 — adapter interface + recorded-fixture adapter (data/recordings/**, binary IO
  per INS-001) + Alchemy/QuickNode adapter configs (no secrets; provider identity +
  capability declarations only).
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
- (none yet)
