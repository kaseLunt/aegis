---
id: H0
type: goal
title: Earn ether.fi engineering respect with an honest, reproducible protocol flight recorder
status: active
review_by: 2026-10-01
informs: []
updated: 2026-07-21
---

# North Star

Build Aegis so that an ether.fi engineer who inspects it for ten minutes concludes: *the author
understood our topology and threat model, chose defensible assertions, handled uncertainty
correctly, and built a reproducible full-stack system rather than a mocked dashboard* — while
demonstrating AI-assisted engineering where the owner holds the claims, threat model, and gates.

## Success evidence
- Near-term: the intermediate hiring-ready gate (`docs/ROADMAP.md`, M1–M4) passes — live ETH↔OP
  route with Record/Rewind/Rehearse on real evidence, failure demos, identical report hashes.
- Ultimate: the final definition of done in `docs/ROADMAP.md` passes across all six evidence
  families.

## How this is used
The evaluation criterion for every phase and every promotion: does this work materially advance the
north star? The route may change; this does not. Work items and ideas point here via `informs: [H0]`.
A feature that would weaken claim semantics to add breadth fails this test by definition.
