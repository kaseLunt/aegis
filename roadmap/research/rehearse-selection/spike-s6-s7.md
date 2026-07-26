<!-- S6/S7 de-risking spike report — rehearsal-master standing lane, 2026-07-26.
Persisted verbatim by the orchestrator from the lane's final report. Executes the spikes
authorized by D-74472e1d ("Ratify + early spikes"); all execution in a scratch project
outside the repo. HEADLINES: S6 GATE-FAIL (EDR deposit-nonce catch-22 — M4 gate case is
L1-only per the ruling's own rule; a weaker disclosed criterion exists as an unexercised
owner waiver); S7 MEASURED (52/52 gas-faithful prefix replay; 912 logical RPC calls; 1.5 s
state-resident vs ~24 min cold-remote INFERRED — the CLI-artifact architecture holds, and
the 5.8 MiB pinned-state bundle makes third-party re-execution concrete). Also: two further
hex-misread strikes (4th and 5th in the corpus) and a runtime refutation of wr5's
"pinning is structural" CANON claim. -->

# SPIKE REPORT — S6 (OP gate) and S7 (budget probe)

**S6 VERDICT: GATE-FAIL** — EDR 0.14.2 cannot reproduce the canonical receipts root of OP block 133508663. The divergence is confined to exactly one field (`depositNonce`) of one receipt (index 0, the type-`0x7E` deposit), but that field is consensus-load-bearing and **no configuration of EDR's public API can produce the correct value**. Cause is *not* the one the wave-1 ruling predicted: deposit support is present and executes faithfully; the blocker is that EDR applies ordinary mempool nonce validation to deposits.

**S7 VERDICT: MEASURED, NO EXTRAPOLATION NEEDED** — the full 52-transaction prefix of L1 block 22099914 replayed successfully on EthereumJS v10.1.2, reproducing canonical `gasUsed` on **52/52** transactions, at a cost of **912 logical RPC calls**. Wall time splits sharply: **1,499 ms** with state resident locally versus **~24 min INFERRED** fully cold against free public archive RPC. The CLI-artifact conclusion holds, but for a different reason than the ruling assumed — the bottleneck is state round-trips, not the engine.

---

## 0. Environment record (OBSERVED)

| Item | Value |
|---|---|
| `node --version` | **v22.20.0** (clears EDR's `engines: node >= 22`) |
| `npm --version` | 10.9.3 |
| platform | `win32 x64` |
| `@nomicfoundation/edr` | **0.14.2**, MIT, binary `@nomicfoundation/edr-win32-x64-msvc@0.14.2` (24,752,128 bytes) |
| `@ethereumjs/{vm,statemanager,block,tx,common,util,rlp,mpt,evm}` | **10.1.2** |
| `ethereum-cryptography` | 3.2.0 |
| Scratch project | `C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\spike\` |

**Nothing was installed into or modified in `C:\Users\kasel\source\repos\etherfi\aegis`.** No repo file was read for write purposes; the repo was read only for the decision record and the wave-1 ruling.

---

## 1. S6 — the OP gate

### 1.1 API divergence: what the package actually exports

The ruling's CANON claims were checked against the installed package (OBSERVED, 90 total exports):

| Claimed symbol | Status | Note |
|---|---|---|
| `OP_CHAIN_TYPE` | **PRESENT**, `string` | value is `"op"` (`L1_CHAIN_TYPE` is `"L1"`) |
| `opProviderFactory` | **PRESENT**, `function` | works as documented |
| `OpHardfork` | **DIVERGENT** | declared in `index.d.ts` as `enum { Bedrock=100 … Isthmus=107 }`, but **`edr.OpHardfork` is `{}` at runtime** — the napi layer does not materialise it |

Two further divergences worth carrying into any Aegis binding:

1. **`opHardforkFromString` accepts only exact PascalCase.** OBSERVED: `'Holocene'` → `106`; `'holocene'`, `'HOLOCENE'`, `'isthmus'`, `'granite'` all **throw** `InvalidArg`. Since `ProviderConfig.hardfork` is typed as a bare `string`, a lowercase hardfork name is a runtime throw, not a type error. The exported constants (`edr.HOLOCENE === "Holocene"`) are the only correct source.
2. **`AccountOverride.storage` is explicitly non-functional** — the type declaration itself says *"BEWARE: This field is not supported yet. See NomicFoundation/edr#911"*. Storage overrides are unavailable in 0.14.2. This bears directly on state-override disclosure (ruling criterion 2): a storage override cannot be applied at all, let alone disclosed.

`EdrContext` is a **process-global singleton** — OBSERVED warning on second construction: *"Failed to set global tracing subscriber… Please only initialize EdrContext once per process."* A CLI forking several chains must design around this.

### 1.2 Correction to my own work: the target block hex

My first hand-converted hex for block 133508663 was `0x7f51ab7`, which is block **133503671** — 4,992 blocks off. I caught it only because the fetch script computed the value programmatically. Everything from that probe (including a receipts root of `0x533c02da…`) was discarded and is **not** evidence. I made the same class of error a second time on L1 (`0x151014a` = 22085962, not 22099914).

This is the third and fourth occurrence of the hex-misread class the wave-1 ruling flagged as "three strikes." It is now empirically clear that hand hex conversion is the single most reliable source of error in this corpus. **Recommend the mechanical check be broadened**: any block number, calldata word, or numeric literal appearing in a deliverable must be produced by executed code, never by hand.

### 1.3 Canonical target (OBSERVED, `https://mainnet.optimism.io`)

Cached at `…\spike\op-133508663.json`, sha256 `aacebc9fa5b83f396c8c6fe05883aaa605a3cdb981cb1da121855ebe94f3a259`.

```
block      133508663 = 0x7f52e37
hash       0xec31e350828a195c0e6450150dbfbfc086235e310ebd1c12cc1b96ff7a34eedc
parent     0xe2a72a48e72f5cfb4f5bc04e1f5b633f2b00bbd405f62478c9083647ca0312e3
receiptsRoot 0xfb526c202e8ed8bbf0f38415e1c1e18fabbda9a7708781be8f9a2d571e675709
timestamp  0x67de3627 = 2025-03-22T04:01:43Z
gasUsed    0x942d41   gasLimit 0x3938700   baseFee 0x2f9a6
35 transactions, type histogram {0x7e:1, 0x2:17, 0x0:17}
```

The type histogram **exactly reproduces the wave-1 ruling's OBSERVED claim** (`§3 item 8`). wr5's OP block characterisation is independently confirmed.

Index-0 deposit (OBSERVED):
```
hash        0x2a46841e31d63f4d9010a0f45812de5f431be967719388daa14048a91e75246c
from        0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001   r = s = v = 0
to          0x4200000000000000000000000000000000000015   (L1Block predeploy)
sourceHash  0x190f53a3697e90fdac670685d05e4b0d4d60afb9967f895337f67e376df1bef8
mint 0x0  value 0x0  gas 0xf4240  gasPrice 0x0
depositNonce 0x1af6bc1 (= 28273601)   depositReceiptVersion 0x1
selector    0x440a5e20  (setL1BlockValuesEcotone)
```
`r = s = v = 0` **confirms the ruling's permanent boundary item**: the deposit sender is an RLP *field*, asserted, never signature-recovered. That is true of the canonical envelope itself, on any stack.

### 1.4 Two self-proofs run before judging the engine

**Checker self-proof.** An independent receipts-root deriver (`@ethereumjs/mpt` + RLP; OP deposit receipts encoded as `0x7e || rlp([status, cumGas, bloom, logs, depositNonce, depositReceiptVersion])`) reproduced the canonical root from the canonical receipts **exactly**. Negative-tested twice:
- perturb index-0 `cumulativeGasUsed` by +1 → root changes (checker is not blind);
- drop `depositNonce`/`depositReceiptVersion` → root changes to `0x8303aecc…`.

The second negative test establishes the fact the whole gate turns on: **`depositNonce` is consensus-load-bearing for the OP receipts root.**

**Envelope self-proof.** All 35 canonical transactions were reconstructed byte-exactly from RPC JSON and verified by `keccak256(envelope) == canonical hash` — **35/35**, including the deposit at `isSystemTx = false` (the `true` variant hashes differently, so the flag is pinned by the hash, not assumed). Any downstream rejection is therefore the engine's, not my encoding's.

### 1.5 The failure boundary, located precisely

Submitting the canonical deposit envelope to EDR gave (OBSERVED):

```
eth_sendRawTransaction(0x7ef8f8a0190f53a3…)
-> {"code":-32000,"message":"Transaction nonce too low.
    Expected nonce to be at least 28273601 but got 0."}
```

This is **not** "unsupported transaction type." Discrimination tests confirm the decode succeeded:

| Input | Result |
|---|---|
| `0x7e` + junk | `-32602 "input too short"` — a deposit-payload parse error |
| `0x7d` + junk | `-32602 "Invalid transaction type 125."` — type not recognised |

EDR recognises `0x7E`, decodes the deposit fields, and resolves the sender from the unsigned envelope. It then applies **ordinary mempool nonce validation**. A deposit envelope carries no nonce field, so it is read as `0`, and `0 < 28273601` rejects it.

Supporting evidence that deposit *execution* semantics are compiled in — native binary strings (OBSERVED): `DepositTransactionParts`, `is_system_transaction`, `DepositSystemTxPostRegolithHalted`, `MissingDepositNonce`, `sourceHash`, `depositNonce`, `depositReceiptVersion`.

Deposit modelling on the **read** path is complete (OBSERVED): reading the parent block through EDR returns `type 0x7e` with `sourceHash` and `mint` decoded, and the receipt returns `type 0x7e`, `depositNonce 0x1af6bc0`, `depositReceiptVersion 0x1`.

RPC method-surface enumeration from the binary shows the only submission entry points are `eth_sendRawTransaction{,Sync,Conditional}` and `eth_sendTransaction{,Sync}`. **There is no deposit-aware injection method** (`op_sendDepositTransaction`, `debug_sendDepositTransaction`, `eth_sendDepositTransaction` all absent — probed live, all `ABSENT`).

### 1.6 The catch-22 (the finding that makes this a hard FAIL)

`hardhat_setNonce` **refuses to decrease** a nonce (OBSERVED: *"New nonce (0) must not be smaller than the existing nonce (28273601)"*). The only remaining lever is `ProviderConfig.genesisState` → `AccountOverride.nonce`. Two arms were run:

| Arm | Depositor nonce | Admission | `depositNonce` in receipt |
|---|---|---|---|
| **A** | forced to `0` | **ACCEPTED**, hash `0x2a46841e…` **equals canonical** | `0x0` — **wrong** (canonical `0x1af6bc1`) |
| **B** | set to canonical `28273601` | **REJECTED** — "nonce too low… got 0" | n/a |

The two requirements are mutually exclusive by construction: *admission* requires account nonce `0`; *receipt fidelity* requires account nonce `= canonical depositNonce`. **For every OP block whose `depositNonce` is non-zero — i.e. every OP block after the first — EDR 0.14.2 cannot both admit the deposit and record the correct `depositNonce`.** (INFERRED generalisation from a mechanism observed on one block; the mechanism is structural, but only one block was tested.)

### 1.7 Full 35-transaction replay result (OBSERVED)

Forked at parent 133508662; one disclosed override (depositor nonce → 0); all 35 canonical envelopes submitted in order; one block mined at the canonical timestamp.

```
submitted 35/35, rejected 0        replay wall time 343,635 ms (cold cache)

                    EDR                              canonical
number         0x7f52e37                             0x7f52e37     MATCH
tx count       35                                    35            MATCH
timestamp      0x67de3627                            0x67de3627    MATCH
baseFeePerGas  0x2f9a6                               0x2f9a6       MATCH
gasUsed        0x942d41                              0x942d41      MATCH
gasLimit       0x3938700                             0x3938700     MATCH
receiptsRoot   0x682faf04bbf49a8c…4b19b0da           0xfb526c20…675709   MISMATCH
```

Per-receipt comparison on `{status, gasUsed, cumulativeGasUsed, logs, logsBloom, depositNonce, txhash}`: **34/35 identical**. The single divergence:

```
index 0 (0x7e): depositNonce 0x0 != 0x1af6bc1
```

My independent deriver reproduced EDR's own reported `receiptsRoot` from EDR's receipts (`0x682faf04…` both ways), cross-validating engine and checker.

**Notably, EDR reproduced whole-block `gasUsed` exactly (`0x942d41`)**, including the deposit's zero-gas semantics and the L1 data fee accounting on all 34 fee-paying transactions, and computed the canonical OP base fee from the parent unaided.

### 1.8 What S6 means for the M4 decision

The literal gate criterion fails. But the shape of the failure matters, and I want to separate two things the owner must not conflate:

- **Receipts-root reproduction (the harness acceptance test) — FAILS on OP.** No available configuration passes. Do not report otherwise.
- **Semantic effect fidelity (what Rehearse actually renders: storage diffs, logs, gas) — passes on this block at 34/35 receipts plus exact block gas**, with the deposit executing to canonical `status 0x1` and canonical `gasUsed 0xab33`.

Per the ruling's own rule ("if S6 fails, every OP candidate becomes `unknown` and the M4 case is L1-only"), **the M4 gate case is L1-only, and R1 stands.** That is the disposition I am recording.

Whether OP candidates may later ship under a *weaker, explicitly disclosed* acceptance criterion — per-receipt equality with a permanent, named `depositNonce` divergence — is an **owner decision, not mine**. It is a real option because the divergence is a single field with a known cause, but taking it means every OP retrospective ships with two permanent disclosable boundary items (asserted deposit sender; non-reproducible receipts root) and an acceptance test weaker than the one `docs/` currently implies. I am not exercising that waiver.

**Expiry conditions for the S6 result:** this verdict dies on (a) any EDR release that changes deposit admission — the fix is narrow and upstream may well make it; (b) any change to OP deposit receipt encoding at a future hardfork; (c) loss of canonicality of OP block 133508663. It carries no clock. It was measured on **one** OP block at Holocene; generalisation to other heights or hardforks is INFERRED.

---

## 2. S7 — the budget probe

### 2.1 Fork recipe confirmation (OBSERVED)

wr5's R1 recipe was independently re-derived and **matches on every field**:

```
target  22099914 = 0x15137ca
hash    0xdc9464f870b008f1094ba7c0644a52e63e68e9437229c91d468a0300cbeb3f68   MATCH
parent  0x32f339b394a53d120f88ab3a1f53fc84e2936aec7e97654505aafa3cfee5568a   MATCH
timestamp 0x67de36c7 = 2025-03-22T04:04:23Z                                  MATCH
baseFee 0x1a18aae7   gasLimit 0x2243e5b                                      MATCH
198 transactions                                                             MATCH
tx[52]  0x1a4ba83eb8635a108a4e3db1c6a602858bb7133fe50fd91b9fc2767aa784206b   MATCH
        to 0x2aca71020de61bb532008049e1bd41e451ae8adc, 1316 bytes calldata   MATCH
```

New (OBSERVED): type histogram `{0x2:181, 0x0:14, 0x3:3}`, with the three EIP-4844 blob transactions at indices **194, 195, 196** — all *after* index 52, so **the 52-tx prefix is blob-free**.

That matters, because EthereumJS **refuses to construct a blob transaction without a KZG-initialised `Common`**: `createBlockFromJSONRPCProvider` on this block throws *"A common object with customCrypto.kzg initialized required to instantiate a 4844 blob tx"*. A prefix-replay harness sidesteps this by building only the prefix; a **full-block** harness self-proof (ruling's S1) on any post-Dencun block will require a KZG backend as an additional dependency. Recording this as a gap.

### 2.2 Measurement semantics (stated so the numbers can be attacked precisely)

Instrumentation is a local counting proxy (`proxy2.mjs`) between the engine and upstream:
- **`logical`** = requests the *engine* issued. Counted **before** any cache lookup, so a warm cache cannot deflate it. This is the endpoint-independent budget number.
- **`wire`** = physical upstream HTTP requests (cache misses + failover retries).
- A local disk cache exists only to make a 52-tx run feasible against rate-limited free endpoints. It never affects `logical` — proven by the cold and fully-warm runs reporting the **identical 912**.

### 2.3 Provider refusal taxonomy (OBSERVED, 2026-07-26)

The wave-1 ruling recorded PublicNode's archive refusal as HTTP 403. Today it is different again:

| Endpoint | `eth_getCode` @22099913 | `eth_getStorageAt` | `eth_getProof` (burst of 8) |
|---|---|---|---|
| `ethereum-rpc.publicnode.com` | `403` `-32602 "Archive requests require a personal token"` | same | — |
| `eth.drpc.org` | `200` OK | `408` "Request timeout on the free plan" | **8/8 OK** |
| `eth.merkle.io` | `200` OK | `200` OK | **0/8 — all `429`** |
| `cloudflare-eth.com` | `-32603 Internal error` | same | — |
| `rpc.flashbots.net` | `-32603 "state at block #22099914 is pruned"` | same | — |
| `1rpc.io/eth` | `403` archive token required | `200` OK | 0/8 |
| `eth-pokt.nodies.app` | `200` OK | `200` OK | 0/8 |
| `eth.blockrazor.xyz` | `-32000 "historical state …"` | same | — |

**This is the third distinct refusal shape recorded for PublicNode across the corpus** (`-32602` → `403` → `-32602` with new text). The ruling's G9 ("provenance already rotting… an un-hashed URL is a citation, not evidence") is confirmed empirically a second time.

`gateway.tenderly.co/public/mainnet` **did** serve archive reads and was **deliberately excluded**: publishing a benchmark measured against it would collide with the Tenderly ToS findings in wr5 §4 (§1.1 personal-use, §1.4(vi) bar on publishing evaluations). Recording the refusal as self-imposed, not technical.

Final configuration: failover pool `drpc → pokt → 1rpc → merkle`, per-endpoint throttling. Observed endpoint statuses over the 52-tx run: `drpc 200:269, drpc 408:232, drpc 500:33, pokt 200:265`.

### 2.4 The numbers (OBSERVED)

Full 52-transaction prefix (indices 0–51) of block 22099914, forked at parent 22099913, `@ethereumjs/vm` 10.1.2, `Common(Mainnet, Prague)`:

| Metric | Value |
|---|---|
| transactions replayed | **52/52 successful** |
| **logical RPC calls** | **912** (911 in replay + 1 block fetch) |
| mean calls/tx | 17.5 |
| per-tx calls | **p50 7, p95 64, max 90** |
| method histogram | `eth_getStorageAt` **549**, `eth_getProof` **193**, `eth_getCode` **169**, `eth_getBlockByNumber` 1 |
| bytes downloaded | 2,575 KiB |
| **wall, state resident locally** | **1,499 ms** (mean 29 ms/tx; p50 11 ms, p95 105 ms, max 204 ms) |
| wall, partially warm (378/912 cached) | 713,756 ms |
| wall, fully cold — 10-tx calibration | 594,136 ms for 377 calls = **1,576 ms per logical call** |
| Phase 1 fork construction | **2 ms, 0 RPC calls** (RPCStateManager is fully lazy) |

**INFERRED**: a fully cold 52-tx prefix against this free public pool would take ≈ 912 × 1,576 ms ≈ **1,437,000 ms ≈ 24 minutes**. Labelled INFERRED because it extrapolates the cold 10-tx per-call rate; the partially-warm run's 713,756 ms is the OBSERVED lower bound.

### 2.5 Correctness, and what was deliberately not done

- **Envelope self-proof: 52/52** — every reconstructed prefix transaction hash equals the canonical hash.
- **Sender self-proof: 52/52** — `getSenderAddress()` **ecrecovers** and matches the RPC's asserted `from`. This confirms the ruling's claim that EthereumJS prefix replay is self-auditing.
- **Gas fidelity: 52/52 exact** against canonical receipts (`eth_getBlockReceipts`).

Precise claim: **gas-faithful on 52/52**. Logs, storage diffs, and state roots were **not** compared — do not read this as "faithful" without qualification.

**I deliberately stopped at index 51 and did not execute the R1 target at index 52.** Executing it would put its post-state effects into the research record, which is exactly the prediction-input contamination the ruling's G11 and `ENGINEERING_SPEC.md:701` forbid. The prefix is proven; the prediction path for M4 is left clean.

### 2.6 Correction to the ruling's CANON pinning claim

The wave-1 ruling states (§4, criterion 1) that `RPCStateManager` accepts `blockTag` as a block number or `'earliest'` **only**, that `'latest'`/`'pending'` are unsupported, and that *"pinning is structural, not a discipline you can forget."*

**That is false at runtime in v10.1.2.** OBSERVED:

```
new RPCStateManager({ blockTag: 'latest'  })  -> ACCEPTED, internal _blockTag = "0xlatest"
new RPCStateManager({ blockTag: 'pending' })  -> ACCEPTED, internal _blockTag = "0xpending"
new RPCStateManager({ blockTag: 'earliest'})  -> ACCEPTED, internal _blockTag = "earliest"
new RPCStateManager({ blockTag: 22099913n })  -> ACCEPTED, internal _blockTag = "0x15137c9"
```

Source (`statemanager/dist/esm/rpcStateManager.js:36`): `this._blockTag = opts.blockTag === 'earliest' ? opts.blockTag : bigIntToHex(opts.blockTag)`. Since `bigIntToHex` does `` `0x${num.toString(16)}` `` and `String.prototype.toString` ignores its argument, `'latest'` silently becomes the malformed tag `'0xlatest'`.

Failure mode confirmed live: an RPC call with `'0xlatest'` returns `{"code":-32601,"message":"invalid hex string"}` — **at query time, with a confusing message, not at construction.** (A `blockTag` of `undefined` *does* throw at construction: `Cannot read properties of undefined`.)

**Restatement Aegis should adopt:** pinning in EthereumJS v10 is **type-level, not runtime-structural**. The TypeScript signature is the only guard; a value arriving from JSON, config, or any `any`-typed path defeats it. Aegis must add its own runtime assertion that `blockTag` is a `bigint`, and negative-test it. This is a concrete addition to the ruling's S3 zero-override proof.

### 2.7 The architecture consequence — sharper than the ruling assumed

The ruling predicted the prefix replay would "blow any interactive p95 by orders of magnitude," and it does. But the measurement locates the cost precisely:

- **Engine compute for the whole 52-tx prefix: 1,499 ms.** The EVM is not the bottleneck.
- **912 lazy state round-trips are the bottleneck**, and 60% of them (`eth_getStorageAt`, 549) are single-slot reads.

INFERRED arithmetic against the spec's 10-second p95 (`ENGINEERING_SPEC.md:1010`): 912 serial calls need < 11 ms per call end-to-end to fit. At a realistic 20 ms/call → 18.2 s; at 50 ms → 45.6 s. **The `retrospective_rehearsal` CLI-artifact decision holds.**

But two consequences the ruling did not have, and which strengthen the ratified direction:

1. **The artifact can carry its own state.** The 912 pinned responses are **5.8 MiB on disk**. A content-addressed state bundle shipped with the rehearsal makes it **independently re-executable by a third party in ~1.5 seconds with no RPC access at all.** That is the "reproduction contract" wr5 §6 asks for, made concrete — and it is the direct structural answer to the Tenderly disqualifier that *"no third party can re-execute a result."* I recommend this be captured as a first-class artifact-format requirement.
2. **The p95 exclusion should be scoped to *cold* rehearsal, not to rehearsal.** Re-rendering or re-verifying an existing artifact is a ~1.5 s operation and need not be excluded from interactive SLOs.

---

## 3. Consolidated corrections to the wave-1 ruling

| Ruling claim | Status after spike |
|---|---|
| EDR: `OP_CHAIN_TYPE`, `opProviderFactory`, `OpHardfork` exist | **Confirmed**, except `OpHardfork` is `{}` at runtime |
| "deposit handling is *undocumented* in EDR's public surface" | **Confirmed as documentation gap; refuted as capability gap.** Deposits parse, execute, and produce genuine `0x7e` receipts |
| "if S6 fails, OP candidates → `unknown`, M4 is L1-only" | **Triggered.** M4 gate case is L1-only; R1 stands |
| Deposit sender "asserted, never recovered" | **Confirmed** — `r = s = v = 0` in the canonical envelope |
| EthereumJS `blockTag` pinning is "structural" | **Refuted.** Type-level only; `'latest'` silently becomes `'0xlatest'` |
| EthereumJS prefix replay is "self-auditing" via hash + ecrecover | **Confirmed** — 52/52 and 52/52 |
| EthereumJS "cannot replay any OP prefix (no type-0x7E)" | **Confirmed** — `@ethereumjs/tx` `TransactionType` has no `0x7E` |
| PublicNode archive refusal shape | **Rotted again** — third distinct shape; G9 confirmed twice |
| wr5's OP block 133508663 tx-type histogram | **Independently confirmed** |
| wr5's R1 fork recipe (block/parent/ts/baseFee/gasLimit/198 tx/index 52) | **Independently confirmed on every field** |

---

## 4. Gap list

| ID | Gap |
|---|---|
| **S6-G1** | EDR applies mempool nonce validation to deposits. No public API path admits a deposit with a non-zero canonical `depositNonce`. Upstream issue should be filed; until then OP receipts-root reproduction is unavailable. |
| **S6-G2** | `AccountOverride.storage` non-functional (EDR #911) — storage overrides cannot be applied *or* disclosed in 0.14.2. Blocks part of the ruling's S3. |
| **S6-G3** | `EdrContext` is a process-global singleton; multi-chain CLI design must account for it. |
| **S6-G4** | Only one OP block, one hardfork (Holocene) tested. Generalisation is INFERRED. |
| **S7-G1** | Full-block harness self-proof (S1) on any post-Dencun block needs a KZG backend — an unpicked additional dependency. |
| **S7-G2** | `blockTag` runtime validation must be added by Aegis and negative-tested. |
| **S7-G3** | No archive endpoint in the free pool sustains `eth_getProof` bursts except drpc, which 408s on `eth_getStorageAt`. The ruling's G10 (provision WR3 pair 1, paid tiers) is now a hard blocker for reproducible timing, not a nicety. |
| **S7-G4** | Logs / storage-diff / state-root fidelity of the L1 prefix replay is unverified; only gas was compared. |
| **S7-G5** | Isolation for R1 remains `unknown` — nothing in this spike addressed the trace/state-diff requirement. |

---

## 5. Verdicts

**S6 — NOT REHEARSABLE AS POSED.** OP block 133508663 cannot have its canonical receipts root reproduced by EDR 0.14.2. OP candidates (M1, M2, D) go `unknown` for receipts-root-gated acceptance. A weaker disclosed criterion is available but is an owner waiver I am not exercising.

**S7 — REHEARSABLE.** The R1 fork recipe is confirmed field-by-field, the 52-transaction prefix replays gas-faithfully at 52/52, and its cost is measured at 912 RPC calls / 1.5 s resident / ~24 min cold-remote. R1 remains the M4 gate case, still conditional on the unmet isolation precondition (S7-G5) that the wave-1 ruling already recorded.

Neither result is a statement that any transaction is fit to execute, then or now. Both are claims about one counterfactual at one pinned boundary, reproducible only under the stated engine, ruleset, and package versions above. Both were measured in 2026-07 against chain state from 2025-03; neither says anything about either contract's configuration today.

---

## 6. Artifacts (all outside the repo)

Scratch project root: `C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\spike\`

**S6:** `fetch-op.mjs`, `receipts-root.mjs`, `deposit-envelope.mjs`, `edr-provider.mjs`, `encode-txs.mjs`, `s6-replay.mjs`, `s6-diag.mjs`, `s6-discriminate.mjs`, `s6-catch22.mjs`, `s6-fullreplay.mjs`, `s6-final.mjs`, `scan-binary.mjs`, `scan-methods.mjs`, `op-133508663.json`

**S7:** `proxy2.mjs`, `s7-budget3.mjs`, `s7-verify-52.mjs`, `s7-52.log`, `s7-52-warm.log`, `s7-result-52-cold.json`, `canonical-22099914-block.json`, `canonical-22099914-receipts.json`, `s7-cache/` (912 pinned responses, 5.8 MiB — the re-execution bundle)
