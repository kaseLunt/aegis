<!-- ROUTE-ETH-OP-v1 — GAP-3 / GAP-5 / GAP-1 control-plane evidence dossier.
Chain-historian standing lane G35, 2026-07-26. Research input only.
EXPECTED-side evidence via governance-execution history (blueprint §4-admissible path).
This lane DELIBERATELY did not read owner()/delegates()/hasRole()/rate-limit getters at
head — those observed-side reads belong to a different role under D-006.
No repo file was read-modified by this lane; no block explorer was used for any purpose. -->

<!-- Integrator provenance note (fable-main, 2026-07-26): persisted VERBATIM from the lane's
scratch output. Durable evidence copy (ledger.jsonl, raw/ 146 files, ~~13 content-addressed
sweep artifacts~~ 13 sweep ledger entries = 10 unique sweep digests, 8 retained sweep files
(§9.1 as corrected per Codex review), all scripts): C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\g35\
— the temp scratchpad path cited below will not outlive the machine's temp cleanup.
Claim strength: the lane's own report, dual/three-provider where stated, NOT yet
independently reviewed; manifest-grade use requires the wave-3 blueprint patch pass +
review (D-006: this lane sourced expected-side evidence and may not certify it). -->

# ROUTE-ETH-OP-v1 — GAP-3 / GAP-5 / GAP-1 EVIDENCE DOSSIER

**Lane:** chain-historian, standing evidence lane G35 (control-plane follow-ups named by
`roadmap/research/route-manifest/g02-04-execution-order.md` §7 and by
`roadmap/research/route-manifest/blueprint.md` §6 round-8 MANIFEST-READY step 2)
**Retrieval window:** 2026-07-26 ~23:20 UTC → 2026-07-27 ~01:0x UTC
**Chain heads at read time (OBSERVED, dual-provider on ETH):**
ETH `25620245`, hash `0xa621150c3588badf0cef86543d5383de03b93dfeca87d686a527e6127cfa2ff8`, ts 2026-07-26T23:25:35Z
(identical block number **and** hash returned by `rpc.mevblocker.io` and `gateway.tenderly.co/public/mainnet`)
OP `154754784`, hash `0xd8454ad8516f4a8298066660bb96376727d37f3ee696e22fc7cbb3b32fba6029`, ts 2026-07-26T23:25:45Z

**Evidence ledger:** `…\scratchpad\g35\ledger.jsonl` — every raw response body sha256'd with
its **effective** URL (post-redirect), HTTP status, byte count and note.

---

## 1. SUMMARY — THE THREE ANSWERS, PLUS TWO GAPS CLOSED IN PASSING

### GAP-3 — **ANSWERED. The blueprint's presumption is TRUE on ETH and REFUTED on OP, by an event three days old.**

Complete `RoleGranted` / `RoleRevoked` / `RoleAdminChanged` history, block 0 → head, both
TimelockControllers, every role id and event topic0 derived in-lane from the OpenZeppelin
signatures.

- **ETH `0xcd425f44…`** — the L1 controller Safe `0x2aCA7102…` holds **PROPOSER + EXECUTOR +
  CANCELLER** since blk 22089226, **never revoked**. The blueprint's "presumed proposer/executor"
  is confirmed. One later addition: CANCELLER to `0x055a8B2B…` at blk 25533314.
- **OP `0x851dd540…`** — the OP controller Safe `0x764682c7…` held PROPOSER + EXECUTOR +
  CANCELLER from blk 139414997 and **all three were REVOKED at blk 154619344 (2026-07-23)**,
  simultaneously granted to a **new Safe `0x7a00657a…`**, plus CANCELLER to `0x055a8B2B…`.
  **Blueprint S7 / E2's "proposer/executor = OP controller Safe" is stale as of that block.**
- **EXECUTOR_ROLE is NOT open on either timelock.** Zero `RoleGranted`/`RoleRevoked` events with
  `account == address(0)` across both contracts' entire histories. Execution is permissioned.
  *(per Codex review, [[g35-codex-verdict.md]] claim 5: the zero-`address(0)` observation is
  OBSERVED-dual/triple; "not open"/"permissioned" is an inference conditional on the deployed
  code obeying the sourced AccessControl write/emission model.)*
- **Neither timelock has an external admin.** Exactly one admin-role grant each, to `address(this)`
  — which per the OZ constructor source means the deploy-time `admin` argument was `address(0)`.
  Role changes must therefore pass through the timelock's own delay (ETH 172,800 s / OP 259,200 s),
  and the observed grants/revokes did exactly that.
- **The two timelocks run DIFFERENT OpenZeppelin role-model epochs** — ~~ETH is OZ 4.x~~ ETH is
  OZ-4-style (`TIMELOCK_ADMIN_ROLE`), ~~OP is OZ 5.x~~ OP is OZ-5-style
  (`DEFAULT_ADMIN_ROLE = bytes32(0)`) — INFERRED lineage *(superseded 2026-07-26 per Codex review
  round 2, [[g35-codex-verdict.md]])*. Established two ways:
  event shape at construction, and presence/absence of the `TIMELOCK_ADMIN_ROLE` literal in
  block-pinned runtime bytecode. **This is a direct input to blueprint GAP G-10.**
  *(per Codex review, [[g35-codex-verdict.md]] claim 8: read as OZ-4-style / OZ-5-style — the
  exact lineage is INFERRED; literals and event shapes corroborate the model but are not an
  exact deployed-bytecode/source build match.)*

### GAP-5 — **ANSWERED, and it REFUTES the blueprint's most urgent unknown. The delegate is the timelock, on both chains.**

First, a source correction: **`OAppCoreUpgradeable.setDelegate` emits NOTHING.** The task's
premise ("LayerZero OAppCore emits an event on setDelegate — likely `DelegateSet(address)`") is
refuted by the vendored source. The event lives on the **Endpoint**, is
`DelegateSet(address sender, address delegate)`, and **both parameters are non-indexed** — so it
cannot be topic-filtered by OApp, and a full-history Endpoint sweep with a data-side filter is the
only sound method.

| Chain | Incumbent delegate by last event | Since block | Same tx as the ownership transfer? |
|---|---|---|---|
| ETH `0xcd2eb13d…` | **`0xcd425f44…` (the ETH adapter-owner timelock)** | 25296945 (2026-06-11) | **Yes** — tx `0x15f25bb0…`, logIndex 126 vs 127 |
| OP `0x5a7facb9…` | **`0x851dd540…` (the OP L2 timelock)** | 154486119 (2026-07-20) | **Yes** — tx `0xfc990c72…`, logIndex 64 vs 65 |

**Consequence:** blueprint §5.1, E4 and E5's standing claim — *"Delegate-gated values (DVN set,
threshold, confirmations, libraries) can still be rewritten with zero enforced delay by a delegate
whose identity is unread"* — is **false as of those blocks**. The delegate-gated path is the
timelocked path. Corroborated behaviourally and independently: at ETH blk 25418960 the ETH timelock
successfully executed `setSendLibrary` / `setReceiveLibrary` / `setConfig` **on the Endpoint**, and
`MessageLibManager` gates all three behind `_assertAuthorized(_oapp)`, which admits only the OApp
itself or `delegates[_oapp]`.

### GAP-1 — **CLOSED. Agreement TRUE. OP pre-window is now dual-provider.**

Independent 2,966-chunk sweep of `mainnet.optimism.io` over `[120917167, 150567893]`, **0 chunk
errors, 0 transport retries**. **18 events, exact agreement with the prior lane's Tenderly set** on
`(direction, blockNumber, blockHash, transactionHash, logIndex, data)`. All four decisive
30101-touching writes reproduce the prior lane's §3.2 table value-for-value.

### Bonus — **G-06 CLOSED, and G-07 CLOSED with a supersession the blueprint does not carry**

- **G-06:** L1 proxy admin `0xa9E9bBf0…` ~~was owned by `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`
  from its deployment block 20865339 and **has never changed**~~ owner **by last decoded event** =
  `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`, from its deployment block 20865339; no later
  corresponding standard event appears through the pinned head. Current storage remains a separate
  observed-side check. *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*
  L1 upgrade authority resolved.
- **G-07:** that L1 timelock's `minDelay` ~~is **864,000 s (10 days)**~~ **by last decoded event**
  is **864,000 s (10 days)** since ETH blk 24982415; no later `MinDelayChange` appears through the
  pinned head; current storage remains a separate observed-side check. *(superseded 2026-07-26 per
  Codex review round 2, [[g35-codex-verdict.md]])*
  The blueprint records "≤ 259,200 s bound only" — ~~the live value~~ the value by last decoded
  event is **larger** than the bound, and
  the 259,200 s figure is a superseded state that was live 2024-03-08 → 2026-04-24.

---

## 2. METHOD AND ACQUISITION DISCIPLINE

### 2.1 Keccak — re-verified before any derivation

The prior lane's pure-Python Keccak-256 was copied unmodified from the archive
(`C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\keccak.py`) and its **7-vector
self-test re-run in this lane before any derivation**, and again at the top of every derivation
script (`assert keccak.selftest()` is the first executable line of each):

```
KECCAK SELFTEST PASS (7 vectors incl. empty, abc, transfer sel,
Transfer/Approval/OwnershipTransferred topics, MINTER_ROLE)
```

### 2.2 Every derivation shown (all produced by executed code, INS-035ae3e4)

**Event topic0s**

| Signature | keccak256 → topic0 |
|---|---|
| `RoleGranted(bytes32,address,address)` | `0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d` |
| `RoleRevoked(bytes32,address,address)` | `0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b` |
| `RoleAdminChanged(bytes32,bytes32,bytes32)` | `0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff` |
| `DelegateSet(address,address)` | `0x6ee10e9ed4d6ce9742703a498707862f4b00f1396a87195eb93267b3d7983981` |
| `DelegateSet(address)` *(the hypothesis under test — **not** the real event)* | `0x2bb25fbb42d8e727aa4821b933cc09877ef371e86860cb18c52f8fda3cf18b5c` |
| `CallScheduled(bytes32,uint256,address,uint256,bytes,bytes32,uint256)` | `0x4cf4410cc57040e44862ef0f45f3dd5a5e02db8eb8add648d4b0e236f1d07dca` |
| `CallExecuted(bytes32,uint256,address,uint256,bytes)` | `0xc2617efa69bab66782fa219543714338489c4e9e178271560a91b82c3f612b58` |
| `Cancelled(bytes32)` | `0xbaa1eb22f2a492ba1a5fea61b8df4d27c6c8b5f3971e63bb58fa14ff72eedb70` |
| `MinDelayChange(uint256,uint256)` | `0x11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5` |
| `Upgraded(address)` | `0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b` |
| `OutboundRateLimitsChanged((uint32,uint256,uint256)[])` | `0x55254e344b7fc8e2e038c1f7f20a1c7afe659c1a3bbfc4e35dd1ca9bba0ca0a0` |
| `InboundRateLimitsChanged((uint32,uint256,uint256)[])` | `0x983af742b0b5ca79aa5c0be76cea126e1baf3139ecd04624deac13853c4bebde` |
| `PeerSet(uint32,bytes32)` | `0x238399d427b947898edb290f5ff0f9109849b1c3ba196a42e35f00c50a54b98b` |
| `OwnershipTransferred(address,address)` *(added per Codex review)* | `0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0` |

The two rate-limit topic0s were **re-derived in this lane and asserted equal** to the g02-04
dossier §2.2 values by executed code (`MATCH g02-04 dossier §2.2: True` for both) — a cross-lane
reproducibility check, not a copy.

**Role ids** — the operative point is that `DEFAULT_ADMIN_ROLE` is the OZ **constant `bytes32(0)`**,
*not* the hash of the string. Both are derived below so the distinction is on the record:

| Role string | keccak256 |
|---|---|
| `PROPOSER_ROLE` | `0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1` |
| `EXECUTOR_ROLE` | `0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63` |
| `CANCELLER_ROLE` | `0xfd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783` |
| `TIMELOCK_ADMIN_ROLE` | `0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5` |
| `keccak256("DEFAULT_ADMIN_ROLE")` — **a decoy, never used as a role id** | `0x1effbbff9c66c5e59634f24fe842750c60d18891155c32dd155fc2d661a4c86d` |
| **`DEFAULT_ADMIN_ROLE` as actually used (OZ constant)** | `0x0000000000000000000000000000000000000000000000000000000000000000` |

**Function selectors** (used to decode timelock operation calldata)

`grantRole(bytes32,address)` → `0x2f2ff15d` · `revokeRole(bytes32,address)` → `0xd547741f` ·
`renounceRole(bytes32,address)` → `0x36568abe` · `updateDelay(uint256)` → `0x64d62353` ·
`setDelegate(address)` → `0xca5eb5e1` · `setPeer(uint32,bytes32)` → `0x3400288b` ·
`setOutboundRateLimits(…)` → `0xe96e38e2` · `setInboundRateLimits(…)` → `0xf51b1aca` ·
`setSendLibrary(address,uint32,address)` → `0x9535ff30` ·
`setReceiveLibrary(address,uint32,address,uint256)` → `0x6a14d715` ·
`setConfig(address,address,(uint32,uint32,bytes)[])` → `0x6dbd9f90` ·
`setEnforcedOptions((uint32,uint16,bytes)[])` → **`0xb98bd070`**
*(the last one resolves a selector that appeared unidentified in the ETH timelock's operation
history — a small incidental closure of the same class as g02-04 §6.3.)*

### 2.3 Event and struct types read from SOURCE, never guessed

| Type | Source, with acquisition digest |
|---|---|
| `DelegateSet(address sender, address delegate)` — **both non-indexed** | `ILayerZeroEndpointV2.sol` L56, sha256 `a88fb702b371527c3791d7e5c168c1157d39021ed29b51e627e02973e6a740e0` |
| `EndpointV2.setDelegate` writes `delegates[msg.sender]` and emits unconditionally | `EndpointV2.sol` L326-330, sha256 `9702083ea7e0873510bd562095a6028dab5fad5e9be30e452908e6178bd51b6c` |
| `_assertAuthorized(_oapp)` = `msg.sender == _oapp \|\| msg.sender == delegates[_oapp]` | `EndpointV2.sol` L354-357, same digest |
| `setSendLibrary` / `setReceiveLibrary` / `setReceiveLibraryTimeout` / `setConfig` all call `_assertAuthorized(_oapp)` | `MessageLibManager.sol` L227-232, L245-251, L279-285, L307-308, sha256 `aa074a24bd2f7b5e91f7b5cb60d647ae3c8d2ff44c3bf62e925d6ce661cf799b` |
| `OAppCoreUpgradeable.setDelegate` — `onlyOwner`, **emits nothing**, delegates to the Endpoint | `OAppCoreUpgradeable.sol` L101-103, sha256 `f64acff6e5d03603c00d7212ae995832f77b39d105a4dfe68d2651aa537a8a0a` |
| `IOAppCore` declares only `PeerSet` — **no delegate event on the OApp** | `IOAppCore.sol` L18, sha256 `041dd35f0a4a22425614414c05cd5aae6ce7e4b5b86b0350045e57c0ed3cbf1b` |
| `__OAppCore_init_unchained` also calls `endpoint.setDelegate` (second write path, closed in §5.4) | `OAppCoreUpgradeable.sol` L50-53, same digest |
| `_roles[…]` assigned in **exactly two** functions, both emitting unconditionally | OZ `AccessControl.sol` v4.9.6 sha256 `afd98330d27bddff0db7cb8fcf42bd4766dda5f60b40871a3bec6220f9c9edf7`; v5.0.2 sha256 `1086a1ad3788972b885ff3f209da510615dde6214d46b29e1cd2a4924f66c06d` |
| TimelockController constructor role wiring (both epochs) | v4.9.6 sha256 `a0d206c08ad337754df71b731e827f35e6e5d635630b6c930fb54d4d72aa9d66`; v5.0.2 sha256 `89a4cf0e404a42f13d01efefb5c1b3b1d46641c670b626b1b885330f3faccd2a` |

All LayerZero sources were fetched from the ether.fi fork pinned at
`JorgeAtPaladin/LayerZero-v2` commit `21ad027cf323c323619566d2c9d1f2fa404f021f`.
**Cross-lane reproducibility check:** `IMessageLibManager.sol` fetched here hashes to
`c648091e7cb079cb95778becfff1a813e901fdc07124153ba731a7d9daa29b40` — byte-identical to the digest
the g02-04 lane recorded for the same file (§2.2). Independent re-fetch, same bytes.

**Event shapes that matter for decoding** (each cost a deliberate correction, recorded here so the
next lane does not pay it again):
- `RoleGranted`/`RoleRevoked`: **all three parameters indexed** → 4 topics, **empty `data`**.
  Asserted at decode: `len(topics)==4` and `data in ("0x","")`.
- `CallScheduled`: only `id` and `index` indexed → **3 topics**; `data` head is
  `(target, value, offset→bytes, predecessor, delay)` so the bytes offset is **160**, asserted.
- `CallExecuted`: 3 topics; head is `(target, value, offset→bytes)` so the offset is **96**, asserted.
- `DelegateSet`: **0 indexed parameters** → 1 topic, `data` is exactly 2 words.

### 2.4 Full-word decoder with truncation teeth — negative-tested in THIS lane

`decode.py` was copied unmodified from the archive. Every numeric in this dossier is produced by
`int.from_bytes` over a **complete 32-byte word**; there are no substring reads anywhere. Because
this lane decodes **new event shapes** the prior lane never touched (role topics, `CallScheduled`
/`CallExecuted` bodies, `DelegateSet` bodies), the guards were re-negative-tested against those
exact paths and against real payloads:

```
POSITIVE control: real DelegateSet body decodes, delegate = 0xcd425f44758a08baab3c4908f3e3de5776e45d7a

[A] DelegateSet body guards
  REJECTED 1-byte-short body:            ValueError: TRUNCATION GUARD ... length 63 is not a multiple of 32
  REJECTED half-word splice:             ValueError: TRUNCATION GUARD ... length 48 is not a multiple of 32
  REJECTED dropped delegate word:        AssertionError: ARITY GUARD: DelegateSet expects 2 data words, got 1
  REJECTED dirty high bytes in sender:   AssertionError: DIRTY ADDRESS WORD ... high 12 bytes not zero
[B] role-topic guards
  REJECTED 31-byte topic:                ValueError: TRUNCATION GUARD ... topic is 31 bytes, not 32
  REJECTED dirty-high-bytes account:     AssertionError: DIRTY ADDRESS TOPIC
[C] CallScheduled/CallExecuted guards
  REJECTED bytes offset 0:               AssertionError: OFFSET GUARD: CallScheduled bytes offset 0 != 160
  REJECTED calldata len > payload:       AssertionError: TRUNCATION GUARD: declared 255 calldata bytes, got 32
[D] rate-limit array guards, on REAL 19-entry data
  REJECTED real array minus final word:  AssertionError: ARITY GUARD: array claims 19 entries -> expects 59 words, body has 58
  REJECTED real array minus 1 byte:      ValueError: TRUNCATION GUARD ... length 1887 is not a multiple of 32
  REJECTED length word tampered 19->2:   AssertionError: ARITY GUARD: array claims 2 entries -> expects 8 words, body has 59

=== guard negative-test result: 11 rejected as required, 0 leaked ===
```

**Honest note on the first run of this test:** one case initially reported NOT REJECTED. On
inspection the *test vector* was wrong — I had placed the "dirt" in the low bytes of the address
word, where zeros are legal — not the guard. Vector corrected, guard rejects. Recorded because a
negative test that is silently fixed until it passes is worthless; the failure and its cause belong
in the record.

### 2.5 Providers — what worked, what refused (OBSERVED, verbatim)

| Endpoint | Result in this lane |
|---|---|
| `rpc.mevblocker.io` | full-range `eth_getLogs` OK (ETH primary); one transient `eth_getBlockByNumber` failure, retried successfully |
| `gateway.tenderly.co/public/mainnet` | full-range OK (ETH secondary) |
| `optimism.gateway.tenderly.co` | full-range OK (OP primary); returned `"result": null` for one historical receipt (`0xe5bec9ff…`) that OP Labs served — recorded as a refusal, not a fact |
| `mainnet.optimism.io` | archive OK at 10k steps. **2,966-chunk GAP-1 sweep: 0 errors.** 1,534-chunk role sweep: 11 chunks refused with `-32016 "Your IP has exceeded its requests per second capacity"` — **all 11 re-queried successfully, 0 additional events** |
| `optimism.api.onfinality.io/public` | OK at 100k steps but very slow; the roles sweep completed (154 chunks, 11 logs); its delegate sweep did not complete before the lane's pause |
| `optimism.drpc.org` | `code 35` — "ranges over 10000 blocks are not supported on free plan" |
| `op-pokt.nodies.app` | `-32001` "Block range too large: maximum allowed is 250 blocks" |
| `optimism.publicnode.com` | `-32602` "Archive requests require a personal token" |
| `optimism-mainnet.public.blastapi.io` | `-32000` "Blast API is no longer available" |
| `opt-mainnet.g.alchemy.com/v2/demo`, `0xrpc.io/op` | empty/`null` body |
| `api.zan.top/opt-mainnet` | `-32012` "cu limit exceeded" |
| `optimism.rpc.thirdweb.com` | `-32005` "Log response size exceeded. Maximum allowed number of requested blocks is 1000" |
| `rpc.optimism.gateway.fm`, `optimism.llamarpc.com`, `op.rpc.blxrbdn.com` | DNS `getaddrinfo failed` |
| `api.safe.global` (via `safe-transaction-{mainnet,optimism}.safe.global`) | OK. **Requires EIP-55 checksummed addresses** — lowercase returns HTTP 422 `"Checksum address validation failed"`. Checksums were derived in-lane with this lane's keccak. |

**G9 provenance-rot applied:** every `safe-transaction-*.safe.global` request **308-redirects**; the
**effective** URL (`https://api.safe.global/tx-service/{eth,oeth}/api/v1/…`) is what the ledger
records. 15 of 108→N acquisitions in this lane were redirected.

### 2.6 Explorer quarantine honored

**No block explorer was used at all** — not for discovery, not for labels, not for decoding. Every
address label in this dossier is either (a) carried forward from a repo-canonical SOURCED value with
its citation, or (b) explicitly marked as unlabelled. Every value is decoded by this lane's decoder
from raw log `data`, raw topics, or raw calldata.

### 2.7 Role separation honored (D-006 / blueprint §4 preamble)

This lane made **no `eth_call` at head, and no read of any value the manifest will verify**. In
particular `owner()`, `delegates()`, `hasRole()`, `getMinDelay()`, `peers()`,
`outboundRateLimits()` and `inboundRateLimits()` were **not** called. Every claim below is derived
from **governance-execution history** — the blueprint's admissible expected-side path. Two classes
of chain read were used and are declared:
- `eth_getLogs` over historical ranges (the evidence base);
- `eth_getCode` and `eth_getBlockByNumber` **pinned to historical block numbers, never `latest`**,
  and only against entities that are *not* manifest targets (Safes, TimelockControllers, proxy
  admins). **None of the code hashes in §7 may seed `expectedRuntimeCodeHash` for anything** —
  they are entity-characterisation, and the G-01 anti-seeding rule applies to them by analogy.

---

## 3. GAP-3 — TIMELOCK PROPOSER / EXECUTOR / CANCELLER ROLES

### 3.1 Acquisition and agreement

| Timelock | Range | Providers | Events | Agreement |
|---|---|---|---|---|
| ETH `0xcd425f44758a08baab3c4908f3e3de5776e45d7a` | 0 → 25620245, single request | mevblocker `7c30c1d7a8b2a7cd07d214d618ff87221e8b6284da035ba2a6bf54f9fd43362d` · Tenderly `db547caef6059f4b636e53b37a471d117655de973ec7b1b8eaf5b9602d0e6ad5` | 9 | **True** |
| OP `0x851dd540f4d2ec78120de0a0cc87b21ede5df5c6` | 0 → 154754784 | Tenderly `2bd503d963dd095b4851aa8311d7834abf9c77f758b80c2d10c88b7b7b19fbb1` | 11 | — |
| OP, second provider | 139414997 → 154754784, 10k steps, 1,534 chunks + 11 repaired | OP Labs, artifact `01082422c9c8693f9ca00883ec42e5bad037f54a6477e19c981730b6e227a096` | 11 | **True** vs Tenderly |
| OP, third provider | 139414997 → 154754784, 100k steps, 154 chunks | OnFinality, artifact `c8a42122e00f0fa99eab3360fbe720f3736c11b2ec9bab9eedf5e5558990cc22` | 11 | **True** vs Tenderly |

Agreement basis: `(blockNumber, blockHash, transactionHash, logIndex, data, topics, address)`.
**The OP role history is three-provider concordant.**

The OP Labs sweep's 11 rate-limited chunks were individually re-queried until served
(`[143324997,143334996]`, `[143334997,143344996]`, `[143344997,143354996]`,
`[148604997,148614996]`, `[148614997,148624996]`, `[148624997,148634996]`,
`[152184997,152194996]`, `[152194997,152204996]`, `[152204997,152214996]`,
`[152214997,152224996]`, `[152224997,152234996]`) — **0 still refusing, 0 additional events**.
Coverage is complete, not merely "mostly complete".

### 3.2 ETH timelock `0xcd425f44…` — full role ledger

~~All nine events are in **one transaction**,~~ Eight of the nine role events are in **one
transaction**, `0x39b68979e40d786a6688601aa747b34aabf3d48c0246068d052790ae373a8624`
(a direct contract-creation tx, `to = null`, `from = 0x8d5aac5d3d5cda4c404fa7ee31b0822b648bb150`,
status `0x1`, 9 logs, dual-provider receipt agreement **True**)~~, plus one later grant~~ — the
transaction's ninth log is a `MinDelayChange`, not a role event; the ninth role event is the
later canceller grant (row 9, blk 25533314). *(superseded 2026-07-26 per Codex review,
[[g35-codex-verdict.md]])*

| # | Block | ts (UTC) | logIdx | Event | Role | Account |
|---|---|---|---|---|---|---|
| 1 | 22089226 | 2025-03-20T16:19:11Z | 219 | RoleAdminChanged | TIMELOCK_ADMIN_ROLE | prev `bytes32(0)` → new TIMELOCK_ADMIN_ROLE |
| 2 | 22089226 | " | 220 | RoleAdminChanged | PROPOSER_ROLE | prev `bytes32(0)` → new TIMELOCK_ADMIN_ROLE |
| 3 | 22089226 | " | 221 | RoleAdminChanged | EXECUTOR_ROLE | prev `bytes32(0)` → new TIMELOCK_ADMIN_ROLE |
| 4 | 22089226 | " | 222 | RoleAdminChanged | CANCELLER_ROLE | prev `bytes32(0)` → new TIMELOCK_ADMIN_ROLE |
| 5 | 22089226 | " | 223 | **RoleGranted** | TIMELOCK_ADMIN_ROLE | `0xcd425f44…` (**SELF**) |
| 6 | 22089226 | " | 224 | **RoleGranted** | PROPOSER_ROLE | `0x2aca71020de61bb532008049e1bd41e451ae8adc` |
| 7 | 22089226 | " | 225 | **RoleGranted** | CANCELLER_ROLE | `0x2aca71020de61bb532008049e1bd41e451ae8adc` |
| 8 | 22089226 | " | 226 | **RoleGranted** | EXECUTOR_ROLE | `0x2aca71020de61bb532008049e1bd41e451ae8adc` |
| 9 | 25533314 | 2026-07-14T20:37:35Z | 329 | **RoleGranted** | CANCELLER_ROLE | `0x055a8b2b65d0ab4e0c17a0168d032464b7e97bdf` |

Block hashes: `0x54d5a4b874c08215db4a1ac32d5a64b1d4ae3b68db05cbb6ce163efda6215ab9` (22089226),
`0x594b0b1eae6364700cdf6937f1dc9e5fc0ec091491329565e5540f454de6cb6d` (25533314).

Full-word topic decodes for the load-bearing rows:

```
row 6  topic[1] 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1 -> PROPOSER_ROLE
       topic[2] 0x0000000000000000000000002aca71020de61bb532008049e1bd41e451ae8adc -> 0x2aca7102…  (high 12 bytes asserted zero)
       topic[3] 0x0000000000000000000000008d5aac5d3d5cda4c404fa7ee31b0822b648bb150 -> sender = deployer EOA
row 8  topic[1] 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63 -> EXECUTOR_ROLE
       topic[2] 0x0000000000000000000000002aca71020de61bb532008049e1bd41e451ae8adc -> 0x2aca7102…
row 9  topic[1] 0xfd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783 -> CANCELLER_ROLE
       topic[2] 0x000000000000000000000000055a8b2b65d0ab4e0c17a0168d032464b7e97bdf -> 0x055a8b2b…
       topic[3] 0x000000000000000000000000cd425f44758a08baab3c4908f3e3de5776e45d7a -> sender = the timelock ITSELF
```

**Folded state at ETH head 25620245 — nothing has ever been revoked on this timelock:**

| Role | Holder | Granted at | Revoked at | Live |
|---|---|---|---|---|
| TIMELOCK_ADMIN_ROLE | `0xcd425f44…` (self) | 22089226 | — | YES |
| PROPOSER_ROLE | `0x2aCA7102…` L1 controller Safe | 22089226 | — | YES |
| EXECUTOR_ROLE | `0x2aCA7102…` L1 controller Safe | 22089226 | — | YES |
| CANCELLER_ROLE | `0x2aCA7102…` L1 controller Safe | 22089226 | — | YES |
| CANCELLER_ROLE | `0x055a8B2B…` | 25533314 | — | YES |

### 3.3 OP timelock `0x851dd540…` — full role ledger, **with the supersession**

| # | Block | ts (UTC) | logIdx | Event | Role | Account |
|---|---|---|---|---|---|---|
| 1 | 139414997 | 2025-08-05T21:19:31Z | 54 | RoleGranted | DEFAULT_ADMIN_ROLE `bytes32(0)` | `0x851dd540…` (**SELF**) |
| 2 | 139414997 | " | 55 | RoleGranted | PROPOSER_ROLE | `0x764682c769ccb119349d92f1b63ee1c03d6aecff` |
| 3 | 139414997 | " | 56 | RoleGranted | CANCELLER_ROLE | `0x764682c7…` |
| 4 | 139414997 | " | 57 | RoleGranted | EXECUTOR_ROLE | `0x764682c7…` |
| 5 | 154619344 | 2026-07-23T20:11:05Z | 187 | **RoleGranted** | PROPOSER_ROLE | **`0x7a00657a45420044bc526b90ad667affaee0a868`** |
| 6 | 154619344 | " | 189 | **RoleGranted** | EXECUTOR_ROLE | **`0x7a00657a…`** |
| 7 | 154619344 | " | 191 | **RoleGranted** | CANCELLER_ROLE | **`0x7a00657a…`** |
| 8 | 154619344 | " | 193 | **RoleGranted** | CANCELLER_ROLE | `0x055a8b2b65d0ab4e0c17a0168d032464b7e97bdf` |
| 9 | 154619344 | " | 195 | **RoleRevoked** | PROPOSER_ROLE | `0x764682c7…` |
| 10 | 154619344 | " | 197 | **RoleRevoked** | EXECUTOR_ROLE | `0x764682c7…` |
| 11 | 154619344 | " | 199 | **RoleRevoked** | CANCELLER_ROLE | `0x764682c7…` |

Block hashes: `0x7e10a7238e80d9f85465f569053daeccc506f27ba2238b9ab5a61b075414417d` (139414997),
`0x57f90c7970a36b3446d6ef20637d4ecd8cc9a3000aff0399f3d84a3d0f1b72e7` (154619344).
Transactions: `0xe5bec9ffcc8128454f0a0c89c18ef3a3198aaade6e4c068ba17265b4915a1693` (construction) and
`0x36d3ed1cfa86608471c27cc7ed3a820af29bd37cd3f336512d64bcb576145fcc` (rotation, status `0x1`,
16 logs, **dual-provider receipt agreement True**).

**Folded state at OP head 154754784:**

| Role | Holder | Granted at | Revoked at | Live |
|---|---|---|---|---|
| DEFAULT_ADMIN_ROLE `bytes32(0)` | `0x851dd540…` (self) | 139414997 | — | YES |
| PROPOSER_ROLE | `0x764682c7…` OP controller Safe | 139414997 | **154619344** | **no — SUPERSEDED** |
| EXECUTOR_ROLE | `0x764682c7…` OP controller Safe | 139414997 | **154619344** | **no — SUPERSEDED** |
| CANCELLER_ROLE | `0x764682c7…` OP controller Safe | 139414997 | **154619344** | **no — SUPERSEDED** |
| PROPOSER_ROLE | **`0x7a00657a…`** | 154619344 | — | YES |
| EXECUTOR_ROLE | **`0x7a00657a…`** | 154619344 | — | YES |
| CANCELLER_ROLE | **`0x7a00657a…`** | 154619344 | — | YES |
| CANCELLER_ROLE | `0x055a8B2B…` | 154619344 | — | YES |

The superseded rows are retained, with their validity intervals, exactly as the recorder discipline
requires: a Rewind reconstruction of any OP boundary in `[139414997, 154619344)` must return
`0x764682c7…` as proposer/executor, **not** `0x7a00657a…`.

### 3.4 The role changes were themselves timelocked operations — the exhibit trail

Full `CallScheduled`/`CallExecuted`/`Cancelled` history was pulled for both timelocks
(ETH: 1,058 events, digest `4caab75c0027cae22972f0b72fa3ff8a9b570912b71f5e41e4ce9c694007a30e`;
OP: 14 events, digest `2dbc39b40ccb8c08acc7d9fb8fa2a76361cce41420d2c505c7618c82e0330049`).
Every role change above has a matching schedule→execute pair with the delay in the clear:

| Chain | Op id | Scheduled | Delay word → seconds | Executed | Elapsed |
|---|---|---|---|---|---|
| ETH | `0x59ccfcf28a95c8d85f1f4915ece101a42b912229886af8dd8d2cdf98504d9e8d` | blk 25497442 (tx `0xd0e0ed85…`) | `0x…0002a300` → **172,800** | blk 25533314 (tx `0xae96949e…`) | 35,872 blocks |
| OP | `0x702c9f6b80f8c0547c8d6660c190f19b55c8172d6557a8d42a96f92f18b5024f` | blk 154486119 (tx `0xfc990c72…`) | `0x…0003f480` → **259,200** | blk 154619344 (tx `0x36d3ed1c…`) | 133,225 blocks ≈ 266,450 s |

The OP operation is a **7-call batch**, indices 0–6, decoded from `CallScheduled` calldata:
`grantRole(PROPOSER, 0x7a00657a…)`, `grantRole(EXECUTOR, 0x7a00657a…)`,
`grantRole(CANCELLER, 0x7a00657a…)`, `grantRole(CANCELLER, 0x055a8b2b…)`,
`revokeRole(PROPOSER, 0x764682c7…)`, `revokeRole(EXECUTOR, 0x764682c7…)`,
`revokeRole(CANCELLER, 0x764682c7…)` — the grants precede the revokes within the batch, so the
timelock is never role-less. Each call's arguments decoded full-word, e.g.:

```
CallScheduled idx 4, blk 154486119 logIdx 70
  data word[0] 0x000000000000000000000000851dd540f4d2ec78120de0a0cc87b21ede5df5c6 -> target = SELF
  data word[4] 0x000000000000000000000000000000000000000000000000000000000003f480 -> delay = 259200 s
  calldata sel 0xd547741f -> revokeRole(bytes32,address)
    arg word[0] 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1 -> PROPOSER_ROLE
    arg word[1] 0x000000000000000000000000764682c769ccb119349d92f1b63ee1c03d6aecff -> 0x764682c7…
```

**Attribution note (INS-878f3914 class):** the outgoing OP controller Safe `0x764682c7…` is the
`to` of **both** the scheduling and the executing transaction — i.e. it scheduled and then executed
its own removal, using the EXECUTOR_ROLE it still held at execution time. Ordering is established
by `(blockNumber, transactionIndex, logIndex)`, never by Safe nonce.

### 3.5 Completeness — how the role ledger is known to be the whole role state

1. **Event-level completeness, SOURCED not assumed.** In OZ `AccessControl` the role mapping is
   assigned in **exactly two** functions — `_grantRole` and `_revokeRole` — and each emits
   unconditionally whenever it actually changes state; `_setRoleAdmin` is the only writer of
   `adminRole` and emits `RoleAdminChanged`. Verified by executed regex over both v4.9.6 and v5.0.2
   sources (`occurrences of '_roles[…] =' : 2` in each). `renounceRole` routes through `_revokeRole`
   and therefore also emits. **The event stream IS the role state.**
2. **Range completeness.** Both primary sweeps ran `fromBlock: 0x0`. Nothing predates them.
3. ~~**No silent code swap.**~~ **No standard `Upgraded(address)` event.** `Upgraded(address)`
   history is **empty (0 events)** on
   `0xcd425f44…`, `0x9f26d4c9…`, `0xa9e9bbf0…`, `0x851dd540…` and `0x632304ed…`.
   ~~None is an upgradeable proxy, so the emitting code path was constant across the whole history.~~
   Absence of this one event signature proves neither that none of the five is a proxy nor that
   no code replacement occurred by a path that does not emit it; it establishes only that no
   standard `Upgraded(address)` was emitted. *(superseded 2026-07-26 per Codex review,
   [[g35-codex-verdict.md]])*
   *(Disclosure: those five empty-result bodies share a digest — `46ab8616d277a8ac…` on ETH,
   `5458704bd0a3e61a…` on OP — because the response bytes are literally identical
   `{"jsonrpc":"2.0","id":1,"result":[]}`. Content-addressing collides on empty results by design;
   the ledger's per-acquisition `note` carries the distinguishing request parameters.)*
4. **Constructor reconciliation.** The observed grants match the OZ constructors exactly:
   v4.x grants `TIMELOCK_ADMIN_ROLE` to `address(this)`, then `PROPOSER`+`CANCELLER` to each
   proposer and `EXECUTOR` to each executor; v5.x grants `DEFAULT_ADMIN_ROLE` to `address(this)`
   then the same. Because exactly **one** admin-role grant appears on each timelock, the optional
   `admin` constructor argument was `address(0)` on all three — **no external super-admin exists**.

### 3.6 Who the new role holders are (facts only — G-09 class, never a predicate)

Characterised via the Safe transaction service (an acquisition path wholly independent of the RPC
evidence) plus block-pinned `eth_getCode`. **These are EvidenceFacts. Signer custody is permanently
out of scope and no competence or independence judgment is made.**

| Address | Chain(s) | Safe version | Threshold | Owners | Nonce | Digest |
|---|---|---|---|---|---|---|
| `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` (outgoing OP) | OP | 1.3.0+L2 | 4 | 7 | 36 | `080988dfd63a3594a46de3fe38571e2ed3683aa034e9ca20c2ad1b04d925b3c4` |
| `0x7a00657a45420044bc526B90Ad667aFfaee0A868` (incoming OP) | OP | 1.3.0+L2 | 4 | 7 | **1** | `39c2e3d1a7f49c17524ac5e1f2c851d9efef55902c0fa0c3c3770042b1587c4d` |
| `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` (ETH) | ETH | 1.3.0 | 4 | 7 | 825 | `d82a5eac9995e029c545931bc33b7deea8097e6645ac58b4ea98c7f6006e738a` |
| `0x055a8B2B65d0aB4E0C17a0168d032464B7E97bdF` (canceller) | ETH **and** OP, same address | 1.4.1 / 1.4.1+L2 | 4 | 6 | **0** on both | `d0a599e3e44e57c34152e3150239806e34ae92bc31fa266da5efa059f6a917f3` (ETH), `0c4b5e52ae3b11d669f6f317dcb2cd183f4c3c737d1c9027931590a018cd8a17` (OP) |

**Signer-set delta, outgoing → incoming OP role holder: IDENTICAL — 7 of 7 shared, 0 added,
0 removed, same 4-of-7 threshold.**
~~So the OP rotation is a Safe **re-deployment**, not a change of signing body.~~
These are current (acquisition-time) snapshots: they do not prove the signer sets were identical
at the rotation block 154619344, and they do not prove the role change was a Safe
"re-deployment". *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])*
Reported as a fact; the *reason* is not established by any public artifact and this
lane does not speculate.

The canceller Safe `0x055a8B2B…` has a **disjoint** 6-owner set from both controller Safes and
nonce 0 on both chains — ~~it has never executed a transaction~~ it has never executed a
nonce-consuming Safe transaction (Safe nonce zero does not exclude module or fallback-handler
execution). *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* Its proxy runtime code hash is
identical across ETH and OP (`a8a0fbd3cdf49e751346664e01b529a58322a814cf8df8d85deb20e63bd6415e`),
consistent with a deterministic same-address deployment.

Deployment senders, for the record: ETH timelock created by EOA
`0x8d5aac5d3d5cda4c404fa7ee31b0822b648bb150`; OP timelock created by contract
`0x2ef43d8a4470674878bc3e80b7dcce2b4e3436b0` in a tx sent by
`0xd8f3803d8412e61e04f53e1c9394e13ec8b32550` to factory `0xba5ed099633d3b313e4d5f7bdc1305d3c28ba5ed`.
**Unlabelled** — no explorer was consulted and no repo artifact names them.

### 3.7 Role-model epoch — direct input to blueprint G-10

| Timelock | Runtime bytes (pinned) | `TIMELOCK_ADMIN_ROLE` literal present? | Event shape | Epoch |
|---|---|---|---|---|
| ETH `0xcd425f44…` @ blk 22089226 | 8,392 · sha256 `9dbf8287aa082eec04aeea34c95e9c3fe63b815bf1ac1781949d0f6fa6078881` | **True** | 4× `RoleAdminChanged` + admin grant to self | ~~**OZ 4.x**~~ **OZ-4-style** (INFERRED) |
| OP `0x851dd540…` @ blk 139414997 | 6,536 · sha256 `8e13b7c8d692bdf5a33c494faaed3c53beb4be54a8e679b5b485280578c1d148` | **False** | no `RoleAdminChanged`; `bytes32(0)` grant to self | ~~**OZ 5.x**~~ **OZ-5-style** (INFERRED) |

`PROPOSER_ROLE`, `EXECUTOR_ROLE` and `CANCELLER_ROLE` literals are present in **both**. The two
legs (bytecode literal scan, event shape) agree.
*(added per Codex review, [[g35-codex-verdict.md]] claim 8: the exact "OZ 4.x"/"OZ 5.x" lineage
is INFERRED — read as "OZ-4-style"/"OZ-5-style role model"; runtime literals and construction
event shapes corroborate the model but are not an exact deployed-bytecode/source build match.
Round 2: the in-table exact epoch labels above are struck accordingly.)*
**Manifest consequence:** a control-plane row cannot use one role-id vocabulary for both chains —
the ETH timelock's role admin is `TIMELOCK_ADMIN_ROLE`, the OP timelock's is `bytes32(0)`.
*(These two code hashes are entity characterisation and must never seed `expectedRuntimeCodeHash`
for any target.)*

---

## 4. GAP-5 — DELEGATE PROVENANCE

### 4.1 The premise correction, and why the method had to change

The task posed GAP-5 as "OAppCore emits an event on `setDelegate` — likely `DelegateSet(address)`".
**Source refutes this.** `OAppCoreUpgradeable.setDelegate` (L101-103) is:

```solidity
function setDelegate(address _delegate) public onlyOwner {
    endpoint.setDelegate(_delegate);
}
```

No `emit`. And `IOAppCore` declares exactly one event, `PeerSet`. The delegate event exists only on
the Endpoint, as `DelegateSet(address sender, address delegate)` — **and both parameters are
non-indexed** (`ILayerZeroEndpointV2.sol` L56). Two consequences the method had to absorb:

1. `topic0` is `keccak256("DelegateSet(address,address)")` = `0x6ee10e9e…`, **not** the
   `DelegateSet(address)` hypothesis (`0x2bb25fbb…`, derived and discarded).
2. **The sender cannot be topic-filtered.** The only sound method is a full-history sweep of every
   `DelegateSet` on the Endpoint plus a **data-side** filter on decoded word[0]. That is what was
   done — 6,368 ETH events and 1,953 OP events swept to find 4 and 3 relevant ones respectively.

### 4.2 Acquisition and agreement

| Chain | Emitter | Range | Provider / step | Events | Artifact sha256 | Chunk errors |
|---|---|---|---|---|---|---|
| ETH | EndpointV2 `0x1a44076050125825900e736c501f859c50fe728c` | 0 → 25620245 | mevblocker, 250k | 6,368 | `afc5f65d0e792a4e834a69779cad82bec4f31f8f6fc9214587601136a46c7859` | **0** |
| ETH | " | 0 → 25620245 | Tenderly, 250k | 6,368 | `1af5f569451077e72b6a00297a409ed157459978fac33ee79574cd3668a6669b` | **0** |
| ETH | " | 0 → 25620245 | mevblocker, **1M** | 6,368 | `f70a448c5cf7c0165a246d77e34828989c7c3d8e006a9b93f74cea964fbedf11` *(see §9.2 — bytes superseded on disk)* | **0** |
| ETH | " | 0 → 25620245 | Tenderly, **1M** | 6,368 | `abac6c8ce76aa392962cb00b051a4cb22d81386bec1581141c1f35bb5c691438` *(same caveat)* | **0** |
| ETH | " | 0 → 25620245 | mevblocker, **100k** (257 chunks) — hardening leg B | **6,368** | `7a459787f5e1fef5ca9fddeec43fdf668d1ce054c9d2d1acfddb274ce77efa9d` | **0** |
| OP | EndpointV2 `0x1a4407…` | 0 → 154754784 | Tenderly, 1M (155 chunks) | 1,953 | `4154672b8f3a93af8b7bdfaa4cb596140c7b45c147cd31083a3b1a709fa8fda3` | **0** |
| OP | " | 120917167 → 154754784 | OP Labs, 10k (**3,384 chunks**) — hardening leg A | **1,756** | `9ad7632164922c406c3cbec28233ce5a3c7576b5a5b0eab5d44d8de1c2b8137b` | **0** |

**ETH dual-provider agreement on all 6,368 events: True**, basis
`(blockNumber, blockHash, transactionHash, logIndex, data)`.

~~**ETH step-size invariance (leg B): the same 6,368 events at 100k, 250k AND 1M steps, on both providers.** A 10x step-size range yielding an identical event set rules out the provider-result-cap class — the failure mode where a chunked sweep silently under-reports because a provider truncates per-request results.~~
Retained bytes prove exact equality between mevblocker's 100k and 250k sweeps and exact
250k cross-provider equality with Tenderly. The ledger records 6,368 results for both 1M
sweeps, but their overwritten bodies prevent exact-set verification. The core delegate
conclusion does not depend on those lost bodies; the former 10× exact-set claim is
withdrawn. *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]] — replacement
text verbatim)*

**OP dual-provider agreement (leg A): True.** Tenderly's full-range set restricted to
`[120917167, head]` is **1,756 events**; OP Labs' independent 3,384-chunk sweep of the same
range is **1,756 events**, agreeing on
`(blockNumber, blockHash, transactionHash, logIndex, data, topics, address)`. The OP OFT's
three-row delegate history is identical across the two providers.

### 4.3 ETH adapter `0xcd2eb13d…` — complete delegate history (4 events of 6,368)

| # | Block | ts (UTC) | logIdx | Tx | data word[1] | Delegate | Status |
|---|---|---|---|---|---|---|---|
| 1 | 20865339 | 2024-09-30T18:43:11Z | 98 | `0x6f944ee740287bf0acf6a458ef101e5583bc9e75a0b89b6a7046a0d61493ce77` | `0x000000000000000000000000afa61d537a1814de82776bf600cb10ff26342208` | `0xafa61d53…` deployer | SUPERSEDED |
| 2 | 20865365 | 2024-09-30T18:48:23Z | 269 | `0x66b09a871d80053794500a0d5253399daa44d534afbb7c492e320557ecd003f5` | `0x0000000000000000000000002aca71020de61bb532008049e1bd41e451ae8adc` | `0x2aCA7102…` L1 controller Safe | SUPERSEDED |
| 3 | 21366263 | 2024-12-09T16:53:11Z | 67 | `0x0ae2d6c598e722b5d31b44dd6bc9f0fe2cf711778ecbfc849d4e1266ae83db10` | `0x0000000000000000000000002aca71020de61bb532008049e1bd41e451ae8adc` | `0x2aCA7102…` (re-set during the upgrade) | SUPERSEDED |
| 4 | **25296945** | **2026-06-11T21:36:35Z** | 126 | `0x15f25bb019486b3683454b74b3850510e581955514913c58b14dfb899a483b67` | `0x000000000000000000000000cd425f44758a08baab3c4908f3e3de5776e45d7a` | **`0xcd425f44…` ETH timelock** | **CURRENT** |

Block hashes `0x18dc3285a829ef1c60772bbf85037c3481db3357186dc0c29b663b11b9b998ec`,
`0x87cbac266043391e6a138eeae0f19373b89c06703c09866e19a91e9f0806c344`,
`0xf63faeaefc3caed54e3a1872693b4c60f27999558e172ddf43207accd79ae2eb`,
`0x683c056c4bb1f8b08631e2565dbbc7560750973a24d8a493c39c26553eefa83f`. Every log's `blockHash` was
asserted equal to the independently fetched header hash at decode time.

### 4.4 OP OFT `0x5a7facb9…` — complete delegate history (3 events of 1,953)

| # | Block | ts (UTC) | logIdx | Tx | Delegate | Status |
|---|---|---|---|---|---|---|
| 1 | 120917167 | 2024-06-03T16:45:11Z | 43 | `0xf957156a85475f471a612cd97416e226d27c92e53264df82011d26275869a259` | `0xc83bb947…` OP deployer | SUPERSEDED |
| 2 | 121196110 | 2024-06-10T03:43:17Z | 1 | `0xfcd4f8f01a42e376e54325776d40692eb554d23d6a26a8035dcfc0fbf4b5eca4` | `0x764682c7…` OP controller Safe | SUPERSEDED |
| 3 | **154486119** | **2026-07-20T18:10:15Z** | 64 | `0xfc990c72b8edf46fe92f5ceeaa02b5006f3dee89412c82b8ca0884f504619958` | **`0x851dd540…` OP L2 timelock** | **CURRENT** |

Full-word decode of the current row:
```
data word[0] 0x0000000000000000000000005a7facb970d094b6c7ff1df0ea68d99e6e73cbff -> sender   = 0x5a7facb9… (our OApp)
data word[1] 0x000000000000000000000000851dd540f4d2ec78120de0a0cc87b21ede5df5c6 -> delegate = 0x851dd540… (OP L2 timelock)
```

### 4.5 The handover transactions — owner and delegate move together, in one tx

**ETH, blk 25296945, tx `0x15f25bb0…`, txIndex 77, status `0x1`, 3 logs:**

```
logIndex 126  DelegateSet          @EndpointV2   sender=0xcd2eb13d…  delegate=0xcd425f44…  (timelock)
logIndex 127  OwnershipTransferred @adapter      0x2aca7102… -> 0xcd425f44…               (timelock)
logIndex 128  ExecutionSuccess     @L1 Safe      safeTxHash=0xfdbca099267e5594549ecf1d9b3922dccd549e44c9c4412ba5403449191c7ed4
```

**OP, blk 154486119, tx `0xfc990c72…`, txIndex 7, status `0x1`, 26 logs** — one transaction that
transferred six *other* contracts to the timelock, zeroed seven peers, rewrote seven EIDs' rate
limits, moved the delegate, moved ownership, **and** scheduled the role rotation:

```
logIndex  48  SafeMultiSigTransaction @OP controller Safe
logIndex  49  OwnershipTransferred    @0xc9475e18e2c5c26ea6adcd55fabe07920bea887e  0x764682c7… -> 0x851dd540…
logIndex  50  OwnershipTransferred    @0xaae0d7d8147c9f2c39a0b19974f8e684fa2bba6f  "
logIndex  51  OwnershipTransferred    @0xeca0b8088bf30efd476f0a4e6b7e4b5d652b1ded  "
logIndex  52  OwnershipTransferred    @0x5ab0dce5dbef9c0284fbdb34a8f8e3cf5216ba2c  "
logIndex  53  OwnershipTransferred    @0x9685ff6e421f163a9a2fbb831f28344f8e4a964a  "
logIndex  54  OwnershipTransferred    @0xc706ac2f5c9332890a7dc37837675ed3dd116416  "
logIndex  55-61  PeerSet  @OP OFT   EIDs 30214,30335,30362,30165,30260,30243,30322 -> bytes32(0)
logIndex  62  OutboundRateLimitsChanged @OP OFT  7 EIDs, 30101 ABSENT
logIndex  63  InboundRateLimitsChanged  @OP OFT  7 EIDs, 30101 ABSENT
logIndex  64  DelegateSet             @EndpointV2  sender=0x5a7facb9…  delegate=0x851dd540…
logIndex  65  OwnershipTransferred    @OP OFT      0x764682c7… -> 0x851dd540…
logIndex  66-72 CallScheduled         @OP timelock  7 calls, delay 259200 s each  (the role rotation)
```

*(`0xc9475e18e2c5c26ea6adcd55fabe07920bea887e` matches the L2 sync pool address the blueprint
records at S7 as the OP `MINTER_ROLE` holder, SOURCED WR2 §1b/P3 — noted, not further pursued.)*

### 4.6 Behavioural corroboration — the timelock has actually exercised delegate authority

This is an independent evidence surface from the `DelegateSet` event. At **ETH blk 25418960**
(tx `0x30b173b1…`, status `0x1`, dual-provider receipt agreement True) the ETH timelock executed a
scheduled batch that included, targeting the **Endpoint**:

```
CallExecuted idx 4  target 0x1a4407…  sel 0x9535ff30 setSendLibrary(address,uint32,address)
  word[0] 0x000000000000000000000000cd2eb13d6831d4602d80e5db9230a57596cdca63 -> oapp = our adapter
CallExecuted idx 5  target 0x1a4407…  sel 0x6a14d715 setReceiveLibrary(address,uint32,address,uint256)
CallExecuted idx 6  target 0x1a4407…  sel 0x6dbd9f90 setConfig(address,address,(uint32,uint32,bytes)[])
CallExecuted idx 7  target 0x1a4407…  sel 0x6dbd9f90 setConfig(…)
```

`MessageLibManager` gates every one of these behind `_assertAuthorized(_oapp)`, which reverts unless
`msg.sender == _oapp || msg.sender == delegates[_oapp]`. `CallExecuted` is emitted only after a
successful call. **Therefore at blk 25418960, `delegates[0xcd2eb13d…]` was the timelock** — proved
without reading the mapping, from a completely different evidence surface than §4.3.

### 4.7 Completeness — ~~the delegate write path is closed~~ delegate write-path corroboration *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])*

~~`delegates[oapp]` has exactly **two** possible writers, both established from source:~~ The
reviewed source exposes two relevant write routes, both established from source: *(superseded
2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*
1. `OAppCore.setDelegate` — `onlyOwner`. Owner is the timelock on both chains since
   ETH 25296945 / OP 154486119 (g02-04 §6.1, corroborated here by the same-tx `OwnershipTransferred`
   logs). **Neither timelock has ever scheduled a `setDelegate` (`0xca5eb5e1`)** — verified by
   selector histogram over all 548 ETH `CallScheduled` calls and all 7 OP ones: **0 occurrences.**
2. `__OAppCore_init_unchained` during (re-)initialisation ~~— reachable only via a proxy upgrade.
   **Closed:**~~ — one route to it is a proxy upgrade. *(superseded 2026-07-26 per Codex review
   round 2, [[g35-codex-verdict.md]])* `Upgraded(address)` history is complete and dual-provider on ETH
   (mevblocker `3248085a4c8f4079c4b5f834de05465e346707a7152def06557eabd7b55f13a8` /
   Tenderly `d8fe15395948189f8165e14e8003733d568b984725ba51e59cdc2811bc8c9764`, **agreement True**),
   Tenderly on OP (`4dedede845de31a3e0f08a07a12acc51dec4ca491c52f3d6d3f84b538a7c4bcf`).
   Last upgrade: **ETH blk 21366263** → `0xa82cc578927058af14fd84d96a817dc85ac4f946`;
   **OP blk 129082737** → `0x70d7e0c93d8443325550ba3f71576f5f346b8aa9`. Both **predate** the current
   delegate assignments~~, so no re-initialisation has occurred since~~. No standard
   `Upgraded(address)` event post-dates either assignment, but that absence does not prove that
   reinitialization or every alternate code-replacement path is impossible. *(superseded
   2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*
   *(Cross-lane check: the OP digest `4dedede8…` and ETH Tenderly digest `d8fe1539…` are
   byte-identical to those the g02-04 lane recorded for the same queries.)*

Also of note: **`EndpointV2.setDelegate` has no access control of its own** — it writes
`delegates[msg.sender]`. The access control lives entirely in the OApp.
~~That is why the write-path enumeration above is exhaustive.~~

What this section establishes, corrected: Full Endpoint `DelegateSet` history through the pinned heads contains no later event for
either OApp. The retained 555-call timelock operation histories contain no direct
`setDelegate` selector, and no standard `Upgraded(address)` event post-dates either
assignment. The 555-call scan is single-provider per chain; `Upgraded` coverage is
dual-provider on ETH and single-provider on OP. These checks corroborate the last-event
delegate result but do not independently prove exhaustive OApp reinitialization or every
alternate code-replacement path. *(superseded 2026-07-26 per Codex review,
[[g35-codex-verdict.md]] — replacement text verbatim)*

---

## 5. GAP-1 — OP PRE-WINDOW SECOND SOURCE

### 5.1 The sweep

| Property | Value |
|---|---|
| Provider | `mainnet.optimism.io` (OP Labs canonical) — administratively independent of Tenderly |
| Address | `0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff` |
| Topics | `[[0x55254e34…, 0x983af742…]]` — both re-derived in-lane |
| Range / step | `[120917167, 150567893]` / 10,000 |
| Chunks | **2,966** |
| Chunk errors | **0** |
| Transport retries | **0** |
| Events | **18** |
| Whole-sweep artifact sha256 | **`44600465c259a78bb00651aa9aaab05fc337ebb35d1e85822228aaf7dd58d62a`** (258,649 bytes) |

`fromBlock` justification (INFERRED, stated so it can be attacked): logs are emitted by code
executing *at* an address; the OP OFT proxy was created at blk 120917167 (its first `Upgraded` and
its `OwnershipTransferred` from `address(0)` are both in that block), so no emission with that
emitter can precede it. The prior lane's Tenderly sweep ran from block 0 and its earliest event is
at 129082737, which is consistent.

### 5.2 The comparison — **AGREEMENT: True**

Basis: `(direction, blockNumber, blockHash, transactionHash, logIndex, data)`.

```
THIS LANE  mainnet.optimism.io [120917167,150567893] 10k steps, 2966 chunks, 0 errors : 18 events
PRIOR LANE Tenderly full-lifetime, restricted to the same window                     : 18 events
*** AGREEMENT (direction, blockNumber, blockHash, txHash, logIndex, data): True ***
```

Prior-lane artifacts compared against: `43c8ff7452492040…` (outbound) / `dc653748f1b2a55d…`
(inbound), read from the archived `op_ratelimit_logs.json`.

*(added per Codex review, [[g35-codex-verdict.md]]: the g35 package is not self-contained for
the Tenderly half of this comparison — `gap1_compare.py` hardcodes the adjacent parent archive's
`op_ratelimit_logs.json`, and the two Tenderly raw bodies and their ledger rows live outside
`g35/` in that adjacent parent archive. The reviewer verified the 18/18 comparison against
those adjacent bodies.)*

### 5.3 The 18 events, independently decoded

| Block | logIdx out/in | Array n | EIDs | 30101 present |
|---|---|---|---|---|
| 129082737 | 26 / 27 | 8 | 30243, 30260, 30102, 30184, **30101**, 30214, 30183, 30165 | **YES** |
| 129163410 | 85 / 84 | 1 | 30335 | no |
| 130775846 | 74 / 73 | 1 | 30322 | no |
| 131126109 | 15 / 14 | 1 | 30362 | no |
| 131857157 | 48 / 47 | 1 | 30320 | no |
| 141921482 | 243 / 244 | 5 | 30243, 30260, 30165, 30322, 30332 | no |
| 149815468 | 283 / 284 | 2 | 30214, **30101** | **YES** |
| 150292394 | 253 / 254 | 2 | 30214, **30101** | **YES** |
| 150567893 | 419 / 420 | 19 | 19 EIDs incl. **30101** | **YES** |

### 5.4 The four decisive 30101 writes, full-word — reproducing g02-04 §3.2 exactly

```
blk 129082737  word 0x…7595 -> eid 30101
               word 0x00000000000000000000000000000000000000000000006c6b935b8bbd400000 -> 2000000000000000000000 wei
               word 0x0000000000000000000000000000000000000000000000000000000000003840 -> 14400 s
blk 149815468  word 0x00000000000000000000000000000000000000000000021e19e0c9bab2400000 -> 10000000000000000000000 wei
blk 150292394  word 0x0000000000000000000000000000000000000000000000a2a15d09519be00000 -> 3000000000000000000000 wei
blk 150567893  word 0x0000000000000000000000000000000000000000000000a2a15d09519be00000 -> 3000000000000000000000 wei
```
Outbound and inbound identical at every one of the four blocks. **The supersession is preserved:
10,000 weETH was live for 11 days (OP blk 149815468 → 150292394) and a Rewind reconstruction of any
OP boundary in that interval must return 10,000, not 3,000.**

### 5.5 Post-window extension — 30101 untouched to head, independently decoded

Beyond GAP-1's brief, `(150567893, 154754784]` was swept on the OP OFT for both rate-limit topics
**and** `PeerSet` (digest `fa6bec5704361ca7aadfe258974dde4717be7013146747bfba36347c5337d6cb`,
13 events): blk 152192876 (7 EIDs), blk 153663267 (EID 30416 + its peer), blk 154486119 (7 EIDs
zeroed + 7 peers zeroed). **30101 appears in none of them, and no `PeerSet` touches 30101.**

The equivalent ETH check was done from a *different* surface — decoding the ETH timelock's
`CallExecuted` calldata rather than the OFT's own logs:

| Block | Call | Array n | EIDs | 30111 present |
|---|---|---|---|---|
| 25418960 | setInbound/setOutbound | 1 | 30416 | **no** |
| 25574218 | setInbound/setOutbound | 8 | 30214, 30335, 30362, 30165, 30260, 30243, 30322, 30332 | **no** |

~~**Net: `ANY post-timelock write touching 30111/30101: False`** — an independent corroboration of
g02-04 §3.5 leg 4 from an acquisition surface that lane did not use.~~
**Net:** No post-window touch appears in the decoded OP rate-limit/`PeerSet` event filters or the
decoded ETH timelock `CallExecuted` selector filters. This does not exclude every possible write
path. Within those filters, the result is an independent corroboration of g02-04 §3.5 leg 4 from
an acquisition surface that lane did not use. *(superseded 2026-07-26 per Codex review round 2,
[[g35-codex-verdict.md]])*

---

## 6. BONUS — G-06 CLOSED, G-07 CLOSED WITH A SUPERSESSION

These were not in the lane's brief. They are one `eth_getLogs` each, sit in the same control-plane
row, and one of them contradicts a value the blueprint currently carries — so they are reported.

### 6.1 G-06 — L1 proxy admin ownership

`OwnershipTransferred` on `0xa9e9bbf04f95688d7fd82036f83544630e463cac`, block 0 → head,
**dual-provider agreement True** (mevblocker `10162e69233c3373b356f8d9f9e442e43bd1f1eca334b237e65174c45672d01f` /
Tenderly `ca631d141e545edb164aac23a6677ffc4f56f1753632a162dd4606bda13c5a50`):

| Block | From → To |
|---|---|
| 20865339 | `address(0)` → **`0x9f26d4c958fd811a1f59b01b86be7dffc9d20761`** |

**Exactly one event.** ~~**Never changed.**~~ Owner **by last decoded event**; no later
corresponding standard event appears through the pinned head. Current storage remains a separate
observed-side check. *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*
L1 upgrade authority = WR2's L1 timelock. This resolves
blueprint E2's "L1: proxy admin `0xa9E9bBf0…`, owner **not established**" and its
"L1 upgrades: **unknown** — possibly instant if the proxy admin is Safe-owned."

For symmetry, the OP proxy admin `0x632304edc891afed1a7bde9a40b19f1c393ad5f3`
(digest `4062bc4ef828aec2eda5b59ef63cbb0ababba437fc0e1b8aee073bac617912a3`, 3 events):
blk 120917167 `0x0` → `0xc83bb947…` (deployer); blk 121917486 → `0x764682c7…` (OP controller Safe);
blk **139705022** → **`0x851dd540…`** (OP L2 timelock). Confirms blueprint E2's OP claim with
decoded evidence, and dates it.

### 6.2 G-07 — L1 timelock `0x9f26d4C9…` minDelay: the blueprint's bound is stale

`MinDelayChange` full history, **dual-provider agreement True**
(`402c7f7a4c279e0c84e85389f94051fae0d760a5b7ee9e0aca33335747e7acce` /
`91d4ba1a0b9f1ec92fd9bbfa989c25e3d28af3a9980cbc4e439e1c2df0fc85ab`):

| Block | old word → new word | old → new (s) |
|---|---|---|
| 19298624 | `0x…0000` → `0x…0e10` | 0 → 3,600 |
| 19323324 | `0x…0e10` → `0x…0e11` | 3,600 → 3,601 |
| 19323869 | `0x…0e11` → `0x…012c` | 3,601 → 300 |
| 19324383 | `0x…012c` → `0x…015180` | 300 → 86,400 |
| 19384524 | `0x…015180` → `0x…03f480` | 86,400 → 259,200 |
| **24982415** | `0x…03f480` → `0x00000000000000000000000000000000000000000000000000000000000d2f00` | **259,200 → 864,000 (10 days)** |

**The blueprint records G-07 as "≤ 259,200 s bound only".** ~~**The live value is 864,000 s — larger
than the stated bound.**~~ **The minDelay by last decoded event is 864,000 s — larger than the
stated bound;** no later `MinDelayChange` appears through the pinned head, and current storage
remains a separate observed-side check. *(superseded 2026-07-26 per Codex review round 2,
[[g35-codex-verdict.md]])* 259,200 s is a *superseded* state (live ETH blk 19384524 → 24982415).

### 6.3 L1 timelock roles — same GAP-3 treatment, dual-provider agreement True

Digests `83d5338a817e8c509f892327902f865f50cb017b577248deb1ae3712514dcb02` /
`9148f44172bcf25b07842eb939e3de4da69a763049729808e21161fd2681f4d5`, 9 events:

| Block | Event | Role | Account |
|---|---|---|---|
| 19298624 ×4 | RoleAdminChanged | TIMELOCK_ADMIN / PROPOSER / EXECUTOR / CANCELLER | `bytes32(0)` → TIMELOCK_ADMIN_ROLE |
| 19298624 | RoleGranted | TIMELOCK_ADMIN_ROLE | `0x9f26d4c9…` (**SELF**) |
| 19298624 | RoleGranted | PROPOSER_ROLE | `0xcdd57d11476c22d265722f68390b036f3da48c21` |
| 19298624 | RoleGranted | CANCELLER_ROLE | `0xcdd57d11…` |
| 19298624 | RoleGranted | EXECUTOR_ROLE | `0xcdd57d11…` |
| **25533308** | RoleGranted | CANCELLER_ROLE | `0x055a8b2b65d0ab4e0c17a0168d032464b7e97bdf` |

Matches blueprint S7's "L1 timelock proposer Safe `0xcdd57D11476c22d265722F68390b036f3DA48c21`"
(SOURCED WR2 §1a) — **upgraded from declaration to decoded event**, never revoked. ~~OZ 4.x epoch~~
OZ-4-style epoch (INFERRED lineage — §8 claim 8 as corrected) *(superseded 2026-07-26 per Codex
review, [[g35-codex-verdict.md]])*,
`admin = address(0)`, EXECUTOR_ROLE **not** open (zero `address(0)` role events are observed;
"not open" is INFERRED, conditional on the deployed code obeying the sourced AccessControl
write/emission model) *(added per Codex review round 2, [[g35-codex-verdict.md]])*.

**Cross-chain pattern worth flagging:** `0x055a8B2B…` received CANCELLER on the L1 timelock at ETH
blk **25533308** and on the ETH adapter-owner timelock at ETH blk **25533314** — six blocks apart —
and on the OP timelock at OP blk 154619344. A coordinated canceller/veto rollout across all three
timelocks. Stated as sequence; **no motive is claimed** (no declared-intent artifact was located).

### 6.4 Resulting authority chains (decoded, with per-hop latency)

```
L1 ADAPTER CONFIG (peers, rate limits, delegate rotation, ownership)
  0xcd2eb13d… --owner--> 0xcd425f44… (172,800 s) --PROPOSER+EXECUTOR+CANCELLER--> 0x2aCA7102…
                                                  --CANCELLER (only)-----------> 0x055a8B2B…
L1 ADAPTER LIBRARIES / DVN CONFIG (Endpoint setConfig, setSendLibrary, setReceiveLibrary)
  Endpoint --delegates[0xcd2eb13d…]--> 0xcd425f44… (SAME timelock, 172,800 s) --> 0x2aCA7102…
L1 ADAPTER CODE (proxy upgrade)
  0xcd2eb13d… --proxyAdmin--> 0xa9E9bBf0… --owner--> 0x9f26d4C9… (864,000 s) --> 0xcdd57D11…

OP OFT CONFIG
  0x5a7facb9… --owner--> 0x851dd540… (259,200 s) --PROPOSER+EXECUTOR+CANCELLER--> 0x7a00657a…  [since OP 154619344]
                                                 --CANCELLER (only)------------> 0x055a8B2B…
OP OFT LIBRARIES / DVN CONFIG
  Endpoint --delegates[0x5a7facb9…]--> 0x851dd540… (SAME timelock, 259,200 s) --> 0x7a00657a…
OP OFT CODE (proxy upgrade)
  0x5a7facb9… --proxyAdmin--> 0x632304Ed… --owner--> 0x851dd540… (259,200 s) --> 0x7a00657a…
```

Every hop above is a decoded on-chain event with a block anchor. ~~**No hop has zero latency any
more.**~~ **Within the enumerated OApp configuration and upgrade routes above, no hop has zero
latency any more.** Safe-internal signer changes, cancellation, pause, DVN key rotation, and
vendor-side control remain outside that conclusion. *(superseded 2026-07-26 per Codex review,
[[g35-codex-verdict.md]])*

---

## 7. WHAT THIS CHANGES IN THE BLUEPRINT (for the wave-3 patch pass)

| Blueprint location | Current text | This lane's evidence |
|---|---|---|
| §6 verdict, G-08 | "what still blocks is the Safes' proposer/executor standing (GAP-3) and the unread `delegates()` (GAP-5)" | **Both closed.** ETH Safe confirmed proposer/executor/canceller; OP Safe's roles **revoked** at OP blk 154619344 → `0x7a00657a…`; delegate = the per-chain timelock on both sides. |
| §3 S7, L1 controller Safe row | "continuing role = presumed timelock proposer/executor, open at GAP-3" | **Confirmed by decoded event**, ETH blk 22089226, never revoked. Presumption → OBSERVED-dual. |
| §3 S7, OP controller Safe row | "presumed proposer/executor, GAP-3 class" | **REFUTED as of OP blk 154619344.** New holder `0x7a00657a…`. Authoring `0x764682c7…` today manufactures a false control-plane claim. |
| §3 S7, ETH timelock row | "Proposer/executor unknown — GAP-3" | Resolved: `0x2aCA7102…` (P/E/C) + `0x055a8B2B…` (C). |
| §2 E2 | "OP … proposer/executor = OP controller Safe (deploy-script declaration; on-chain `RoleGranted` enumeration outstanding)" | Enumerated. **Declaration is now stale**; live is `0x7a00657a…`. |
| §2 E2 | "L1: proxy admin `0xa9E9bBf0…`, owner **not established** (G-06)"; "L1 upgrades: **unknown** — possibly instant" | **G-06 closed:** owner **by last decoded event** `0x9f26d4C9…` since blk 20865339~~, never changed~~; no later corresponding standard event appears through the pinned head (current storage remains a separate observed-side check) *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*. **L1 upgrades ≥ 864,000 s**, not "possibly instant". |
| §2 E4, E5, E7 + §5.1 | "delegate-gated path NOT proven timelocked; zero remains the honest latency floor" | **REFUTED.** Delegate = timelock on both chains. Library/DVN/`setConfig` latency is **≥172,800 s ETH / ≥259,200 s OP** at and after ETH 25296945 / OP 154486119 — and **zero before**. Time-varying, with supersession points. |
| §4 G-07 | "≤ 259,200 s bound only" | **864,000 s by last decoded event** since ETH blk 24982415 (current storage remains a separate observed-side check) *(round 2, [[g35-codex-verdict.md]])*; 259,200 s superseded. |
| §4 G-10 | "OP OFT role-model ABI epoch" | Adjacent finding: the **two timelocks run different OZ role-model styles** ~~(4.x vs 5.x)~~ (OZ-4-style vs OZ-5-style, INFERRED lineage — claim 8 as corrected) *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*. A single role-id vocabulary across chains is wrong by construction. |
| §4 G-09 | Safe signer sets, facts-only when closed | Facts in hand for four Safes (§3.6), including ~~the **identical 7-of-7 signer set** across the OP rotation~~ acquisition-time snapshots reporting **identical current owner sets** for the outgoing and incoming OP role holders — a role/address rotation; not proof of signer equality at the rotation block, and not a redeployment (claim 19 as corrected) *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*. |
| §7 GAP-1 | "OP pre-window single-provider" | **Closed** — dual-provider, agreement True. |

**Two caveats the patch pass must preserve.** (1) These are *expected-side* claims derived from
governance history — "the last role/delegate event says X" — **not** claims about current storage.
Only the observed lane may assert the second, and the engine, not a human, compares them.
(2) Every latency figure above is a *property with a validity window*, not a constant. Authoring
"172,800 s" without its `fromBlock` repeats exactly the error the round-8 pass corrected for E7.

---

## 8. CLAIM-STRENGTH REGISTER

**OBSERVED-dual** = decoded from raw bytes, two or more administratively independent providers
agreeing on `(blockNumber, blockHash, txHash, logIndex, data[, topics, address])`.
**OBSERVED-single** = decoded from raw bytes, one provider.
**SOURCED** = read from a named source file at a pinned commit, with acquisition digest.
**INFERRED** = this lane's judgment.

| # | Claim | Strength |
|---|---|---|
| 1 | ETH timelock: `0x2aCA7102…` holds PROPOSER+EXECUTOR+CANCELLER since blk 22089226, never revoked | **OBSERVED-dual** |
| 2 | ETH timelock: `0x055a8B2B…` holds CANCELLER since blk 25533314 | **OBSERVED-dual** |
| 3 | OP timelock: `0x764682c7…` P/E/C **revoked** at blk 154619344 | **OBSERVED-triple** (Tenderly + OP Labs + OnFinality) *(caveat added per Codex review: the "Safe" characterization of the holders remains separately single-provider — see claim 18)* |
| 4 | OP timelock: `0x7a00657a…` holds P/E/C since blk 154619344 | **OBSERVED-triple** *(caveat added per Codex review: the "Safe" characterization of the holders remains separately single-provider — see claim 18)* |
| 5 | EXECUTOR_ROLE is **not** open (no `address(0)` grant) on either timelock | ~~**OBSERVED-dual/triple** + **SOURCED** (OZ: event stream = role state)~~ Zero `address(0)`-account role events: **OBSERVED-dual/triple**; "EXECUTOR_ROLE is not open" itself: **INFERRED**, conditional on the deployed code obeying the **SOURCED** AccessControl write/emission model *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| 6 | Neither timelock has an external admin (`admin = address(0)` at construction) | **INFERRED** from OBSERVED event count + **SOURCED** OZ constructor |
| 7 | Role changes were themselves timelocked ops with delay 172,800 / 259,200 s | ~~**OBSERVED-single** per chain (schedule+execute pair), delays cross-checked against `MinDelayChange` (**OBSERVED-dual** on ETH)~~ Cited schedule/execute receipts: **OBSERVED-dual** on both chains; the complete operation-history scan: **OBSERVED-single**; the `0xcd425f44…` `MinDelayChange` history is **OBSERVED-single** in this archive, not dual *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| 8 | ~~ETH timelock is OZ 4.x, OP timelock is OZ 5.x~~ ETH timelock runs an OZ-4-style role model, OP timelock an OZ-5-style role model | ~~**OBSERVED-single** (pinned `eth_getCode` literal scan) + **OBSERVED** event shape + **SOURCED** OZ constructors — two independent legs~~ **INFERRED** — runtime literals and construction event shapes confirmed (single-provider pinned `eth_getCode` literal scan + event shape + **SOURCED** OZ constructors), but the exact "OZ 4.x/OZ 5.x" lineage is inferred without an exact deployed-bytecode/source build match *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| 9 | `DelegateSet` is on the Endpoint with both params non-indexed; the OApp emits nothing | **SOURCED** (`ILayerZeroEndpointV2.sol` L56; `OAppCoreUpgradeable.sol` L101-103) |
| 10 | ETH adapter delegate = `0xcd425f44…` by last event, since blk 25296945 | **OBSERVED-dual** |
| 11 | OP OFT delegate = `0x851dd540…` by last event, since blk 154486119 | **OBSERVED-dual** (Tenderly + OP Labs, 1,756/1,756 agreement) |
| 12 | The ETH timelock has actually exercised delegate authority at blk 25418960 | **OBSERVED-dual** (receipt) + **SOURCED** (`_assertAuthorized`) |
| 13 | ~~The delegate write path is closed (no scheduled `setDelegate`; no post-assignment `Upgraded`)~~ Delegate write-path negatives (no scheduled `setDelegate`; no post-assignment standard `Upgraded`) — corroboration, not independent proof of closure: see the §4.7 replacement text | ~~Delegate history **OBSERVED-dual** on both chains; `Upgraded` history OBSERVED-dual (ETH) / OBSERVED-single (OP); write-path enumeration **SOURCED**~~ Delegate history **OBSERVED-dual** on both chains; the 555-call operation-history scan **OBSERVED-single** per chain; `Upgraded` OBSERVED-dual (ETH) / OBSERVED-single (OP); write-path enumeration **SOURCED** — together these corroborate the last-event delegate result but do not independently prove exhaustive OApp reinitialization or every alternate code-replacement path *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| 14 | GAP-1: OP pre-window event set agrees with the prior lane, 18/18 | **OBSERVED-dual** (OP Labs vs Tenderly) *(caveat added per Codex review: the `g35` directory is not self-contained for the Tenderly half — the compared Tenderly bodies and their ledger rows live in the adjacent parent archive; the reviewer verified the 18/18 comparison against those adjacent bodies)* |
| 15 | No post-2026-04-21 write touches EID 30111/30101 | ~~**OBSERVED-dual** on ETH via two surfaces; **OBSERVED-single** on OP post-window~~ **OBSERVED-single** on ETH — two internal evidence surfaces are not two providers under this register's own dual-provider definition; **OBSERVED-single** on OP post-window; claim scope capped to the decoded event/selector filters, not every possible write *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| 16 | G-06: L1 proxy admin ~~owner `0x9f26d4C9…`, one event, never changed~~ owner **by last decoded event** = `0x9f26d4C9…` — one event in the full history; current storage remains an observed-side check *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* | **OBSERVED-dual** |
| 17 | G-07: L1 timelock ~~minDelay = 864,000 s since blk 24982415~~ minDelay **by last decoded event** = 864,000 s since blk 24982415; current storage remains an observed-side check *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* | **OBSERVED-dual** |
| 18 | Safe versions / thresholds / owner sets (§3.6) | **OBSERVED-single**, Safe transaction service — **EvidenceFacts only, never a predicate** *(caveat added per Codex review: an acquisition-time, single-provider Safe-service snapshot)* |
| 19 | ~~The OP Safe rotation preserved an identical 7-of-7 signer set~~ Acquisition-time snapshots of the outgoing and incoming OP Safes report identical 7-of-7 owner sets and 4-of-7 thresholds; this does not prove the signer sets were identical at rotation block 154619344, nor that the role change was a Safe "re-deployment" *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* | **OBSERVED-single** (facts class) |
| 20 | `0xba5ed099…`, `0x2ef43d8a…`, `0x8d5aac5d…`, `0xd8f3803d…` roles/identities | **UNLABELLED** — deliberately not characterised; no explorer consulted |
| 21 | Motive for the OP role rotation, the canceller rollout, or the 2026-04-14 reversion | **NOT CLAIMED** — no declared-intent artifact located (g02-04 GAP-4 remains open) |

**Causality discipline.** This dossier states that the OP controller Safe's roles were revoked and
that ~~an identically-signed Safe~~ a Safe whose acquisition-time snapshot reports an identical
current owner set *(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]])*
received them in the same operation — a role/address rotation. It does **not** claim the
rotation was performed *because of* anything, nor that it was a key rotation, a migration, or a
response to an incident. Sequence is evidence; motive is not, and no public artifact supplies it.

---

## 9. DISCIPLINE STATE

### 9.1 Numbers

| Metric | Value |
|---|---|
| Acquisitions ledgered (effective URL + raw-body sha256 + status + bytes + note) | ~~**156**~~ **170** — rows 157–170 are a second 14-block reorg recheck appended after the hardening sweeps *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| Distinct raw bodies | ~~**122** (38,050,641 raw bytes retained)~~ ledger: **122 unique digests**; `raw/`: **146 files, 119 unique retained bodies, 22,897,975 bytes currently on disk**. 38,050,641 is the sum of the first 156 ledger rows' byte counts — including duplicate acquisitions and lost bodies — not "raw bytes retained" *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| Redirected acquisitions recorded with effective URL (G9) | 15 |
| Providers exercised | 15 (5 usable, 10 refusing — all refusals recorded verbatim, §2.5) |
| Whole-sweep content-addressed artifacts | ~~**13**~~ **13 sweep ledger entries — 10 unique sweep digests, 8 retained sweep files** *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| Chunked requests issued across all sweeps | **9,069** |
| Chunk errors, all sweeps | **0** — except the OP Labs role sweep's 11 x `-32016` rate limits, **all 11 re-queried to success, 0 additional events** |
| Keccak self-test runs | Once per derivation script, first executable line — **all PASS** |
| Decoder guard negative tests | **11 rejected as required, 0 leaked** |
| End-of-lane reorg recheck | ~~**12 pinned block hashes re-read cross-provider, 0 mismatches, 0 refusals**~~ **14 pinned block hashes in the recheck script, run twice** (the second run is ledger rows 157–170), re-read cross-provider, 0 mismatches, 0 refusals *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])* |
| Block-hash assertions during decode | Every decoded log's `blockHash` asserted equal to its independently fetched header |
| `eth_call` at head | **0** |
| Reads of any manifest-verified value | **0** |
| Block explorer use | **0** |
| Repo files modified | **0** |

### 9.2 Self-audit — a defect in this lane's own evidence handling

**Found and disclosed rather than quietly cleaned up.** ~~Two sweep artifacts were written to the
**same filename across two runs at different step sizes**, so the earlier bytes were overwritten:~~
**Four paths — not two — carry multiple ledgered digests** *(superseded 2026-07-26 per Codex
review, [[g35-codex-verdict.md]])*: the two lost 1M delegate sweep artifacts below ~~(ledger lines
28–31)~~ (mevblocker sweep: ledger lines 28/30, same-digest repeat at line 32; Tenderly sweep:
ledger lines 29/31, same-digest repeat at line 43) *(superseded 2026-07-26 per Codex review
round 2, [[g35-codex-verdict.md]])*; one overwritten failed ETH header response (ledger lines 63 and 66); and one overwritten
failed OP bytecode response (ledger lines 105 and 108). The latter two do not affect surviving
factual conclusions — the successful replacement responses remain, and the old OP error body
survives under another filename — but the disclosure must say four path collisions. The two
sweep-artifact collisions, where the earlier bytes were overwritten by a re-run at a different
step size:

| Artifact path | Ledger entries | Distinct digests | Recoverable on disk |
|---|---|---|---|
| `raw/gap5_delegateset_ETH_mevblocker.bin` | 3 | 2 | only `afc5f65d…` (250k). **`f70a448c…` (1M) is ledgered but its bytes are gone.** |
| `raw/gap5_delegateset_ETH_tenderly.bin` | 3 | 2 | only `1af5f569…` (250k). **`abac6c8c…` (1M) bytes gone.** |

The ledger is intact and correctly records what was fetched — but two of its rows now point at a
path whose contents no longer hash to the recorded digest. That is a *content-addressing violation
in the storage layer*, and exactly the class this workbench exists to catch. **Remedy for the next
lane: artifact filenames must include the sweep parameters (or the digest itself), so a re-run can
never overwrite a prior exhibit.** ~~No claim in this dossier depends on the lost bytes~~ The
core delegate conclusion does not depend on the lost bytes, but the formerly claimed exact 10×
step-invariance does — that claim is withdrawn (see the §4.2 replacement text) *(superseded
2026-07-26 per Codex review, [[g35-codex-verdict.md]])* — both lost
artifacts' ledger rows reported the *same* 6,368-event count as their surviving 250k
counterparts, which corroborates by count only.

Silver lining, recovered from the ledger notes: those overwritten runs are a **free step-invariance
data point**. The ETH `DelegateSet` sweep returned **6,368 events at 1M steps (26 chunks) and 6,368
at 250k steps (103 chunks), on both providers** — a 4× step-size change with an identical count.
Hardening leg B adds a third step size (100k, 257 chunks) to that series.

A third, benign observation: five `Upgraded`-check responses share one digest each per chain because
their bodies are the identical empty-result JSON. Content-addressing collides on empty results by
design; disambiguation lives in the ledger `note`.

### 9.3 An error made and corrected during the lane

The first run of the guard negative-test suite reported one case NOT REJECTED. Root cause was a
**bad test vector** (dirt placed in the low bytes of an address word, where zeros are legal), not a
guard leak. Vector corrected; guard rejects; both the failure and the diagnosis are in §2.4. A
negative test silently edited until green is not evidence.

---

## 10. HARDENING LEGS — FINAL STATUS: BOTH LANDED CLEAN

Both legs were killed mid-run by an operator pause earlier in the session. Before restarting,
each was **audited against the ledger** rather than assumed:

| Leg | Partial bytes on disk | Ledger entries | Disposition |
|---|---|---|---|
| A — OP Labs `DelegateSet` | none | none | **failed closed cleanly** -> clean restart |
| B — ETH 100k step-invariance | none | none | **failed closed cleanly** -> clean restart |
| *(OP roles sweep, which HAD completed pre-pause)* | present | 1 | re-hashed from disk -> matches ledgered `01082422c9c8693f…` exactly -> **not re-run** |

Both restarts ran the keccak self-test as their first executable line and ledgered every
acquisition with effective URL and raw-body sha256.

### Leg A — OP Labs second-provider `DelegateSet` sweep

| Property | Value |
|---|---|
| Provider / range / step | `mainnet.optimism.io` / `[120917167, 154754784]` / 10,000 |
| Chunks | **3,384** |
| Chunk errors | **0** |
| Events | **1,756** |
| Artifact sha256 | **`9ad7632164922c406c3cbec28233ce5a3c7576b5a5b0eab5d44d8de1c2b8137b`** |
| Agreement vs Tenderly, same range | **True** — 1,756 / 1,756 on `(blockNumber, blockHash, txHash, logIndex, data, topics, address)` |
| OP OFT delegate rows, both providers | identical: `(120917167, 43, 0xc83bb947…)`, `(121196110, 1, 0x764682c7…)`, `(154486119, 64, 0x851dd540…)` |

**Effect:** GAP-5's OP half rises from OBSERVED-single to **OBSERVED-dual**. Claim 11 upgraded.

### Leg B — ETH `DelegateSet` step-size invariance

| Property | Value |
|---|---|
| Provider / range / step | `rpc.mevblocker.io` / `[0, 25620245]` / 100,000 |
| Chunks | **257** |
| Chunk errors | **0** |
| Events | **6,368** |
| Artifact sha256 | **`7a459787f5e1fef5ca9fddeec43fdf668d1ce054c9d2d1acfddb274ce77efa9d`** |

```
STEP-SIZE INVARIANT (100k vs 250k, same provider):        True
CROSS-PROVIDER     (250k mevblocker vs 250k tenderly):    True
100k vs tenderly-250k:                                    True
ETH adapter delegate history identical at all step sizes: True
```

*(superseded 2026-07-26 per Codex review round 2, [[g35-codex-verdict.md]]: the final script-output
line above — ~~`ETH adapter delegate history identical at all step sizes: True`~~ — is superseded;
the quoted output is left verbatim because editing inside script output would falsify it, but the
claim it states is withdrawn. Exact set equality is retained only for 100k/250k on the same
provider and for 250k cross-provider; the 1M runs corroborate by ledger-recorded count only —
their overwritten bodies prevent exact-set verification.)*

Combined with the two 1M-step runs recovered from the ledger (§9.2), the ETH `DelegateSet` event
~~set is **6,368 at 100k, 250k and 1M steps, across two administratively independent providers** —
a 10x step-size range and two providers, one answer.~~ count is 6,368 at 100k, 250k and 1M steps,
across two administratively independent providers — by exact retained-set comparison at 100k/250k
(and 250k cross-provider), but by ledger-recorded count only at 1M: the overwritten 1M bodies
prevent exact-set verification, and the former 10× exact-set claim is withdrawn (§4.2 replacement
text). *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])*

**Effect:** the provider-result-cap failure mode is excluded for the sweep that carries GAP-5's
ETH answer. No claim changed; the existing claim got harder to attack.

### Nothing changed versus the pause report

Both re-runs **reproduced the pre-pause figures exactly** (leg B's 6,368 events; leg A's three
delegate rows). **There is no divergence to flag.**

One thing improved beyond the pause report: the OnFinality roles sweep, which appeared stalled at
pause time, is recorded in the ledger as having **completed** (154 chunks, **0 errors**, 11 events,
artifact `c8a42122e00f0fa99eab3360fbe720f3736c11b2ec9bab9eedf5e5558990cc22`), making the **OP role
history three-provider concordant** rather than two-provider.

## 11. GAP LIST AFTER THIS LANE

| # | Gap | Status |
|---|---|---|
| g02-04 GAP-1 | OP pre-window single-provider | **CLOSED** — dual-provider, agreement True (§5) |
| g02-04 GAP-3 | Timelock proposer/executor roles | **CLOSED** — both timelocks, plus the L1 timelock (§3, §6.3) |
| g02-04 GAP-5 | Delegate unread | **CLOSED** — delegate = timelock on both chains (§4) |
| G-06 | L1 proxy admin owner | **CLOSED** (§6.1) |
| G-07 | L1 timelock minDelay | **CLOSED, and the blueprint's bound is stale** (§6.2) |
| g02-04 GAP-2 | Non-emitting write excluded by reasoning, not state diff | **Still open.** Unchanged; needs archive `eth_getStorageAt` at the two boundary blocks. |
| g02-04 GAP-4 | No declared-intent artifact for the 2026-04-14 reversion | **Still open**, and this lane adds three more motive-less sequences: the OP role rotation, the cross-chain canceller rollout, and the L1 delay increase to 10 days. Rewind may state all four sequences; it may not state why. |
| G-01 | `expectedRuntimeCodeHash` | Untouched by design. **No code hash in this dossier may seed it.** |
| G-09 | Safe signer sets | Facts now in hand for four Safes (§3.6); remains facts-only, never a predicate. |
| G-10 | Role-model ABI epoch | **Advanced**, not closed: the two timelocks are proven to differ (§3.7). The OP **OFT's** own role model (the original G-10 subject) still needs binding to impl `0x70d7E0C9…` after G-01. |
| **NEW-1** | `0x7a00657a…`, `0x055a8B2B…` have no repo-side declared-intent artifact | **Open.** Two live control-plane authorities appear in no reviewed ether.fi artifact this lane could locate. Closing recipe: locate the governance proposal/deploy artifact naming them, or record them as chain-only entities in the control-plane map with that provenance stated. |
| **NEW-2** | Artifact-filename reuse defect (§9.2) | **Open, procedural.** Fix in tooling before the next lane. |

---

## 12. VERDICT

**GAP-3 — RECONSTRUCTABLE. CLOSED.** The complete role history of both TimelockControllers is
recovered from block 0, block-hash-pinned, three-provider concordant on OP and dual-provider on ETH,
with every topic0 and role id derived in-lane and the completeness of the event stream *sourced*
from the OpenZeppelin implementation rather than assumed. The operative answers: the controller Safe
**is** the proposer/executor on ETH and **is no longer** on OP; `EXECUTOR_ROLE` is **not** open on
either (zero `address(0)` role events are observed; "not open" is INFERRED, conditional on the
deployed code obeying the sourced AccessControl write/emission model) *(added per Codex review
round 2, [[g35-codex-verdict.md]])*; the only other holder is a canceller-only Safe present on both
chains; and neither timelock
has an external admin.

**GAP-5 — RECONSTRUCTABLE. CLOSED, with the premise corrected.** The OApp emits no delegate event;
the Endpoint does, with both parameters non-indexed. Incumbent delegate is the **timelock** on both
chains, assigned in the same transaction as the ownership transfer, corroborated behaviourally by
the ETH timelock actually exercising delegate authority, and ~~with the write path closed on both
possible writers~~ with the write-path checks corroborating the last-event result (see the §4.7
replacement text — corroboration, not independent proof of closure) *(superseded 2026-07-26 per
Codex review, [[g35-codex-verdict.md]])*. **The blueprint's "delegate-gated path is not proven timelocked, zero latency
floor" is refuted.**

**GAP-1 — RECONSTRUCTABLE. CLOSED.** 2,966 chunks, 0 errors, 18/18 exact agreement with the prior
lane on the full comparison key. OP pre-window completeness rises from single-provider to
dual-provider.

**Both hardening legs landed clean and changed no answer** — leg A raised GAP-5's OP half to
dual-provider (1,756/1,756); ~~leg B proved the ETH sweep step-size invariant across a 10x range~~
leg B proved exact 100k/250k set equality and exact 250k cross-provider equality; the 1M runs
corroborate by ledger-recorded count only (§4.2 replacement text; the 10× exact-set claim is
withdrawn) *(superseded 2026-07-26 per Codex review, [[g35-codex-verdict.md]])*.
Every claim in this dossier is dual-provider or better except where §8 says otherwise.

**Carried forward — NOT RECONSTRUCTABLE AS POSED:** the *motive* behind any of the four
supersessions this lane and its predecessor documented (the 2026-04-14 rate-limit reversion, the
OP role rotation, the cross-chain canceller rollout, the L1 delay increase to 10 days). Each is a
clean, block-anchored sequence; none has a located declared-intent artifact. Rewind may state the
sequence and must not state the reason.

**The design point this lane exercised for W6-m1:** GAP-3 produced a real, three-day-old
supersession in a control-plane authority — a row that a mutable-row indexer would have silently
UPDATEd, destroying the record that `0x764682c7…` was the OP proposer/executor for 11 months. The
append-only fold in §3.3 keeps both states with their validity intervals, which is precisely the
reorg-supersession fixture shape `roadmap/work/W6-m1-scenario-fixtures.md` asks for — except here
the supersession is authoritative-chain governance, not a reorg. **Both must produce the same
exhibit trail; only the cause differs.** A fixture that models only reorg supersession will miss
this class entirely.

---

## 13. REPRODUCTION

All scripts, artifacts and the acquisition ledger:
`C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\g35\`

| File | Role |
|---|---|
| `keccak.py`, `decode.py`, `fetch.py`, `sweep.py` | Copied **unmodified** from `C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\`; archive not written to |
| `derive_roles.py`, `derive_rl.py` | Topic0 / role-id / selector derivations, each re-running the keccak self-test |
| `gap3_roles.py`, `gap3_decode.py`, `gap3_ops.py`/`gap3_ops2.py`, `gap3_show.py`, `role_fold.py` | GAP-3 acquisition, full-word decode, timelock-operation trail, append-only state fold |
| `gap5_src.py`, `gap5_auth.py`, `gap5_sweep.py`, `gap5_decode.py` | GAP-5 source acquisition, authorization-path verification, Endpoint sweeps, decode |
| `gap1_sweep.py`, `gap1_compare.py` | GAP-1 resumable 2,966-chunk sweep and the agreement comparison |
| `leg_a_delegate.py`, `leg_b_stepinv.py` | The two hardening legs (resumable; fail closed) |
| `op_oplabs.py`, `op_second.py`, `op2nd_compare.py` | OP second/third-provider verification |
| `who.py`, `who2.py`, `owners.py` | Role-holder characterisation (EIP-55 checksums derived in-lane) |
| `epoch.py`, `completeness.py`, `upgraded.py` | Role-model epoch, OZ completeness sourcing, no-silent-upgrade checks |
| `bonus_g06.py`, `bonus_l1tl.py` | G-06 / G-07 closures |
| `negtest.py` | 11 guard negative tests |
| `reorg_recheck.py` | End-of-lane cross-provider block-hash re-verification |
| `xcheck_g02.py`, `postwin.py`, `handover.py` | Independent-surface cross-checks of g02-04's completeness legs |
| `ledger.jsonl` | Every acquisition: effective URL, HTTP status, sha256, bytes, note |
| `raw\` | Every raw response body, byte-for-byte (subject to the §9.2 disclosure) |

Repo files **read** (never modified): `roadmap/research/route-manifest/g02-04-execution-order.md`,
`roadmap/research/route-manifest/blueprint.md`.

---

## Codex review disposition (2026-07-26)

- **Verdict: NEEDS-CORRECTIONS** — independent Codex review (job `task-ms2o0tel-1yz0gm`), full
  verdict at [[g35-codex-verdict.md]].
- **The two principal refutations are CONFIRMED:** OP roles moved from `0x764682c7…` to
  `0x7a00657a…` at block 154619344, and the current delegate by last decoded event is the
  per-chain timelock on both ETH and OP.
- **Corrections applied in-place this pass** (supersede-in-place convention, never delete): the
  six wrong assertions (§3.2 construction-event count, §3.5 `Upgraded`-absence overreach, §3.6
  Safe re-deployment/nonce overstatements, §4.2 step-invariance, §6.4 zero-latency scope, §9.2
  lost-bytes dependency), the §8 claim-strength tags (claims 5, 7, 8, 13, 15, 16, 17, 19; caveats
  on 3–4, 14, 18), the §2.2 `OwnershipTransferred` topic0 addition, the understated §9 archive
  inventory (170 ledger rows; four path collisions; 146 files / 119 unique retained bodies /
  22,897,975 bytes; 14-pin reorg recheck run twice; 13 sweep entries / 10 unique digests / 8
  retained files), and the two verbatim replacement passages (§4.7 write-path, §4.2 step
  invariance).
- **Scoped re-verification of the patched dossier is pending. No wave-3 row is manifest-grade
  until that gate passes** (D-006; D-b4ab3c69 convergence gate).
