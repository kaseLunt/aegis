---
id: IDEA-17416aa7-84ec-488a-9037-bcef5ff88989
type: idea
title: "Rehearsal artifacts carry their own pinned-state bundle -- third-party re-execution without RPC"
status: inbox
informs: []
review_when: date:2026-08-09
updated: 2026-07-26
---

# IDEA-17416aa7-84ec-488a-9037-bcef5ff88989 — Rehearsal artifacts carry their own pinned-state bundle -- third-party re-execution without RPC

**Source.** S7 budget spike (spike-s6-s7.md §2.7, rehearsal-master 2026-07-26). Measured:
the entire 52-tx prefix replay consumed 912 lazy state reads totalling **5.8 MiB** on disk,
and with that state resident the full replay runs in **1.5 seconds** — the EVM was never the
bottleneck; RPC round-trips were.

**The idea.** Make the pinned-state bundle a **first-class component of the rehearsal
artifact format** (M4): every `retrospective_rehearsal` (and later `public_unsigned_proposal`
run) ships `{envelopes, block header, content-addressed state-read set, engine+ruleset
pins, prediction hash}`. Consequences:
1. **Third-party re-execution in seconds with zero RPC access** — the wr5 §6 "reproduction
   contract" made concrete, and the structural answer to the Tenderly-class disqualifier
   ("no third party can re-execute a result").
2. The spec's 10-second p95 exclusion narrows to *cold* rehearsal only; re-verification of
   an existing artifact becomes an interactive-SLO operation (~1.5 s).
3. The bundle is content-addressed like every other recording, slotting into the existing
   custody chain (rawResponseSha256 / envelopeSha256 discipline) with no new trust class.

**Cost/risks to weigh at promotion.** Bundle size scales with prefix state footprint
(5.8 MiB for 52 tx is friendly; deep-state txs may not be); the bundle is evidence and needs
the same supersession-on-reorg semantics as any recording; storage/serving belongs to the S4
store design.

**Promotion path.** Phase review at M4 planning; pairs with D-74472e1d (already ratified:
rehearsals are CLI-produced artifacts) — this idea upgrades "artifact" from report-only to
report+state.
