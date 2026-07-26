<!-- G-02/G-03/G-04 execution-order & provenance dossier — chain-historian standing lane,
2026-07-26. Persisted verbatim by the orchestrator from the lane's final report. Research
input only. Expected-side evidence via governance-execution history (blueprint §4-admissible
path); the lane DELIBERATELY did not read the rate-limit getters at head — that observed-side
read belongs to a different role (D-006). Full acquisition ledger (127 content-addressed
responses) in the session scratchpad; paths in §10. -->

# ROUTE-ETH-OP-v1 — G-02 / G-03 / G-04 EXECUTION-ORDER & PROVENANCE DOSSIER

**Lane:** chain-historian, standing research lane G-02/G-03/G-04
**Retrieval window:** 2026-07-26 ~20:52–21:41 UTC
**Chain heads at read time (OBSERVED):** ETH `25619467` (hash `0x707744a68caa2b19ff37fd04d5c32fabf0a453def5c7578db0a96af78736cde5`, ts 2026-07-26T20:49:47Z); OP `154750423`
**Evidence ledger:** 127 recorded acquisitions, every raw response body sha256'd with effective URL — `C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\ledger.jsonl`

---

## 1. SUMMARY — THE THREE ANSWERS

### G-02 — **3,000 weETH / 14,400 s is the live-intended value. Confidence: HIGH.**

**The naming inference in WR1 C2 was wrong, and the chain says so plainly.** `NEW_LIMIT = 10_000 ether` did execute — *first*, on 2026-04-03. It was then **superseded twice**, both times downward to 3,000, on 2026-04-14 and again on 2026-04-21. The `increase-rate-limits` batch is the *older* writer; `SecurityUpgrade` is the *younger*.

| # | Date (UTC) | ETH blk | OP blk | Limit | Batch shape |
|---|---|---|---|---|---|
| 1 | 2024-12-09 | 21366296 | 129082737 | 2,000 | 8 EIDs (initial) |
| 2 | 2026-04-03 | 24799211 | 149815468 | **10,000** | 2 EIDs — `increase-rate-limits` |
| 3 | 2026-04-14 | 24879181 | 150292394 | **3,000** | 2 EIDs — *reversion* |
| 4 | 2026-04-21 | 24924948 | 150567893 | **3,000** | 19 EIDs — `SecurityUpgrade` |

Grounds: a complete, block-hash-pinned event ledger of *every* `Outbound/InboundRateLimitsChanged` emission over both contracts' entire lifetimes, dual-provider on ETH, plus an independent 419-chunk zero-error post-window sweep on OP. No later writer touches EID 30111/30101. Both setters are `onlyOwner`, and the full ownership history is enumerated, so the authorized-writer set is closed.

**Manifest-authorable value (both directions, both sides):** `limit = 3000000000000000000000` wei, `window = 14400` s.

### G-03 — **CLOSED. Peer provenance recovered on both sides, including one supersession.**

- ETH `peers(30111)` set **once**, blk `20865344`, → `0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff`. Never changed.
- OP `peers(30101)` set **twice**: blk `120917167` → `0xfe7fe01f8b9a76803af3750144c2715d9bcf7d0d` (a *prior* L1 weETH OFT adapter), then **superseded** at blk `126404187` → `0xcd2eb13d6831d4602d80e5db9230a57596cdca63`.

Both current values match WR1's SOURCED-D derivation exactly. Claim strength rises from "derived from registry co-declaration" to **decoded on-chain event**.

### G-04 — **CLOSED. The blog was right: explicit pins exist. I found them.**

Send *and* receive libraries were explicitly pinned in **one transaction per chain**, both on 2026-04-22, 19 pathways each, EID 30111/30101 included. Confirmed three ways: Safe batch calldata, transaction receipt, and a full-history Endpoint sweep. Additionally: the **pre-existing defaults for these EIDs were the identical addresses** — which independently corroborates the blog's "byte-identical … bridging behavior is unchanged" claim and pins down exactly what the pin changed (the *authority*, not the *library*).

### Plus: a finding that invalidates a blueprint claim

**Both OApps have been handed to timelocks.** ETH adapter owner → `0xcd425f44…` at blk 25296945 (2026-06-11); OP OFT owner → the L2 timelock `0x851dd540…` at blk 154486119 (2026-07-20). The blueprint's E7 "**Zero latency**" for rate limits, and its S7 "controller Safe = intended owner", are **stale as of those blocks**. Details in §6.

---

## 2. METHOD AND ACQUISITION DISCIPLINE

### 2.1 Keccak — built, not trusted

No keccak backend was installed (`eth_utils` present but `pycryptodome`/`pysha3` absent — OBSERVED `ImportError`). I wrote a pure-Python Keccak-256 and **self-tested it against 7 published vectors** before any derivation: empty string, `"abc"`, the `transfer(address,uint256)` selector, and the `Transfer`/`Approval`/`OwnershipTransferred` topic0s, plus `keccak("MINTER_ROLE")`. All pass.
`…\scratchpad\keccak.py`

### 2.2 Every derivation shown

| Signature | keccak → selector/topic0 |
|---|---|
| `setOutboundRateLimits((uint32,uint256,uint256)[])` | `0xe96e38e2…` → sel **`0xe96e38e2`** |
| `setInboundRateLimits((uint32,uint256,uint256)[])` | → sel **`0xf51b1aca`** |
| `setPeer(uint32,bytes32)` | → sel **`0x3400288b`** |
| `setSendLibrary(address,uint32,address)` | → sel **`0x9535ff30`** |
| `setReceiveLibrary(address,uint32,address,uint256)` | → sel **`0x6a14d715`** |
| `execTransaction(...)` | → sel **`0x6a761202`** |
| `multiSend(bytes)` | → sel **`0x8d80ff0a`** |
| `schedule/scheduleBatch/execute/executeBatch` | `0x01d5062a` / `0x8f2a0bb0` / `0x134008d3` / `0xe38335e5` |
| `OutboundRateLimitsChanged((uint32,uint256,uint256)[])` | topic0 **`0x55254e344b7fc8e2e038c1f7f20a1c7afe659c1a3bbfc4e35dd1ca9bba0ca0a0`** |
| `InboundRateLimitsChanged((uint32,uint256,uint256)[])` | topic0 **`0x983af742b0b5ca79aa5c0be76cea126e1baf3139ecd04624deac13853c4bebde`** |
| `PeerSet(uint32,bytes32)` | topic0 **`0x238399d427b947898edb290f5ff0f9109849b1c3ba196a42e35f00c50a54b98b`** |
| `SendLibrarySet(address,uint32,address)` | topic0 **`0x4cff966ebee29a156dcb34cf72c1d06231fb1777f6bdf6e8089819232f002b1c`** |
| `ReceiveLibrarySet(address,uint32,address)` | topic0 **`0xcd6f92f5ac6185a5acfa02c92090746cec64d777269cbcd0ed031e396657a1c2`** |
| `ReceiveLibraryTimeoutSet(address,uint32,address,uint256)` | topic0 **`0x4e0a5bbfa0c11a64effb1ada324b5437a17272e1aed9320398715ef71bb20928`** |
| `DefaultSendLibrarySet(uint32,address)` | topic0 **`0x16aa0f528038ab41019e95bae5b418a50ba8532c5800e3b7ea2f517d3fa625f5`** |
| `DefaultReceiveLibrarySet(uint32,address)` | topic0 **`0xc16891855cffb4a5ac51ac11864a3f3c96ba816cc45fe686c987ae36277de5ec`** |
| `Upgraded(address)` | topic0 `0xbc7cd75a…` |
| `OwnershipTransferred(address,address)` | topic0 `0x8be0079c…` |
| `MinDelayChange(uint256,uint256)` | topic0 `0x11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5` |

The event **struct types were read from source, not guessed** — `RateLimitConfig{uint32 peerEid; uint256 limit; uint256 window}` at `contracts/PairwiseRateLimiter.sol` L31-35, events L50-51 (sha256 `e1523b416a51a768053facb47dac27da3f0cad77b10f6812b9feeacba308c396`); library events from LayerZero `IMessageLibManager.sol` L17-23, all **non-indexed** (sha256 `c648091e7cb079cb95778becfff1a813e901fdc07124153ba731a7d9daa29b40`).

### 2.3 Full-word decoder with truncation teeth (INS-035ae3e4)

`…\scratchpad\decode.py`. No substring reads anywhere; every numeric comes from `int.from_bytes` over a complete 32-byte word. Structural guards: body length must be a multiple of 32; array arity must equal `2 + 3n` exactly; address words must have 12 zero high bytes; `peerEid` must fit uint32.

**Negative-tested at use (all three fail closed):**
```
REJECTED 1-byte-short body:  ValueError: TRUNCATION GUARD ... length 159 is not a multiple of 32
REJECTED dropped final word: AssertionError: ARITY GUARD: array claims 1 entries -> expects 5 words, body has 4
REJECTED half-word splice:   ValueError: TRUNCATION GUARD ... length 144 is not a multiple of 32
```
This is the truncated-literal fixture INS-035ae3e4 asks for, exercised against the real decoder.

### 2.4 Providers — what worked, what refused (OBSERVED, verbatim)

| Endpoint | Result |
|---|---|
| `rpc.mevblocker.io` | **full-range `eth_getLogs` OK** (ETH primary) |
| `gateway.tenderly.co/public/mainnet` | **full-range OK** (ETH secondary) |
| `optimism.gateway.tenderly.co` | **full-range OK** (OP primary) |
| `mainnet.optimism.io` | archive OK, **10k range cap** (`-32062 Block range is too large` at 50k+); intermittent `-32011 no backend is currently healthy` |
| `ethereum-rpc.publicnode.com` | **`-32602 Archive requests require a personal token`** |
| `optimism-rpc.publicnode.com` | `-32701 exceed maximum block range: 50000`, then **`-32602` archive-token refusal on every chunk** |
| `optimism.api.onfinality.io/public` | archive OK at 100k, but **`-32029 Too Many Requests`** under sustained use |
| `rpc.ankr.com/eth` | `-32000 Unauthorized: … API key` |
| `cloudflare-eth.com` | `-32046 Cannot fulfill request` |
| `eth.llamarpc.com` | HTTP 521 |
| `eth.drpc.org` | `code 12` can't route; `optimism.drpc.org` 10k free-plan cap |
| `1rpc.io/eth`, `1rpc.io/op` | 50-block cap |
| `eth-mainnet.public.blastapi.io` | 10-block cap |
| `eth.merkle.io` | `-32601 Method not found` |
| `eth.rpc.blxrbdn.com` | `-32000 method not available` |
| `rpc.payload.de`, `api.securerpc.com`, `core.gashawk.io`, `op-mainnet.public.blastapi.io`, `optimism.rpc.subquery.network`, `rpc.optimism.gateway.fm`, `optimism.therpc.io` | DNS `getaddrinfo failed` |
| `optimism.meowrpc.com`, `optimism.blockpi.network`, `optimism.lava.build`, `endpoints.omniatech.io` | empty/`null` body |
| `api.zan.top/opt-mainnet` | `-32012 cu limit exceeded` |

**G9 (provenance rot) applied:** the Safe request `https://safe-transaction-mainnet.safe.global/api/v1/...` **308-redirects** to effective URL `https://api.safe.global/tx-service/eth/api/v1/...` — recorded per-acquisition. Service `Safe Transaction Service v6.6.1`, no API key required (sha256 `e5092cdbf7c875ef8060f3a83d41a00179206efba1df241bab9fd028d26dbd54`). Note its self-declared `ETH_REORG_BLOCKS: 10`.

### 2.5 Explorer quarantine honored

No block explorer was used at all — not even for discovery. Discovery came from the Safe transaction service and from topic0-filtered `getLogs`. Every value below is decoded by my decoder from raw calldata or raw log `data`.

---

## 3. G-02 — EXECUTION-ORDER TABLE WITH DERIVATIONS

### 3.1 The complete ledger (every emission, both contracts, full lifetime)

- **ETH** `0xcd2eb13d…` — 24 `OutboundRateLimitsChanged` + 21 `InboundRateLimitsChanged` = 45 events, block 0 → latest.
  Two administratively independent providers returned **byte-identical sets** (agreement checked on `blockNumber`, `blockHash`, `transactionHash`, `logIndex`, `data`): mevblocker `c5841c5e729c4633…` / Tenderly `bd2ff67e9b58104f…` (outbound); mevblocker `757360a1efad2e17…` / Tenderly `b97aabf683bea2a2…` (inbound). **Agreement: True.**
  **Exactly 8 of the 45 touch EID 30111.**
- **OP** `0x5a7facb9…` — 12 outbound + 11 inbound, block 0 → latest, Tenderly (`43c8ff7452492040…`, `dc653748f1b2a55d…`). **Exactly 8 touch EID 30101.**

### 3.2 Execution-order table (the deliverable)

| Batch | Chain | Safe nonce | Block | Block hash | Timestamp (UTC) | Tx hash | EID | limit (wei) | window (s) |
|---|---|---|---|---|---|---|---|---|---|
| initial | ETH | 514 | 21366296 | `0xbaba602bca79d99f8c26085d14e74b8ac82b2e8a3ab65884d5394e7a6521768a` | 2024-12-09T16:59:47Z | `0x96a997ff3535d7aa1ef6721329f13cbc075ebb4a98a53a623c203929666e6668` | 30111 | 2000000000000000000000 | 14400 |
| initial | OP | 9 | 129082737 | `0xeb80f24f7fbefef118f65a4fa469111200e7e1363be0a90a9e800e460fa00eab` | 2024-12-09T17:10:51Z | `0x53c04693ff9ce5de7936ed9947f0c1b293ba03821a15009b4ceaa513b6d6f546` | 30101 | 2000000000000000000000 | 14400 |
| **increase** | ETH | **719** | **24799211** | `0x64af5140d9f5d58244a925dc466ec5afc520b76cdf800cb827ffbf310b79f08b` | 2026-04-03T12:49:59Z | `0xe66b4fafaaf65e0d7fd8b038d0371019ed6c939b3a67a2c515c8956c966eaecc` | 30111 | **10000000000000000000000** | 14400 |
| **increase** | OP | **22** | **149815468** | `0x407525f355bfb380be6772c14981261a9de70edf50020bd977f2e1d1c85628c4` | 2026-04-03T15:21:53Z | `0xef1f04876e07e9d91d4a1072abc4b913ba6646eb01fc3f173d9c0b31beb019ec` | 30101 | **10000000000000000000000** | 14400 |
| **reversion** | ETH | **726** | **24879181** | `0x9847533bd1c32226498d75814d3b4e9ab9027debaa29cb56ea42ae94bfaffd60` | 2026-04-14T16:18:47Z | `0x8988dac4264734675b6b8da385e03d53b32e0605422ac4983fbdbe86bcd8faa1` | 30111 | **3000000000000000000000** | 14400 |
| **reversion** | OP | **23** | **150292394** | `0x27bc10dc610247e2a439c1e9382de7187e8ae64fe795417f4cbef37a2250293b` | 2026-04-14T16:19:25Z | `0x6564b0083c7d012cd83eea1184dcea53262524162619e87ea653276fe11bb493` | 30101 | **3000000000000000000000** | 14400 |
| **SecurityUpgrade (LAST WRITER)** | ETH | **733** | **24924948** | `0x61df48449dd231528f4866c504d599aa0fbd725a06dfd11628f5311945b2cf4e` | 2026-04-21T01:17:47Z | `0xb2d726d24d50a88338fced2406de132817fb9d22a0cae3d4f1929e494f1f30fb` | 30111 | **3000000000000000000000** | 14400 |
| **SecurityUpgrade (LAST WRITER)** | OP | **24** | **150567893** | `0xad4e22a313b994d6215664602c36f56ab79388243525476055a170543b82a5d6` | 2026-04-21T01:22:43Z | `0xcce39e18c71c9896dc48f144c162814c2ba03d47e291813d19575979401737f7` | 30101 | **3000000000000000000000** | 14400 |

Every row is outbound **and** inbound — symmetric, both decoded separately, identical values.

### 3.3 Full-word derivations for the three contested writes

The only three distinct words that carry the answer:

```
peerEid  0x000000000000000000000000000000000000000000000000000000000000759f -> 30111   (0x759f)
peerEid  0x0000000000000000000000000000000000000000000000000000000000007595 -> 30101   (0x7595)
limit    0x00000000000000000000000000000000000000000000021e19e0c9bab2400000 -> 10000000000000000000000 wei
                                                                            -> 10000 weETH exactly (remainder 0)
limit    0x0000000000000000000000000000000000000000000000a2a15d09519be00000 -> 3000000000000000000000 wei
                                                                            -> 3000 weETH exactly (remainder 0)
window   0x0000000000000000000000000000000000000000000000000000000000003840 -> 14400 s = 4 h
```

Per-exhibit, with array header words consumed and arity asserted:

| Exhibit | logIndex | arrayLen | peerEid word | limit word | window word |
|---|---|---|---|---|---|
| ETH 24799211 outbound | 646 | 2 | `…759f` | `…021e19e0c9bab2400000` | `…3840` |
| ETH 24799211 inbound | 647 | 2 | `…759f` | `…021e19e0c9bab2400000` | `…3840` |
| ETH 24879181 outbound | 190 | 2 | `…759f` | `…a2a15d09519be00000` | `…3840` |
| ETH 24879181 inbound | 191 | 2 | `…759f` | `…a2a15d09519be00000` | `…3840` |
| ETH 24924948 outbound | 324 | 19 | `…759f` | `…a2a15d09519be00000` | `…3840` |
| ETH 24924948 inbound | 325 | 19 | `…759f` | `…a2a15d09519be00000` | `…3840` |
| OP 149815468 out/in | 283 / 284 | 2 | `…7595` | `…021e19e0c9bab2400000` | `…3840` |
| OP 150292394 out/in | 253 / 254 | 2 | `…7595` | `…a2a15d09519be00000` | `…3840` |
| OP 150567893 out/in | 419 / 420 | 19 | `…7595` | `…a2a15d09519be00000` | `…3840` |

### 3.4 Batch-shape forensics — and a corpus gap

Decoded array membership (OBSERVED):

- 2026-04-03 (10,000): ETH `[30214, 30111]`, OP `[30214, 30101]` — 2 EIDs. Matches WR1's `increase-rate-limits` batch shape.
- 2026-04-14 (3,000): ETH `[30214, 30111]`, OP `[30214, 30101]` — **the identical 2-EID shape, opposite value**. This is a deliberate, targeted reversion of the 04-03 increase.
- 2026-04-21 (3,000): 19 EIDs, the blanket `SecurityUpgrade` set.

**INFERRED, flagged:** WR1's reviewed `output/*.json` set (SOURCED, `roadmap/research/WR1/expected-route-policy.md:296-305`) contains **no batch matching the 04-14 reversion**. WR1 itself notes (`:492`) it did not exhaustively search all ~90 `output/` files, so I cannot claim the batch is absent from the tree — only that **the declared-intent corpus WR1 reviewed does not contain the write that decided the question**. That is the load-bearing lesson: the repo tree is a statement of intent; the chain is the record.

### 3.5 Completeness — how I know nothing later moved it

Four independent legs:

1. **Event-level completeness.** `_setOutboundRateLimits`/`_setInboundRateLimits` unconditionally `emit` (source L105, L128). Every write emits; the ledger is the full write history regardless of caller.
2. **Authorization closure.** Both setters are `external onlyOwner()` — OBSERVED `contracts/EtherFiOFTAdapterUpgradeable.sol` L52/L56 (sha256 `62a89a04…`) and `contracts/EtherfiOFTUpgradeable.sol` L68/L72 (sha256 `2613fced…`). Ownership history is fully enumerated (§6.1), so the writer set is closed.
3. **No silent-write upgrade.** `Upgraded(address)` history: ETH adapter last upgraded blk **21366263** → `0xa82cc578927058af14fd84d96a817dc85ac4f946`; OP OFT last upgraded blk **129082737** → `0x70d7e0c93d8443325550ba3f71576f5f346b8aa9`. **Both predate the entire 2026 contested window**, so the event-emitting code path was constant throughout. (Digests `d8fe1539…`, `4dedede8…`.)
4. **Post-window sweep, independent provider.** OP Labs canonical `mainnet.optimism.io`, range `[150567893, 154750423]`, 10k steps, **419 chunks, 0 errors**, artifact sha256 `3fd4855b0d25da50f1b15ec6dfd7fdf7f91e81af681236c0dd168b522da84b24`. Seven events found; the **only** one touching 30101 is the 2026-04-21 write itself. Later events at 152192876 / 153663267 / 154486119 touch other EIDs only.

Equivalently on ETH: later events at 25134295, 25194944, 25418960, 25574218 exist but **contain no 30111 entry** (decoded membership shown in the ledger).

**Honest strength statement.** ETH completeness is dual-provider full-range. OP completeness is: full-range single-provider (Tenderly) for the pre-window, **plus** an independent full-coverage sweep for the decisive post-window, **plus** the Safe transaction service (a wholly different acquisition path) independently yielding the same four 30101-touching writes at nonces 9/22/23/24. See §7 for the residual gap.

### 3.6 The Safe index is not load-bearing — it is bound to chain evidence

For all six decisive executions I pulled the transaction object and receipt and matched the Safe-service `safeTxHash` against the on-chain `ExecutionSuccess` payload (decoded from data word 0 — non-indexed in this Safe version):

| Chain | nonce | tx.to == controller Safe | selector | status | safeTxHash binding |
|---|---|---|---|---|---|
| ETH | 719 | ✅ `0x2aca7102…` | `0x6a761202` | `0x1` | ✅ `0x35dada57…` |
| ETH | 726 | ✅ | `0x6a761202` | `0x1` | ✅ `0x9f4d7771…` |
| ETH | 733 | ✅ | `0x6a761202` | `0x1` | ✅ `0x08a5b6a3…` |
| OP | 22 | ⚠ `0xa1dabef3…` (MultiSendCallOnly) | `0x8d80ff0a` | `0x1` | ✅ `0x002d1e05…` (3rd of 3) |
| OP | 23 | ✅ `0x764682c7…` | `0x6a761202` | `0x1` | ✅ `0x4619d408…` |
| OP | 24 | ✅ | `0x6a761202` | `0x1` | ✅ `0xacdd77d6…` |

**Structural finding worth carrying into Rewind's data model:** OP tx `0xef1f0487…` executes **three Safe nonces in one on-chain transaction** via MultiSendCallOnly. Log interleaving:

```
logIndex 278  ExecutionSuccess  safeTxHash=0x110b718d…      (nonce 20)
logIndex 281  ExecutionSuccess  safeTxHash=0x3154873d…      (nonce 21)
logIndex 283  OutboundRateLimitsChanged  eids=[30214, 30101]
logIndex 284  InboundRateLimitsChanged   eids=[30214, 30101]
logIndex 285  ExecutionSuccess  safeTxHash=0x002d1e05…      (nonce 22)
```
Safe nonce alone does not order state changes within a block. **`(blockNumber, transactionIndex, logIndex)` is the only sound ordering key**, and attributing an effect to a governance action requires log-position containment, not tx-level association.

---

## 4. G-03 — setPeer PROVENANCE

Full `PeerSet` history, both OApps, block 0 → latest. ETH dual-provider, **agreement: True** (`54a717d0a1bdfad6…` / `0c5ffc3cbdf5b100…`); OP Tenderly (`77111cbc44cc8072…`). 21 events each side.

### ETH adapter `0xcd2eb13d…` — EID 30111, set once, never superseded

| Block | Tx | word0 (eid) | word1 (peer bytes32) | Decoded |
|---|---|---|---|---|
| 20865344 | `0x0938744d97cf79b8c59975f1f7b897443382c47b39116c6b7c397bb2cab8861c` | `…0000759f` → 30111 | `0x0000000000000000000000005a7facb970d094b6c7ff1df0ea68d99e6e73cbff` | `0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff` |

High 12 bytes asserted zero. Block hash `0xb6266f8e10b7e9aa5ee1cf7cc30051f2387b14682d0494c6d07470bdfd0ff8e0`, ts 2024-09-30T18:44:11Z. **Provenance note (OBSERVED):** this write at blk 20865344 precedes the ownership transfer to the L1 controller Safe at blk 20865366 — it was performed under deployer control `0xafa61d537a1814de82776bf600cb10ff26342208`, in the same deployment sequence as blocks 20865340–20865347.

### OP OFT `0x5a7facb9…` — EID 30101, set twice, **superseded**

| # | Block | Tx | word1 (peer bytes32) | Decoded | Status |
|---|---|---|---|---|---|
| 1 | 120917167 | `0xbc4073562795cc124828bf098a510c7718c4d45957d6c964e146b8632e0e32e3` | `0x000000000000000000000000fe7fe01f8b9a76803af3750144c2715d9bcf7d0d` | `0xfe7fe01f…` | **SUPERSEDED** |
| 2 | 126404187 | `0x5e989ed2aacbece642194baef2169e9688bf99b68be2398f91570d0ba6bab68b` | `0x000000000000000000000000cd2eb13d6831d4602d80e5db9230a57596cdca63` | `0xcd2eb13d…` | **current** |

Block hashes `0x70c7f7ea5760855dc5c538b3716543aeec2b84edd67d7a007fe15b782dc3146c` (ts 2024-06-03T16:45:11Z) and `0x914d316b3e6942247297f894df056050e739549cf301ebbab16744633c4b28fe` (ts 2024-10-08T17:05:51Z).

**What `0xfe7fe01f…` is (OBSERVED, characterized by `eth_call`, not by label):**
- `token()` → `0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee` — the **same L1 weETH token** the current adapter is bound to (SOURCED WR1 S8 `0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee`)
- `endpoint()` → `0x1a44076050125825900e736c501f859c50fe728c` — the same EndpointV2
- `owner()` → `0x2aca71020de61bb532008049e1bd41e451ae8adc` — the **same L1 controller Safe**
- runtime code 10,956 bytes, sha256 `3a2e2319ed3caded93765ec9e5b1f85bc2cd13608596e27865ebc2b119a21dfe`

**INFERRED:** a *prior* L1 weETH OFT adapter, retired in favour of `0xcd2eb13d…` during the 2024-09-30 → 2024-10-08 migration. The ETH side stood up its peer on 09-30; the OP side repointed on 10-08 — an **8-day one-sided-peer interval**, which is exactly the asymmetric-peer condition the engineering spec's negative fixture 14 exists for, occurring for real in this route's history.

**Route-liveness corroboration for G-11 (INFERRED, affirmative):** the most recent peer activity is **revocation of other pathways** — ETH blk 25574218 sets EID 30332 → `0x0`; OP blk 154486119 sets seven EIDs (30214, 30335, 30362, 30165, 30260, 30243, 30322) → `0x0`. The 30101/30111 pair is untouched by any zeroing. Decommissioning is visibly in progress around this route and deliberately not applied to it.

---

## 5. G-04 — LIBRARY PIN-IN-PLACE

**Verdict: explicit pins EXIST.** The blog's assertion is corroborated, and the reason WR1 could not find them is that they are in a *different batch* from the `setConfig` batches — one day later.

### The pin transactions

| Chain | Safe nonce | Block | Block hash | Timestamp | Tx |
|---|---|---|---|---|---|
| ETH | 738 | 24932629 | `0xf32d60a1a167f99ac7321f8f6388839e97eaa1059e701f539bbd4493e67cfae1` | 2026-04-22T02:58:11Z | `0xca11434964000163e235a912e4d512c0b6a0faaf513e6ca5db261560bcc3bf82` |
| OP | 25 | 150613167 | `0x24216ba6d39f14159b85f38c442d31afc9de5dc54ddd8d6614cfe72771b3f9c7` | 2026-04-22T02:31:51Z | `0xb31ae147b1fd13bf8ef1a05962d30c755c7b1bb531aca0d1e3b33e26dae4d587` |

Each: `status = 0x1`, 19 × `SendLibrarySet` + 19 × `ReceiveLibrarySet` + 19 × `ReceiveLibraryTimeoutSet`, emitter `0x1a44076050125825900e736c501f859c50fe728c` (EndpointV2). Receipt digests `80f381858053a822…` (ETH), `9b401a9cf40e9002…` (OP).

**Decoded calldata (from Safe batch, `multiSend[18]` / `multiSend[37]`) — full words:**

ETH, `setSendLibrary(address,uint32,address)` sel `0x9535ff30`:
```
word[0] 0x000000000000000000000000cd2eb13d6831d4602d80e5db9230a57596cdca63 -> oapp   = 0xcd2eb13d…
word[1] 0x000000000000000000000000000000000000000000000000000000000000759f -> eid    = 30111
word[2] 0x000000000000000000000000bb2ea70c9e858123480642cf96acbcce1372dce1 -> newLib = 0xbb2ea70c… (L1 SendUln302)
```
ETH, `setReceiveLibrary(address,uint32,address,uint256)` sel `0x6a14d715`: same oapp/eid, `newLib = 0xc02ab410f0734efa3f14628780e6e695156024c2`, **`gracePeriod word = 0x00…00 -> 0`**.
OP, mirrored: `oapp = 0x5a7facb9…`, `eid word 0x…7595 -> 30101`, send `0x1322871e4ab09bc7f5717189434f97bbd9546e95`, receive `0x3c4962ff6258dcfcafd23a814237b7d6eb712063`, gracePeriod `0`.

All four addresses match WR1 §2.3 exactly (SOURCED `roadmap/research/WR1/expected-route-policy.md:142-145`).

Receipt-level events decoded identically (ETH logIndex 667/704/705; OP logIndex 125/162/163), including `ReceiveLibraryTimeoutSet(oapp, eid, oldLib=0x0, timeout=0)` — i.e. **no grace period, no timeout window on the old library**.

### Supersession check — full Endpoint history, both chains

| Chain | Range | Chunks | Errors | Total library events | Artifact sha256 |
|---|---|---|---|---|---|
| ETH | 0 → 25619467, 1M steps | 26 | **0** | 8260 | `78ba08b3255f6133fff1015fc50cd3611e04e18c97ea6c02a3486f1dd331dfb7` |
| OP | 0 → 154750423, 2M steps | 78 | **0** | 3705 | `3fe3d4eafd1c88fad90bee3d9dccd837da4c32bb35890f70c5db41b1d6262f12` |

**Result:** across the Endpoint's entire life on both chains, our two OApps appear in library-set events in **exactly one transaction each** — the ones above. For EID 30111/30101 there is **no earlier pin and no later change**. (The only other appearance is a later pathway addition for EID 30416: ETH blk 25418960, OP blk 153663267.)

### The finding that makes the blog claim precise

Default libraries for these EIDs, decoded from the same sweep:

| Chain | Event | Block | Library |
|---|---|---|---|
| ETH | `DefaultSendLibrarySet(30111)` | 19094406 | `0xbb2ea70c9e858123480642cf96acbcce1372dce1` |
| ETH | `DefaultReceiveLibrarySet(30111)` | 19094406 | `0xc02ab410f0734efa3f14628780e6e695156024c2` |
| OP | `DefaultSendLibrarySet(30101)` | 115358461 | `0x1322871e4ab09bc7f5717189434f97bbd9546e95` |
| OP | `DefaultReceiveLibrarySet(30101)` | 115358459 | `0x3c4962ff6258dcfcafd23a814237b7d6eb712063` |

**The defaults were already byte-identical to the pinned values.** So, precisely:
- Before blk 24932629 / 150613167 the route resolved via **LayerZero-controlled defaults**, and the effective libraries were the same addresses.
- After, the same addresses are held in the **OApp-specific slot**.
- **What changed is who may change it**, not what it is. This is exactly the blog's claim, now with evidence, and it settles the manifest's `mustBeExplicit: true` predicate: expected value = the four addresses, and the not-default flag is expected `true` **only for boundaries at or after** those blocks. For any earlier boundary the honest expected state is *default-resolved*.

---

## 6. ADJACENT FINDINGS THAT CHANGE THE BLUEPRINT

### 6.1 Ownership moved to timelocks — E7's "zero latency" is now false

`OwnershipTransferred` full history (digests `c7b7fab65aa697be…`, `93e00eeb9dbfb532…`):

**ETH adapter `0xcd2eb13d…`**
| Block | From → To |
|---|---|
| 20865339 | `0x0` → `0xafa61d537a1814de82776bf600cb10ff26342208` (deployer) |
| 20865366 | deployer → `0x2aca71020de61bb532008049e1bd41e451ae8adc` (L1 controller Safe) |
| 21366263 | Safe → Safe (re-init during upgrade) |
| **25296945** | Safe → **`0xcd425f44758a08baab3c4908f3e3de5776e45d7a`** — ts 2026-06-11T21:36:35Z, hash `0x683c056c4bb1f8b08631e2565dbbc7560750973a24d8a493c39c26553eefa83f` |

**OP OFT `0x5a7facb9…`**
| Block | From → To |
|---|---|
| 120917167 | `0x0` → `0xc83bb94779c5577af1d48df8e2a113dff0cb127c` (deployer) |
| 121013372 | deployer → `0x764682c769ccb119349d92f1b63ee1c03d6aecff` (OP controller Safe) |
| **154486119** | Safe → **`0x851dd540f4d2ec78120de0a0cc87b21ede5df5c6`** (the L2 timelock, SOURCED WR2 P8) — ts 2026-07-20T18:10:15Z |

Both new owners are TimelockControllers, confirmed by `MinDelayChange` history (full-word decoded):

| Timelock | Block | old word → new word | Delay |
|---|---|---|---|
| ETH `0xcd425f44…` | 22089226 | `0x…0000` → `0x…7080` | 0 → **28,800 s** |
| ETH `0xcd425f44…` | 24895807 | `0x…7080` → `0x…02a300` | 28,800 → **172,800 s (2 days)** |
| OP `0x851dd540…` | 139414997 | `0x…0000` → `0x…03f480` | 0 → **259,200 s (3 days)** |

**Consequences for the manifest:**
1. Blueprint §2 E7 ("Changing authority: OApp owner … **Zero latency**") and E3/E8's zero-latency framing are **stale for rate limits and peers** as of ETH blk 25296945 / OP blk 154486119. Rate-limit and peer changes now require a scheduled timelock operation: **≥2 days on ETH, ≥3 days on OP**.
2. Blueprint S7 G-08 expected `owner()` = controller Safes. **On-chain, that is no longer the live value on either chain.** Authoring the Safes as expected owner today would produce a false drift alarm. The reviewable expected value is now the timelock on each chain, with the Safe as (presumed) proposer/executor — the proposer/executor role assignment is *not* established here (see gaps).
3. The **259,200 s** value — the one INS-035ae3e4 records as having been misread as 16,200 — is now confirmed by full-word decode of an **on-chain event** (`0x…03f480`), upgrading WR2 P8 from deploy-script declaration to chain evidence. This also supplies an expected-side path for G-07's sibling.
4. `0xcd425f44758a08baab3c4908f3e3de5776e45d7a` is **not** the L1 timelock WR2 names (`0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`, SOURCED WR2 §1a). It is a distinct, 2-day timelock now owning the L1 adapter. The control-plane map needs this entity added.

### 6.2 Declared implementations are the live ones (helps G-01, does not close it)

`Upgraded` events give the live implementation lineage: ETH adapter → `0xa82cc578927058af14fd84d96a817dc85ac4f946` since blk 21366263; OP OFT → `0x70d7e0c93d8443325550ba3f71576f5f346b8aa9` since blk 129082737. Both **match** WR1's declared values (SOURCED `expected-route-policy.md` S2 rows). This is *event-history corroboration that the declared upgrade landed* — it does **not** supply `expectedRuntimeCodeHash`, and per the blueprint's round-3 ruling it must not be used to seed one. G-01 stays open on its own terms.

### 6.3 WR5 gap G5 incidentally closed

WR5 lists selector `0xe96e38e2` (lead L-30) as unidentified (SOURCED `roadmap/research/rehearse-selection/wr5-ruling.md:254`). Derived here: **`0xe96e38e2` = `setOutboundRateLimits((uint32,uint256,uint256)[])`**, from the pinned-commit struct definition. Sibling `0xf51b1aca` = `setInboundRateLimits(...)`.

### 6.4 G-14 anchors now available

Validity-window anchor candidates from the 26Q2 batches: ETH `fromBlock` 24924948 (config) / 24932629 (library pin); OP 150567893 / 150613167. **INFERRED:** the honest anchor for a manifest asserting `mustBeExplicit: true` is the *later* pair — 24932629 / 150613167 — because before those blocks the not-default predicate would fail by construction.

---

## 7. GAP LIST

| # | Gap | Status |
|---|---|---|
| **GAP-1** | **OP pre-window completeness is single-provider.** The OP ledger for blocks < 150567893 rests on Tenderly alone. The PublicNode 50k sweep failed **696/696 chunks** (`-32602` archive-token refusal, artifact `114b64ba8c106a6e…`); the OnFinality 100k sweep hit `-32029` rate limits (36/42 chunks failed on the post-window probe) and the full-range run had not completed at report time. **Mitigation in hand:** the Safe transaction service (independent acquisition path) yields the same four 30101-touching writes. **Closing recipe:** re-run `mainnet.optimism.io` at 10k steps over `[120917167, 150567893]` (~3,000 chunks, ~40 min) or use one funded archive endpoint. |
| **GAP-2** | **Post-2026-04-21 pathway for a *non-emitting* write is excluded by reasoning, not by exhaustive trace.** No `Upgraded` event occurred after 21366263/129082737, and both setters emit, so no silent write is possible — but this is a code-path argument, not a state-diff proof. A storage-slot diff at the two boundary blocks would make it airtight; that requires archive `eth_getStorageAt`, unprovisioned. |
| **GAP-3** | **Timelock proposer/executor role assignments not established** for `0xcd425f44…` (ETH). I confirmed it is a TimelockController with a 2-day delay and that it owns the adapter; I did **not** enumerate `RoleGranted` to determine who may propose/execute. Required before the control-plane row can name a live authority. |
| **GAP-4** | **The 2026-04-14 reversion batch has no located declared-intent artifact.** WR1's reviewed file set contains nothing matching it; the remaining ~90 `output/*.json` were not exhaustively searched (here or in WR1). Until located, the *reason* for the reversion is unknown — and Rewind may state the sequence but **not** the motive. |
| **GAP-5** | **Delegate (`delegates(oapp)`) not read.** Library and `setConfig` authority is delegate-gated, not owner-gated. The ownership move to timelocks does **not** by itself imply the *library/DVN* change path is timelocked. G-08's delegate half remains open and is now more urgent than before. |
| **GAP-6** | **`expectedRuntimeCodeHash` (G-01) untouched** — out of scope here, and deliberately not seeded from any observation made in this lane. |

---

## 8. CLAIM-STRENGTH DISCIPLINE

- Everything in §3–§5 is **OBSERVED** — decoded by my decoder from raw calldata or raw log `data`, every response body hashed, every effective URL recorded. No explorer label, decode, or annotation was consulted.
- **I did not read `outboundRateLimits(30111)` / `inboundRateLimits(30101)` at head, deliberately.** That getter read is the *observed-side* check that a separate lane must perform blind, and this dossier is expected-side evidence. Reading it here and reporting it as the answer would collapse the acquisition-path separation the blueprint's §4 preamble forbids. My last-writer claim is derived from **governance-execution history**, which §4 explicitly admits as an expected-side path. The two must be compared by the engine, not by me.
- The last-writer claim is **"no write after block 24924948 / 150567893 altered this key,"** grounded in event completeness plus authorization closure. It is *not* a claim about current storage — those are different assertions, and only the observed lane may make the second.
- Supersession is reported as supersession: the 10,000 value **was** live for 11 days (2026-04-03 → 04-14). A Rewind reconstruction of any boundary in that interval must return 10,000, not 3,000. The record retains both.
- Causality is not claimed anywhere: I state that the 04-14 batch wrote 3,000 to the same two EIDs the 04-03 batch had raised. I do **not** claim it was executed *because of* the increase — no public artifact establishes intent (GAP-4).

---

## 9. VERDICT

**G-02 — RECONSTRUCTABLE. CLOSED.** Last-writer at head is **3,000 weETH (`3000000000000000000000` wei) / 14,400 s**, outbound and inbound, both chains, written 2026-04-21 (ETH blk 24924948, OP blk 150567893). WR1's C2 naming inference is **refuted by execution order**. Manifest may pin this value at reviewed-evidence strength, with a validity window opening at those blocks.

**G-03 — RECONSTRUCTABLE. CLOSED.** Both peer values recovered from `PeerSet` events with full-word decodes; ETH set once and never changed, OP superseded once (2024-10-08). Values match WR1's derivation; claim strength upgraded from derived to decoded-on-chain.

**G-04 — RECONSTRUCTABLE. CLOSED, with the answer being "yes, pinned."** Explicit `setSendLibrary`/`setReceiveLibrary` executed 2026-04-22 on both chains, 19 pathways each, EID 30111/30101 included, `gracePeriod = 0`; full-history Endpoint sweeps (0 chunk errors) confirm no earlier pin and no later change. The pre-existing defaults were the identical addresses, which is what makes the blog's "bridging behavior unchanged" claim true and precise.

**Carried finding — NOT RECONSTRUCTABLE AS POSED:** the blueprint's rate-limit and peer **change-latency** entries. They are posed as "zero latency, one Safe execution." That is no longer the chain's answer: both OApps are timelock-owned (ETH 2 days since blk 25296945; OP 3 days since blk 154486119). The latency cell needs re-posing as a time-varying property with its own supersession record — which is precisely the design point Rewind exists to serve.

---

## 10. REPRODUCTION

All artifacts, scripts, and the acquisition ledger are under:
`C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\`

| File | Role |
|---|---|
| `keccak.py` | Pure-Python Keccak-256 + 7-vector self-test |
| `decode.py` | Full-32-byte-word decoder with truncation/arity guards |
| `fetch.py` | Hashing fetcher (raw body sha256 + effective URL → `ledger.jsonl`) |
| `sweep.py` | Chunked getLogs with whole-sweep content addressing |
| `harvest_safe.py`, `scan_route.py` | Safe history harvest + MultiSend unwrap and selector scan |
| `ratelimit_ledger.py` | Dual-provider rate-limit event ledger |
| `ledger.jsonl` | 127 acquisitions: effective URL, HTTP status, sha256, note |
| `raw\` | Every raw response body, byte-for-byte |

Repo files read (not modified): `roadmap/research/route-manifest/blueprint.md`, `roadmap/research/WR1/expected-route-policy.md`, `roadmap/research/WR2/authority-map.md`, `roadmap/research/rehearse-selection/wr5-ruling.md`, `roadmap/insights/INS-035ae3e4-…md`.
