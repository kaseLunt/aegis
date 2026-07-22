# WR5 completeness critique (INS-003 pass)

Critic: Codex (cross-vendor, INS-002) · task-mrwcons6-u9hy45 · 2026-07-22
Verdict: useful shortlist, not closable at `Correct`. A/D remain promising leads; H valuable
after delay correction; I bonus-only. Integrator disposition in `rehearse-candidates.md`
§Post-critique disposition.

## Ranked findings (EXTEND unless marked)

1. **Timelock hex truncation repeated.** WR5 states 0x3f48=16,200s for all four schedule
   calls and derives historical minDelay <= 16,200s. Adjudicated value: 0x3f480=259,200s
   (72h). Corrected consequences: schedule->execute gap (337,104s) still exceeds 72h, so H
   remains plausibly ready pending parent-state isOperationReady; the bound is
   minDelay <= 259,200s; the inference becomes "raised from at most 3 days to 10 days".
   WR5 must not claim the historical delay EQUALED 3 days (upper bound only).
2. **Prefix replayability not established** — 53/24/140/170 are counts, a cost signal;
   the contract requires exact-order replay of every prefix envelope; verdicts stay
   unknown/untested until a dry run proves it.
3. **Complete-envelope clause underfilled** — tx type, outer nonce, value, gas/fee fields,
   access-list/blob fields, signature fields, raw signed bytes not inventoried; "full
   calldata recovered" != "complete envelope recovered".
4. **Isolation overstated** — top-level `to` scan called "stronger than" storage-slot
   non-overlap; that ordering is reversed. Internal calls/delegatecalls invisible.
   Downgrade to unknown-pending-trace/diff. D's event does not establish owner() post-state.
5. **No execution-epoch code identity/ABI binding** — Safe proxy+singleton, MultiSend
   variant, timelocks, Endpoint/libraries, ProxyAdmin, H/I inner targets all unresolved at
   execution height; identity-before-decoding is the spec's hard order.
6. **Safe sender semantics more complex than "arbitrary relayer + embedded signatures"** —
   needs block-bound singleton/version, owners/threshold, guard/fallback/modules, signature
   modes (incl. EIP-1271/approved-hash), outer envelope semantics.
7. **OP timelock execution stream never searched** — most obvious OP-native shape
   (CallExecuted/operation-id on the timelock itself) missing; Safe-history-first discovery
   misses relayed executions; pool census must not be a closed four-address universe.
8. **Block environment reduced to 3 header fields; no OP replay analysis** (rollup fork
   rules, L1-attributes/deposit txs in prefix, OP tx types, fee semantics).
9. **Timelock operation identity/readiness/predecessor/cancellation incomplete** — no
   operation IDs, no schedule<->execute ID equality, no isOperationReady at parent state;
   I lacks a paired schedule and its own per-clause table.
10. **No candidate mapped to a historical manifest or affected canonical assertion** —
    manifestVersion is mandatory; A configures the Sync Pool OApp (not obviously the primary
    adapter pathway); D's route impact overstated; H's first inner call undecoded; I off-route.
11. **"No public unsigned proposal exists" overclaimed** — narrow to the exact endpoints/
    filters queried; scheduled-but-unexecuted timelock ops and governance artifacts unsearched.
12. **Module/non-standard execution shapes unsearched** (Safe module txs, delegatecall
    batches, EOA-relayed timelock executions, event-first discovery, Safes beyond WR2's list).
13. **One L1 archive probe generalized to all chains/blocks/candidates** — I was 1 day old;
    D is OP; the OP observation was a null receipt, not an archive/fork probe. Per-chain,
    per-height probes needed.
14. **Internal contradictions** — D receipt provenance (no-receipt vs two-operator cross-check:
    the cross-check covered the tx object, not the receipt); H heading vs first-target text;
    H "largest prefix" vs I=170; D "permanently/no bypass" exceeds one observation; pool
    described as four authorities while H/I arrive via a separate proposer Safe.
15. **Provenance rows partially non-reproducible** — ellipsized Safe API URLs; RPC/API
    responses not content-addressed; weakens threshold/nonce and empty-queue claims.
16. **ACCEPTED GAP** — core-protocol governance / non-route Safes stay outside this lane
    (census is route-bounded, not exhaustive); a core-only candidate could not satisfy the
    route-workflow M4 gate anyway.
17. **ACCEPTED GAP** — stateful simulation and administratively independent provider quorum
    are implementation gates, not selection-lane work; requires wording "promising/untested"
    for dependent clauses.

## Candidate disposition (critic)
- A: primary lead; downgrade "no blocking clause" -> "promising; prefix/sender/identity/
  isolation/affected-assertion qualification outstanding".
- D: strongest OP-side alternative; add OP replay qualification; withdraw permanence claim.
- H: richest batch follow-on after 259,200s correction + full 4-target decode + MultiSend
  identity + operation IDs + parent-state readiness.
- I: bonus only.

## Genuinely complete
Hashes/chains/blocks/indices/parent hashes/batch shapes for all four; A/D/H byte-matched to
pinned repo artifacts; discovery vs chain-observation separation; no manifest promotion;
quorum and trace gaps disclosed; I's off-route nature disclosed.
