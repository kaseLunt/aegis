---
id: INS-e14fbbbc-0f52-435e-b48c-23abed56571b
type: insight
title: "EDR deposit-nonce catch-22 — admission and receipt fidelity are mutually exclusive; M4 is L1-only"
status: candidate
informs: []
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-e14fbbbc-0f52-435e-b48c-23abed56571b — EDR deposit-nonce catch-22 — admission and receipt fidelity are mutually exclusive; M4 is L1-only

**Context.** S6 OP gate spike (`roadmap/research/rehearse-selection/spike-s6-s7.md` §1,
rehearsal-master 2026-07-26). EDR 0.14.2's OP deposit support is real on the read and
execution paths (deposits parse, execute to canonical status/gas, produce genuine 0x7e
receipts) — but the submission path applies **ordinary mempool nonce validation to
deposits**. A deposit envelope carries no nonce (reads as 0), so admission requires the
depositor account nonce to be 0, while receipt fidelity requires it to equal the canonical
`depositNonce` — **mutually exclusive by construction** for every OP block after the first
(OBSERVED on block 133508663: arm A admits but records depositNonce 0x0; arm B rejects;
`hardhat_setNonce` refuses decreases; no deposit-aware injection method exists in the RPC
surface). `depositNonce` is consensus-load-bearing for the OP receipts root — proven by a
self-tested independent root deriver whose negative test (drop the field) moves the root.

**Consequence (recorded disposition).** Per wr5's own gate rule: **the M4 gate case is
L1-only; R1 stands.** OP candidates go `unknown` for receipts-root-gated acceptance. A
weaker, explicitly disclosed acceptance criterion (per-receipt equality with a named
permanent depositNonce divergence — EDR hit 34/35 receipts + exact block gas) exists as an
**owner waiver, deliberately not exercised** by the spike.

**Expiry.** This verdict dies on: (a) any EDR release changing deposit admission (the fix is
narrow; upstream issue should be filed — S6-G1); (b) OP deposit-receipt encoding changes at
a future hardfork; (c) loss of canonicality of the tested block. Measured on ONE block at
Holocene; generalization is INFERRED from a structural mechanism.

**Teeth (P4).** The receipts-root deriver + its two negative tests (perturb cumulativeGas;
drop depositNonce) become the acceptance harness for any future EDR re-test — re-run the
gate on each EDR upgrade before any OP rehearsal claim strengthens.
