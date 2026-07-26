---
id: INS-6d122078-aee2-47d5-b402-41d372da0d90
type: insight
title: "expert persona bench for P2-P4 research four standing agents and their latent spaces"
status: candidate
informs: [W6, R-b4e2e152-96dc-4238-b76b-c16336e93dbd]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-6d122078 — Expert persona bench for P2-P4 research

## Context

The owner directed (2026-07-26) that the free parallel research lanes start now, staffed by
expert PERSONA agents tuned into specific companies' latent space — the reasoning being that
a generalized agent averages across all software culture, while a persona anchored to the
three or four organizations whose daily craft IS the problem domain surfaces insights the
average misses. Exemplar pattern: the circuit-taste design director (user-level agent with a
latent-space table taking each source FOR A NAMED CRAFT and rejecting its failure mode).

## Evidence — the bench, its sources, and the reasoning

Four standing advisors under the user-level agents directory (`~/.claude/agents/`, outside
the repo and its gates; advise only, never edit; re-message the same instance to accumulate
context):

| Agent | Model | Latent space | First assignment |
|---|---|---|---|
| `route-cartographer` | fable | L2BEAT (privileged-actor enumeration), OP Labs (OP-stack semantics), LayerZero (weETH OFT rails), Trail of Bits (proxy skepticism), OpenZeppelin (upgrade/authority patterns) | ETH↔OP directed-route manifest blueprint from WR1/WR2 |
| `chain-historian` | opus | TrueBlocks, The Graph (reorg playbook), Index Supply school, Flashbots (reorg realism), NTSB flight-recorder ethos (tiebreaker) | WR4 Rewind case-selection ruling + W6 supersession fixture notes |
| `rehearsal-master` | opus | Tenderly, Foundry/anvil, Safe (execution semantics), OZ Defender (proposal lifecycle), retrospective-replay forensics | WR5 Rehearse case ruling + fork-simulation tooling evaluation |
| `evidence-warden` | fable | Sigstore, in-toto/SLSA, Certificate Transparency, Reproducible Builds, forensic chain of custody (tiebreaker) | R-b4e2e152 §1+§2 custody design (bundle anchoring, provider binding) |

Model split per owner guidance: fable where judgment compounds (expected-state scoping,
evidence claim strength), opus where outputs are concrete and Codex-checkable. Every report
goes to Codex for adversarial review; Codex may also serve as a researcher where that fits.

Governance posture: these are READ-ONLY advisors returning reports — no claims needed
(`parallel_readers: allowed`). Their D-006 independence constraints are written INTO the
personas (route-cartographer is textually banned from implementing observed-side checks or
certifying against values it sourced). Research artifacts land in the repo only through the
serial integrator lane with normal gates, after Codex review.

## Consequence

- Persona reports feed: the route manifest (P2's biggest input), WR4/WR5 completion, the P4
  simulation spike, and the R-b4e2e152 evidence designs — all identified as
  blocked-on-nothing in the parallelism analysis.
- The bench persists at user level; future sessions invoke by agent name once the registry
  refreshes (this session inlined the personas into general-purpose agents as the documented
  fallback).
- If a persona's advice is promoted into a decision or work item, the promotion runs through
  the normal HITL barrier — personas advise, owners ratify.
