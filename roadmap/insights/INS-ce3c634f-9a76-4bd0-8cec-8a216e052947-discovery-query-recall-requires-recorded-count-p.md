---
id: INS-ce3c634f-9a76-4bd0-8cec-8a216e052947
type: insight
title: "Discovery-query recall requires recorded count plus per-result disposition"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-ce3c634f-9a76-4bd0-8cec-8a216e052947 — Discovery-query recall requires recorded count plus per-result disposition

**Context.** Research wave 1 (WR5 retrospective, `roadmap/research/rehearse-selection/wr5-ruling.md`).
WR5's candidate discovery ran a `to=<target>` transaction filter that returned **eight**
SecurityUpgrade-shaped executions; the ruling initially headlined a narrower reading, and the
Codex adversarial pass (codex-review-wave1.md, finding 7) showed the real defect was
**insufficient per-result accounting** — results were "included" and "set aside" in prose
without a ledger, so a reader could not audit which of the eight were dispositioned or why.
The corrected ruling ships an eight-row disposition ledger. Separately, wr5 G8 shows the same
query *shape* has a recall hole: a `to=`-filter is blind to MultiSend-wrapped actions (the L1
Safe has 147 executed MultiSend batches) and to relayed execution — so even a fully
dispositioned result set can silently under-count the population.

**Consequence / the rule.** A discovery query in any research or fixture-selection artifact
must record BOTH:
1. the query itself + its raw result **count**, content-addressed where feasible; and
2. a **per-result disposition row** (selected / set aside + reason) covering every result —
   no prose summaries standing in for rows.
And the query design must state its known blind spots (batching, relaying, event-vs-tx
indexing) or pair with an order-independent event-first complement (G8's recipe).

**Teeth (to land with W6 / the next discovery-bearing artifact).** A machine check over
research/fixture-selection documents: any table or section declaring a discovery query must
carry a `count:` and a disposition table whose row count equals it; checker fails on mismatch.
Extends INS-003 (query-recall class).
