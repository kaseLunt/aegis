---
id: R-ce86b728-897e-4073-92d3-8c3b786aa848
type: risk
title: "M1 cannot honestly close at W6 -- canon requires real finalized evidence via live dual-provider acquisition, and no live adapter exists"
status: open
informs: ["W6"]
review_when: date:2026-08-14
updated: 2026-07-31
---

# R-ce86b728-897e-4073-92d3-8c3b786aa848 — M1 cannot honestly close at W6 -- canon requires real finalized evidence via live dual-provider acquisition, and no live adapter exists

**Context.** Found by the owner's cross-project audit (2026-07-30) and VERIFIED against
canon this session. Canonical M1 (docs/ROADMAP.md, "Milestone 1" section): the goal is
`deployment.code_identity` "from reviewed manifest to REAL FINALIZED EVIDENCE"; the
deliverables include "two administratively independent RPC adapters"; the exit gate's
"Disconnecting or corrupting a provider cannot create a false pass" is only meaningful
against LIVE acquisition.

**Evidence.** No live adapter exists: W3 built the recorded adapter seam only
(`recordedAdapter`, lib/aegis/chain/adapter.ts); W5 explicitly deferred live RPC
transports + the WR3 probe step (W5 Non-goals); W6 excludes the live capture pipeline
(W6 Non-goals). The facade consumes recorded bundles exclusively. Meanwhile
[[D-6bedc848-2a42-411a-a65b-d623f7418121]] §4 says "M1 closes at W6" — in tension with
canon, and per [[D-003]] docs/ canon WINS on milestone content.

**Consequence.** W6 completes the fixture-corpus and supersession DELIVERABLES but cannot
honestly close M1 by itself. Resolution is an owner/phase-review decision, two honest
paths: (a) a live-acquisition work item (live HTTP adapters for the two declared
providers + the WR3 probe step + a documented live command) lands before the M1 exit
gate; or (b) the owner re-scopes canonical M1's exit gate to recorded-mode reproduction
(a docs/ canon edit — owner-only surface). Path (a) also re-ranks the standing owner
item: the ALCHEMY_API_KEY / QUICKNODE_API_TOKEN accounts gate M1's honest closure, not
merely M2 convenience. Until resolved, no STATUS/EV language may claim M1 is closed or
closeable at W6 — "W6 completes M1's corpus deliverables" is the claim ceiling.
