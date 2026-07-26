---
id: INS-a76edd46-7bd4-41a2-bb55-c2ea21fc109e
type: insight
title: "Same-chain-only applicability bounds fail open historically — a missing window reads as applicable"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-a76edd46-7bd4-41a2-bb55-c2ea21fc109e — Same-chain-only applicability bounds fail open historically — a missing window reads as applicable

**Context.** Surfaced by the round-3 chain-historian pass on wr4 (Candidate-5 reframe), while
line-verifying the Codex confirmation finding. OBSERVED in `lib/aegis/manifest/trust.ts`:
- `manifest_not_yet_valid` fires only when `fromBlock.chainId === boundary.block.chainId`
  (trust.ts:388-394); `manifest_expired` only when `toBlock.chainId` matches (395-402).
- `validity` carries exactly ONE `fromBlock`/`toBlock` pair, each bound to a single chainId
  (196-206) — there is no per-chain window array.
- Chain coverage is a separate check (`chainIds.includes(...)`, 384-385).

**The property.** For a multi-chain manifest (`chainIds: [1, 10]`) whose validity window
bounds only chain 1, a chain-10 boundary sees **no applicable bound at all** — the window is
*silent* on chain 10, and `checkApplicability` returns `applicable: true` (given environment
match). A missing same-chain bound therefore reads as applicability, not as a gap: the
mechanism **fails open in the historical direction**. A route manifest authored in 2026 with
only an L1 window would silently apply its expectations to a 2025 OP block.

**Consequence / the rule.** A multi-chain manifest must declare a validity bound **per chain
it covers**, and consumers must treat a missing same-chain bound as a gap
(`unknown`/`not_applicable` + reason), never as applicability. This constrains: (a) the
ROUTE-ETH-OP-v1 authoring recipe (blueprint G-14 anchors must exist per chain); (b) wr4
Candidate 5 (conditional until a reviewed chain-10 historical window exists); (c) any future
schema change — either `validity` becomes per-chain structurally, or `checkApplicability`
learns to refuse a covered chain that has no same-chain bound.

**Teeth (when the applicability surface is next touched, or at W6 fixture design).** A
red-first test: a manifest covering chains [1, 10] with only a chain-1 window, evaluated at a
chain-10 boundary, must NOT evaluate as silently applicable once the rule lands — and until
the engine change is scheduled, the boundary-language of any historical verdict on an
unbounded chain must carry the gap disclosure. Cross-refs: wr4-ruling §1.5 blocker (a) and
the G10 per-chain window addendum; R-85f86c4d (manifest absence blocks M4).
