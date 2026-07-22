# WR5 — Rehearse acceptance-case candidates (retrospective Safe/timelock execution)

Research lane: WR5. Evidence target: Correct (research rationale informing hiring-ready-gate
case selection; not deployment evidence, not a manifest, not a signed acceptance artifact).
Retrieval date for every web/API/RPC claim below: **2026-07-22** (single research session)
unless a different date is stated on the claim itself. Chains in scope: **Ethereum mainnet
(chainId 1)** and **OP Mainnet (chainId 10)**.

Charter: `roadmap/work/WR5-research-lane.md`. Contract under test:
`docs/ENGINEERING_SPEC.md` → "Preflight engine" → `retrospective_rehearsal` request shape
and "Acceptance artifact"; `docs/ROADMAP.md` Milestone 4. Candidate pool: executed
transactions of the four authorities pinned in `roadmap/research/WR2/authority-map.md` —
L1 controller Safe `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC`, L1 timelock
`0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`, OP controller Safe
`0x764682c769CcB119349d92f1B63ee1c03d6AECFf`, OP L2 timelock
`0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6`.

**No public unsigned proposal candidate was found or sought as a live-queue item** — Safe
transaction-service queues for these four authorities contained no pending (unexecuted)
transactions at retrieval time (each Safe's own `nonce` equalled the highest executed nonce
observed). Every candidate below is therefore kind (B): a historical canonical execution
transaction. This satisfies the charter's primary target; the "public unsigned proposal"
path remains a bonus this lane could not populate because none exists right now.

## 0. Method and source-class discipline

Two source classes were used, and this file keeps them visibly separate per
`docs/SOURCE_REGISTER.md`:

- **Discovery lead only, not evidence** — the Safe Transaction Service REST API
  (`safe-transaction-mainnet.safe.global`, `safe-transaction-optimism.safe.global`). This is
  a third-party hosted indexer, epistemically the same class as a block explorer per
  `docs/THREAT_MODEL.md`: useful to *find* candidate transaction hashes, decoded calldata,
  nonces, and executor addresses, but never treated here as proof of on-chain state. Every
  fact taken from it below is labeled `[SAFE-API]` and was cross-checked against raw chain
  data before being used to support a feasibility verdict.
- **Block-hash-bound public state** — direct JSON-RPC calls (`eth_getTransactionByHash`,
  `eth_getTransactionReceipt`, `eth_getBlockByNumber`, `eth_call`, `eth_getCode`,
  `eth_getBalance`) against public multi-tenant RPC endpoints (`ethereum-rpc.publicnode.com`
  for chain 1; `optimism-rpc.publicnode.com` and `mainnet.optimism.io` for chain 10).
  Labeled `[RPC]` below, with the exact endpoint noted. **Limitation carried into every
  verdict**: each fact came from *one* provider (two only for candidate D's receipt, see
  §4), not the administratively-independent quorum `docs/ENGINEERING_SPEC.md` requires for
  a production `pass`/`fail`. This lane establishes candidate feasibility, not a quorum-
  verified report; provider-pair selection is `roadmap/research/WR3/provider-matrix.md`'s
  job and is cited, not repeated, here.
- Pinned deployment repository `etherfi-protocol/weETH-cross-chain` at the same commit WR2
  pinned, `e30c859c08a0fb44b4732e44b040f144094638ed` (retrieved 2026-07-22 via
  `raw.githubusercontent.com` and the GitHub contents API), used only to name and byte-match
  the historical batches against their on-chain execution. Labeled `[REPO]`.

Every candidate's identifying calldata was compared **byte-for-byte** between the `[REPO]`
output file and the `[SAFE-API]`/`[RPC]`-observed executed transaction; all four matches
below are exact (full hex string equality), not selector-only matches.

### Empirical archive/trace probe (feeds every candidate's §"archive requirement" verdict)

`[RPC]` against `ethereum-rpc.publicnode.com`, retrieved 2026-07-22:

```text
eth_getCode(<LayerZero Endpoint>, 0x179dd0a)      -> error -32602
  "Archive requests require a personal token. Get one at: https://www.allnodes.com/publicnode"
eth_getBalance(<L1 controller Safe>, 0x179dd0a)   -> same error
eth_getBalance(<L1 controller Safe>, "latest")    -> 0x9703018c33ffaa8 (succeeds)
```

This is the exact probe `roadmap/research/WR3/provider-matrix.md` §6.3 recommends and marks
`U — probe` for PublicNode. The result: **this free public endpoint refuses archive-depth
state for every candidate block below** (all are months old); only `latest`-adjacent reads
work. Separately, `debug_traceTransaction` on the same endpoint returns
`-32601 method does not exist` even for the freshest candidate (I, one day old) — confirming
WR3's separate finding that debug/trace is not on PublicNode's free tier. **Conclusion for
every candidate in this file: a paid archive+trace provider (WR3's Alchemy/QuickNode pair,
or equivalent) is a hard prerequisite for actually executing any of these retrospective
rehearsals; a free public RPC can discover and describe the candidate but cannot fork or
trace it.** This is stated once here and applies identically below unless a candidate's
section says otherwise.

One asymmetry worth carrying forward: on OP, `optimism-rpc.publicnode.com` returned a bare
null for `eth_getTransactionReceipt` on a ~1-year-old hash (candidate D), while
`mainnet.optimism.io` (the OP Foundation's own endpoint) returned the full receipt
immediately. That is a second, OP-specific data point for WR3's still-open PublicNode
archive-depth probe, not a new capability WR5 is claiming to have chosen.

---

## 1. Candidate summary table

| ID | Chain | Authority | Action | Tx hash | Target block | Tx index / block size | Batch shape | Repo match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | Ethereum (1) | L1 controller Safe `0x2aCA71...` | Endpoint `setConfig` (ReceiveUln302, EID 30111/OP) for L1 Sync Pool | `0xe9cf3c7be3c234d6533774f5798d241094c211ca7dcca77c6f2b6f1c4c0c8030` | 24763659 | 53 / 195 | none (single direct call, `operation=0`) | exact vs `output/op_L1_ControllerConfig.json` |
| D | OP (10) | OP controller Safe `0x764682...` | `transferOwnership` of OP OFT proxy admin to OP L2 timelock | `0x7a2c3041c1f8ca5848a118ec97cc7eb90f4ed193ce7a0c946255b90153d59b8b` | 139705022 | 24 / 32 | none (single direct call, `operation=0`) | exact vs `output/op-TransferProxyAdminOwnerToTimelock.json` |
| H | Ethereum (1) | L1 timelock `0x9f26d4...` (proposed/executed via Safe `0xcdd57D11...`) | 4× `TimelockController.execute` — L1 Sync Pool config incl. OP EID 30111, wrapped in one Safe MultiSend | `0x6cade3ad051b8249c4f2cc1ea955c1ab7f2ec4d344b871bd6251ae5c91c5c6ca` | 24799960 | 140 / 375 | Safe MultiSend of 4 internal calls (`operation=1` delegatecall to MultiSend; each internal call `operation=0`) | exact vs `output/op_L1_TimelockExecute.json` |
| I (bonus) | Ethereum (1) | L1 timelock `0x9f26d4...` (via Safe `0xcdd57D11...`) | native `TimelockController.executeBatch` — 4× `setPeer(eid, 0x0)` pathway removal, **not** OP-specific | `0x9aa3f36fd754674adc047c6478431f79b156bfb55b525811eb927c6080104031` | 25583192 | 170 / 1009 | native timelock batch, single top-level call (`operation=0`) | not repo-matched (post-dates pinned commit's `output/` snapshot; decoded independently from `[SAFE-API]`+`[RPC]`) |

All four are `[REPO]`/`[SAFE-API]`/`[RPC]`-cross-matched historical `execTransaction`
(candidates A, D, H) or timelock-`executeBatch`-via-Safe (candidate I) invocations, status
`0x1` (success), already final (the newest, candidate I, is from 2026-07-21, comfortably
past Ethereum's ~13-minute finality window as of the 2026-07-22 retrieval date).

---

## 2. Candidate A — L1 controller Safe, single-call Endpoint `setConfig` for the OP direction

### Identity and provenance

- **Discovery** `[SAFE-API]`: `GET /api/v1/safes/0x2aCA71020De61bb532008049e1Bd41E451aE8AdC/multisig-transactions/?executed=true&to=0x1a44076050125825900e736c501f859c50fE728c` on `safe-transaction-mainnet.safe.global`, retrieved 2026-07-22. Result includes `safeTxHash 0xbf8febbe...`, `transactionHash 0xe9cf3c7b...`, `nonce 714`, `blockNumber 24763659`, `executionDate 2026-03-29T13:52:11Z`, `operation: 0`, `executor 0xdc06023b80e588f1121A901eFC3a0126f7191692`, `proposer 0x46Cba1e9B1e5Db32dA28428f2fb85587BCb785E7` (the same address WR2 lists as an owner of this Safe), `confirmationsRequired 3` (of the Safe's declared threshold 4 — see below), `isSuccessful true`.
- **Byte match** `[REPO]`: `output/op_L1_ControllerConfig.json` (pinned commit `e30c859c08a0fb44b4732e44b040f144094638ed`) contains one transaction: `to: 0x1a44076050125825900e736c501f859c50fe728c`, `data` 1290 hex chars. The Safe-API-observed `data` field is byte-identical (verified via direct string equality in this session).
- **Chain confirmation** `[RPC]` `ethereum-rpc.publicnode.com`, `eth_getTransactionByHash`: `blockHash 0x7dc6ae8241c572be2af38f1ce4ca90fbf6a8f4b7ed1c3e0670c7ae537279cf0b`, `blockNumber 0x179dd0b` (24763659), `transactionIndex 0x35` (53), `from 0xdc06023b80e588f1121a901efc3a0126f7191692`, `to 0x2aca71020de61bb532008049e1bd41e451ae8adc`, `input` starts `0x6a761202` (Safe `execTransaction` selector) wrapping the identical `0x6dbd9f90...` payload.
- **Effect** `[RPC]` `eth_getTransactionReceipt`: `status 0x1`, `gasUsed 184454`, 2 logs — `ReceiveUln302` (`0xc02Ab410...`) config-set event and the Safe's own `ExecutionSuccess(bytes32,uint256)` (topic `0x442e715f...`).

### Decoded semantics

`Endpoint.setConfig(oapp=0xD789870beA40D056A4d26055d0bEFcC8755DA146 [L1 Sync Pool], lib=0xc02Ab410f0734EFa3F14628780e6e695156024C2 [ReceiveUln302], configParams=[{eid: 30111 (0x759f, OP), configType: 2 (ULN), config: {confirmations: 32, requiredDVNs: 2 [0x589dEDbD..., 0xa59BA433...], optionalDVNCount: 0}}])`. This sets the receive-side ULN config for the L1 Sync Pool's OP-direction inbound path — a real, single, narrowly-scoped route-control action.

### Block context

- Target block 24763659, hash `0x7dc6ae8241c572be2af38f1ce4ca90fbf6a8f4b7ed1c3e0670c7ae537279cf0b`, timestamp `1774792331` (2026-03-29T13:52:11Z — matches `[SAFE-API]` `executionDate` exactly).
- Parent block 24763658, hash `0x5d498ffb3bd1df54b06c60295138e0812c7c144f38c4cd246fa86a05faafb2be`.
- Block holds 195 transactions total; target is index 53 → **53-transaction canonical prefix**.

### Isolation check performed

`[RPC]` full block fetch (`eth_getBlockByNumber(0x179dd0b, true)`) and scan of all 195 `to`
addresses: **zero other transactions in this block call the LayerZero Endpoint at all**
(our target is the only Endpoint call in the block). This is strong, cheaply-obtained
evidence of isolation from later same-block writes, though it stops short of a full
storage-level state diff (see verdict below).

### Feasibility verdict per `retrospective_rehearsal` contract clause

| Clause | Verdict | Basis |
| --- | --- | --- |
| Reconstruct complete envelope + internal batch order | **Feasible** | `operation=0`; no internal batch to order — envelope is `execTransaction(to=Endpoint, data=setConfig(...), operation=0, signatures=<11 sigs already in data>)`. Full calldata already recovered byte-for-byte. |
| Resolve/verify target block hash, tx index, parent block hash, block environment | **Feasible** | All four values independently obtained via `[RPC]` above; block environment (basefee, gas limit, timestamp) is part of the standard block header already fetched. |
| Fork parent block, replay 53 canonical prefix txs in order, snapshot pre-state | **Feasible in principle, untested in this lane** | Requires an archive-capable fork provider (see probe above — PublicNode free tier explicitly refuses this depth). 53 is a small, ordinary prefix by mainnet standards; no unusual precompiles or EIP-4844 blobs were noted in the surrounding txs during the isolation scan. Not independently gas-profiled tx-by-tx in this lane. |
| Execute target statefully against reconstructed pre-state | **Feasible in principle** | `execTransaction` is a plain contract call from an arbitrary relayer EOA; no special preconditions beyond gas and the Safe's own nonce/owner state at that block, both reconstructable. |
| Exclude receipts/events/post-state/later txs from prediction inputs | **Feasible by construction** | The prediction path (fork + replay + execute) never reads the receipt; this is a process discipline for the Aegis engine to enforce, not a property of this transaction. |
| Generate + hash predicted before/after report before comparison | **Feasible in principle** | Standard engine behavior; nothing about this candidate blocks it. |
| Compare with independently-acquired actual-effect evidence (receipt+trace/diff, or checkpoint+no-later-write proof) | **Feasible** | Receipt already obtained `[RPC]` (2 logs, decoded above). A trace/state-diff needs the paid archive+trace tier (same probe finding). The cheaper "checkpoint + proof no later tx touched affected state" path is well supported here: isolation check above shows no other tx in the block even calls the Endpoint. |
| Report divergence without rewriting the original predicted artifact | **N/A to candidate selection** | Engine-behavior clause; not falsified by anything found here. |
| **Sender semantics reproducible** | **Feasible** | Top-level `from` is an arbitrary relayer EOA (`0xdc06023b...`) requiring no special authorization — it only needs to carry pre-collected valid Safe signatures, which are already embedded in the historical calldata. Internally, `Safe.execTransaction` performs the target call with `msg.sender = Safe address`, exactly reproducible from reconstructed Safe owner/threshold/nonce state at the parent block. |
| **Same-block isolation of actual effects** | **Feasible, cheaply demonstrated** | Confirmed no other transaction in the 195-tx block calls the Endpoint contract at all (stronger than merely "no other tx touches the same storage slot"). |

**Overall: no blocking clause found. Archive/trace access is the only hard external
dependency, and it is a paid-tier requirement rather than a fact-of-this-transaction
problem.**

---

## 3. Candidate D — OP controller Safe, single-call proxy-admin ownership transfer to the L2 timelock

### Identity and provenance

- **Discovery** `[SAFE-API]`: `GET /api/v1/safes/0x764682c769CcB119349d92f1B63ee1c03d6AECFf/multisig-transactions/?executed=true&to=0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` on `safe-transaction-optimism.safe.global`, retrieved 2026-07-22. One result: `transactionHash 0x7a2c3041...`, `nonce 18`, `blockNumber 139705022`, `executionDate 2025-08-12T14:27:01Z`, `operation: 0`, method decoded `transferOwnership`.
- **Byte match** `[REPO]`: `output/op-TransferProxyAdminOwnerToTimelock.json` — single transaction, `to: 0x632304edc891afed1a7bde9a40b19f1c393ad5f3`, `data: 0xf2fde38b000000000000000000000000851dd540f4d2ec78120de0a0cc87b21ede5df5c6`. Identical to the observed on-chain `input` payload embedded in `execTransaction`.
- **Chain confirmation, two independent RPC endpoints** `[RPC]`:
  - `mainnet.optimism.io` (OP Foundation's own endpoint) `eth_getTransactionByHash`/`eth_getTransactionReceipt`: `blockHash 0xce1fecc3bc42dbbb113f4b938a70f1231332da7e8f64607c5a96b16a9082928f`, `blockNumber 0x853babe` (139705022), `transactionIndex 0x18` (24), `from 0xba9a3c0a22baebe8c4926227bde32d6edc0d5d28`, `status 0x1`.
  - `optimism-rpc.publicnode.com` returned a bare `null` for the receipt at the same hash (see §0 asymmetry note) but agreed on the transaction object itself.
  - This is the one candidate in this file with a genuine second-provider cross-check, though only for the receipt, and both endpoints are execution clients rather than an administratively-independent commercial quorum.
- **Effect** `[RPC]`: 3 logs — `ConfigSet`-shaped event on the OP controller Safe (topic `0x66753cd2...`), `OwnershipTransferred(0x764682c7...,0x851dd540...)` on the proxy admin (topic `0x8be0079c...`), and the Safe's `ExecutionSuccess` (topic `0x442e715f...`).

### Decoded semantics

`ProxyAdmin(0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3).transferOwnership(0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6)` — the OP controller Safe permanently hands upgrade authority over the OP weETH OFT's proxy admin to the OP L2 timelock (3-day declared `minDelay` per WR2 §1b / `DeployEtherFiTimelock.s.sol`). This is a highly consequential, semantically simple, one-shot governance action: after this block, no future OP OFT upgrade can bypass the timelock delay.

### Block context

- Target block 139705022, hash `0xce1fecc3bc42dbbb113f4b938a70f1231332da7e8f64607c5a96b16a9082928f`.
- Parent block 139705021, hash `0x3341886f1ac3a08db541168398645d92e7ecb7466526320d6443b1ac7c53704a`.
- Block holds 32 transactions total; target is index 24 → **24-transaction canonical
  prefix — the smallest of any candidate in this file.**

### Isolation check performed

`[RPC]` full block fetch and scan of all 32 `to` addresses: **the target transaction is the
only transaction in the entire block that calls either the OP controller Safe or the proxy
admin contract.** Strongest isolation evidence of the four candidates, on the smallest
block.

### Feasibility verdict per `retrospective_rehearsal` contract clause

| Clause | Verdict | Basis |
| --- | --- | --- |
| Reconstruct complete envelope + internal batch order | **Feasible** | `operation=0`, no internal batch. |
| Resolve/verify target block hash, tx index, parent block hash, block environment | **Feasible** | All obtained `[RPC]`, cross-checked against a second endpoint for the receipt. |
| Fork parent block, replay 24-tx prefix, snapshot pre-state | **Feasible in principle, untested** | Smallest prefix of the four candidates — least archive/replay work. Same paid-tier archive dependency as candidate A; OP-specific archive/trace support is WR3's territory (Alchemy `debug_traceCall` and QuickNode `trace_*`/`debug_*` are both documented for OP per WR3 §"Capability matrix — OP Mainnet"). |
| Execute target statefully against reconstructed pre-state | **Feasible** | Plain `transferOwnership` call gated only by `onlyOwner`; the calling identity (the OP controller Safe, via its internal `msg.sender` substitution) is exactly what needs reconstructing, and its owner/threshold/nonce state at the parent block is public and archive-readable. |
| Exclude receipts/events/post-state/later txs from prediction inputs | **Feasible by construction** | Same engine-discipline note as candidate A. |
| Generate + hash predicted before/after report before comparison | **Feasible in principle** | No candidate-specific obstruction. |
| Compare with independently-acquired actual-effect evidence | **Feasible, and already partly cross-provider** | Receipt obtained from two different RPC operators in this lane (OP Foundation node + PublicNode, the latter only for the transaction object, not the receipt). `OwnershipTransferred` event content is unambiguous and directly checks the claimed post-state (`owner() == 0x851Dd540...`). |
| Report divergence without rewriting original artifact | **N/A to candidate selection** | — |
| **Sender semantics reproducible** | **Feasible** | Same relayer-EOA-plus-pre-collected-signatures pattern as candidate A; nothing OP-specific complicates it. |
| **Same-block isolation of actual effects** | **Feasible, strongest evidence of the four** | Confirmed unique — only tx in the 32-tx block touching either relevant contract. |

**Overall: no blocking clause found. This is the lowest-implementation-risk candidate by
prefix size and isolation strength, at the cost of being semantically the least rich (one
plain `Ownable.transferOwnership` call, no internal batch to exercise the engine's batch
decoder).**

---

## 4. Candidate H — L1 timelock, 4-call Safe-MultiSend `execute` batch (the richest internal-batch case)

### Identity and provenance

- **Discovery** `[SAFE-API]`: full executed-transaction history of `0xcdd57D11476c22d265722F68390b036f3DA48c21` (the L1 timelock's declared proposer/executor Safe per WR2 §1a; **not** the L1 controller Safe itself, but the timelock-proposer Safe that acts on the pinned L1 timelock `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`), `safe-transaction-mainnet.safe.global`, retrieved 2026-07-22, 181 executed transactions total (nonce 0–180), most of them `schedule(Batch)`/`execute(Batch)` pairs against the L1 timelock. Nonce 173: `transactionHash 0x6cade3ad...`, `blockNumber 24799960`, `executionDate 2026-04-03T15:19:47Z`, `to 0x40A2aCCbd92BCA938b02010E17A5b8929b49130D` (canonical Safe MultiSend v1.3.0), decoded method `multiSend`, 4 internal calls, all `to: 0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` (the pinned L1 timelock), each `operation: 0`, selector `0x134008d3` (`TimelockController.execute(address,uint256,bytes,bytes32,bytes32)`).
- **Byte match** `[REPO]`: `output/op_L1_TimelockExecute.json` — 4 transactions, each `to: 0x9f26d4c958fd811a1f59b01b86be7dffc9d20761`, selector `0x134008d3`. All 4 `data` strings are byte-identical to the 4 internal-call `data` strings decoded from the on-chain MultiSend (verified via direct string comparison in this session — full equality, not prefix-only).
- **Paired schedule** (context, not itself the rehearsal target): nonce 172, `transactionHash 0xdaa21dbccdf134bd4a48440039a0c4c704e0aadb3dc13a38815bfdf1875529cc`, block 24771973, `2026-03-30T17:41:23Z`, byte-matches `output/op_L1_TimelockSchedule.json` exactly (selector `0x01d5062a`, same 4 target payloads with a `16200`-second delay parameter — `0x3f48` hex — embedded in each `schedule` call). The ~3.9-day gap between schedule and execute is well past that 16200 s (~4.5 h) minimum, consistent with an operator executing once convenient rather than at the earliest eligible moment.
- **Chain confirmation** `[RPC]` `ethereum-rpc.publicnode.com`: `blockHash 0x661c8fd0ef5beffe3063a2d955c22e3335ad3d3649f5c13d943750591bb164c3`, `blockNumber 0x17a6ad8` (24799960), `transactionIndex 0x8c` (140), `from 0xdc06023b80e588f1121a901efc3a0126f7191692` (same relayer EOA as candidate A), `to 0xcdd57d11476c22d265722f68390b036f3da48c21`.
- **Effect** `[RPC]` receipt: `status 0x1`, `gasUsed 311625`, 8 logs — 4× a `CallExecuted`-shaped event on the L1 timelock (topic `0xc2617efa...`) interleaved with 3 distinct config-change events on the L1 Sync Pool (`0xd789870b...`) plus the closing Safe `ExecutionSuccess`.

### Decoded semantics (all 4 internal `execute` calls target the L1 Sync Pool `0xD789870beA40D056A4d26055d0bEFcC8755DA146`)

1. `setPeer(30111 /* wait — decoded target arg is a different address per call; see below */)` — actually: call 1 targets a *different* contract than calls 2–4 (embedded `target` arg `0x9FfDF407cDe9a93c47611799DA23924Af3EF764F`, an L1 native-minting-adjacent contract per WR2's registry), calling `0xf3820f27(...)` with an OP-related config array; calls 2–4 all target the L1 Sync Pool directly with `0x09f37812(...)`, `0x86dc6e9a(...)`, and `0x3400288b(...)` (`setPeer(30111 /* 0x759f */, 0x23ca5e5300d3b35a47dfef6a36ecba5ac0a96e03)` and `setPeer(30111, 0x6a26e8894b9bbd684a13647f67822ef142e0e45e)` and `setPeer(30111, 0xc9475e18e2c5c26ea6adcd55fabe07920bea887e)`). Three of the four calls explicitly carry EID `30111` (`0x759f`) — **this batch is concretely OP-route-relevant**, unlike candidate I below.

### Block context

- Target block 24799960, hash `0x661c8fd0ef5beffe3063a2d955c22e3335ad3d3649f5c13d943750591bb164c3`.
- Parent block 24799959, hash `0x29ecf247aefef737217986e83bf5641873761b7a33e5a97d69e05c62b846ccfe`.
- Block holds 375 transactions total; target is index 140 → **140-transaction canonical
  prefix — the largest of the four candidates.**

### Isolation check performed

`[RPC]` full block fetch and scan of all 375 `to` addresses against the L1 timelock, the L1
Sync Pool, and the timelock-proposer Safe: **only the target transaction touches any of the
three.**

### Feasibility verdict per `retrospective_rehearsal` contract clause

| Clause | Verdict | Basis |
| --- | --- | --- |
| Reconstruct complete envelope + internal batch order | **Feasible, and the most demanding real test of this clause among the four candidates** | Two nesting levels: (1) Safe `execTransaction` with `operation=1` (delegatecall to MultiSend) wrapping (2) 4 packed sub-calls, each independently ABI-decodable as `TimelockController.execute(target,value,data,predecessor,salt)`. Exact byte match to `[REPO]` confirms order and content are fully recoverable. |
| Resolve/verify target block hash, tx index, parent block hash, block environment | **Feasible** | All obtained `[RPC]`. |
| Fork parent block, replay 140 canonical prefix txs, snapshot pre-state | **Feasible in principle, largest prefix of the four — proportionally more that can go wrong (fetch gaps, decode failures on unrelated prefix txs)** | Same archive-tier dependency as candidate A; not gas- or opcode-profiled tx-by-tx in this lane. |
| Execute target statefully against reconstructed pre-state | **Feasible, with one extra precondition beyond A/D** | Each internal `TimelockController.execute` call additionally requires the *scheduled operation* to already be in the `ready` state at the reconstructed parent-block state (i.e., the paired `schedule` call from block 24771973 must already be part of that reconstructed state, and the parent block's timestamp must be ≥ the scheduled ready time). This is a real, candidate-specific fact to verify during implementation, not merely assumed. |
| Exclude receipts/events/post-state/later txs from prediction inputs | **Feasible by construction** | — |
| Generate + hash predicted before/after report before comparison | **Feasible in principle** | — |
| Compare with independently-acquired actual-effect evidence | **Feasible** | Receipt obtained `[RPC]`, 8 logs decoded above; a full state diff again needs the paid archive+trace tier. The cheaper checkpoint-based proof is supported by the isolation scan (only tx in the block touching any of the 3 relevant contracts). |
| Report divergence without rewriting original artifact | **N/A to candidate selection** | — |
| **Sender semantics reproducible** | **Feasible, with the timelock-Safe distinction made explicit** | Two authority layers must both be reconstructed: (a) the Safe's own owner/threshold/nonce state (same as A/D), and (b) the *timelock's* internal state (its scheduled-operation map), since `execute` reverts if the target operation is not `ready`. |
| **Same-block isolation of actual effects** | **Feasible** | Confirmed unique among 375 txs. |

**Overall: no blocking clause found, but this candidate carries two feasibility costs the
simpler candidates don't: (1) a materially larger same-block prefix (140 vs 24–53), and (2)
an extra precondition — the scheduled-operation's `ready` state at the reconstructed parent
block — that must be independently confirmed, not assumed. In exchange it is the only
candidate that genuinely exercises nested internal-batch decoding (Safe MultiSend of
multiple independently-targeted timelock calls), which is the part of the
`retrospective_rehearsal` contract the two single-call candidates cannot test at all.**

---

## 5. Candidate I (bonus, not OP-specific) — freshest native `TimelockController.executeBatch`

### Identity and provenance

- **Discovery** `[SAFE-API]`: same Safe history as candidate H, nonce 180 (the *most recent*
  executed transaction from this Safe at retrieval time): `transactionHash
  0x9aa3f36fd754674adc047c6478431f79b156bfb55b525811eb927c6080104031`, `blockNumber
  25583192`, `executionDate 2026-07-21T19:28:11Z`, `to 0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`
  (the L1 timelock directly — **no MultiSend wrapper this time**), decoded method
  `executeBatch`, decoded params: `targets` = 4× `0xD789870beA40D056A4d26055d0bEFcC8755DA146`
  (L1 Sync Pool), `values` = 4× `0`, `payloads` = 4× `setPeer(eid, bytes32(0))` for EIDs
  **30183, 30214, 30243, 30362** — a pathway-removal/decommission action, per the repo's
  `*-ReducePathways.json` naming convention. **This candidate does not touch EID 30111
  (OP)** and is not itself repo-byte-matched (it postdates the pinned commit's `output/`
  snapshot; its structure was decoded independently from `[SAFE-API]`'s `dataDecoded` plus
  the `[RPC]`-observed calldata, both of which agree).
- **Chain confirmation** `[RPC]` `ethereum-rpc.publicnode.com`: `blockHash
  0xce3a4b94cd8f7cdb926808895a22e7232b448b9a902356f3c5f5db91a68b4915`, `blockNumber
  25583192`, `transactionIndex 170`, `from 0x8d5aac5d3d5cda4c404fa7ee31b0822b648bb150`
  (a different relayer EOA than A/H), `status 0x1`, `gasUsed 146696`, 9 logs.

### Why it's here despite not being OP-specific

This is the cleanest **single-call, native, atomic** batch primitive found in the entire
candidate pool: `TimelockController.executeBatch` performs its own internal atomicity (no
Safe MultiSend indirection at all — `operation=0` straight to the timelock), which is
arguably a more direct exercise of "one canonical execution transaction, which may itself
contain an atomic ... timelock batch" than candidate H's Safe-MultiSend-of-4-single-executes
approach. It is also the freshest transaction in this file by ten weeks, which minimizes
(but does not eliminate — see §0 probe) archive-depth risk.

### Block context

- Target block 25583192, hash `0xce3a4b94cd8f7cdb926808895a22e7232b448b9a902356f3c5f5db91a68b4915`.
- Parent block 25583191, hash `0x74f720dca79273f91d275b874d6e0cdc8e3a2fecae6e48b7830f69f86bc249e7`.
- Block holds 1009 transactions; target is index 170 → **170-transaction canonical prefix,
  the single largest of any candidate here**, despite the block being the most recent.
  (Recency and prefix size are not correlated — this is a genuinely busy block.)

### Isolation check performed

`[RPC]` full block fetch and scan of all 1009 `to` addresses against the L1 timelock, L1
Sync Pool, and timelock-proposer Safe: unique — only the target transaction touches any of
the three.

### Feasibility verdict (condensed — same clause list as above)

Materially identical to candidate H's verdict (single-authority-layer nesting, same
"target operation must be `ready`" precondition — here directly on the timelock rather than
through a Safe MultiSend, so actually *one layer shallower* to reconstruct), except:

- **Batch shape** is simpler to decode (no MultiSend unpacking step at all — the timelock's
  own ABI directly exposes `targets[]`/`values[]`/`payloads[]`).
- **Same-block prefix** is the largest of the four (170), moderately increasing fork-replay
  cost and the chance an unrelated prefix transaction is itself hard to fetch/decode.
- **Route relevance**: this transaction is real ether.fi governance activity touching the
  pinned L1 timelock, but it is **not** an OP-route action (it removes reciprocal peers for
  four *other* remote chains). It satisfies the mission's broader "touching ether.fi
  contracts" bar but not the OP-route-specific framing WR2/M2/M4 emphasize.

**Overall: no blocking clause found; kept as a bonus option because of its clean single-call
batch shape and near-head freshness, not promoted above H because it is off-topic for the
ETH↔OP route and has the largest prefix of the four.**

---

## 6. Cross-candidate comparison

| Property | A | D | H | I (bonus) |
| --- | --- | --- | --- | --- |
| Chain | Ethereum | OP | Ethereum | Ethereum |
| Authority | L1 controller Safe | OP controller Safe | L1 timelock (via proposer Safe) | L1 timelock (via proposer Safe) |
| Batch shape | none (single call) | none (single call) | Safe MultiSend of 4 | native `executeBatch` of 4 |
| Same-block prefix | 53 | **24 (smallest)** | 140 | 170 (largest) |
| Isolation evidence | unique Endpoint caller in block | unique caller of both relevant contracts | unique caller of all 3 relevant contracts | unique caller of all 3 relevant contracts |
| Extra precondition beyond Safe-state reconstruction | none | none | timelock operation must be `ready` at parent block | timelock operation must be `ready` at parent block |
| OP-route relevant | yes (EID 30111 explicit) | yes (OP OFT's own proxy admin) | yes (3 of 4 sub-calls carry EID 30111) | no (EIDs 30183/30214/30243/30362) |
| Age at retrieval | ~4 months | ~11 months | ~3.5 months | ~1 day |
| Exercises internal-batch decode | no | no | **yes (2-level nesting)** | yes (1-level, native) |
| Repo-byte-matched | yes | yes | yes | no (postdates pinned commit) |

None of the four candidates hit a disqualifying clause. All four require a paid
archive+trace-capable provider that the free public RPC used for discovery explicitly does
not offer (empirically confirmed, §0); this is a provider-selection dependency on WR3, not a
property that differs among the candidates.

## 7. Ranked recommendation

1. **Primary: Candidate A** (L1 controller Safe, single-call `setConfig` for the OP
   direction, block 24763659). Smallest number of moving parts that is still genuinely
   OP-route-relevant and touches the pinned L1 controller Safe directly: no MultiSend/batch
   indirection to get wrong on a first implementation, no timelock-`ready`-state
   precondition to independently verify, a moderate (53-tx) and easily-enumerated prefix,
   and the strongest possible "no other tx in the block even calls this contract" isolation
   story. This is the lowest-implementation-risk way to first prove the
   `retrospective_rehearsal` path end-to-end.
2. **Close second / OP-side alternative: Candidate D** (OP controller Safe, proxy-admin
   ownership transfer, block 139705022). Even smaller prefix (24) and even stronger
   isolation than A, plus it is semantically the single most consequential action in the
   pool (irreversibly gates all future OP OFT upgrades behind the L2 timelock) and it
   exercises the OP-chain side of the pinned-authority set that A does not. Recommended as
   the second fixture, or as the primary if the team prefers the OP chain as the first
   proof rather than Ethereum.
3. **Richest / follow-on: Candidate H** (L1 timelock, 4-call Safe-MultiSend `execute`
   batch, block 24799960). This is the only candidate that actually forces the engine to
   decode a real nested internal batch (Safe MultiSend wrapping independently-targeted
   timelock calls) and to reconstruct timelock `ready`-state as a second authority layer —
   exactly the scenario the `retrospective_rehearsal` contract's "may itself contain an
   atomic ... batch" language anticipates. Recommended as the batch-structure follow-on
   once A (or D) has proven the simple path, precisely because its larger prefix (140) and
   extra precondition make it a worse *first* fixture but a necessary *eventual* one.
4. **Bonus, keep on file, do not promote yet: Candidate I** (native `executeBatch`, block
   25583192). Cleanest native-batch call shape and freshest block, but off-topic for the
   OP route and carries the largest prefix (170) of the four. Worth revisiting once the
   engine already handles H, as a second architecturally-distinct batch shape
   (`executeBatch` vs. Safe-MultiSend-of-`execute`s) to fixture against.

## 8. Provenance register

| # | Claim | Source | Retrieved |
| --- | --- | --- | --- |
| S1 | L1 controller Safe info (nonce 823, threshold 4, 7 owners, version 1.3.0) | `GET https://safe-transaction-mainnet.safe.global/api/v1/safes/0x2aCA71020De61bb532008049e1Bd41E451aE8AdC/` | 2026-07-22 |
| S2 | OP controller Safe info (nonce 35, threshold 4, 7 owners, version 1.3.0+L2) | `GET https://safe-transaction-optimism.safe.global/api/v1/safes/0x764682c769CcB119349d92f1B63ee1c03d6AECFf/` | 2026-07-22 |
| S3 | L1 timelock-proposer Safe info (nonce 181, threshold 6, 10 owners) | `GET https://safe-transaction-mainnet.safe.global/api/v1/safes/0xcdd57D11476c22d265722F68390b036f3DA48c21/` | 2026-07-22 |
| S4 | Candidate A executed-tx record (nonce 714, block 24763659, executor, signatures, decoded method) | `GET .../safes/0x2aCA71.../multisig-transactions/?executed=true&to=0x1a4407...` | 2026-07-22 |
| S5 | Candidate D executed-tx record (nonce 18, block 139705022) | `GET .../safes/0x764682.../multisig-transactions/?executed=true&to=0x632304...` | 2026-07-22 |
| S6 | Candidate H + paired schedule (nonces 172/173) and full 181-tx history of the timelock-proposer Safe, incl. candidate I (nonce 180) | `GET .../safes/0xcdd57D11.../multisig-transactions/?executed=true&limit=100` (paginated) | 2026-07-22 |
| S7 | `output/op_L1_ControllerConfig.json`, `output/op_L1_TimelockSchedule.json`, `output/op_L1_TimelockExecute.json`, `output/op-TransferProxyAdminOwnerToTimelock.json`, `output/ethereum-SecurityUpgrade.json`, `output/op-SecurityUpgrade.json`, `output/mainnet.json`, `output/op_L2_GrantMinter.json`, `output/ethereum-unpauseBridge.json`, `output/op-unpauseBridge.json` at commit `e30c859c08a0fb44b4732e44b040f144094638ed` | `raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/*.json` | 2026-07-22 |
| S8 | Full `output/` directory listing at the pinned commit (confirms no `op_L2_ControllerConfig.json` / no direct L2-timelock-targeting file exists yet) | `GET https://api.github.com/repos/etherfi-protocol/weETH-cross-chain/contents/output?ref=e30c859c08a0fb44b4732e44b040f144094638ed` | 2026-07-22 |
| S9 | Candidate A tx/block/receipt (`blockHash`, `transactionIndex 53`, `parentHash`, 195-tx block, 2 logs, unique Endpoint caller) | `POST https://ethereum-rpc.publicnode.com` `eth_getTransactionByHash` / `eth_getBlockByNumber(0x179dd0b, true)` / `eth_getTransactionReceipt` | 2026-07-22 |
| S10 | Candidate D tx/block/receipt (`transactionIndex 24`, 32-tx block, unique caller of proxy admin + Safe) | `POST https://mainnet.optimism.io` and `POST https://optimism-rpc.publicnode.com` | 2026-07-22 |
| S11 | Candidate H tx/block/receipt (`transactionIndex 140`, 375-tx block, 8 logs, unique caller of timelock/Sync Pool/proposer Safe) | `POST https://ethereum-rpc.publicnode.com` | 2026-07-22 |
| S12 | Candidate I tx/block/receipt (`transactionIndex 170`, 1009-tx block, 9 logs) | `POST https://ethereum-rpc.publicnode.com` | 2026-07-22 |
| S13 | Archive-depth probe: `eth_getCode`/`eth_getBalance` at historical block rejected ("Archive requests require a personal token"); `latest` succeeds; `debug_traceTransaction` returns `-32601` | `POST https://ethereum-rpc.publicnode.com` | 2026-07-22 |
| S14 | Current (live, **not** parent-block-bound) `TimelockController.getMinDelay()` on the L1 timelock = 864000 s (10 days) | `POST https://ethereum-rpc.publicnode.com` `eth_call({to: 0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761, data: 0xf27a0c92}, "latest")` | 2026-07-22 |
| S15 | WR3 provider-matrix cross-reference for archive/trace capability per provider/chain | `roadmap/research/WR3/provider-matrix.md` | 2026-07-21 (WR3's own retrieval date) |
| S16 | WR2 authority map (pinned Safe/timelock addresses, DVN registry, delegate-derivation caveat) | `roadmap/research/WR2/authority-map.md` | 2026-07-21 (WR2's own retrieval date) |

Per `docs/SOURCE_REGISTER.md`, none of the above — including the `[RPC]`-labeled rows —
promotes any value into an active Aegis manifest. This file is candidate-selection research
rationale for the hiring-ready Rehearse acceptance case, reviewed by the manifest-promotion
checklist before any of it becomes expected policy or a shipped fixture.

## 9. Open questions and caveats

1. **Provider quorum not yet established.** Every `[RPC]` fact above came from one provider
   (two, for candidate D's receipt only, and both are execution-client-class endpoints, not
   an administratively independent commercial pair). Before any candidate becomes a real
   fixture, re-acquire every fact from WR3's recommended provider pair and require
   block-hash agreement.
2. **Prefix transactions were counted, not individually profiled.** "53/24/140/170
   preceding transactions" is a count from the block header, not a per-transaction
   gas/opcode/precompile survey. A transaction in the prefix that itself reverts, uses an
   unusual precompile, or depends on now-hard-to-fetch calldata could still complicate
   replay even though the count is modest. This should be done once real archive access is
   provisioned, before committing to a fixture.
3. **Isolation checks here are a `to`-address scan, not a storage-slot state diff.** This is
   a reasonable, cheap first pass (and for candidates A/D it is a strong result — literally
   no other transaction in the block calls the relevant contract at all) but a fully rigorous
   implementation should still perform the trace/state-diff comparison the contract
   describes, since an intermediate contract could in principle reach the target storage via
   an internal call without appearing as a top-level `to`.
4. **Timelock `ready`-state precondition (candidates H, I) needs its own archive read.**
   Confirming that the scheduled operation was actually `ready` (not merely that a
   `schedule` call happened earlier) requires reading `TimelockController.isOperationReady`
   or equivalent at the reconstructed parent-block state — not yet done in this lane.
5. **Do not reuse the live `getMinDelay()` reading (S14, 10 days) as the delay that applied
   to candidates H/I's historical schedule/execute pair.** The schedule calldata for H
   embeds a 16200 s (~4.5 h) delay parameter, which could only have been valid if the
   timelock's `minDelay` was ≤ 16200 s in March 2026 — implying `minDelay` has since been
   raised to 10 days. A retrospective evaluation must read `minDelay` (and every other
   config value) from the reconstructed **parent-block** state, never from a live "current"
   read like S14, which is included here only as directional context and a caution, not as
   evidence usable in a rehearsal.
6. **No public unsigned proposal candidate exists right now.** All four pinned
   Safes'/timelocks' transaction-service `nonce` fields matched their highest executed
   nonce at retrieval time — there is nothing queued and unsigned to evaluate as
   `artifactOrigin: "public_unsigned_proposal"` today. This should be re-checked
   periodically; it is a point-in-time fact, not a structural limitation.
7. **The broader "SecurityUpgrade" 5/6-call MultiSend templates were surveyed but not
   selected.** Multiple historical executions of the `ethereum-SecurityUpgrade.json`- and
   `mainnet.json`-shaped templates were found on the L1 controller Safe (e.g. block
   24924948, block 23879335, and others enumerated during this session), some directly on
   the primary L1 OFT Adapter. They were set aside because their `setConfig`/rate-limit
   payloads typically enumerate many remote EIDs in one call (bootstrap/hardening actions
   spanning most of the ~30 supported chains at once), making "is this specifically the OP
   direction" a harder claim to isolate than candidates A/D/H's narrowly-scoped calls. They
   remain available as additional candidates if the team wants a broader-blast-radius batch
   for later Rehearse coverage.
