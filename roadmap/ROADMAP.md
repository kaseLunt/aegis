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

| ID | Work item | Phase | Depends on | Evidence target | Status |
|----|-----------|-------|-----------|-----------------|--------|
| W0 | Stand up the control plane (this system) | P0 | — | Correct | achieved |
| W0A | Adopt sibling-orchestrator directive, right-sized ([[D-004]]) | P0 | W0 | Correct | achieved |
| W0B | Harden control plane per external review ([[D-005]], [[R-001]]) | P0 | W0A | Correct + Robust | achieved |
| W0C | Identity scrub: purge work email, prevent recurrence ([[R-002]]) | P0 | W0B | Correct | committed |
| W0D | Parallelism prep: claims model + lane charters ([[D-006]]) | P0 | W0B | Correct + Robust | active |
| W1 | Canonical report core: schemas, JCS canonicalization, SHA-256 report hash | P1 | W0 | Correct + Robust | committed |
| W2 | Manifest model + trust root (approved-hash / reviewer-threshold policy) | P1 | W1 | Correct + Robust | unfiled |
| W3 | Finalized-block selection + two independent RPC adapters + quorum/conflict semantics | P1 | W1 | Correct + Robust | unfiled |
| W4 | Identity adapters (direct / EIP-1967 / beacon / clone) + code-hash-scoped ABI registry | P1 | W2, W3 | Correct + Robust | unfiled |
| W5 | `aegis verify` CLI + report API + CI adapter + web evidence drawer over one engine | P1 | W4 | Correct + Robust + Demonstrated | unfiled |
| WR1 | Research: ETH↔OP expected route policy ([[D-006]] lane) | P1 | — | Correct | committed |
| WR2 | Research: authority map (owners/Safes/timelocks) | P1 | — | Correct | committed |
| WR3 | Research: provider/archive feasibility matrix | P1 | — | Correct | committed |
| WR4 | Research: Rewind case selection | P1 | — | Correct | committed |
| WR5 | Research: Rehearse case selection | P1 | — | Correct | committed |
| WR6 | Research: adversarial vectors (blind to W1 impl) | P1 | — | Correct | committed |

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
