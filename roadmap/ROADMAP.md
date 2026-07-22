# ROADMAP — here → there

> The plan. Updated at phase boundaries. **Only one phase is ever "In progress."**
> Phases project `docs/ROADMAP.md` milestones into execution order; that file wins on
> sequencing/status semantics ([[D-003]]). Milestone exit gates are quoted there — a phase here
> closes only when its milestone gate passes.

## Phases
| ID | Phase | Goal | State |
|----|-------|------|-------|
| P0 | Foundation | Control plane installed + committed; M0 prototype held honest (no new M0 features) | **In progress** |
| P1 | M1 — Canonical evidence spine | `deployment.code_identity` from reviewed manifest to real finalized evidence; identical result via CLI/API/CI/web | Planned |
| P2 | M2 — ETH↔OP route Record | Live bidirectional route topology; every mandatory `ROUTE-ETH-OP-v1` cell passes on real finalized evidence | Planned |
| P3 | M3 — Rewind | Reorg-aware indexing; one real config change traced transaction → affected assertions | Planned |
| P4 | M4 — Rehearse | One real proposal / retrospective Safe-timelock execution decoded + statefully simulated | Planned — **MVP line** (hiring-ready gate) |
| P5 | M5–M8 — Domain-complete beta | Stake/core, wider crosschain, Liquid, Cash, governance, operator/AVS families | Parked — see `ideas/` |
| P6 | M9–M10 — Finished public release | Counterfactual lab + production/reviewer hardening | Parked |

Crossing the MVP line requires a VISION review before the next phase opens.

## Work ladder (current phases)
Dependency-gated: an item can't be certified while anything it depends on is unproven.

| ID | Work item | Phase | Depends on | Evidence target | Current |
|----|-----------|-------|-----------|-----------------|---------|
| W0 | Stand up the control plane (this system) | P0 | — | Correct | Correct ✅ |
| W1 | Canonical report core: schemas, JCS canonicalization, SHA-256 report hash | P1 | W0 | Correct + Robust | Declared |
| W2 | Manifest model + trust root (approved-hash / reviewer-threshold policy) | P1 | W1 | Correct + Robust | Declared |
| W3 | Finalized-block selection + two independent RPC adapters + quorum/conflict semantics | P1 | W1 | Correct + Robust | Declared |
| W4 | Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry | P1 | W2, W3 | Correct + Robust | Declared |
| W5 | `aegis verify` CLI + report API + CI adapter + web evidence drawer over one engine | P1 | W4 | Correct + Robust + Demonstrated | Declared |

(Each row is also a file under `work/` — the contract + work-order + live status in one.
W2–W5 files are created when the item is committed at P1 entry; W1 exists now as the P1 seed.)

## Evidence ladder
`Declared → Reachable → Active → Correct → Robust → Demonstrated` — definitions in `VISION.md`.

## Design artifacts
- ✅ `docs/ENGINEERING_SPEC.md` — schemas, target architecture, `ROUTE-ETH-OP-v1` matrix
- ✅ `docs/THREAT_MODEL.md` — result semantics, forbidden inferences, adversarial test list
- ✅ `docs/SOURCE_REGISTER.md` — claim-to-source map + route research blockers
- ⬜ Ethereum/OP directed-route manifest (research blockers in `docs/SOURCE_REGISTER.md` §Hiring-ready)
