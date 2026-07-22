---
id: D-003
type: decision
title: docs/ is product canon; roadmap/ is the execution cockpit derived from it
status: accepted
date: 2026-07-21
supersedes: []
---

# D-003 — Authority split between `docs/` and `roadmap/`

## Context
Aegis already had a canonical design record (`docs/`) with its own authority hierarchy
(`docs/README.md`): threat model > engineering spec > product spec > selection > roadmap > source
register > interview brief. Installing the control plane created a second `ROADMAP.md`/vision
surface and a potential dual-authority hazard.

## Decision
- `docs/` remains the **product canon**: what Aegis is, what claims mean, target architecture,
  milestone definitions, and exit gates. Its internal authority hierarchy is unchanged.
- `roadmap/` is the **execution cockpit**: phases project `docs/ROADMAP.md` milestones, work items
  decompose them, and capture objects (ideas/insights/decisions/risks) record session output.
- On any conflict, `docs/` wins and the `roadmap/` file is corrected in the same change.
- A phase in `roadmap/ROADMAP.md` may close only when its corresponding milestone exit gate in
  `docs/ROADMAP.md` passes; the control plane's evidence ladder cannot substitute for a gate.
- The `docs/README.md` change rule still applies: material feature changes update spec +
  threat-model boundary + roadmap gate together — control-plane bookkeeping rides along, never
  replaces that.

## Consequences
- Agents get one unambiguous lookup order: `roadmap/STATUS.md` for "what now",
  `docs/` for "what is true / allowed to be claimed".
- Milestone honesty is preserved: control-plane status levels describe project execution, never
  product claims (no UI label may exceed what the canonical result schema allows).
