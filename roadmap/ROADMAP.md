# ROADMAP — here → there

> The plan. Updated at phase boundaries. **Only one phase is ever "In progress."**
> Phases project `docs/ROADMAP.md` milestones into execution order; that file wins on
> sequencing/status semantics ([[D-003]]). Milestone exit gates are quoted there — a phase here
> closes only when its milestone gate passes.

## Phases
| ID | Phase | Goal | State |
|----|-------|------|-------|
| P0 | Foundation | Control plane installed + committed; M0 prototype held honest (no new M0 features) | Done |
| P1 | M1 — Canonical evidence spine | `deployment.code_identity` from reviewed manifest to real finalized evidence; identical result via CLI/API/CI/web | **In progress** |
| P2 | M2 — ETH↔OP route Record | Live bidirectional route topology; every mandatory `ROUTE-ETH-OP-v1` cell passes on real finalized evidence | Planned |
| P3 | M3 — Rewind | Reorg-aware indexing; one real config change traced transaction → affected assertions | Planned |
| P4 | M4 — Rehearse | One real proposal / retrospective Safe-timelock execution decoded + statefully simulated | Planned — **MVP line** (hiring-ready gate) |
| P5 | M5–M8 — Domain-complete beta | Stake/core, wider crosschain, Liquid, Cash, governance, operator/AVS families | Parked — see `ideas/` |
| P6 | M9–M10 — Finished public release | Counterfactual lab + production/reviewer hardening | Parked |

Crossing the MVP line requires a VISION review before the next phase opens.

## Work ladder (current phases)
Dependency-gated: an item can't be certified while anything it depends on is unproven.

| ID | Work item | Phase | Depends on | Evidence target | Status |
|----|-----------|-------|-----------|-----------------|--------|
| W0 | Stand up the repo-native control plane for agent-swarm coordination | P0 | — | Correct | achieved |
| W0A | Adopt the sibling orchestrator's control-plane directive, right-sized for Aegis | P0 | W0 | Correct | achieved |
| W0B | Harden the control plane per external review (enforcement gaps, honest claims) | P0 | W0A | Correct + Robust | achieved |
| W0C | Purge work-email identity from history and prevent recurrence mechanically | P0 | W0B | Correct | committed |
| W0D | Parallelism prep — claims model, lane charters, doctrine (D-006) | P0 | W0B | Correct + Robust | achieved |
| W0E | Lane hardening per second review — close cooperative-gate holes before lane commits | P1 | W0D | Correct + Robust | achieved |
| W0F | Migrate to upgraded control-plane bundle (receipts, snapshot coherence, writer_mode) | P1 | — | Correct + Robust | achieved |
| W1 | Canonical report core — schemas, JCS canonicalization, SHA-256 report identity | P1 | W0 | Correct + Robust | achieved |
| W2 | Manifest model + trust root (approved-hash policy, content addressing, applicability) | P1 | W1 | Correct + Robust | achieved |
| W3 | Finalized-block selection + two independent RPC adapters + quorum/conflict semantics | P1 | W1 | Correct + Robust | achieved |
| W4 | Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry | P1 | W2, W3 | Correct + Robust | achieved |
| W5 | aegis verify CLI + report API + CI adapter + web evidence drawer over one engine | P1 | W4 | Correct + Robust + Demonstrated | candidate |
| WR1 | ETH-OP expected-policy research (route manifest inputs) | P1 | — | Correct | achieved |
| WR2 | Authority research (owners, delegates, roles, Safes, timelocks, guardians) | P1 | — | Correct | achieved |
| WR3 | Provider and archive feasibility (independence, finality, EIP-1898, forks) | P1 | — | Correct | achieved |
| WR4 | Rewind case selection (one real reconstructable configuration change) | P1 | — | Correct | committed |
| WR5 | Rehearse case selection (public proposal or historical Safe/timelock execution) | P1 | — | Correct | committed |
| WR6 | Adversarial vectors (designed blind to W1 implementation) | P1 | — | Correct | achieved |
| EXPX | Installer seed slot (adopted inert example) | P0 | — | Correct | archived |

(Each row is also a file under `work/`. The **Status column is a validated copy** of the work
file's frontmatter `status` — the doctor blocks commits when it drifts; `unfiled` rows have no
file yet and are created when committed at phase entry. Evidence *levels* are never hand-written
anywhere.)

## Evidence ladder
`Declared → Reachable → Active → Correct → Robust → Demonstrated` — definitions in `VISION.md`.

## Design artifacts
- ✅ `docs/ENGINEERING_SPEC.md` — schemas, target architecture, `ROUTE-ETH-OP-v1` matrix
- ✅ `docs/THREAT_MODEL.md` — result semantics, forbidden inferences, adversarial test list
- ✅ `docs/SOURCE_REGISTER.md` — claim-to-source map + route research blockers
- ⬜ Ethereum/OP directed-route manifest (research blockers in `docs/SOURCE_REGISTER.md` §Hiring-ready)
