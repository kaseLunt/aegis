---
id: D-74472e1d-1338-4676-becf-2c4a407c8e99
type: decision
title: "Fork-engine pair (EthereumJS primary, EDR cross-check) and CLI-produces-artifact rehearsal architecture"
status: accepted
approved_by: klunt (2026-07-26, decision-queue session ratification)
date: 2026-07-26
supersedes: []
updated: 2026-07-26
---

# D-74472e1d-1338-4676-becf-2c4a407c8e99 — Fork-engine pair (EthereumJS primary, EDR cross-check) and CLI-produces-artifact rehearsal architecture

**Status: ACCEPTED — owner-ratified 2026-07-26** (decision-queue session; the owner selected
"Ratify + early spikes": the direction below is approved, AND the two de-risking spikes (S6
EDR OP-deposit-block replay gate; S7 RPC budget probe) are authorized to run early as
research, in scratch environments outside the repo — dependencies still enter the repo only
at P4.)

Originally proposed as: (introduces new dependencies; architectural
direction for P4/M4). Sourced from the rehearsal-master wave-1 ruling
(`roadmap/research/rehearse-selection/wr5-ruling.md` §3, header verdict PROMOTABLE), which
survived Codex adversarial review + confirmation (codex-review-wave1-confirmation.md).

## Proposed direction

1. **EthereumJS v10 (`@ethereumjs/vm` + `RPCStateManager` + `createBlockFromJSONRPCProvider`)
   as the L1 engine of record.** Pinning is structural (`blockTag` accepts a number or
   `'earliest'` only — `'latest'` is unrepresentable); hardfork ruleset is an explicit
   `Common` input; you own the `StateManager`, so the no-side-channel isolation claim is
   structurally testable. MPL-2.0, consumed unmodified.
2. **EDR 0.14.2 as (a) the mandatory OP engine and (b) a differential cross-check on L1.**
   Only credible in-process path with real OP-Stack modelling (`OP_CHAIN_TYPE`, OpHardfork
   Bedrock→Isthmus, functional L1Block/GasPriceOracle predeploys, L1-fee receipt fields).
   MIT. **Two engines disagreeing must yield `conflict`, never a coin flip.**
3. **`retrospective_rehearsal` is an offline CLI-produced artifact, not a live request path.**
   A 52-tx prefix replay under lazy RPC state fetching blows any interactive p95 by orders of
   magnitude (wr5 S7); the CLI produces a content-addressed artifact the surfaces render.

## Rejected alternatives (recorded in the ruling)

- EthereumJS as sole engine — cannot replay any OP prefix (no type-0x7E deposits, no
  predeploys, no L1 data fee).
- EDR as sole engine — 0.x, maintainer-stated "Hardhat-only" stance, native binary limits.
- anvil (external process), Tenderly (hosted) — weaker pinning/custody posture for an
  evidence product; stale forks (`@nomicfoundation/ethereumjs-vm`, `js-revm`, …) — abandoned.

## De-risking gates before commitment hardens

- **S6 OP gate:** EDR must replay OP block 133508663 including the index-0 type-0x7E deposit
  and reproduce the canonical receipts root; if it cannot, OP candidates go `unknown` and the
  M4 case is L1-only. (Deposit sender is asserted-never-recovered on every stack — permanent
  disclosable limitation.)
- **S7 budget probe** against the WR3 provider pair (Alchemy + QuickNode) for the chosen
  candidate height.

## Consequences if ratified

New dependencies (`@ethereumjs/vm`, `@nomicfoundation/edr`) enter at P4, not before; W6
fixture design may assume the artifact-producing CLI shape; the M4 boundary-language template
(wr5 §6) becomes the claim ceiling for rehearsal outputs.
