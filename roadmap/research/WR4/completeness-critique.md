# WR4 completeness critique (INS-003 pass)

Critic: Codex (cross-vendor, INS-002) · task-mrwc3pcd-0hf1zn · 2026-07-22
Inputs: charter + specs first, deliverable last. Verbatim findings below; integrator
disposition in `rewind-candidates.md` §Post-critique disposition.

## Verdict
WR4 is a useful candidate lead sheet, but not complete enough to support its claim that
Candidate 1 or 2 satisfies the M3 exit gate. It searched a few promising transaction
shapes, not the full mutable surface of both directed pathways. Most serious omissions:
implementation upgrades, peers, the send/receive configuration matrix, executor/ULN
parameters, and authority transitions.

## A. Missed candidate classes
- **A1 (P0) Actual OFT/adapter implementation upgrades** — Candidate 5 changes the
  ProxyAdmin owner, not the implementation; Candidate 2 notices the ABI epoch but never
  locates the upgrade tx that created it. Strongest direct exercise of M3's explicit-epoch
  gate. Look: `Upgraded(address)` logs at both proxies, ProxyAdmin upgrade txs, Safe/
  timelock histories, deployment outputs/tags. EXTEND.
- **A2 (P0) Peer/EID mapping changes** — no setPeer/peer-replacement search for EIDs
  30101/30111; a peer change can redirect/disable one pathway while libraries/DVNs look
  correct. EXTEND.
- **A3 (P0) Send-library changes + primary-OApp receive-library changes** — Candidate 3
  covers only the L1 Sync Pool receive side; primary adapter/OFT send+receive uncovered.
  EXTEND.
- **A4 (P0) Full ULN and executor configuration** — only one 4-DVN receive slice decoded;
  send ULN, confirmations, optional-DVN policy, executor config unexamined. Decode every
  `EndpointV2.setConfig` for both OApps × both EIDs × both libraries. EXTEND. (Includes the
  directed-pathway matrix: WR4 covered L1 outbound limits only for ETH→OP; OP outbound + an
  earlier L1 inbound for OP→ETH.)
- **A5 (P1) OApp owner and Endpoint delegate changes** — ProxyAdmin ownership ≠ OFT
  ownership ≠ LZ delegate. EXTEND.
- **A6 (P1) Pause/unpause, guardian, RoleRegistry transitions** — decoded `unpauseBridge()`
  but selected no pause candidate; no role-revocation/numeric-role-migration search. EXTEND.
- **A7 (P1) Timelock schedule/execute pairs and timelock-role changes** — one nearby
  scheduleBatch dismissed without systematic pairing. EXTEND.
- Genuinely covered: rate-limit changes (with disclosed OP-inbound gap), one role grant,
  one ProxyAdmin transfer, MultiSend complexity, Sync-Pool-vs-primary distinction.

## B. Missed search angles
- **B1 (P0) Event/emitter-first history** — sender-first misses timelock/module/replaced-
  owner executions; M3 is log-first. EXTEND.
- **B2 (P0) Git history/tags/release-to-deployment mapping** — one commit pinned while
  Candidate 2 itself proves current source ≠ historical ABI. EXTEND.
- **B3 (P1) Exhaustive output/*.json inventory** with per-file exclusion reasons. EXTEND.
- **B4 (P1) Timelock event streams**, not just Safe nonces. EXTEND.
- **B5 (P1) LayerZero Scan-class pathway tooling** (discovery-only). EXTEND.
- **B6 (P1) Complete each directed pathway** (source-send/destination-receive pairs), not
  "outbound on both chains". EXTEND.

## C. Hazards not flagged
- **C1 (P0)** No canonical event identity (chainId, blockHash, txHash, logIndex) obtained
  for any candidate. ACCEPTED GAP gating every recommendation.
- **C2 (P0)** ABI/code epoch unresolved beyond Candidate 2 (1, 3, 4, 5 all assume July
  source describes May implementations; LZ source unpinned). EXTEND feasibility tables.
- **C3 (P1)** LayerZero default-inheritance vs explicit override vs timeout transitions not
  distinguished for before-state. EXTEND.
- **C4 (P1)** Safe initiator/executor semantics collapsed (sender/Safe/signers/MultiSend
  layers are distinct actors). EXTEND.
- **C5 (P1)** OP Bedrock finality/reorg lineage undiscussed. EXTEND.
- **C6 (P1)** eth_getLogs availability, provider caps, gap detection narrower than stated.
  ACCEPTED GAP with per-chain capability checklist.
- **C7 (P2)** Transaction-boundary vs block-end state isolation (later same-block writes).
  ACCEPTED GAP until containing blocks scanned.

## D. Internal consistency
- **D1 (P0)** M3 gate claimed without affected-assertion map or canonical evidence —
  downgrade to "candidate for satisfying". EXTEND.
- **D2 (P0)** 14-seconds-apart mislabeled "causal-edge material" — spec: timestamps are
  navigation-only; causal edges need explicit artifacts. Relabel chronology-only. EXTEND.
- **D3 (P1)** Per-claim provenance ledger missing (exact Safe API URLs/hashes). EXTEND.
- **D4 (P1)** Before/after values overstated for Candidates 2/5 (intended/inferred vs
  observed not separated). EXTEND.
- **D5 (P2)** "One day before the blog post" asserted while the post date is unresolved.
  Remove until resolved. EXTEND.
- **D6 (P2)** Residual OP block-range statement excludes Candidate 5's own block. Correct.
- **D7 (P2)** Candidate 5 names the wrong ABI dependency (ProxyAdmin ABI decodes the call;
  OFT topology explains impact). Correct.

## Bottom line
Numerical charter target met; substantive "reconstructable logs, state, ABI epochs, and
affected assertions" objective not yet. Candidate 1 remains a promising lead, not an
M3-qualified recommendation, until the directed-path matrix, canonical event evidence, ABI
epochs, affected assertions, and causal-edge semantics are added.
