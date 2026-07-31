---
id: IDEA-a565869a-ce64-4ec5-ad94-5d0f2c4add01
type: idea
title: "Aegis-Solvent boundary: narrow M7 Cash at the M4 phase review; control-plane positioning; the diff-to-blast-radius integration seam"
status: inbox
informs: []
review_when: date:2026-08-14
updated: 2026-07-31
---

# IDEA-a565869a-ce64-4ec5-ad94-5d0f2c4add01 — Aegis-Solvent boundary: narrow M7 Cash at the M4 phase review; control-plane positioning; the diff-to-blast-radius integration seam

**Context.** Owner's cross-project audit (2026-07-30) comparing Aegis with Solvent (the
lending-risk indexer). Verdict adopted by the owner: overlap is healthy through M4 (the
hiring-ready route slice); it becomes duplicative only at M7 (Cash) and the M5-M10
expansion. Positioning: Solvent = the lending-RISK data plane (book, HF, liquidations,
oracle stress); Aegis = the deployment/governance ASSURANCE control plane (Record /
Rehearse / Rewind over controls, identity, and configuration).

**Actions this idea carries to the M4 phase review:**
1. NARROW M7 Cash to: contract identity + dependency wiring; roles/upgrade authority/
   config drift; expected-vs-observed parameter configuration; rehearsing a real Cash
   governance tx; the canonical before/after configuration artifact. Leave to Solvent:
   book/position risk, HF/liquidation math, market/oracle stress, price history,
   account history, migration metrics, parameter blast radius.
2. Aegis counterfactuals stay about CONTROL policy (DVNs, rate limits, pause delays,
   timelocks) — never price/collateral scenarios.
3. Do not commit to M5-M10 as portfolio scope; M4 is the second release boundary.
4. The M0 homepage must not be presented as the finished product (it reads as an early
   Solvent cousin); the distinct story arrives with M2 topology + M3 Rewind + M4 Rehearse.
5. Integration seam (optional, strong): Aegis decodes+simulates a governance action and
   emits the canonical parameter/config diff -> Solvent applies proposed parameters to
   the live book and computes affected positions/debt/liquidation exposure.
