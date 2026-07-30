<!-- DRAFT — G-08 evidence lane (re-posed wave-3 charter). Chain-historian/evidence-acquisition
persona. Subject: OP controller Safe 0x7a00657a45420044bc526B90Ad667aFfaee0A868. NOT COMMITTED,
NOT INDEPENDENTLY REVIEWED. Every value below is lane-reported pending a Codex/second-lane review
gate (D-b4ab3c69); no row here is manifest-grade. D-006: this lane SOURCES expected/evidence values
only — it implements no observed-side check and certifies nothing. -->

# ROUTE-ETH-OP-v1 — G-08 SAFE PROVENANCE EVIDENCE DOSSIER

**Subject:** the OP controller Safe `0x7a00657a45420044bc526B90Ad667aFfaee0A868` — the entity that
received PROPOSER+EXECUTOR+CANCELLER on the OP timelock `0x851dd540…` at OP blk 154619344
(2026-07-23), per the corrected G35 findings (g35 §3.3, OBSERVED-triple). Riders in the same charter:
the outgoing OP Safe `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` (items 5–6) and the cross-chain
canceller Safe `0x055a8B2B65d0aB4E0C17a0168d032464B7E97bdF` (G-15).

**Charter:** the eight re-posed G-08 items in `blueprint.md` §4 G-08 row (lines ~176) and the §6
verdict. This dossier answers each with per-claim OBSERVED/INFERRED tags and retained-artifact
citations, matching the g35 methodology (sweep recipes, provider set, content-addressed artifacts,
in-lane keccak, full-word decode with truncation teeth, explorer quarantine, D-006 role separation).

**Pinned heads (this lane):** ETH `25643936` (hash `0xfe96755052…`, dual-provider), OP `154897427`
(hash `0x3787b9c639…`, dual-provider). Selected as the min head across responding providers per
chain so every provider can serve the pinned range. All head/"current" reads are pinned to these
blocks, never `latest`.

---

## 0. THE EIGHT ANSWERS (headline per charter item)

| # | Charter item | Outcome | Headline |
|---|---|---|---|
| 1 | Creation provenance of `0x7a00657a…` | **ANSWERED** | OP blk **153277304** (2026-06-22), tx `0x2a528cc9…`, creator EOA `0x8d5aac5d…` (the same EOA that created the ETH adapter-owner timelock and both canceller-Safe instances), factory `0xc2283458…` = GnosisSafeProxyFactory v1.3.0, singleton `0xfb1bffc9…` = GnosisSafeL2 v1.3.0. OBSERVED-dual + independent Safe-service path. |
| 2 | Signer-set provenance from creation | **ANSWERED** | Full self-event history from block 0, OBSERVED-dual (Tenderly 1M + OP Labs 10k): SafeSetup **5 owners / thr 2** @153277304, then **+2 owners, thr→4** @153703252 ⇒ **7 owners / thr 4**. No `RemovedOwner` ever. |
| 3 | Threshold history | **ANSWERED** | **2 → 4**, single change at OP blk 153703252 (`ChangedThreshold`, full-word decoded). |
| 4 | Second acquisition path for current owners/threshold | **ANSWERED (three concordant paths)** | event-fold **=** pinned dual-provider **storage walk** (owner linked-list, ownerCount, threshold, nonce, singleton) **=** Safe-service snapshot: **7 owners / thr 4 / nonce 1**. g35's OBSERVED-single facts raised to OBSERVED-multi-path. |
| 5 | Relationship to outgoing Safe `0x764682c7…` | **ANSWERED, and the g35 Codex gap CLOSED** | Two **distinct** Safe proxies (different creation blocks/txs → **not** a "re-deployment"). Event-fold of both **at rotation block 154619344** proves **identical owner sets AND thresholds at that block** (7-of-7 shared, 0 delta) — closing exactly what g35 claim-19 could not (current snapshots). CAP: identical signers ≠ identical control (custody unknowable, G-09); no motive stated. |
| 6 | Residual-authority sweep for outgoing Safe | **ANSWERED — material finding** | By last decoded standard event `0x764682c7…` **still holds DEFAULT_ADMIN_ROLE (`bytes32(0)`) and UNPAUSER_ROLE on the OP OFT manifest target `0x5a7facb9…`** (never revoked) plus ownership of 6 non-route contracts. The rotation moved **only** the timelock's P/E/C roles, **not** the OApp's own AccessControl admin. CAP: standard `OwnershipTransferred`/`RoleGranted`/`RoleRevoked` filters only. |
| 7 | Declared-intent artifact | **ANSWERED — REFUTES g35 NEW-1/G-15 for `0x7a00657a…`** | `0x7a00657a…` **IS declared** at the pinned commit `e30c859c` deploy source `utils/L2Constants.sol` as `DEPLOYMENT_CONTRACT_CONTROLLER` / `L2_CONTRACT_CONTROLLER_SAFE` for other L2s and `safeAddress` of 24 tx-builder batches. The OP config at pin still names the **old** `0x764682c7…`; the on-chain rotation brought OP onto the already-declared canonical L2 controller. `0x055a8B2B…` (canceller) is in **no** artifact — G-15 stands for it. |
| 8 | Owner-review promotion of wave-3 control-plane values | **OUT OF LANE SCOPE (owner/HITL)** | D-006 bars the sourcing lane from certifying; recorded as the remaining owner-gated step. No promotion is performed here. |

**Whole-dossier claim-strength cap:** this is the evidence lane's own report, dual/triple-provider
concordant where stated. It is **NOT independently reviewed**. No value here is manifest-grade until
a Codex or second-lane review gate lands, and row promotion remains owner-gated regardless (mirrors
the g35 wave-3 discipline; D-b4ab3c69).

---

## 1. METHOD AND ACQUISITION DISCIPLINE (matched to g35 §2)

### 1.1 Tools carried forward byte-identical
`keccak.py`, `decode.py`, `fetch.py`, `sweep.py` copied **unmodified** from the g35 evidence archive
`C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\` (sha256 verified equal to both the
archive and the g35 lane copies):

| File | sha256 |
|---|---|
| `keccak.py` | `8b6d733ff789b05ebb8da523ba8340524a1cf30cb0c8ae0d6823b22291850ad1` |
| `decode.py` | `fdbfdbcaa202df683005ba1af2531cd67afb01c3263fa2647e2f260e3aaf9c1a` |
| `fetch.py` | `6e9a616dc09b36826c15fc85129990fbd94516a3f5946372337a7be434700b16` |
| `sweep.py` | `2237a78bd2d881d0af4fcb0bcd37d1aaa62194089abb7b55551e3e7a2bd23859` |

New this lane: `safedec.py` (Safe-event decoders, same full-word/truncation-teeth discipline as
`decode.py`). Keccak 7-vector self-test is the first executable assertion in every derivation script.

### 1.2 Every derivation shown (executed code, INS-035ae3e4)
All topic0s and role ids used below were derived in-lane (`s03_derive_safe.py`), keccak self-test
first. The three shared with g35 §2.2 were **asserted equal** to that dossier's values by executed
code (`MATCH g35 dossier §2.2 … : True`) — a reproducibility check, not a copy.

| Signature | topic0 |
|---|---|
| `SafeSetup(address,address[],uint256,address,address)` | `0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8` |
| `AddedOwner(address)` | `0x9465fa0c962cc76958e6373a993326400c1c94f8be2fe3a952adfa7f60b2ea26` |
| `RemovedOwner(address)` | `0xf8d49fc529812e9a7c5c50e69c20f0dccc0db8fa95c98bc58cc9a4f1c1299eaf` |
| `ChangedThreshold(uint256)` | `0x610f7ff2b304ae8903c3de74c60c6ab1f7d6226b3f52c5161905bb5ad4039c93` |
| `ProxyCreation(address,address)` *(v1.3.0 factory shape)* | `0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235` |
| `ExecutionSuccess(bytes32,uint256)` | `0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e` |
| `SafeMultiSigTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes,bytes)` | `0x66753cd2356569ee081232e3be8909b950e0a76c1f8460c3a5e3c2be32b11bed` |
| `ChangedMasterCopy(address)` | `0x75e41bc35ff1bf14d81d1d2f649c0084a0f974f9289c803ec9898eeec4c8d0b8` |
| `OwnershipTransferred(address,address)` | `0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0` |
| `RoleGranted(bytes32,address,address)` | `0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d` |
| `RoleRevoked(bytes32,address,address)` | `0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b` |
| role id `keccak256("UNPAUSER_ROLE")` | `0x427da25fe773164f88948d3e215c94b6554e2ed5e5f203a821c9f2f6131cf75a` |
| role id `DEFAULT_ADMIN_ROLE` (OZ constant, **not** the string hash) | `0x0000…0000` |

### 1.3 Event shapes read from SOURCE (Safe v1.3.0 + v1.4.1), never guessed
Both Safe source families were fetched from `safe-global/safe-smart-account` at tags `v1.3.0` /
`v1.4.1` (`s02_src_safe.py`), each file sha256-ledgered. Key shapes and their per-epoch difference
(which the decoder branches on):

| Type | Source (retained sha256) | Shape |
|---|---|---|
| `SafeSetup` | GnosisSafe.sol L45 `744af66001…` = Safe.sol L59 `efd3301ed5…` | initiator **indexed**; data = `(offset, threshold, initializer, fallbackHandler, ownerCount, owners[])` |
| `AddedOwner`/`RemovedOwner` | v1.3.0 OwnerManager.sol L9-11 `ba9726f488…`: **NON-indexed** (1 topic, 32-byte data); v1.4.1 OwnerManager.sol L13-15 `5ba5381350…`: owner **indexed** (2 topics, empty data) | decoder auto-detects by (topics, data-len) |
| `ChangedThreshold` | same files | 1 topic, 1 data word |
| `ProxyCreation` | v1.3.0 GnosisSafeProxyFactory.sol L10 `2e58cab438…`: NON-indexed; v1.4.1 SafeProxyFactory.sol L12 `0bf51e2baa…`: proxy **indexed** | decoder auto-detects |
| `SafeMultiSigTransaction` | GnosisSafeL2.sol L10-24 `164ccdbfd4…` = SafeL2.sol L13-25 `8ed69cb26d…` | 11 non-indexed params; `additionalInfo = abi.encode(nonce, msg.sender, threshold)` |

The **owner/threshold write/emission model** was SOURCED, not assumed (`s08`): an executed scan of
both OwnerManager sources shows `owners[…]=` and `threshold=` are written only inside
`setupOwners / addOwnerWithThreshold / removeOwner / swapOwner / changeThreshold`, each of which
emits `AddedOwner`/`RemovedOwner`/`ChangedThreshold` unconditionally. **The Safe event stream is the
owner/threshold state** — subject only to the delegatecall caveat quantified in §6.4.

### 1.4 Full-word decoder, negative-tested in THIS lane (`s14_negtest.py`)
`safedec.py` reads only complete 32-byte words and fails closed on truncation, arity, and
dirty-address defects. The guards were negative-tested against **real** SafeSetup/AddedOwner payloads
mutated to defect:
```
POSITIVE control: SafeSetup decodes 5 owners threshold 2; AddedOwner decodes owner 0xe63794cf… [non-indexed (v1.3.0)]
[A] SafeSetup: REJECTED 1-byte-short data; REJECTED owner-count tampered 5->6 (ARITY); REJECTED owners offset != 128 (OFFSET)
[B] AddedOwner: REJECTED dirty high address byte; REJECTED 2-word data; REJECTED 2-topic+32-byte data (neither sourced shape)
[C] SafeSetup: REJECTED missing initiator topic
=== guard negative-test result: 7 rejected as required, 0 leaked ===
```

### 1.5 Providers, redirects, refusals (OBSERVED, verbatim)
| Endpoint | Result in this lane |
|---|---|
| `rpc.mevblocker.io` | ETH primary; full-range `eth_getLogs`, `getCode`, headers OK |
| `gateway.tenderly.co/public/mainnet` | ETH secondary; OK. Returned `state at block #… is pruned` for one historical OP-Safe boundary getCode via its OP twin (see below) |
| `optimism.gateway.tenderly.co` | OP primary; full-range OK. Returned `null` for the outgoing-Safe **creation** tx/receipt (state pruned) — recorded as a **refusal**, not a fact |
| `mainnet.optimism.io` (OP Labs) | OP archive; 10k-step sweeps OK; served the outgoing-Safe creation tx/receipt that Tenderly pruned |
| `optimism.api.onfinality.io/public` | rate-limited (`-32029`/HTTP 429) on 7 requests, all recorded as refusals; data served by another provider in every case |
| `safe-transaction-{mainnet,optimism}.safe.global` → `api.safe.global/tx-service/{eth,oeth}/…` | OK; **308-redirects** (9 acquisitions ledgered with the **effective** URL, G9 discipline); **requires EIP-55 checksums** (derived in-lane with this lane's keccak) |

### 1.6 Explorer quarantine + D-006 role separation
**No block explorer** was used — every address label is either (a) SOURCED from the pinned deploy
tree / vendor deployment registry with its citation, or (b) explicitly **unlabelled**. This lane made
**no read of any value the manifest will verify** as a predicate: `owner()`, `delegates()`,
`hasRole()`, `getMinDelay()`, `getOwners()`, `getThreshold()` were **not** called. The storage-walk
reads (§4) are historical-block-pinned `eth_getStorageAt` used only to **corroborate** the
event-fold as an independent acquisition path, and are recorded as **EvidenceFacts** (G-09 class),
never as a pass/fail predicate. No code hash in this dossier may seed `expectedRuntimeCodeHash`
(G-01 anti-seeding, by analogy — g35 §2.7).

---

## 2. ITEM 1 — CREATION PROVENANCE OF `0x7a00657a…`

Creation block located by dual-provider `eth_getCode` bisection (`s04`, primary = Tenderly OP,
28 probes) and the boundary **re-verified on a second provider** (code **absent** @153277303,
**present** @153277304, agreement **True**). Creation transaction recovered by `eth_getLogs [C,C]`
on the Safe, then tx + receipt on two providers (`s05`); the full-word `ProxyCreation` + `SafeSetup`
decode of the receipt gives the factory, singleton and setup parameters. Every self-log's `blockHash`
asserted equal to an independently fetched header.

| Field | Value | Strength |
|---|---|---|
| Creation block | OP **153277304** (hash `0xa627e3f9b37f7074b598eec6719db836924b358ee52b7afa25c2297e32205a74`, ts 1782153385 = **2026-06-22T18:36:25Z**) | **OBSERVED-dual** (Tenderly+OP Labs; boundary absent@C-1/present@C both providers) |
| Creation tx | `0x2a528cc92b77cc1032aaf93027bb7624de6ff6de52ea259e6e1b3544973b3be1` (status `0x1`, 2 logs) | OBSERVED-dual receipt agreement True |
| Sender / creator | EOA `0x8d5aac5d3d5cda4c404fa7ee31b0822b648bb150` | OBSERVED-dual; **cross-lane note:** identical to the deployer EOA of the ETH adapter-owner timelock `0xcd425f44…` (g35 §3.6) and of **both** canceller-Safe instances (§7 here) |
| tx.to (factory called) | `0xc22834581ebc8527d974f8a1c97e1bea4ef910bc` | OBSERVED-dual |
| Factory (ProxyCreation emitter) | `0xc22834581ebc8527d974f8a1c97e1bea4ef910bc` = **GnosisSafeProxyFactory v1.3.0** `[eip155]` | OBSERVED-dual (event) + **SOURCED** (vendor `safe-deployments` v1.3.0/proxy_factory.json, retained) |
| Singleton (masterCopy) | `0xfb1bffc9d739b8d520daf37df666da4c687191ea` = **GnosisSafeL2 v1.3.0** `[eip155]` | OBSERVED-dual + SOURCED (vendor registry) |
| fallbackHandler | `0x017062a1de2fe6b99be3d9d37841fed19f573804` = **CompatibilityFallbackHandler v1.3.0** `[eip155]` | OBSERVED (SafeSetup decode) + SOURCED (vendor registry) |
| SafeSetup at creation | initiator = factory `0xc2283458…`, **5 owners, threshold 2**, initializer `0x0` | OBSERVED-dual |
| Independent Safe-service `/creation/` | `tx`, `creator`, `factoryAddress`, `masterCopy` all **match** the decoded values | OBSERVED-single (Safe tx-service, acquisition path independent of RPC) |

**Cross-chain existence:** the same address holds **no code** on ETH at the ETH pinned head (`s04`
X-CHAIN PROBE) — `0x7a00657a…` is an OP-only Safe. (`0x764682c7…` likewise ETH-codeless.)

Retained: `raw/g08_code_OP_0x7a00657a_*`, `raw/g08_r3_crelogs_OP_0x7a00657a_*`,
`raw/g08_r3_crerc_OP_0x7a00657a_*`, `raw/g08_r3_svc_creation_OP_0x7a00657a.json`,
`raw/safe_deployments_v1.3.0_*`; index `creation_blocks.json` / `creation_tx.json`.

---

## 3. ITEMS 2 & 3 — SIGNER-SET AND THRESHOLD PROVENANCE FROM CREATION

Full self-event history swept from **block 0** on two providers (`s06a`, `s06b`): Tenderly at 1M
steps (whole-sweep artifact `5a45941744d3f283…`) and OP Labs at 10k steps from the creation block
(artifact `29904f8933f3…`). Provider agreement on the full comparison key
`(blockNumber, blockHash, transactionHash, logIndex, data, topics, address)` = **True** (6 vs 6
events). Decoded and folded in block order (`s07`); every event's `blockHash` asserted against an
independently fetched header.

**Owner/threshold timeline (`0x7a00657a…`, OBSERVED-dual):**

| Block | ts (UTC) | Event(s) | Result state |
|---|---|---|---|
| 153277304 | 2026-06-22T18:36:25Z | `SafeSetup` (5 owners, thr 2) | 5 owners / **thr 2** |
| 153703252 | — (hash `0x4a220f1da8…`, cross-provider) | `AddedOwner`×2 + `ChangedThreshold`→4 (one MultiSend batch, nonce 0) | **7 owners / thr 4** |

No `RemovedOwner` ever appears. **Item 3 (threshold history): 2 → 4**, one change, fully decoded.

The 7 owners (linked-list order at head, §4): `0xde3bf1fa…`, `0xe63794cf…`, `0x5c8c76f2…`,
`0x4507cfb4…`, `0x0e706a98…`, `0xd3107493…`, `0x566e58ac…`. These are **EvidenceFacts** (G-09):
signer identities/custody are permanently out of scope; no competence or independence judgment is
made.

**Completeness backing (item 2/3, delegatecall caveat quantified):** the Safe's single
`SafeMultiSigTransaction` (nonce 0, blk 153703252) is a DELEGATECALL to
`0xa1dabEF33b3B82c7814B6D82A79e50F4AC44102B` = **MultiSendCallOnly v1.3.0** (SOURCED, vendor registry
`multi_send_call_only.json`), whose source (`MultiSendCallOnly.sol`, retained `9a0ee19d20…`) executes
`call()` only — its inner ops are both `operation=0` (CALL) to the Safe itself (the add-owner/
threshold batch). No owner-storage-rewriting delegatecall path was exercised, so the event fold is
complete for what actually executed. See §6.4 for the general cap on this reasoning.

Retained: `raw/safehist_OP_0x7a00657a_0-154897427_step1000000_tenderly.bin` (17,463 B, sha256
`5a45941744d3f283933e84fb9169b2d4be238a114df64b7e76b3664378c4cc4a`),
`raw/safehist_OP_0x7a00657a_153277304-154897427_step10000_oplabs.bin`;
`safehist_raw.json`, `fold_results.json`, `msig_ops_0x7a00657a.json`.

---

## 4. ITEM 4 — SECOND ACQUISITION PATH FOR CURRENT OWNERS / THRESHOLD

Three mutually independent acquisition paths agree on the acquisition-time (pinned-head) state:

1. **Event fold** (§3) — from `AddedOwner`/`RemovedOwner`/`ChangedThreshold` history.
2. **Pinned dual-provider storage walk** (`s10`) — `eth_getStorageAt` at OP **154897427** on both
   Tenderly and OP Labs, walking the OwnerManager sentinel linked list (mapping slot 2, keys derived
   with in-lane keccak) plus `ownerCount` (slot 3), `threshold` (slot 4), `nonce` (slot 5),
   `singleton` (slot 0). Slot layout SOURCED from the acquired GnosisSafe inheritance order, not
   memory. Dual-provider agreement **True**; `len(owners)==ownerCount` asserted.
3. **Safe transaction service snapshot** (`s11`) — a third path (HTTP API).

| Path | owners | threshold | nonce | singleton |
|---|---|---|---|---|
| event fold @154897427 | 7 | 4 | — | — |
| storage walk @154897427 (dual-provider) | 7 | 4 | 1 | `0xfb1bffc9…` (GnosisSafeL2 v1.3.0) |
| Safe-service snapshot | 7 | 4 | 1 | `0xfb1bffc9…` |

**Fold-vs-storage MATCH = True** (owners+threshold). **Storage-vs-service MATCH = True** (owners+
threshold+nonce+singleton, after case-normalisation). This **raises g35's OBSERVED-single Safe-service
facts (claims 18–19) to OBSERVED-multi-path** for the current state. Strength: **OBSERVED-dual** for
the storage walk, **OBSERVED-single** for the service leg, event fold OBSERVED-dual.

Also read (`s10` follow-up): `modules[SENTINEL]` at the pinned head = sentinel (**empty module list**,
dual-provider) — no enabled Safe module provides an alternate authority path at acquisition time.

Retained: `raw/stor_OP_0x7a00657a_*_pin154897427_*`, `raw/svc_state_OP_0x7a00657a_g08.json`;
`storage_walk.json`, `svc_snapshots.json`.

---

## 5. ITEM 5 — RELATIONSHIP TO THE OUTGOING SAFE `0x764682c7…`

### 5.1 Two distinct proxies — not a "re-deployment"
Both Safes' creation transactions were decoded (§2 recipe, applied to `0x764682c7…` in `s05`):

| Safe | Creation block | Creation tx | Singleton |
|---|---|---|---|
| `0x764682c7…` (outgoing) | OP **120754634** (2024-05-30) | `0xd584e673…` | GnosisSafeL2 v1.3.0 `0xfb1bffc9…` |
| `0x7a00657a…` (incoming) | OP **153277304** (2026-06-22) | `0x2a528cc9…` | GnosisSafeL2 v1.3.0 `0xfb1bffc9…` |

Different creation blocks and different creation transactions ⇒ **two separate contracts**. The g35
"re-deployment" phrasing (already struck per the Codex round-2 correction) is definitively **not**
what happened: the OP rotation was a **role/address rotation** onto a pre-existing, independently
created Safe. (Both were created by the same EOA `0x8d5aac5d…` and use the same singleton — a
common signer body, not one contract redeployed.) OBSERVED-dual (`0x7a00657a…`) / OBSERVED-single
(`0x764682c7…` creation tx: Tenderly pruned it, served by OP Labs — recorded honestly).

### 5.2 Signer sets AT the rotation block — the g35 Codex gap, CLOSED
The g35 Codex verdict (claim 19) corrected the dossier's "identical 7-of-7 across the rotation" down
to *current-snapshot* equality: current snapshots "do not prove the signer sets were identical **at
the rotation block** 154619344." This lane closes that gap directly. Folding **both** Safes'
`AddedOwner`/`RemovedOwner`/`ChangedThreshold` histories to a snapshot **at block 154619344**
(`s07`, `snapshot_at`):

```
incoming 0x7a00657a: 4 of 7   |   outgoing 0x764682c7: 4 of 7
identical owner sets AND thresholds at rotation block 154619344: True
shared 7 | only-incoming [] | only-outgoing []
```

So at the rotation block the two Safes had an **identical 7-owner set and identical 4-of-7 threshold**,
established from the decoded OwnerManager event history (not a head snapshot). Strength: the incoming
half is OBSERVED-dual; the outgoing half is OBSERVED-dual (Tenderly 1M + OP Labs 10k full history,
79/79 events, full-key agreement True).

**CAPS (carried, non-negotiable):** an identical signer set is **not** evidence of identical
organizational control — custody and collusion are unknowable from public state (G-09, permanent).
No motive for the rotation is stated (no located artifact establishes one; §7, §8, causality
discipline). This is a facts-class finding, never a predicate.

Retained: `raw/safehist_OP_0x764682c7_0-154897427_step1000000_tenderly.bin` (299,567 B, sha256
`5f337c80307e2125423ef57b7c5fbe5a7a074bf7802bf78446c82b6769c40c7a`),
`raw/safehist_OP_0x764682c7_120754634-154897427_step10000_oplabs.bin` (615,977 B, sha256
`80d7123693c1ea67c4c7f01fd863714b9937135f89a8a52de04fa7d7b77765b6`); `safehist_764682_oplabs.json`.

---

## 6. ITEM 6 — RESIDUAL-AUTHORITY SWEEP FOR THE OUTGOING SAFE `0x764682c7…`

Address-less, topic-filtered `eth_getLogs` over `[0, pinned head]` on both chains, four filters per
Safe (`s12`): `OwnershipTransferred` with the Safe as new-owner (topic2) and as previous-owner
(topic1); `RoleGranted` and `RoleRevoked` with the Safe as account (topic2). Folded per
(emitter[,role]) by **last decoded event**. OP via Tenderly 1M-step chunked sweeps (contiguous, 0
chunk errors, 0 transport retries); ETH via mevblocker full-range.

### 6.1 The material finding — role standing on a manifest target
By last decoded event the outgoing Safe **still holds two live roles on the OP OFT `0x5a7facb9…`
(an S2 manifest target)** — the rotation did **not** touch them:

| Role (id) | Emitter | Granted | Revoked | Live by last event |
|---|---|---|---|---|
| `DEFAULT_ADMIN_ROLE` (`bytes32(0)`) | OP OFT `0x5a7facb9…` | OP blk 121110949 | — | **YES** |
| `UNPAUSER_ROLE` (`0x427da25f…`) | OP OFT `0x5a7facb9…` | OP blk 129082737 | — | **YES** |

The three `RoleRevoked` events on `0x764682c7…` are **only** the OP-**timelock** P/E/C roles at
154619344 (g35 §3.3, reproduced here). Interpretation, capped: the 2026-07-23 rotation moved the OP
timelock's proposer/executor/canceller roles to `0x7a00657a…` but **left the OApp's own
AccessControl admin (`DEFAULT_ADMIN_ROLE`) and `UNPAUSER_ROLE` with the outgoing Safe** — a residual
control-plane authority directly on the route's OP OFT. The incoming Safe `0x7a00657a…` holds **no**
`OwnershipTransferred` and **no** OApp roles by any filter — only the timelock P/E/C roles (§0).

The `bytes32(0)` admin id and the `UNPAUSER_ROLE` keccak match corroborate that the OP OFT runs an
OZ `AccessControl` model with `DEFAULT_ADMIN_ROLE = bytes32(0)` — a **data point for G-10** (the OP
OFT's role model), which remains **open**: exact epoch is INFERRED and still needs binding to the
impl `0x70d7E0C9…` runtime code after G-01 (g35 §11). Role ids are reported as decoded, not as a
resolved ABI.

### 6.2 Residual ownership (by last `OwnershipTransferred`)
Still owned by `0x764682c7…` within the standard filter: `0x1ad405eb…` (blk 149640756),
`0x3f1bdae9…` (151285642), `0xa519afbc…` (149554354), `0xdcb61200…` (148527657), `0xe0080d2f…`
(149604349), `0xe5d38547…` (149947189) — six non-route contracts, **unlabelled** (no artifact
consulted). Transferred **away** to the OP timelock `0x851dd540…`: the OP OFT `0x5a7facb9…`, the OP
proxy admin `0x632304ed…` (139705022), and five further contracts at 154486119 (the handover tx
g35 §4.5). None of these six residually-owned contracts is an S2/S7 manifest entity.

### 6.3 Cap on the negatives (verdict claim-15 class)
These standings are established **only** within the standard `OwnershipTransferred` /
`RoleGranted` / `RoleRevoked` event filters. They do **not** exclude authority held through
non-emitting or non-standard paths (non-`Ownable` ownership, Safe modules/guards, roles under a
different event signature). The finding is "residual authority **by last decoded standard event**",
not "the complete surviving authority of the outgoing Safe."

Retained: `raw/residual_OP_764682c7_*.bin`, `raw/residual_ETH_764682c7_*_full_mevblocker.json`,
`raw/residual_OP_7a00657a_*.bin`, `raw/residual_ETH_7a00657a_*`; `residual_raw.json`.

### 6.4 Delegatecall completeness cap (backs §3 and §5)
`0x764682c7…` executed **36** `SafeMultiSigTransaction`s (`s09`); **20** are top-level DELEGATECALLs,
**all** to MultiSendCallOnly v1.3.0 `0xa1dabef3…`, whose every inner op decodes to `operation=0`
(CALL — the source forbids delegatecall). No delegatecall to an arbitrary storage-rewriting target
appears. So the OwnerManager event fold is complete **for what actually executed**; the general
possibility of a future non-emitting owner-storage write is the standing cap, not an observed gap.

---

## 7. ITEM 7 — DECLARED-INTENT ARTIFACT

### 7.1 `0x7a00657a…` IS declared — g35 NEW-1/G-15 refuted for this address
A repo search plus a search of the **pinned deploy source** located the address. The deploy tree
`etherfi-protocol/weETH-cross-chain` checked out at scratchpad has **HEAD =
`e30c859c08a0fb44b4732e44b040f144094638ed`** — byte-for-byte the blueprint's pinned commit — with a
**clean working tree** (so the files below are the committed pinned versions). At that commit,
`utils/L2Constants.sol`:

| Line | Declaration |
|---|---|
| L70 | `address constant DEPLOYMENT_CONTRACT_CONTROLLER = 0x7a00657a45420044bc526B90Ad667aFfaee0A868;` |
| L289, L635, L673, L789, L827, L868 | `L2_CONTRACT_CONTROLLER_SAFE: 0x7a00657a…` — the controller Safe for multiple L2 chain configs (avax, base, ink, monad, sonic, stable, …) |

The same address is the Safe-tx-builder `meta.safeAddress` in **24** output batch files
(`avax-*`, `base*`, `ink-*`, `monad-*`, `sonic-*`, `stable-*`). So `0x7a00657a…` is the ether.fi
**canonical L2 contract-controller Safe**, explicitly declared at the pinned commit — **not** an
undocumented chain-only entity. g35's NEW-1 premise ("appears in no reviewed ether.fi artifact")
was a search miss, not a fact: g35 looked at the OP-specific controller declaration only.

**The nuance that resolves the apparent contradiction:** at the pinned commit the **Optimism** config
block (OP OFT `0x5A7fACB9…`, `L2Constants.sol` L404) still names the **old** controller
`0x764682c7…` (L406) — matching WR2's OP controller Safe and the pre-rotation on-chain state. The
on-chain rotation at OP blk 154619344 (g35 §3.3; this lane §5) migrated the OP route **onto the
canonical L2 controller Safe that the deploy source already declared for the newer L2s** — i.e. it
brought OP into line with the rest of the fleet. Strength: **SOURCED** at the pinned commit.

**Provenance caveat (honest):** the deploy tree is a **prior-lane scratchpad checkout**, not a fresh
clone acquired in this lane. Verified here by `git rev-parse HEAD` == the pinned commit and a clean
`git status`; `L2Constants.sol` and `base.json` were retained into this lane's `raw/` with sha256
(`ddd027782a1e56e0…`, `025b9223ae8916d4…`). A fresh independent clone/verification is left as
optional hardening.

### 7.2 `0x055a8B2B…` (canceller) — no artifact; G-15 stands
The canceller Safe address is in **no** reviewed artifact: not in the pinned deploy tree, not in
WR1/WR2, not in `docs/`. It remains a **chain-only entity** with that provenance stated (G-15 closing
recipe). Its chain facts are in §9.

---

## 8. ITEM 8 — OWNER-REVIEW PROMOTION

Out of this lane's scope. Promotion of any wave-3 control-plane value to manifest grade is an
owner/phase-review (HITL) action; **D-006 bars the sourcing lane from certifying its own evidence.**
Recorded as the remaining owner-gated step: the expected OP proposer/executor/canceller is
`0x7a00657a…` (this lane, lane-reported OBSERVED-triple via g35 + corroborated here), and authoring
`0x764682c7…` as a live proposer/executor would manufacture a false control-plane claim (g35 §7).
Nothing in this file promotes anything.

---

## 9. G-15 RIDER — THE CROSS-CHAIN CANCELLER SAFE `0x055a8B2B…`

Same creation/fold/storage-walk treatment (`s04`/`s05`/`s07`/`s10`), both chain instances:

| Field | ETH instance | OP instance | Strength |
|---|---|---|---|
| Creation | blk **25404300** (2026-06-26), tx `0x6c221dd1…` | blk **153581943** (2026-06-29), tx `0x6a5694ce…` | OBSERVED-dual both |
| Creator EOA | `0x8d5aac5d…` (same EOA as §2) | `0x8d5aac5d…` | OBSERVED-dual |
| Factory | `0x4e1dcf7a…` = **SafeProxyFactory v1.4.1** | same | OBSERVED-dual + SOURCED (vendor registry) |
| ProxyCreation singleton | `0x41675c09…` = **Safe v1.4.1** | `0x41675c09…` | OBSERVED-dual + SOURCED |
| Setup initializer (delegatecall) | `0xbd89a1ce…` = **SafeToL2Setup v1.4.1** | same | OBSERVED + SOURCED |
| Current singleton (storage slot 0) | `0x41675c09…` (Safe v1.4.1) | `0x29fcb43b…` (**SafeL2 v1.4.1** — swapped by SafeToL2Setup, `ChangedMasterCopy` decoded at OP creation blk 153581943 logIdx 131) | OBSERVED-dual |
| Owners / threshold / nonce | 6 / 4 / 0 | 6 / 4 / 0 | OBSERVED-dual storage walk + OBSERVED-single service |
| Owner set vs controller Safes | **disjoint** | disjoint | OBSERVED |
| Modules | empty (sentinel) | empty (sentinel) | OBSERVED-dual |
| Proxy runtime code sha256 | `a8a0fbd3cdf49e751346664e01b529a58322a814cf8df8d85deb20e63bd6415e` | identical | OBSERVED-dual — consistent with deterministic same-address deployment (**characterisation only; never seeds `expectedRuntimeCodeHash`**) |

The two instances share an address but currently have **different singletons** (ETH = Safe v1.4.1,
OP = SafeL2 v1.4.1) — the SafeToL2Setup delegatecall swaps the singleton to the L2 variant on OP.
This sharpens g35 §3.6's "identical proxy runtime code" (the *proxy* bytecode is identical; the
*singleton* differs by design). Owner set stable since creation on both chains (only `SafeSetup`;
plus the OP `ChangedMasterCopy` at creation). Facts-class throughout (G-09).

---

## 10. CLAIM-STRENGTH REGISTER

| # | Claim | Strength | Provider(s) / block / artifact |
|---|---|---|---|
| 1 | `0x7a00657a…` created OP blk 153277304, tx `0x2a528cc9…` | OBSERVED-dual | Tenderly+OP Labs; boundary + receipt agreement True |
| 2 | Creator EOA `0x8d5aac5d…`; factory GnosisSafeProxyFactory v1.3.0; singleton GnosisSafeL2 v1.3.0 | OBSERVED-dual + SOURCED (vendor registry) | `creation_tx.json`; `raw/safe_deployments_v1.3.0_*` |
| 3 | Signer history: 5/thr2 @153277304 → 7/thr4 @153703252; no RemovedOwner | OBSERVED-dual | `safehist_…7a00657a…_tenderly.bin` `5a459417…` + OP Labs `29904f89…`, agreement True |
| 4 | Threshold history 2→4, one change | OBSERVED-dual | same |
| 5 | Current 7/thr4/nonce1 on three concordant paths | OBSERVED-dual (fold+storage) + OBSERVED-single (service) | `storage_walk.json`, `svc_snapshots.json` |
| 6 | `0x764682c7…` and `0x7a00657a…` are distinct proxies (different creation tx/block) | OBSERVED-dual / -single | `creation_tx.json` |
| 7 | Identical 7-owner set AND thr **at rotation block 154619344** | OBSERVED-dual both Safes | event-fold snapshot, `fold_results.json` |
| 8 | Identical signers ≠ identical control; no motive; role/address rotation not redeployment | **CAP** (INFERRED-none) | causality discipline; G-09 |
| 9 | `0x764682c7…` still holds DEFAULT_ADMIN + UNPAUSER on OP OFT `0x5a7facb9…` by last event | OBSERVED-single (OP Tenderly sweep) | `residual_raw.json`, `raw/residual_OP_764682c7_RG_acct_*.bin` |
| 10 | Those role standings **only** within standard event filters | **CAP** | §6.3 |
| 11 | `0x7a00657a…` declared as `DEPLOYMENT_CONTRACT_CONTROLLER`/`L2_CONTRACT_CONTROLLER_SAFE` at pinned commit e30c859c | **SOURCED** (pinned deploy tree, HEAD-verified, clean) | `raw/deploysrc_L2Constants.sol_e30c859.txt` `ddd02778…` |
| 12 | OP config at pin still names old `0x764682c7…`; rotation aligned OP to the canonical L2 controller | SOURCED + OBSERVED (rotation) | L2Constants.sol L404-406; g35 §3.3 |
| 13 | `0x055a8B2B…` in no artifact (G-15 stands) | SOURCED-absence | repo + deploy-tree + WR grep |
| 14 | Canceller Safe creation/singleton/owners both chains; proxy code identical, singletons differ | OBSERVED-dual + SOURCED | §9 |
| 15 | OP OFT uses OZ AccessControl (`DEFAULT_ADMIN_ROLE=bytes32(0)`) — data point, G-10 still open | INFERRED | role-id decode; exact epoch needs G-01 code binding |
| 16 | Reorg/cross-provider recheck: 10 load-bearing blocks, 0 mismatches | OBSERVED-dual | `s13`, `raw/reorg_*` |

---

## 11. DISCIPLINE STATE

| Metric | Value |
|---|---|
| Acquisitions ledgered (effective URL + raw-body sha256 + status + bytes + note) | **444** |
| Distinct raw-body digests in ledger | 209 |
| Kinds | 395 `json_rpc`, 35 `http_get`, 14 `json_rpc_chunked_sweep` |
| HTTP status distribution | 423×200, 7×429 (all OnFinality rate-limit refusals, data served elsewhere), 14×per-chunk |
| Redirected acquisitions recorded with effective URL (G9) | 9 (Safe tx-service 308s) |
| `raw/` top-level files / bytes | 437 / 1,988,273 |
| `raw/` incl. chunk subdir (s06b) files / bytes | 3,852 / 2,403,875 |
| Unique retained bodies on disk | 240 |
| Whole-sweep content-addressed artifacts | 14 sweep ledger entries |
| Keccak self-test | first executable line of every derivation script — all PASS |
| Decoder guard negative tests | **7 rejected as required, 0 leaked** |
| Provider agreement checks | all **True** where asserted (see §10) |
| Block-hash assertions during decode | every decoded self-log's `blockHash` == independently fetched header |
| End-of-lane reorg recheck | 10 load-bearing blocks, cross-provider both providers, **0 mismatches, 0 refusals** |
| `eth_call` at head | **0** |
| Reads of any manifest-verified predicate value | **0** (storage walk is facts-class corroboration, block-pinned) |
| Block explorer use | **0** |
| Repo files modified outside `roadmap/research/route-manifest/` | **0** |
| Artifact-filename reuse (g35 NEW-2 remedy) | filenames embed range+step+provider/run-tag; a re-run cannot overwrite a prior exhibit — `s12` asserts no-overwrite before writing |

**Honest process notes.** (1) `s05` first run died at a checksum-helper bug (passed `bytes` to a
`str` keccak); fixed, filenames re-tagged `r3` so no exhibit was overwritten; the failed r1/r2
acquisitions remain in the ledger. (2) Tenderly OP pruned the outgoing Safe's 2024 creation
tx/receipt (`null`) — recorded as a refusal; OP Labs served it (single-provider for that one tx,
disclosed). (3) OnFinality rate-limited 7 requests (HTTP 429) — each recorded, data served by
another provider every time.

---

## 12. GAP LIST AFTER THIS LANE

| Gap | Status |
|---|---|
| G-08 item 1 (creation provenance) | **ANSWERED** — §2 |
| G-08 items 2–3 (signer/threshold from creation) | **ANSWERED** — §3 |
| G-08 item 4 (second acquisition path) | **ANSWERED** (three paths) — §4 |
| G-08 item 5 (relationship to outgoing Safe; rotation-block signer identity) | **ANSWERED; g35 claim-19 gap CLOSED** — §5 |
| G-08 item 6 (outgoing-Safe residual authority) | **ANSWERED — material: DEFAULT_ADMIN+UNPAUSER on OP OFT survive** — §6 |
| G-08 item 7 (declared-intent artifact) | **`0x7a00657a…` FOUND** (deploy source, pinned commit) — **g35 NEW-1/G-15 refuted for it**; `0x055a8B2B…` remains chain-only — §7 |
| G-08 item 8 (owner-review promotion) | **OWNER-GATED, out of lane scope** — §8 |
| G-10 (OP OFT role model) | **still open** — §6.1 gives a data point (`bytes32(0)` admin, UNPAUSER), exact epoch needs G-01 code binding |
| NEW (this lane) | The OP rotation left the OP OFT's own `DEFAULT_ADMIN_ROLE`+`UNPAUSER_ROLE` with the outgoing Safe — a residual control-plane authority the control-plane row must record with its validity anchor (OP blk 121110949 / 129082737) |
| Provenance hardening | The pinned deploy tree used for §7 is a prior-lane scratchpad checkout (HEAD-verified, clean, artifacts retained); a fresh independent clone is optional hardening |

---

## 13. LIMITATIONS

1. **Lane-reported, not reviewed.** Every value is this evidence lane's own report; none is
   manifest-grade until an independent review gate lands (D-006; D-b4ab3c69). Row promotion is
   owner-gated regardless.
2. **Facts, not predicates.** All Safe signer/threshold/owner data is EvidenceFacts (G-09). Custody,
   competence, independence, and collusion are unknowable from public state and are **not** judged.
3. **No motive.** The rotation, the residual-role retention, and the canceller rollout are stated as
   block-anchored sequences; **why** is not established by any located artifact and is not
   speculated (causality discipline; g35 §11 four-motive-less-sequences class, now five).
4. **Negatives are filter-scoped.** The residual-authority negatives (§6) hold only within the
   standard `OwnershipTransferred`/`RoleGranted`/`RoleRevoked` filters; non-emitting or non-standard
   authority paths are not excluded.
5. **Code hashes are characterisation.** No `eth_getCode`/proxy-code hash here may seed
   `expectedRuntimeCodeHash` for any target (G-01 anti-seeding).
6. **Single-provider spots, disclosed:** the outgoing Safe's creation tx/receipt (OP Labs only,
   Tenderly pruned); the Safe-service snapshots (one HTTP API). Both are corroborated by an
   independent path where it matters (creation-block self-logs are dual-provider; service snapshots
   match the dual-provider storage walk).

---

## 14. REPRODUCTION

All scripts, artifacts and the acquisition ledger live in
`roadmap/research/route-manifest/g08-evidence/`.

| File | Role |
|---|---|
| `keccak.py`, `decode.py`, `fetch.py`, `sweep.py` | copied **unmodified** from the g35 archive (sha256 in §1.1); archive not written to |
| `safedec.py` | Safe-event full-word decoders (source-derived shapes, truncation teeth) |
| `s01_heads.py` | head probes + per-chain pinned-head selection |
| `s02_src_safe.py`, `s03_derive_safe.py` | Safe v1.3.0/v1.4.1 source acquisition; in-lane topic0/role-id derivation + g35 cross-check |
| `s04_creation.py`, `s05_creation_tx.py` | creation-block bisection (dual-provider boundary) + creation tx/receipt decode + Safe-service `/creation/` |
| `s06a_safehist.py`, `s06b_hist_764682_oplabs.py` | full self-event history sweeps (resumable, content-addressed) |
| `s07_fold.py` | decode + append-only owner/threshold fold; rotation-block snapshot; provider-agreement + blockHash asserts |
| `s08_vendor_registry.py` | vendor `safe-deployments` identification of factories/singletons/handlers; OwnerManager write/emission scan; ChangedMasterCopy decode |
| `s09_msig_ops.py` | `SafeMultiSigTransaction` enumeration + delegatecall/MultiSend completeness cap |
| `s10_storage_walk.py` | pinned dual-provider owner-linked-list storage walk; MultiSendCallOnly identification |
| `s12_residual.py` | residual-authority topic-filtered sweeps (both Safes, both chains) |
| `s13_reorg_recheck.py` | cross-provider block-hash recheck of load-bearing blocks |
| `s14_negtest.py` | 7 decoder guard negative tests |
| `ledger.jsonl` | every acquisition: effective URL, HTTP status, sha256, bytes, note |
| `raw/` | every raw response body byte-for-byte; sweep concat artifacts; retained deploy-source files |
| `*.json` | intermediate decoded outputs (`creation_*`, `safehist_raw`, `fold_results`, `storage_walk`, `svc_snapshots`, `residual_raw`, `msig_ops_*`, `safe_topics`, `pins`) |

Repo files **read** (never modified): `blueprint.md`, `g35-dossier.md`, `g35-codex-verdict.md`,
`g02-04-execution-order.md`, WR1/WR2 sources. Deploy source **read** (pinned commit `e30c859c`,
scratchpad checkout, HEAD-verified): `weETH-cross-chain/utils/L2Constants.sol` and `output/*.json`.
