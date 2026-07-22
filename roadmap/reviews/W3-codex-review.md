# Codex cross-vendor review — W3 chain modules (2026-07-22)

- Scope: `0a833f7..90c3580` (quorum, selection, adapter, providers, engine + tests +
  recordings), reviewed BEFORE the achieved stamp (ordering fix from the W2 round).
- Session: `019f8c1b-5c35-78e1-b290-5c5506945844`.
- Verdict: needs-attention — 2 P0, 4 P1, 2 P2. ALL verified real by code reading and
  reproduced as RED tests before fixing (`tests/codex-w3-fixes.test.ts`, 19 tests);
  fixed same-day, suite 228/228.
- Clean dimensions per Codex: block/raw conflict rules, decoded-match/raw-mismatch
  handling, insufficient-evidence outcomes, exact hash pinning, BigInt arithmetic,
  finality stripping, unresolved handling, output ordering, UTF-8/JSON typed errors,
  bundle freezing, provider declarations.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | P0 | Provider aliases satisfy quorum — administrativeDomain never reached evaluateQuorum, so two IDs backed by one endpoint could self-corroborate. | FIXED. Observations carry the reviewed administrative domain (threaded from ChainAdapter); agreement requires minAgreeing DISTINCT domains (`administrative_domain_overlap`); ok-without-domain degrades to missing evidence; duplicate required-provider entries are an invalid policy. |
| 2 | P0 | Engine could certify a wrong-chain block — observation chainId synthesized from the REQUEST; returned blocks never validated. | FIXED. `ensureReturned` validates chainId (and expected number on re-fetch) on every adapter return; violations become missing evidence; observations built from returned, validated metadata. |
| 3 | P1 | Recording integrity didn't bind provenance/lookup fields; adapters accepted unverified bundles. | FIXED. Per-response `envelopeSha256` binds providerId/chainId/method/params/capturedAt/rawResponseSha256/result; duplicate lookup keys rejected; result-vs-envelope chainId consistency enforced; `recordedAdapter` accepts only loader-verified bundles (WeakSet gate). Deferred remainder: anchoring recordingId to a whole-bundle digest — R-005-class, revisit at the live-recording pipeline. |
| 4 | P1 | Non-ChainError adapter rejections crashed the engine instead of becoming missing evidence. | FIXED. Catch-all in both proposal and re-fetch phases; native errors → malformed observation, absence → timeout. |
| 5 | P1 | One stale provider could drag the conservative pin arbitrarily back with no signal. | FIXED. `maxHeadLagBlocks` policy leash (`head_divergence_exceeded` → unresolved) + per-provider proposal diagnostics exposed on every result. Full freshness policy remains the W1 report axis wired at W5. |
| 6 | P1 | selectTimeAligned accepted unconfirmed heads as alignment anchors; candidates could exceed their head. | FIXED. Heads and candidates must carry finalized/confirmations finality; `candidate_above_head` rejection. |
| 7 | P2 | Timestamp regex accepted impossible instants (Feb 30, 25:61:61). | FIXED. Exact `Date` round-trip after the fixed-width check; leap-day positive test. |
| 8 | P2 | Non-ok quorum fixtures all lacked payloads — a status-ignoring evaluator would have passed. | FIXED. Tests now prove a timeout/malformed observation carrying a complete matching OR conflicting payload can neither complete a quorum nor manufacture a conflict. |

## Class lessons
- Same family as the W2 round's F1: **identity and independence must be mechanically
  bound, never assumed from strings or config proximity** — aliases, relabeled
  recordings, and request-substituted metadata are all one class: data trusted for a
  property nothing verified.
- Review-before-stamp ordering worked: no re-attestation churn, W3 stamps once, clean.
