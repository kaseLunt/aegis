---
id: R-85f86c4d-d845-49ea-9636-f7014d5c4383
type: risk
title: "ROUTE-ETH-OP-v1 manifest absence blocks the M4 affected-assertion clause"
status: open
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# R-85f86c4d-d845-49ea-9636-f7014d5c4383 — ROUTE-ETH-OP-v1 manifest absence blocks the M4 affected-assertion clause

**Risk.** No `ROUTE-ETH-OP-v1` manifest exists (`roadmap/ROADMAP.md` shows it ⬜). M4's
Rehearse deliverable must report **affected assertions** for a rehearsed transaction — but
with no route manifest there is nothing for "affected" to evaluate against. M4 cannot close
before the M2 manifest lands, whatever the state of the fork-engine work.

**Independent derivation.** Three wave-1 research documents arrived at this same sequencing
constraint separately: wr5-ruling.md G3 (rehearsal-master), the route-manifest blueprint's
gap ledger (route-cartographer), and wr4's supersession design assumptions (chain-historian).
A constraint derived three ways independently is load-bearing, not incidental.

**Compounding factor.** M2 manifest authoring is itself gated on the blueprint's G-01 build
provenance discipline (expected runtime hashes derive from independently reviewed pinned
build artifacts — confirmation round ruled the `first_observation_baseline` fallback
UNENFORCED and out of manifest grade), plus the open manifest-owner items already tracked in
STATUS "Next up" #3 (live rate-limit value, executor pin, historical setPeer tx).

**Mitigation path.** Sequence P2 manifest authoring (or at minimum the historical
applicability window for the chosen M4 candidate — wr5 G4) ahead of any M4 closing claim;
until then every rehearsal artifact reports affected assertions as `unknown` with this risk
cited. Review at P2 planning.
