# VISION — Aegis Protocol Flight Recorder

> The north star. Stable by design. Changes only at a phase review, with explicit approval.
> **Product canon lives in `docs/`** (see [[D-003]]). This file is the execution-level distillation;
> if it ever disagrees with `docs/`, `docs/` wins and this file gets fixed.

## Why this project exists

1. **Hiring signal:** earn genuine engineering respect from ether.fi engineers — proof that the
   author can research an unfamiliar protocol, define honest system boundaries, design a
   data/simulation backend, build a legible frontend, and use AI agents without outsourcing the
   consequential decisions (`docs/PROJECT_SELECTION.md`).
2. **Real utility:** independent, reproducible post-deployment verification, governance review,
   change attribution, and incident reconstruction for ether.fi's public surfaces — valuable even
   if ether.fi never adopts it.
3. **AI-assisted engineering maturity:** demonstrate an ownership boundary where agents provide
   implementation throughput while the owner holds the claims, threat model, and release gates.

## What finished success looks like

The final definition of done in `docs/ROADMAP.md` passes: Record/Rehearse/Rewind operate on real
reviewed evidence across all six families (Stake/core, crosschain, Liquid, Cash, governance,
operator/AVS exposure), the adversarial suite passes, and CLI/API/CI/web render byte-identical
canonical reports.

Elevator: *an ether.fi engineer inspects Aegis for ten minutes and concludes the author understood
their topology and threat model, chose defensible assertions, handled uncertainty correctly, and
built a reproducible full-stack system rather than a mocked dashboard.*

**The MVP line for this control plane is the intermediate hiring-ready gate (M1–M4):** the live
Ethereum↔OP weETH route with Record, Rewind, Rehearse on real evidence, failure demos, and
identical report hashes across surfaces.

## Permanent non-goals

Inherited verbatim from `docs/PRODUCT_SPEC.md` §Non-goals and `docs/PROJECT_SELECTION.md`
§Ideas explicitly rejected. Highlights that bind every phase:

- no universal risk/health scores, `safe to sign`, or `would have prevented` language;
- no APY/market forecasts, allocation recommendations, or Monte Carlo output as product truth;
- no offchain Cash authorization/settlement conclusions; no invented healthy values, ever;
- the renderer never creates a verdict the engine did not produce;
- read-only: never signs, broadcasts, or custodies keys; never claims ether.fi endorsement.

---
## Proof philosophy — the evidence ladder
> Universal. Keep this section as-is.

Status is earned, not declared. Every capability sits at exactly one level:

| Level | Meaning |
|-------|---------|
| Declared | Documentation claims it |
| Reachable | A real construction/call path exists |
| Active | A runtime trace proves it executed |
| Correct | The canonical deterministic check passes |
| Robust | Interaction + multi-seed/variation suites pass |
| Demonstrated | The UI/output faithfully shows authoritative state |

"Complete" requires **Robust + Demonstrated**. Unit tests alone prove only local correctness.

**Derived ≠ true.** A status level means "consistent with the evidence *as of commit X*" — never
timeless truth. Achieved work items carry a tool-written `evidence_fingerprint` over their
`invalidated_by` inputs (staged-index blob hashes); when those inputs change, the doctor blocks
commits until the item is re-verified and re-stamped. A green level can't silently outlive the
bytes that earned it. Full model: [`SYSTEM.md`](SYSTEM.md).

This ladder mirrors the product's own doctrine: Aegis derives verdicts from evidence and prefers
an honest `unknown` over an unjustified `pass` — the control plane applies the same rule to the
project itself.

## Architectural principles

Binding rules from the doc canon (authority: `docs/README.md` hierarchy):

1. **One engine, many renderers.** CLI, API, CI, and web transport the same canonical,
   content-addressed report. No renderer verdict logic.
2. **Expected and observed state have independent provenance.** A manifest is never generated
   from the reads it will verify.
3. **Identity before decoding.** ABI selection only after terminal runtime code-hash verification.
4. **Typed uncertainty.** Six verification states for predicates; separate availability states for
   neutral facts; missing evidence can never improve a result; critical pass *and* fail require
   two-provider quorum.
5. **Determinism.** Same inputs → byte-identical canonical reports (RFC 8785 + SHA-256).
6. **Spec-implementation lockstep.** A material feature change updates the relevant spec,
   threat-model boundary, and roadmap gate in the same change (`docs/README.md` change rule).
7. **Milestone honesty.** Describe the implementation by the highest completed milestone; never
   borrow the finished product's claims for current status.
