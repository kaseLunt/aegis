---
id: INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc
type: insight
title: "head observations lose per-response provenance in the W3 adapter contract; bundle-level capturedAt is the honest stand-in"
status: candidate
informs: [W5, W6]
review_when: date:2026-08-08
updated: 2026-07-25
---

# INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc — head observations lose per-response provenance in the W3 adapter contract; bundle-level capturedAt is the honest stand-in

## Context
W5 slice S1 built the report's top-level `evidence` array from `establishBoundary`'s provider
observations. The facade filtered to observations carrying `status === "ok"`, a
`rawResultHash`, AND a `capturedAt` — which looked like ordinary defensive coding.

## Evidence
- The filter silently matched NOTHING: every report emitted zero `rpc_call` evidence entries
  while still asserting two observation boundaries. `validateReport` accepted it, because the
  canonical schema does not require `evidence` to be non-empty and boundaries do not reference
  evidence ids. Nine S0 tests passed, including a top-level-key-set assertion — none looked
  INSIDE `evidence`. It surfaced only when a throwaway inspection script dumped
  `evidence.map(e => e.kind)` and printed `["manifest"]`.
- Root cause is a contract shape, not a bug: `ChainAdapter.getFinalizedHead` /
  `getLatestHead` / `getBlockByNumber` return a `PinnedBlock`, so the recording envelope's
  `capturedAt` and `sourceMode` are structurally unable to reach `ProviderObservation`.
  `lib/aegis/chain/engine.ts` never sets either field. Identity reads do NOT have this problem:
  `IdentityReadAdapter` returns `IdentityReadResult { value, rawResultHash, capturedAt,
  sourceMode }`, so provenance survives there.
- This is why `tests/engine.test.ts`'s reference recipe used the BUNDLE's `capturedAt`
  (`capturedAt: b.capturedAt`) rather than the observation's. That was not a shortcut — it was
  the only available timestamp.

## Consequence
1. A report asserting a boundary with no evidence backing it is a provenance hole, and no
   existing gate catches it. `evidence` CONTENT needs asserting, not just its presence:
   S1 added "each pinned boundary carries head evidence for every agreeing provider"
   (count per chain x agreeing provider, plus a `capturedAt` type check).
2. The honest stand-in is the verified bundle's own `capturedAt` — it legitimately describes
   every response the bundle contains. Because attribution across MULTIPLE heads bundles would
   be a guess, `runVerification` fails closed with `SurfaceError("ambiguous_head_provenance")`
   when more than one heads recording is supplied, rather than picking one. Refusing to guess is
   preferable to a plausible timestamp.
3. Claim-strength note for any surface: head evidence `capturedAt` is bundle-level (coarser
   than per-response), while identity-read evidence is per-response. A reviewer reading the
   evidence drawer must not be led to believe the head timestamps are per-call.
4. Durable fix, deferred and NOT W5's: widen the `ChainAdapter` head methods to return envelope
   metadata alongside the block (as `IdentityReadAdapter` already does), then thread it into
   `ProviderObservation`. That is a W3-module contract change — it will invalidate the W3 and W4
   receipt bases, so it belongs with the live-adapter work (WR3 probe step), where the same seam
   must already be threaded for captured raw-response hashes. Until then the
   multiple-heads-bundle refusal stands.

## Wider lesson
"Filter out the malformed" and "assert the well-formed" are not the same test. A conjunctive
guard over optional fields degrades silently to matching nothing when one field is structurally
always absent — and reads as prudence while doing so. When a filter protects a REQUIRED output,
assert the output's expected cardinality, not just its shape.
