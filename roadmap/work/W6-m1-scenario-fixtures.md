---
id: W6
type: work
title: M1 recorded scenario fixture corpus + reorg supersession
phase: P1
status: candidate
evidence_target: "Correct + Robust"
priority: 2
depends_on: [W5]
blocked_by: []
informs: [H0]
allowed_paths:
  - data/**
  - lib/**
  - tests/**
deliverables:
  - data/recordings/README.md
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
  - data/**
review_when: phase:P1:exit
updated: 2026-07-24
---

# W6 — M1 recorded scenario fixture corpus + reorg supersession

**Why this advances the vision:** M1's deliverable list requires recorded success,
mismatch, missing-evidence, stale-provider, provider-conflict, ABI-mismatch, and reorg
fixtures, plus block-hash-keyed caches, canonicality checks, and reorg supersession
(docs/ROADMAP.md M1). Only the success path ships today. **W6 is what closes M1**, not W5
([[D-6bedc848-2a42-411a-a65b-d623f7418121]] §4).

## Objective

Ship the reviewable recorded-scenario corpus as data (not as inline test constructions), and
implement reorg supersession over block-hash-keyed evidence, so a reviewer can reproduce each
non-success outcome from a documented command against a sealed fixture.

## Context — why this is a separate item

Every non-success scenario currently exists ONLY as an inline construction inside tests
(`sealedBundle` in `tests/engine.test.ts`, plus `tests/recorded-adapter.test.ts`,
`tests/codex-w3-fixes.test.ts`, `tests/identity-*.test.ts`, `tests/w4-codex-fixes.test.ts`).
That is sufficient to prove the engine fails closed — which is W5's robustness burden — but
it is NOT a corpus a reviewer can point a surface at. Splitting keeps W5 shippable and keeps
W5's evidence claim honest (four-surface identity over the reviewed success fixtures).

## Hard constraint discovered in W5 S1 (2026-07-24)

**No shipped fixture can currently produce a `pass`, and a "success" bundle alone will not fix
it.** Three facts found while wiring identity verifications:
1. `data/manifests/reference-code-identity.json` declares targets at `0xcccc…` (chain 1,
   eip1967) and `0xeeee…` (chain 10, direct), while
   `data/recordings/reference-identity-reads.json` records reads for `0xa1a1…`/`0xb2b2…` on
   chain 1 only. **No declared target has recorded evidence**, so every expectation lands
   `unknown` — honest, but not a demonstration.
2. The manifest's `expectedRuntimeCodeHash` values are placeholders (`sha256:3333…`,
   `sha256:4444…`). No code bytes hash to those, so a `pass` is unreachable by construction.
3. Therefore a success fixture is a **matched PAIR**: the recording's `eth_getCode` result and
   the manifest's `expectedRuntimeCodeHash` must be authored together, with the expected hash
   computed as sha256 over the recorded code BYTES (never over a hex string — W4 hazard), and
   the manifest's embedded `contentHash` recomputed afterwards. Same for `expectedImplementation`
   versus the recorded EIP-1967 slot word.

This is why W5 proves its non-success paths with inline `sealedBundle` constructions instead: a
reviewable success corpus needs authored manifest/recording pairs, which is W6's job. W5's
evidence claim is scoped accordingly.

## Acceptance (to refine at kickoff — candidate placeholder)

- Correct: one sealed bundle per M1 scenario (success, mismatch, missing-evidence,
  stale-provider, provider-conflict, ABI-mismatch, reorg), each envelope-verified by
  `loadRecordingBytes` and each producing exactly the intended typed outcome through the W5
  facade; a reorged block is superseded, not silently replaced, and orphaned observations are
  marked rather than deleted.
- Robust: caches are keyed by (provider policy, manifest hash, chain id, block hash, request
  hash, evaluator version) — never block number alone; a block-hash change invalidates
  derived entries; property tests over supersession ordering.
- Kickoff refines these before status: active.

## Non-goals

- Live capture pipeline / provider probes (WR3 probe step).
- Bundle-digest anchoring and live endpoint-identity binding
  ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §1–2) unless promoted separately.

## Canonical commands

```text
npm test
```

## Handoff

- next: CANDIDATE — owner authorized the W5/W6 split at the W5 kickoff (2026-07-24); not yet
  promoted to committed (HITL barrier: only a phase review promotes). Kickoff must refine
  acceptance and confirm whether M1's cache/canonicality items belong here or in a sibling.
- read_first: docs/ROADMAP.md M1 deliverables + exit gate; `data/recordings/README.md`
  (illustrative-vs-recorded caveats); `tests/engine.test.ts` `sealedBundle()` — the recipe
  for building a bundle whose per-response `rawResponseSha256` and `envelopeSha256` are
  recomputed after mutation; [[D-6bedc848-2a42-411a-a65b-d623f7418121]].
- hazards: a fixture is only evidence of what it honestly records — authoring adversarial
  bundles must not drift into fabricating protocol history; the README's existing
  illustrative-value caveats must extend to every new bundle. W6 touching `data/**` will
  invalidate W5's receipt (W5's `invalidated_by` includes `data/**`) — plan the W5
  re-attestation in the same commit, per
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]].

## Evidence

No attained evidence yet.
