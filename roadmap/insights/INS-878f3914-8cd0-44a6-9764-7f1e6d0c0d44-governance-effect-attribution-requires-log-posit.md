---
id: INS-878f3914-8cd0-44a6-9764-7f1e6d0c0d44
type: insight
title: "Governance-effect attribution requires log-position containment; Safe nonce does not order state changes"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-878f3914-8cd0-44a6-9764-7f1e6d0c0d44 — Governance-effect attribution requires log-position containment; Safe nonce does not order state changes

**Context.** G-02 evidence lane
(`roadmap/research/route-manifest/g02-04-execution-order.md` §3.6, chain-historian
2026-07-26). OBSERVED on OP: one on-chain transaction (`0xef1f0487…`, blk 149815468)
executed **three Safe nonces (20, 21, 22) via MultiSendCallOnly**, with the rate-limit
events interleaved between the second and third `ExecutionSuccess` logs. A tx-level
association ("this tx = Safe nonce N") would mis-attribute the state change; nonce order and
effect order are only coupled through log positions.

**The rule.** For Rewind (M3) and any governance-effect attribution:
1. The only sound ordering key for on-chain effects is **`(blockNumber, transactionIndex,
   logIndex)`** — never Safe nonce, never tx hash alone, never timestamp.
2. Attributing an effect to a governance action requires **log-position containment**: the
   effect's logIndex must fall inside the emitting action's `ExecutionSuccess` bracket, not
   merely inside the same transaction.
3. Batched-execution wrappers (MultiSendCallOnly and kin) make one tx carry many governance
   actions routinely — the corpus now has a real 3-nonce example, so the indexer's data
   model must treat "transaction" and "governance action" as distinct entities from day one.

**Teeth (W6/M3).** The indexer's fixture corpus must include the real 3-nonce transaction
shape (or a constructed equivalent): a test asserting that the rate-limit change attributes
to nonce 22 — not 20, not 21, not "the transaction" — fails on any implementation that keys
attribution at tx level. Complements wr5 G8 (event-first discovery) and the wr4 supersession
ordering rules (position over self-declared keys — same principle, different layer).
