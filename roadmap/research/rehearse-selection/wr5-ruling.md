<!-- DRAFT - rehearsal-master persona ruling, 2026-07-26. PRE-CODEX-REVIEW.
Provenance: opus persona agent (latent space: Tenderly / Foundry / Safe / OZ Defender /
retrospective-replay forensics), first standing assignment on WR5 + fork tooling. The agent
ran LIVE discovery-grade probes (Safe transaction service, public RPC endpoints) labeled
OBSERVED with exact calls; none are deployment evidence. Status: CODEX-REVIEWED 2026-07-26 (review-ms25esga) -- NOT-PROMOTABLE pending corrections; ALL CODEX CORRECTIONS APPLIED 2026-07-26 by the originating persona instances (diff patches), awaiting scoped confirmation pass. The 8->1 headline is not faithful to WR5's text (WR5:434-443 disclosed and set aside); R1 'clean isolation' uses the method this doc itself refutes. MultiSendCallOnly + Tenderly findings CONFIRMED. See codex-review-wave1.md. Original status: awaiting adversarial
review; not promoted. Original headline RETRACTED in the corrections: WR5 made no false
count claim; the defect is missing per-result accounting, and the gate-case selection is drawn
from route-participant rows WR5's set-aside did not reach (see the eight-row ledger). -->

## Rehearsal Master ruling — WR5 Rehearse case selection, fork tooling, and the M4 gate

**Method note.** Every claim is labeled **OBSERVED** (my own probe this session, 2026-07-26, with the exact call), **CANON** (named house: Safe / Foundry / EthereumJS / Tenderly / OP-Stack docs), **REPO** (`path:line`), or **INFERRED**. I ran live discovery-grade probes (Safe transaction service, `ethereum-rpc.publicnode.com`, `mainnet.optimism.io`) because the assignment required verdicts on decode paths and fork recipes that WR5 left unfilled. None of it is deployment evidence and none of it may be promoted to a manifest.

---

## 0. The finding that reorders everything

**WR5's discovery queries have no per-result disposition ledger, so route-participant transactions that its own criteria prefer were left unranked.**

Correction to my first draft, which overstated this: WR5:107 writes "Result **includes** `safeTxHash 0xbf8febbe…`" — it never claims the query returned one row, and WR5:434-443 explicitly discloses that SecurityUpgrade-shaped MultiSend executions were found on the L1 controller Safe, "some directly on the primary L1 OFT Adapter," with a stated reason for setting them aside. **WR5 made no false count claim.** The defect is narrower and structural: no query in the deliverable records its result count or dispositions each result, so a reader cannot tell which rows were weighed and rejected versus never examined. That is exactly the class my §3/#1 fix targets, and it applies to my own draft first — the ledger is below.

**OBSERVED (2026-07-26)** — `GET api.safe.global/tx-service/eth/api/v1/safes/0x2aCA71.../multisig-transactions/?executed=true&to=0x1a44076050125825900e736c501f859c50fE728c&limit=10` returns `count: 8`, complete for that filter. Four of the eight target a `ROUTE-ETH-OP-v1` participant OApp with a single EID; two of those carry eid 30111:

| # | Safe nonce | Tx hash | Block | `_oapp` | `_lib` | eid | Matrix row |
|---|---|---|---|---|---|---|---|
| **R1** | 547 | `0x1a4ba83eb8635a108a4e3db1c6a602858bb7133fe50fd91b9fc2767aa784206b` | 22099914 | `0xcd2eb13D…` **L1 OFT Adapter** | `0xc02Ab410…` ReceiveUln302 | **30111** | **Receive verification (OP→ETH)** |
| **R2** | 546 | `0xb27303aad7429a9d76e3b76718dc0b9a1d0687b1f055d81ba39966c880f43fa1` | 22099706 | `0xcd2eb13D…` **L1 OFT Adapter** | `0xbB2Ea70C…` SendUln302 | **30111** | **Send verification (ETH→OP)** |
| M1 | OP 15 | `0x02207874ffa24a4409ed0714aad5eb467ddaa7adf186c4c3d04a11611e8cc957` | 133508663 (OP) | `0x5A7fACB9…` **OP OFT** | `0x3c4962Ff…` ReceiveUln302 | **30101** | Receive verification (ETH→OP) |
| M2 | OP 14 | `0x359f2b39c37fb6f076a4419902593924bf153b36c9e29d19906b41eaade0bd71` | 133507406 (OP) | `0x5A7fACB9…` **OP OFT** | `0x1322871e…` SendUln302 | **30101** | Send verification (OP→ETH) |

All four executed 2025-03-22 within 45 minutes across both chains — the ETH↔OP weETH route's DVN hardening campaign. `operation: 0`, single direct call, from the pinned controller Safes.

**Eight-row disposition ledger** (L1 controller Safe → LayerZero Endpoint, `executed=true`, count 8, all `operation: 0`):

| nonce | tx hash | block | `_oapp` | eid | disposition |
|---|---|---|---|---|---|
| 714 | `0xe9cf3c7b…` | 24763659 | `0xD789870b` Sync Pool | 30111 | **Rejected** — off the OFT route (WR1:379-386); WR5's candidate A |
| 549 | `0x5cbe5294…` | 22099957 | `0xcd2eb13D` OFT Adapter | 30102 | **Rejected** — route participant, wrong route (BNB) |
| 548 | `0x936cf4e6…` | 22099952 | `0xcd2eb13D` OFT Adapter | 30102 | **Rejected** — same |
| **547** | `0x1a4ba83e…` | 22099914 | `0xcd2eb13D` OFT Adapter | **30111** | **SELECTED — R1** |
| **546** | `0xb27303aa…` | 22099706 | `0xcd2eb13D` OFT Adapter | **30111** | **Runner-up — R2** |
| 541 | `0x027c512d…` | 21955527 | `0xD789870b` Sync Pool | 30362 | **Rejected** — off-route, off-OP |
| 521 | `0x3be0bb70…` | 21523001 | `0xD789870b` Sync Pool | 30214 | **Rejected** — off-route, off-OP |
| 448 | `0x47e3cdd4…` | 20072923 | `0xFE7fe01F…` unidentified | 30280 | **Rejected** — OApp unresolved, off-route |

**Do R1/R2 fall inside WR5's stated set-aside?** No, and the reason matters. WR5:434-443 sets aside the **SecurityUpgrade-shaped MultiSend templates** because "their `setConfig`/rate-limit payloads typically enumerate many remote EIDs in one call… making 'is this specifically the OP direction' a harder claim to isolate than candidates A/D/H's narrowly-scoped calls." R1 and R2 are not members of that class: `operation: 0`, no MultiSend, a single `(eid, configType)` pair, eid 30111 only. They satisfy WR5's *own* stated selection criterion — narrow scope, unambiguous OP direction — **better than candidate A does**, since A is equally narrow but points at the wrong OApp. WR5's rejection reason is sound and I am not overturning it; it simply does not reach R1/R2.

**M1/M2 (OP side) were not set aside — they were never queried.** WR5 §3 filters the OP controller Safe only by `to=0x632304Ed…` (the proxy admin). No OP Safe → Endpoint query appears anywhere in the deliverable, and §9.7's set-aside is scoped to the L1 controller Safe. These are genuinely unsearched, not weighed and rejected.

**Consequence:** all four WR5 candidates are **off the route matrix**. A (`_oapp = 0xD789870b`, L1 Sync Pool) and H (same Sync Pool family) govern the *native-minting sync-pool pathway* — which **REPO** `roadmap/research/WR1/expected-route-policy.md:379-386` explicitly warns is "a different contract pair from the weETH OFT Adapter ↔ OP OFT route… flagged here so a manifest author does not conflate the two," and carries a **materially weaker 2-of-2 DVN policy**. I is off-OP entirely. Only D touches a route participant (the OP OFT's proxy admin). None of A/H/I can produce a non-empty *affected-assertion* set against `ROUTE-ETH-OP-v1` (**REPO** `docs/ENGINEERING_SPEC.md:626-637`), which the M4 exit gate requires (**REPO** `docs/ROADMAP.md`, M4 deliverables: "semantic before/after configuration diff and affected-assertion evaluation").

---

## 1. Verdict per candidate

Format: decode path → fork recipe → predicted-effect classes → expiry → acceptance evidence.

### Candidate A (L1 Sync Pool `setConfig`) — **NOT REHEARSABLE AS POSED**

Three independent disqualifiers, none of which is about archive access:

1. **Off-route.** `_oapp` is the L1 Sync Pool, not a `ROUTE-ETH-OP-v1` node. Affected assertions = ∅ under the only manifest the milestone defines. Rehearsing it produces a semantic diff with nothing to attach it to.
2. **Its decoded value is in live cross-lane conflict.** WR5 §2 says `confirmations: 32, requiredDVNs: 2`. **REPO** `WR1/expected-route-policy.md:381` decodes the same repo artifact as **`confirmations=64`, requiredDVNCount=2** — via programmatic `eth_abi` decode with an independently recomputed selector. WR1 already caught WR5's `0x3f48`/`0x3f480` truncation in the same family. This is the **third** instance of the hex-misread class in this research corpus. A rehearsal whose expected semantic value is itself contested is not an acceptance case.
3. **Envelope not reconstructable as claimed.** WR5's table row asserts "`signatures = <11 sigs already in data>`" against `confirmationsRequired 3` and a declared threshold of 4. Those three numbers cannot all be right. Unresolved.

Not fatal but worth recording: **OBSERVED** its block context is fine (I re-derived neighbours in the same campaign), and the archive dependency is real but generic.

### Candidate D (OP proxy-admin `transferOwnership`) — **REHEARSABLE, CONDITIONALLY**

- **Envelope: confirmed clean.** **OBSERVED** `eth_getTransactionByHash(0x7a2c3041…)` → `to = 0x764682c769ccb119349d92f1b63ee1c03d6aecff` (the Safe itself), selector `0x6a761202` (`execTransaction`), type `0x2`, index 24. WR5 is right here.
- **Decode path:** Safe proxy `0x764682…` → **OBSERVED** 171 code bytes, storage slot 0 = `0x…fb1bffc9d739b8d520daf37df666da4c687191ea` (**CANON** SafeL2 v1.3.0 singleton) → singleton runtime hash → `execTransaction` ABI → inner `ProxyAdmin.transferOwnership(address)` decoded against `0x632304Ed…` resolved `direct`.
- **Fork recipe:** fork OP block 139705021, replay indices 0-23 of 139705022 **including the index-0 type-`0x7E` L1-attributes deposit transaction**, then execute. See §4 — this is the constraint that eliminates two of three engines.
- **Predicted effects:** `ProxyAdmin.owner()` slot transition Safe → L2 timelock; one `OwnershipTransferred` log; Safe nonce +1. Class: *authority transfer*, no value movement, no route-config write.
- **Route relevance:** upgrade authority over a route participant's implementation — maps to the **Identity** and **Control plane** rows, but only if the reviewed manifest declares proxy-admin ownership as an expected control-plane value. It currently does not exist to declare it.
- **Expiry:** none by clock (retrospective); invalidated only by loss of block canonicality or an engine/hardfork-ruleset change. The withdrawn "permanently prevents bypass" claim must stay withdrawn — one `transferOwnership` observation cannot establish that no other upgrade path exists.

**Conditional on:** an OP-Stack-capable engine; and on the fact that D's cheapness (24-tx prefix) is real but was measured with a method that does not work (§2, isolation).

### Candidate H (Safe-MultiSend of 4 timelock `execute`s) — **NOT REHEARSABLE AS POSED**

- **Off-route** (Sync Pool pathway) — same disqualifier as A.
- **Named contract is wrong, and the error is security-material.** **OBSERVED** (safe-global/safe-deployments, v1.3.0 assets): `0x40A2aCCbd92BCA938b02010E17A5b8929b49130D` is **MultiSendCallOnly**; `MultiSend` v1.3.0 is `0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761`. WR5 §4 calls the former "canonical Safe MultiSend v1.3.0". These are different contracts with different security semantics: **CANON** MultiSendCallOnly reverts on any sub-operation with `operation != 0`, i.e. the batch is *structurally incapable* of containing a nested delegatecall. That is a stronger, better claim than WR5 makes — and the fact that it was reached by name rather than by code identity is precisely the interface-level-trust failure `docs/ENGINEERING_SPEC.md:711-713` exists to prevent.
- **First inner call still undecoded.** WR5 §4 ships an unresolved authoring artifact in the deliverable: `setPeer(30111 /* wait — decoded target arg is a different address per call; see below */)`. Of the four selectors listed, only `0x3400288b` is `setPeer(uint32,bytes32)` (**CANON** LayerZero `OAppCore`); `0xf3820f27`, `0x09f37812`, `0x86dc6e9a` are unidentified. Three `setPeer` calls carrying the *same* eid `30111` on the same contract would be mutually contradictory — so WR5's own prose is internally inconsistent.
- **Timelock readiness precondition** remains unverified at parent state, as the critic said.

### Candidate I (native `executeBatch`) — **NOT REHEARSABLE AS POSED.** Off-route by WR5's own admission, largest prefix, no paired schedule, no per-clause table. Bonus only. Concur with critic.

### Candidates R1 / R2 (new) — **REHEARSABLE**

**R1 — L1 controller Safe → Endpoint `setConfig(L1 OFT Adapter, ReceiveUln302, [(30111, ULN)])`**

- **Decode path (three code identities, in order):**
  1. `0x2aCA71…` — **OBSERVED** 171 code bytes, slot 0 = `0x…d9db270c1b5e3bd161e8c8503c55ceabee709552` (**CANON** Safe v1.3.0 singleton), EIP-1967 impl slot **empty**. → requires a **new identity strategy** (§5, G1). Singleton runtime hash → `execTransaction` ABI.
  2. `0x1a4407…` LayerZero EndpointV2 — **OBSERVED** 24 005 code bytes, EIP-1967 slot empty → `direct` strategy, existing support. → `setConfig(address,address,(uint32,uint32,bytes)[])`.
  3. `0xc02Ab410…` ReceiveUln302 — **OBSERVED** 11 010 bytes, `direct`. → `UlnConfig` struct decode of the inner `config` bytes.
  Note `0xcd2eb13D…` (the L1 OFT Adapter, the config *subject*) is **OBSERVED** an EIP-1967 proxy → impl `0xa82cc578927058af14fd84d96a817dc85ac4f946`, matching **REPO** `WR2/authority-map.md:53`'s declared new implementation. Existing `eip1967` strategy covers it.
- **Fork recipe:** **OBSERVED** target block 22099914, hash `0xdc9464f870b008f1094ba7c0644a52e63e68e9437229c91d468a0300cbeb3f68`, parent `0x32f339b394a53d120f88ab3a1f53fc84e2936aec7e97654505aafa3cfee5568a`, `timestamp 0x67de36c7`, `baseFeePerGas 0x1a18aae7`, `gasLimit 0x2243e5b`, **198 transactions, target at index 52** → 52-tx prefix. Type `0x2` envelope, `from 0x5fd4b71c0e46ffb377ef6111459d0fb1c968395e`, 1 316 bytes calldata.
  **Disclosed overrides: none required.** Block environment is *reconstructed from the pinned header*, not overridden — a distinction the report schema must make structural (§4, criterion 2).
- **Predicted-effect classes:** one ULN-config storage write on ReceiveUln302 keyed `(oapp, srcEid=30111)`; Safe nonce +1; gas/fee debit on the relayer EOA. The high-value semantic question — **inherited-default → explicit configuration** — is exactly `docs/THREAT_MODEL.md:182` adversarial test #15 run forwards, and must be established by reading the effective config at the *parent* state, never assumed.
- **Isolation: `unknown`, pending trace/state-diff.** I applied the same top-level `to`-scan my own §2 refutes, so it cannot support an isolation verdict: an internal call or delegatecall from any later transaction could reach the ULN config slots without appearing as a top-level `to`. **OBSERVED** full-block scan of all 198 top-level `to` values against {Endpoint, OFT Adapter, controller Safe, SendUln302, ReceiveUln302} returned the target as the only match. The surviving property is weaker and worth stating exactly: **no later top-level transaction in the block calls any watched contract directly.** That is a screening result, not the evidence `ENGINEERING_SPEC.md:703-706` requires — which is a trace/state diff, or a block-end checkpoint plus proof that no later transaction touched the affected state. Until one of those lands, R1's actual-effect comparison is `indeterminate` and cannot pass the gate.
- **Expiry:** retrospective regime (§3, C-new).
- **Acceptance-evidence shape:** see §4 "harness self-proof". Actual-effect side: **OBSERVED** receipt `status 0x1`, `gasUsed 0x215da`, 2 logs — ULN config event `0x82118522aa536ac0e96cc5c689407ae42b89d592aa133890a01f1509842f5081` on `0xc02Ab410…` and Safe `ExecutionSuccess` `0x442e715f…`. **I have deliberately not decoded the log payload**: the moment a research file records the post-state values, the prediction path is contaminated and `ENGINEERING_SPEC.md:701` ("exclude receipts, emitted events, post-state values… from all prediction inputs") becomes unenforceable. WR5 already breached this for candidate A by publishing its decoded effect. Treat that as a standing rule for round 2.

**R2 — same Safe → `setConfig(L1 OFT Adapter, SendUln302, [(30111, ULN)])`**, block 22099706 (`0x609d97cc…`, parent `0x7a92e5d6…`, ts `0x67de2cfb`, baseFee `0x17bc6efb`, 122 txs, **index 47**). **OBSERVED** two transactions at indices 36 and 37 call ReceiveUln302 at top level — a different contract from the one R2 writes, and both in the prefix rather than after the target. Isolation is `unknown` on the same grounds as R1; the surviving screening property is that no *later* top-level transaction calls a watched contract. R2 additionally requires the storage-slot diff to show the indices-36/37 calls did not touch the slots R2's prediction reads at parent state. Equally rehearsable; slightly noisier block.

**M1 / M2 (OP mirrors) — REHEARSABLE ONLY WITH AN OP-AWARE ENGINE, AND THE ENVELOPE IS NOT WHAT WR5 ASSUMES.**
**OBSERVED**: M1's top-level `to` is **`0xf9d64d54d32ee2bdceaabfa60c4c438e224427d0`, not the Safe** — selector `0xad718d2a`, 1 468 code bytes, storage slot 0 = zero (so not a Safe proxy: an unresolved relayer/module contract). Two different relayer EOAs across M1/M2. This is critic item #12 ("module/relayed execution shapes unsearched") observed in the wild: WR5's blanket claim that Safe execution is "an arbitrary relayer EOA carrying pre-collected signatures" is false for the OP side of this very route. Envelope reconstruction requires code-identity-resolving `0xf9d64d54…` first.

---

## 2. Ranked selection

### THE case for M4's gate: **R1** — L1 controller Safe → Endpoint `setConfig(L1 OFT Adapter, ReceiveUln302, eid 30111)`, tx `0x1a4ba83e…`, block 22099914, index 52

R1 is the selection **conditional on one unmet precondition**: a trace or state-diff proof that no later transaction in block 22099914 touched the ULN config slots the prediction claims. Until that evidence exists, R1's retrospective result is `indeterminate` by `ENGINEERING_SPEC.md:706` and cannot pass the M4 gate — no candidate can, and no candidate is disadvantaged relative to R1 by this. Subject to that, why it wins on every axis the gate scores:

- **It is the only class of candidate that produces a non-empty affected-assertion set.** It writes the ULN configuration that decides which DVN set must attest before an inbound OP→ETH message can release locked weETH on Ethereum. That is `ROUTE-ETH-OP-v1` **Receive verification**, the single highest-consequence cell in the matrix.
- **Ethereum, not OP** — avoids type-`0x7E` deposit replay, which currently disqualifies two of three engines (§4).
- **Direct `execTransaction` envelope**, single call, `operation: 0`, no MultiSend layer, no timelock-readiness precondition.
- **52-tx prefix, independently re-derived rather than inherited.** Isolation is *not* a selection advantage — it is `unknown` for every candidate in the pool, R1 included, because no trace or state diff has been run against any of them.
- **It exercises every architectural primitive M4 names**: Safe-proxy identity resolution (a genuine gap it will force closed), code-identity-scoped ABI selection across three contracts, nested calldata decode, stateful pinned execution, semantic config diff, affected-assertion re-run, and the receipt-excluded prediction discipline.
- **It has product value beyond the demo.** WR1's open conflict C2 (which rate-limit/DVN policy was actually effective when) is the kind of question this transaction class answers.

**Runner-up: R2** (send-side mirror, block 22099706). Same everything, one row over, noisier block. If R1's parent state turns out not to be an inherited default — making the diff boring — R2 is the immediate substitute. Keep both; they are the same implementation.

**OP-side second fixture (not the gate): M1**, after §4's S6 spike passes. **Candidate D** remains a legitimate OP fixture and is now the *simplest* OP envelope in the pool (**OBSERVED** direct `execTransaction`, unlike M1/M2) — promote it above M1 for the OP fixture unless the manifest gains a proxy-admin-ownership control-plane assertion.

**Highest-value open lead — L-30.** **OBSERVED** OP Safe nonce 30, `0xfe64aac14d7604bde6887c3291c40a53529a982ee9d85c676e3cb44027727811`, block 152192876, 2026-05-28T16:08:49Z, `operation 0`, target = the **OP OFT itself**, selector `0xe96e38e2`, 1 024 bytes of calldata, and **the Safe transaction service cannot decode it** (`dataDecoded.method: "fallback"`). It executed **14 seconds after** L1 nonce 772 (`setOutboundRateLimits`, 8 EIDs, block 25194944) — a coordinated cross-chain campaign. An action on a route participant that the Safe UI renders as an opaque `fallback`, which Aegis decodes correctly because it binds the ABI to the verified execution-epoch implementation, is the single most persuasive Rehearse demo available. It is a lead, not a candidate: I have not established its semantics or the OP OFT's implementation at that height.

**Disqualifying findings, consolidated**

| Finding | Bearing |
|---|---|
| No discovery query records its result count or dispositions each result | Cannot distinguish "weighed and rejected" from "never examined"; two eid-30111 route-participant executions went unranked |
| A/H/I are on the sync-pool pathway, not the OFT route | No affected assertions → cannot satisfy the M4 gate |
| WR5 `confirmations: 32` vs WR1 `confirmations=64`, same artifact | Contested expected value; third hex-misread in the corpus |
| `0x40A2aCCb…` is MultiSendCallOnly, not MultiSend | Contract named by label, not identity — the failure the spec forbids |
| H's inner batch is undecoded, with an editing artifact in the deliverable | Batch-decode clause unproven |
| Top-level `to`-scan isolation is unsound (proof below) | Every isolation verdict in WR5 is method-limited |
| OP-side executions are relayed through `0xf9d64d54…` | "Sender semantics reproducible" is false as written for OP |

**Proof that the isolation method is unsound (OBSERVED, not argued):** for OP block 133508663 I scanned all 35 top-level `to` values against {Endpoint, OP OFT, OP Safe, both OP ULN libs} and got **zero hits** — even though the target transaction *in that block* writes ULN config on `0x3c4962Ff…`, confirmed by its own receipt log. A scan that cannot see the target it is scanning for cannot establish that no *later* transaction reached the same state internally. Critic item #4 is not merely "overstated"; it is refuted.

---

## 3. Completeness critique, item by item

| # | Critic finding | Status |
|---|---|---|
| 1 | Timelock hex truncation (`0x3f480` = 259 200 s) | **Answered, and worse than reported.** Correction applied in WR5's disposition. But **OBSERVED via WR1:1381** the same class recurs in candidate A's `confirmations` (32 vs 64) and is *not* dispositioned. Three strikes. Recommend a mechanical check: every numeric decoded from calldata must be produced by a decoder that consumes the full 32-byte word, with a test that fails on a truncated-literal fixture. |
| 2 | Prefix replayability not established | **Open, now costed.** §4 gives the primitive and S1/S2 prove it. Counts remain counts. |
| 3 | Complete-envelope clause underfilled | **Partly answered.** I inventoried tx type (`0x2`), index, `from`, `to`, calldata length, block env (ts/baseFee/gasLimit) for R1/R2/D/M1. Still missing: outer nonce, gas/fee fields, access lists, signature fields, raw signed bytes, and the Safe-internal signature-mode breakdown. **The `11 signatures / threshold 4 / confirmationsRequired 3` contradiction in candidate A is unresolved.** |
| 4 | Isolation overstated | **Answered and escalated** — refuted by observation (above). Downgrade every isolation verdict to `unknown pending trace/state-diff`; note that for R1 the weaker top-level property still holds and no later tx touches the watched set. |
| 5 | No execution-epoch code identity / ABI binding | **Answered structurally, open empirically.** I mapped the strategy per contract (Safe = slot-0 singleton, unsupported; OFT Adapter = EIP-1967; Endpoint/ULNs/Timelock/MultiSendCallOnly = direct) — **at `latest`, not at execution height**. Re-binding at the target block is mandatory and untouched. |
| 6 | Safe sender semantics more complex than claimed | **Answered — the claim is false for OP.** Relayed execution observed. Guard/fallback/module state and EIP-1271/approved-hash modes still uninventoried on both chains. |
| 7 | OP timelock execution stream never searched; pool must not be a closed 4-address universe | **Open.** The OP timelock stream remains unsearched, and §0 shows the OP controller Safe was never queried against the Endpoint either. On the L1 side the gap is accounting, not recall: WR5:434-443 disclosed OFT-Adapter-targeting executions but ranked none of them. |
| 8 | Block environment reduced to 3 fields; no OP replay analysis | **Answered.** Env captured for R1/R2. OP replay analysed in §4: **OBSERVED** block 133508663 tx types `{0x7E ×1 at index 0 → L1Block predeploy 0x42…15 from 0xdead…0001, 0x2 ×17, 0x0 ×17}`. |
| 9 | Timelock operation identity / readiness / predecessor | **Open** — and moot for R1, which has no timelock layer. This is an argument for R1. |
| 10 | No candidate mapped to a manifest or canonical assertion | **Answered — this was the decisive finding.** R1/R2/M1/M2 map to named matrix rows. Residual: `ROUTE-ETH-OP-v1` **does not exist yet** (`roadmap/ROADMAP.md`: "⬜ Ethereum/OP directed-route manifest"), so M4's affected-assertion output is blocked on M2. |
| 11 | "No public unsigned proposal exists" overclaimed | **Answered — a candidate class exists.** **OBSERVED** L1 Safe nonce 824, block 25611627, **2026-07-25**, a MultiSend containing `scheduleBatch` on `0xcD425f44…`. Scheduled-but-unexecuted timelock operations are public, pending, and rehearsable *prospectively* — the exact class WR5 declared empty. Off-route in this instance; the search recipe is in §5, G7. |
| 12 | Module / non-standard execution shapes unsearched | **Answered by observation** — relayed OP executions through `0xf9d64d54…`; and `to=<target>` filters structurally miss every MultiSend-wrapped route action (**OBSERVED** the L1 Safe has **147** executed MultiSend batches). |
| 13 | One archive probe generalised to all chains | **Answered.** **OBSERVED** `mainnet.optimism.io` served `eth_getBalance` at OP block 133508663 (2025-03) — free OP archive reads work at candidate depth. PublicNode ETH archive now fails with **HTTP 403**, not the JSON-RPC `-32602` WR5 recorded; `debug_traceTransaction` still `-32601`. WR5's §0 conclusion holds directionally; its quoted evidence is already stale. |
| 14 | Internal contradictions | **Answered/extended:** MultiSend↔MultiSendCallOnly; H's editing artifact; the 11-sigs/threshold-4 arithmetic; and the pool is described as four authorities while H/I arrive via a fifth Safe. |
| 15 | Provenance rows non-reproducible | **Answered by failure.** **OBSERVED** every `safe-transaction-mainnet.safe.global` URL in WR5 now returns **308 → `api.safe.global/tx-service/eth/…`**. WR5's provenance register is already partially dead four days after authoring. Content-address responses or the register is decorative. |
| 16 | ACCEPTED GAP — route-bounded census | **Accepted, with a correction:** the census was not merely route-bounded, it was *incomplete within its own bounds*. |
| 17 | ACCEPTED GAP — stateful simulation + provider quorum are M4 gates | **Accepted**, and §4 turns it into a costed plan. |

---

## 4. Fork-simulation tooling evaluation

Criteria in the order given. Three families assessed: **anvil** (external process), **in-process EVM** (EthereumJS v10, pure JS; EDR 0.14.2, revm/napi), **Tenderly** (hosted).

### The two constraints that decide it

**OBSERVED** `package.json`: dependencies are `next`, `react`, `react-dom`, `zod`. **There is no EVM, no ABI codec, no chain client in this repo.** Every option is a new-dependency decision — owner territory under `CLAUDE.md` autonomy rules, not mine.

**OBSERVED** `vite.config.ts` + `worker/index.ts` + `@cloudflare/vite-plugin` + `nodejs_compat`: the deployed surface is a **Cloudflare Worker**. No child processes, no native binaries, bounded CPU. **Ruling: the fork engine cannot live in the request path on any option.** M4's retrospective rehearsal must be produced by a Node CLI (the spec already anticipates it — `docs/ENGINEERING_SPEC.md:892`, `aegis preflight safe-batch.json --fork-block …`) and served as a content-addressed recorded artifact. This is not a compromise: `lib/aegis/chain/adapter.ts` already implements exactly that model, with per-response `rawResponseSha256` + `envelopeSha256` integrity and EIP-1898 `{blockHash, requireCanonical: true}` pinning. Corollary: the spec's "preflight without trace: p95 under 10 s" SLO (`ENGINEERING_SPEC.md:1010`) does not and should not apply to `retrospective_rehearsal`.

### 1 — Determinism under pinned state

- **EthereumJS v10.1.2** — **strongest.** **CANON** `RPCStateManager` accepts `blockTag` as a block number or `'earliest'` **only**; `'latest'`/`'pending'` are unsupported. Pinning is structural, not a discipline you can forget. Hardfork ruleset is an explicit `Common` input; Cancun/Prague/Osaka supported, Amsterdam experimental.
- **EDR 0.14.2** — strong. `ForkConfig.blockNumber` pins; but it is a JSON-RPC provider that mines its own blocks, so block environment must be re-imposed per call.
- **anvil** — **weak.** It mines a *new* block for your transaction with its own timestamp/basefee unless every field is overridden; state is lazily fetched and cached. Worse, **CANON/OBSERVED** `--fork-transaction-hash` is documented as "fetch state from **after** a specific transaction hash has been applied" — so the prefix-replay trick is "fork at the hash of index *N−1*", and foundry-rs/foundry#12798 reports it **silently returning `--fork-block-number` behaviour on Base**, closed as not planned. A silently wrong prefix is the worst failure mode this product can have.
- **Tenderly** — **weakest.** **CANON** no page discloses the EVM client, version, or fork ruleset. `eth_simulateV1` docs: the auto-generated timestamp is the node's **wall-clock time**, and overridden numbers/timestamps are applied verbatim without monotonicity validation. Default behaviour is non-reproducible.

### 2 — State-override disclosure

The requirement is stronger than "we log our overrides": **the executor must be constructed from the same boundary object the report publishes**, so an undisclosed override is unrepresentable. Undisclosed override = fabricated evidence.

- **EthereumJS** — **structurally satisfiable.** You own the `StateManager`; there is no side channel. A test can assert the engine exposes no mutation path outside the declared list, and that a non-empty list is inside the report hash.
- **EDR** — satisfiable with discipline; the provider exposes `hardhat_*`-class mutators over the same channel as reads.
- **anvil** — **not structurally satisfiable.** `anvil_setStorageAt`/`anvil_impersonateAccount`/`--auto-impersonate` are reachable by anything that can reach the port; and **CANON** its default posture unlocks accounts. Disclosure becomes an honour system.
- **Tenderly** — mixed and ultimately disqualifying. The REST API **does** echo an applied `state_overrides` block (genuinely good). But **CANON** `eth_simulateV1` "always runs in **non-validating mode**: nonce, balance, and fee requirements are not enforced." That is a permanent override of *validity semantics* that cannot be disclosed as an override because it is not one — it is the engine. A Tenderly "simulation succeeded" does not establish that the transaction is even includable. Rendering that as a Rehearse result would be the anti-canon in its purest form.

### 3 — Transaction-prefix replay

- **EthereumJS — best, and it is the only path where the prefix is *self-auditing*.** **CANON** `createBlockFromJSONRPCProvider` / `createTxFromRPC` reconstruct each prefix transaction from `eth_getBlockByNumber(..., true)`, and `getSenderAddress()` **ecrecovers** the sender rather than trusting the RPC's asserted `from`. Recompute the tx hash from your serialisation and assert equality with the RPC `hash` — one check that catches every lossy-field hazard. Known hazards to handle: `normalizeTxParams` handles `v/r/s` but **not `yParity`**; `JSONRPCTx` does not list `authorizationList`, so a type-`0x4` transaction may silently replay with an empty authorization list. Both are caught by the hash check.
- **EDR** — workable via `serialize()` → `eth_sendRawTransaction`, but there is no documented "replay up to index" primitive and the provider re-validates.
- **anvil** — one turnkey flag, broken on OP-Stack.
- **Tenderly** — **the capability exists only on the wrong endpoint.** `transaction_index` is a **REST** Simulation-API parameter; neither `tenderly_simulateTransaction` nor `tenderly_simulateBundle` nor `eth_simulateV1` has any index parameter. The REST path is also the *persisted* path (§4 privacy).

### 4 — Licensing / operability for an open verification tool

- **EthereumJS: MPL-2.0**, file-level copyleft. Consuming unmodified is unencumbered. *Modifying* their files (which OP support would require) obliges publication of those files — which is a reason to send OP elsewhere, not a blocker.
- **EDR: MIT** (`NomicFoundation/edr/LICENSE`), Hardhat 3 MIT. **No BUSL anywhere** as of 2026-07. Two operability caveats: `hardhat@3.11.1` declares the non-SPDX `"SEE LICENSE IN LICENSE"` (will trip SBOM scanners), and the maintainers' own `edr_napi/README.md` still says *"EDR is only meant to be consumed from Hardhat."* 0.x, no standalone docs.
- **anvil: MIT/Apache-2.0.** Clean licence, external binary.
- **Tenderly: DISQUALIFYING.** **CANON** ToS §1.1 licences the platform "for **Your personal use and not for the benefit of any other person or entity**"; §1.4(iv) bars use "for the benefit of any person or entity other than for Your benefit"; §1.4(vi) bars publishing "any evaluation of the Tenderly Platform" without written consent. Aegis's entire purpose is running simulations on behalf of third parties and publishing the results — and publishing accuracy comparisons about the simulator. Additionally: the Free plan is **UI-only, no API access**, Node RPC is paid-only, `tenderly_simulateTransaction` costs **400 TU** (100× an `eth_call`), the simulation engine is closed-source with reverse-engineering barred, and **no third party can re-execute a result** — a share link is a read-only view of a stored artifact, and sharing requires `save: true`, which conflicts with the privacy posture `docs/THREAT_MODEL.md:156-162` requires.

### 5 — Integration cost with this Node/TS stack

- **EthereumJS** — pure-JS, no native binary, browser-targeted in v10 (Workers support **undocumented — probe**). Highest per-block RPC cost: docs warn recent mainnet blocks generate *thousands* of requests; a 52-tx prefix under lazy `eth_getProof`/`eth_getStorageAt` fetching is the dominant budget item against WR3's provider matrix.
- **EDR** — prebuilt napi per platform, `engines: node >= 22`. **`x86_64-pc-windows-msvc` yes; `win32-arm64` no**; no Workers, no Deno.
- **anvil** — external process, CI/dev friction, no npm story.
- **Tenderly** — trivial integration, everything else disqualifying.

### Ranked recommendation

1. **EthereumJS v10 (`@ethereumjs/vm` + `RPCStateManager` + `createBlockFromJSONRPCProvider`) as the L1 engine of record.** Wins criteria 1, 2, 3 outright; acceptable on 4 and 5.
2. **EDR 0.14.2 as (a) the mandatory OP engine and (b) a differential cross-check on L1.** It is the *only* credible in-process path with real OP-Stack modelling: **CANON** `OP_CHAIN_TYPE`, `opProviderFactory`, `OpHardfork` (Bedrock→Isthmus), Superchain-Registry chain params, functional `L1Block`/`GasPriceOracle` predeploys, and L1-fee receipt fields. Two engines disagreeing must yield `conflict`, never a coin flip.
3. **anvil — developer tool and out-of-band third opinion on L1 only.** Never the engine of record.
4. **Tenderly — rejected as an evidence path.** Permitted only as an owner-keyed corroborating second opinion recorded as a third-party derived observation, and only if the ToS conflict is resolved in writing. It must never be the source of a published post-state.

**Disqualifying finding per rejected option**

| Option | Disqualifier |
|---|---|
| Tenderly as evidence path | ToS §1.1/§1.4(iv)/(vi); undisclosed EVM version; permanent non-validating mode; no third-party re-execution; no API on Free |
| anvil as engine of record | `--fork-transaction-hash` silently degrades to `--fork-block-number` on OP-Stack (foundry#12798, closed not-planned); wide undisclosed-override surface; mines its own block; external process |
| EthereumJS as *sole* engine | No type-`0x7E`, no L1-attributes system tx, no L1 data fee, no OP predeploys → cannot replay any OP prefix |
| EDR as *sole* engine | 0.x with an explicit "Hardhat-only" maintainer stance, no standalone docs, native binary (no Workers, no win-arm64) |
| `@nomicfoundation/ethereumjs-vm`, `@nomicfoundation/evm`, `evmc`, `js-revm` | Stale 2.5-7 years / abandoned / toy. Do not use. |

### What the P4 spike must demonstrate before commitment

- **S1 — Harness self-proof on a *control* block (blind-safe).** Replay **all** transactions of a mainnet block from its parent state; assert per-tx `status`, `gasUsed`, and logs equal the canonical receipts, and that the computed **receipts root and logsBloom equal the header's**. Negative test: perturb one transaction's gas and prove the check fails. *(Full state-root equality is not achievable on any fork — **CANON** `RPCStateManager` "cannot compute valid state roots" without the full trie. The receipts root is the achievable rigorous check and it is sufficient.)* Run this on a block **unrelated to the target** so no target evidence enters the prediction path.
- **S2 — Prefix replay to index − 1** at block 22099914, with tx-hash equality asserted for every reconstructed prefix transaction (catches `yParity`, `authorizationList`, pre-EIP-155 recovery).
- **S3 — Zero-override proof.** The executor is constructed *from* the boundary object the report publishes; a test asserts no reachable mutation path outside the declared list, and that the override list is inside the report hash. `overrides: []` must be a first-class, hashed claim — not an omission.
- **S4 — `safe_proxy_slot0` identity strategy** end-to-end: `0x2aCA71…` → slot-0 singleton → sha256(singleton runtime **at block 22099914**) → registry → `execTransaction` decode → inner `setConfig` decode against the Endpoint's own execution-epoch identity. Negative test: an unregistered hash must yield `refused`/`unknown` with **no** decode, per `lib/aegis/identity/abi.ts:44-66`.
- **S5 — Differential.** Same target on both engines; byte-equal predicted post-state on the touched slots, or `conflict`.
- **S6 — OP gate.** EDR replays OP block 133508663 including the index-0 type-`0x7E` deposit and reproduces the canonical receipts root. **CANON** deposit handling is *undocumented* in EDR's public surface — if S6 fails, every OP candidate becomes `unknown` and the M4 case is L1-only. Note the deposit transaction carries **no signature**: its sender is *asserted, never recovered*, on any stack. That is a permanent, disclosable boundary limitation of every OP retrospective.
- **S7 — Budget.** Measure RPC call count and wall time for the 52-tx prefix against the WR3 pair (Alchemy + QuickNode). Expect this to blow the 10-second p95 by orders of magnitude — which is the evidence for declaring `retrospective_rehearsal` an offline CLI artifact.

---

## 5. Gaps and closing recipes

| ID | Gap | Closing recipe |
|---|---|---|
| **G1** | **No identity strategy resolves a Safe.** **OBSERVED** `0x2aCA71…`/`0xcdd57D11…`/`0x764682…` are all 171-byte proxies with the singleton at **storage slot 0** and an **empty** EIP-1967 slot. `lib/aegis/identity/resolve.ts:59-60` supports `direct | eip1967 | beacon | eip1167_clone` only; `direct` would hash the proxy stub — a *version* fingerprint whose ABI has no `execTransaction`. **Every candidate in the pool is blocked on this.** | Add `safe_proxy_slot0` to `resolve.ts` (read slot 0, mask low 20 bytes, require code, terminal-hash the singleton), plus registry entries for Safe v1.3.0 `0xd9Db270c…` and SafeL2 v1.3.0 `0xfb1bffC9…`. Negative test: a slot-0 word that is not an address must yield `unknown`, never a guess. |
| **G2** | **The ABI registry selects but cannot decode.** `lib/aegis/identity/abi.ts` maps runtime hash → an `abiId` **string**; there is no ABI content and no decoder anywhere in `lib/`. `package.json` has no ABI codec. | Owner decision (new dependency — `viem`/`ox`/`abitype`, or hand-rolled). Then a content-addressed ABI corpus keyed by the same sha256 the registry already uses, with the ABI bytes hashed into the report. |
| **G3** | **No `ROUTE-ETH-OP-v1` manifest exists** (`roadmap/ROADMAP.md`: ⬜). Without it there is nothing for "affected assertions" to evaluate. | M2 dependency; M4 cannot close first. |
| **G4** | **Manifest applicability at a historical boundary.** R1 executed 2025-03-22; a manifest authored from the 2026-07 pinned commit is an anachronism there. | The retrospective must select a manifest version whose applicability window covers block 22099914, or report affected assertions as `not_applicable`/`unknown` with the reason. Never silently apply today's policy to yesterday's state. |
| **G5** | **Unidentified selectors** in candidate H (`0xf3820f27`, `0x09f37812`, `0x86dc6e9a`) and lead L-30 (`0xe96e38e2`). | Resolve the target's implementation **at execution height**, fetch verified source for *that* implementation, derive selectors from its ABI. 4byte-directory is discovery-only and must be quarantined like an explorer label. |
| **G6** | **Unresolved OP relayer `0xf9d64d54…`** (selector `0xad718d2a`, 1 468 code bytes, slot 0 = 0). Blocks OP envelope reconstruction for M1/M2. | Code-identity-resolve it, obtain verified source, decode `0xad718d2a`, and record whether it is a Safe module, a Zodiac-class executor, or a sponsored-relay contract — the answer changes what "sender semantics" means. |
| **G7** | **Prospective-candidate class never searched.** **OBSERVED** L1 Safe nonce 824 (2026-07-25) contains `scheduleBatch` — a scheduled, unexecuted timelock operation. | Standing query: for each pinned timelock, enumerate `CallScheduled` events, subtract `CallExecuted`/`Cancelled`, and keep operations whose `readyAt` has not passed or whose `execute` has not landed. Those are genuine `public_unsigned_proposal` artifacts. Re-run on a schedule; the empty-queue claim is point-in-time. |
| **G8** | **Discovery method misses batched actions.** A `to=<target>` filter cannot see MultiSend-wrapped route actions; **OBSERVED** the L1 Safe has **147** executed MultiSend batches. WR5:434-443 already located this class (citing blocks 24924948 and 23879335, "some directly on the primary L1 OFT Adapter") and correctly parked it as broader-blast-radius follow-on work. I concur it is the wrong *first* fixture and disagree only on why: multi-EID payloads make the semantic diff richer, not harder — showing eid 30111 move among ~30 rows is the blast-radius surface. It is the ideal **batch-structure** fixture once R1 proves the simple path. | Enumerate all 147 MultiSend executions, decode each inner call's `to`, and select those whose inner targets intersect {L1 OFT Adapter, Endpoint}. Complement with an **event-first** search: `UlnConfigSet` / `PeerSet` / rate-limit events on the route contracts, then walk back to the transaction. Event-first is order-independent and immune to both the `to`-filter and the relayed-execution blind spots. |
| **G9** | **Provenance already rotting.** **OBSERVED** every `safe-transaction-*.safe.global` URL in WR5 now 308-redirects to `api.safe.global/tx-service/{eth,oeth}/…`; PublicNode's archive refusal changed from JSON-RPC `-32602` to HTTP `403`. | Content-address every response (WR3 §6 already prescribes this) and record the *effective* URL after redirects. An un-hashed URL is a citation, not evidence. |
| **G10** | **Archive/trace still unprovisioned.** **OBSERVED** PublicNode ETH archive = 403; `debug_traceTransaction` = `-32601`. **OBSERVED** `mainnet.optimism.io` *does* serve archive `eth_getBalance` at OP block 133508663. | WR3 pair 1 (Alchemy + QuickNode) with paid trace tiers; run WR3 §6.3/§6.4 probes **per chain, per candidate height**, not once on L1. |
| **G11** | **Prediction-input contamination in the research record.** WR5 §2 publishes candidate A's decoded post-state effect; my own §1 records R1's receipt log topics. | Round 2 must split every candidate file into an *inputs* section (envelope, block env, calldata, parent-state reads) and a sealed *actual-effects* section, and the implementation must read the second only after the prediction hash is committed. |

**Capture requests for the caller** (I do not write repo files): four items warrant control-plane objects — an insight on *discovery-query recall failure with a machine check* (extends INS-003; the check is "a discovery query's `count` must be recorded and every result dispositioned"); an insight on *the hex/word truncation class, third occurrence*, with the full-word-decoder test as its teeth; a decision on *the fork engine pair and the CLI-produces-artifact architecture*; and a risk on *`ROUTE-ETH-OP-v1` manifest absence blocking the M4 affected-assertion clause*.

---

## 6. The boundary language this case must ship with

For R1, the honest artifact reads approximately:

> **Retrospective rehearsal.** Aegis forked Ethereum block 22099913 (`0x32f339b3…`), replayed transactions 0-51 of block 22099914 (`0xdc9464f8…`) in canonical order, and executed transaction index 52 (`0x1a4ba83e…`, `from 0x5fd4b71c…`, `to 0x2aCA71…`, 1 316 bytes calldata, value 0) against the resulting state. Block environment was reconstructed from the pinned header; **no state overrides were applied**. Engine: `<name>@<version>`, hardfork `<X>`. Prediction hashed `<sha256>` before any receipt was read.
>
> **Excluded, not modelled:** the signers' reasoning; whether this configuration is correct; every other route and EID; anything after block 22099914; and what this contract's configuration is today. This is a claim about one counterfactual at one pinned boundary, reproducible only under the stated engine and ruleset — not a statement about the transaction's safety, and not a statement about the present.

**Expiry has two regimes and the product must not conflate them.** A `public_unsigned_proposal` expires: on wall clock, and immediately on any intervening write to any slot the prediction read. A `retrospective_rehearsal` has **no clock** — it is invalidated only by loss of block canonicality or by a change of engine/hardfork ruleset. It is a **reproduction contract**, not a freshness window. The dangerous failure is showing a retrospective without expiry and letting a reader generalise it to "this is what this transaction would do today." Say the year.

The word `safe` does not appear in any wording, in any voice, ever.
