# WR1 — ether.fi weETH Ethereum <-> Optimism route: expected (declared-intent) policy

Research lane: WR1. Evidence target: Correct (research rationale, not deployment evidence;
per `docs/SOURCE_REGISTER.md`, this is a research baseline, not a live manifest).
Retrieval date for all claims below: **2026-07-22** (author's local date), unless a
per-claim note says otherwise.
Primary pinned source: `etherfi-protocol/weETH-cross-chain` @ commit
`e30c859c08a0fb44b4732e44b040f144094638ed` (author/committer date 2026-07-15T16:53:52Z,
branch `master`, merge commit for PR #77 "26Q2 Security Upgrade").

This commit SHA was **independently re-confirmed** in this lane (not copied from
`roadmap/research/WR2/authority-map.md`) via
`https://api.github.com/repos/etherfi-protocol/weETH-cross-chain/commits/master`,
retrieved 2026-07-22, which returned the identical SHA, author date, and commit message.
WR2 pinned the same commit independently on 2026-07-21; both lanes landed on it because it
was `master`'s HEAD on the days each lane ran, not because either copied the other.

## Scope and method

Mission: pin, with full provenance, the **expected / declared-intent** configuration of the
Ethereum (chain 1, LayerZero EID 30101) <-> Optimism (chain 10, LayerZero EID 30111) weETH
OFT route — chain/EID identity, contract addresses, reciprocal peers, send/receive
libraries, required/optional DVNs and thresholds, confirmations, rate-limit intent, and
route lifecycle intent — everything `docs/ENGINEERING_SPEC.md`'s "Bridge directed-route
controls" predicate (`bridge.directed_route_controls`, `docs/ENGINEERING_SPEC.md:514-528`)
needs on the expected-policy side.

**Independence from WR2.** WR2 (`roadmap/research/WR2/authority-map.md`) already pinned this
same commit and cited overlapping registry/batch files for a different purpose (who holds
authority). Per the task charter this lane corroborates independently rather than copying:
every address and numeric value below was re-derived in this session directly from raw file
content and, where a numeric/struct value was ABI-encoded inside Safe-batch calldata, by
**programmatically ABI-decoding the raw calldata** (Python 3.13 + `eth_abi` 5.2.0, methodology
in Appendix A) rather than reading WR2's prose conclusions. One material discrepancy with
WR2 was found this way and is recorded in "Conflicts and gaps" (§4, item C1).

Sources used, by source class (per `docs/SOURCE_REGISTER.md`):

- **Pinned source / deployment repository** (primary): `utils/L2Constants.sol` (address
  registry), `utils/layerzero-v2-deployments.json` and `utils/dvn-deployments.json`
  (LayerZero-vendor config the repo itself maintains), the `output/*.json` Gnosis Safe
  transaction batches (declared/intended transactions — **not proof of execution or of
  current on-chain state**), the `scripts/*.s.sol` generators (declared constants/intent
  behind each batch), and `contracts/*.sol` (declared contract semantics). These establish
  *declared / intended* configuration only.
- **Official documentation / blog**: the ether.fi weETH bridge-hardening post
  (`ether.fi/blog/weeth-bridge-security-hardening`, dated **May 29, 2026** — six weeks
  *before* the pinned commit's author date; see §4 C4). Establishes product intent only.
- **Upstream protocol specification**: LayerZero V2 docs (OApp reference, DVN/executor
  configuration, integration checklist, message design patterns) and LayerZero Labs' own
  public metadata API (`metadata.layerzero-api.com`). Establishes correct mechanics and
  canonical LayerZero-side contract/DVN identity, not ether.fi-specific route intent.
- **Block explorer**: none consulted. No live RPC reads were performed anywhere in this
  lane — every value below is a *repo-declared*, *documented*, or *upstream-protocol-vendor*
  value, never an observed chain read.

Hard boundary honored: **no live RPC values appear as expected policy anywhere in this
document.** `git` was not invoked; all repository content was retrieved over HTTPS
(`raw.githubusercontent.com`, `api.github.com`) via `curl`/`WebFetch`, never a local clone.

---

## 1. Summary — ROUTE-ETH-OP-v1 expected policy, per direction

"ETH->OP" = messages originating on Ethereum mainnet and delivered to Optimism (Ethereum is
`srcEid` 30101 relative to the OP-side receive config; Optimism is the destination). "OP->ETH"
is the reverse. Both directions share the same OApp pair (L1 OFT Adapter <-> OP OFT), the
same Endpoint address, and — per the decoded calldata — identical numeric policy (45
confirmations, 4 required / 0 optional DVNs) on both legs; only the local DVN *contract
addresses* differ because each DVN operator runs a separate contract per chain.

| Value | ETH -> OP (send: L1; receive: OP) | OP -> ETH (send: OP; receive: L1) | Status |
| --- | --- | --- | --- |
| LayerZero EID (source) | 30101 (Ethereum) | 30111 (Optimism) | Confirmed, 4 independent sources agree (§2.1) |
| LayerZero EID (destination) | 30111 (Optimism) | 30101 (Ethereum) | Confirmed |
| Source OApp | L1 OFT Adapter `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` | OP OFT `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` | Confirmed (§2.2) |
| Destination OApp | OP OFT `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` | L1 OFT Adapter `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` | Confirmed |
| Endpoint (both chains) | `0x1a44076050125825900e736c501f859c50fE728c` | same | Confirmed, identical address on both chains |
| Send library (source chain) | L1 `SendUln302` `0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1` | OP `SendUln302` `0x1322871e4ab09Bc7f5717189434f97bBD9546e95` | Confirmed, explicitly pinned via `setConfig` (not inherited default) |
| Receive library (destination chain) | OP `ReceiveUln302` `0x3c4962Ff6258dcfCafD23a814237B7d6Eb712063` | L1 `ReceiveUln302` `0xc02Ab410f0734EFa3F14628780e6e695156024C2` | Confirmed, explicitly pinned |
| Confirmations (block confirmations before DVN/executor act) | 45 | 45 | Confirmed via ABI-decoded `setConfig` calldata, both legs |
| Required DVN count | 4 | 4 | Confirmed |
| Required DVNs (destination-chain contract addresses) | on OP: Canary `0x5b6735c66d97479cCD18294fc96B3084EcB2fa3f`, LayerZero Labs `0x6A02D83e8d433304bba74EF1c427913958187142`, Horizen `0x9E930731cb4A6bf7eCc11F695A295c60bDd212eB`, Nethermind `0xa7b5189bcA84Cd304D8553977c7C614329750d99` | on L1: Horizen `0x380275805876Ff19055EA900CDb2B46a94ecF20D`, LayerZero Labs `0x589dEDbD617e0CBcB916A9223F4d1300c294236b`, Canary `0xa4fE5A5B9A846458a70Cd0748228aED3bF65c2cd`, Nethermind `0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5` | Confirmed; same 4 provider identities cross-checked against LayerZero's own metadata API |
| Optional DVN count / threshold | 0 / 0 | 0 / 0 | Confirmed — no optional slots; "4-of-4" means all 4 required, not an M-of-N optional quorum |
| Executor (destination chain) | OP executor `0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e` | L1 executor `0x173272739Bd7Aa6e4e214714048a9fE699453059` | **Not pinned by ether.fi via `setConfig` in the reviewed batches** — see gap G1 (§5) |
| Outbound rate limit (SecurityUpgrade baseline) | L1 Adapter `outboundRateLimits[30111]` = 3,000 weETH / 14,400 s (4h) | OP OFT `outboundRateLimits[30101]` = 3,000 weETH / 14,400 s (4h) | Declared, **superseded by a later value in the same repo tree — see conflict C2** |
| Inbound rate limit (SecurityUpgrade baseline) | OP OFT `inboundRateLimits[30101]` = 3,000 weETH / 14,400 s | L1 Adapter `inboundRateLimits[30111]` = 3,000 weETH / 14,400 s | Same caveat |
| Rate limit (`increase-rate-limits` batches) | 10,000 weETH / 14,400 s (both directions) | 10,000 weETH / 14,400 s (both directions) | Declared; naming implies this supersedes the 3,000 baseline — see conflict C2 |
| Reciprocal peer (declared intent) | L1 Adapter `peers(30111)` expected = `bytes32(0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF)` | OP OFT `peers(30101)` expected = `bytes32(0xcd2eb13D6831d4602D80E5db9230A57596CDCA63)` | **Inferred from registry co-declaration only — no `setPeer` calldata for this pair found in the pinned tree; see gap G2** |
| Pause state (declared action) | `unpauseBridge()` called on L1 Adapter in the same 26Q2 batch | `unpauseBridge()` called on OP OFT in the same 26Q2 batch | Declared *intent to unpause*, not observed live state |
| Route lifecycle intent | Not reduced/decommissioned in either "ReducePathways" batch; received rate-limit *increase* | same | Inferred "active/hardened" tier — no explicit status field exists in the repo; see §2.8 |

---

## 2. Per-value detail with provenance

### 2.1 Chain and EID identity

- **Ethereum mainnet**: native chain ID 1, LayerZero EID **30101**.
- **Optimism**: native chain ID 10, LayerZero EID **30111**.
- **Endpoint (both chains)**: `0x1a44076050125825900e736c501f859c50fE728c`.

Corroborated by **four independent artifacts**, all retrieved 2026-07-22:

| # | Value | Source | Class |
| - | --- | --- | --- |
| S1 | `L1_EID = 30101`, `L1_ENDPOINT = 0x1a44076050125825900e736c501f859c50fE728c` | `utils/L2Constants.sol` lines 100-101, commit `e30c859c…638ed`, `https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/utils/L2Constants.sol` | Pinned source (repo constant) |
| S2 | `OP.L2_EID = 30111`, `OP.L2_ENDPOINT = 0x1a44076050125825900e736c501f859c50fE728c` | same file, `ConfigPerL2 OP` struct, lines 388-424 | Pinned source |
| S3 | `"Ethereum-Mainnet": {"nativeChainId":1,"eid":"30101","endpointV2":"0x1a44076050125825900e736c501f859c50fE728c", …}`; `"Optimism-Mainnet": {"nativeChainId":10,"eid":"30111","endpointV2":"0x1a44076050125825900e736c501f859c50fE728c", …}` | `utils/layerzero-v2-deployments.json`, same commit | Pinned source (repo-maintained LayerZero config mirror) |
| S4 | Identical `eid`/`endpointV2` values for `ethereum-mainnet` and `optimism-mainnet` | LayerZero Labs official metadata API, `https://metadata.layerzero-api.com/v1/metadata/deployments`, retrieved 2026-07-22 | **Upstream protocol specification** — independent of the ether.fi repo entirely |

All four agree exactly (case-insensitive). This is the strongest-corroborated fact in this
document.

### 2.2 OApp / adapter contract identity

| Value | Source URL | Retrieval date | Commit / quote |
| --- | --- | --- | --- |
| L1 OFT Adapter = `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` | `utils/L2Constants.sol` line 109 | 2026-07-22 | `address constant L1_OFT_ADAPTER = 0xcd2eb13D6831d4602D80E5db9230A57596CDCA63;` @ `e30c859c…638ed` |
| L1 OFT Adapter proxy admin = `0xa9E9bBf04F95688D7fd82036f83544630E463CAc` | same file line 123 | 2026-07-22 | `address constant L1_OFT_ADAPTER_PROXY_ADMIN = …` |
| L1 OFT Adapter declared new impl = `0xA82cc578927058af14fD84d96a817Dc85Ac4F946` | same file line 110 | 2026-07-22 | `address constant L1_OFT_ADAPTER_NEW_IMPL = …` |
| L1 weETH token = `0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee` | same file line 103 | 2026-07-22 | `address constant L1_WEETH = …` |
| OP OFT = `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF`, impl `0x70d7E0C93D8443325550Ba3F71576F5f346b8aA9` | same file, `OP` struct lines 404-405 | 2026-07-22 | `L2_OFT: 0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF, L2_OFT_IMPL: 0x70d7E0C93D8443325550Ba3F71576F5f346b8aA9,` |
| OP OFT proxy admin = `0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` | same file line 407 | 2026-07-22 | `L2_OFT_PROXY_ADMIN: …` |
| README confirms OP OFT address and chain ID 10 | `README.md` | 2026-07-22 | `| **Optimism** | 10 | \`0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF\` | - |` |

`EtherfiOFTUpgradeable.sol` and `EtherFiOFTAdapterUpgradeable.sol` (both fetched at the pinned
commit) confirm the role model used by `unpauseBridge()`/`pauseBridge()` and rate-limit
setters: numeric role IDs `MINTER_ROLE=1`, `PAUSER_ROLE=2`, `UNPAUSER_ROLE=3` on the OP OFT
side (`contracts/EtherfiOFTUpgradeable.sol` lines 17-19), and OZ `AccessControlUpgradeable`
with a `PAUSER_ROLE`/`UNPAUSER_ROLE` pair, `grantRole`/`revokeRole` restricted to `onlyOwner`,
on the L1 Adapter side (`contracts/EtherFiOFTAdapterUpgradeable.sol` lines 10-11, 72-81). Both
`_debit`/`_credit` are `whenNotPaused` and call into the pairwise rate limiter before the
LayerZero OFT core logic runs (same files, lines 34-50 and 40-56 respectively).

### 2.3 Send / receive libraries

Explicitly pinned (not inherited defaults) via `EndpointV2.setConfig` calls decoded from the
Safe batches below (methodology: Appendix A). Confirmed identical across three in-repo
sources plus LayerZero's own metadata API:

| Chain | Send lib (`SendUln302`) | Receive lib (`ReceiveUln302`) |
| --- | --- | --- |
| Ethereum | `0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1` | `0xc02Ab410f0734EFa3F14628780e6e695156024C2` |
| Optimism | `0x1322871e4ab09Bc7f5717189434f97bBD9546e95` | `0x3c4962Ff6258dcfCafD23a814237B7d6Eb712063` |

Sources, all retrieved 2026-07-22:

- `utils/L2Constants.sol` lines 112-113 (L1) and `OP` struct lines 395-396 — pinned source.
- `utils/layerzero-v2-deployments.json`, `Ethereum-Mainnet`/`Optimism-Mainnet` entries — pinned source.
- ABI-decoded `to`/`lib` arguments of the `EndpointV2.setConfig(address oapp, address lib, …)`
  calls in `output/ethereum-SecurityUpgrade.json` tx[3]/tx[4] and `output/op-SecurityUpgrade.json`
  tx[3]/tx[4] — pinned source (executed-intent Safe batch), decoded values match exactly.
- LayerZero Labs metadata API `sendUln302`/`receiveUln302` fields for `ethereum-mainnet` and
  `optimism-mainnet` — upstream protocol specification, independent of ether.fi.

Per LayerZero's own integration checklist (`https://docs.layerzero.network/v2/tools/integration-checklist`,
retrieved 2026-07-22): *"If libraries are not set, the OApp will fallback to the default
libraries set by LayerZero Labs."* The blog post (`ether.fi/blog/weeth-bridge-security-hardening`,
dated May 29, 2026) states ether.fi *"executed `setSendLibrary` and `setReceiveLibrary` on
every pathway across all 20 weETH chains, pinning the current `SendUln302` and `ReceiveUln302`
addresses into the OApp-specific slots. The libraries are byte-identical to what was already
in use via the defaults, so bridging behavior is unchanged. What changed is that the fallback
path to LayerZero's default library is now closed."* Note: the `output/*.json` batches this
lane decoded call `EndpointV2.setConfig` (DVN/ULN config), not `setSendLibrary`/`setReceiveLibrary`
directly — the library-*pinning* calls (`setSendLibrary`/`setReceiveLibrary`) were not found
in the fetched `output/*.json` set for this pair; see gap G3 (§5).

### 2.4 DVN / ULN configuration (confirmations, required/optional DVNs)

This is the most load-bearing decode in this document because the values live inside
double-ABI-encoded `bytes` fields in raw Safe-batch calldata (methodology: Appendix A).

**Decoded from `output/ethereum-SecurityUpgrade.json`, tx[3]** (`EndpointV2.setConfig` called
by Safe `0x2aca71020de61bb532008049e1bd41e451ae8adc` on chainId `"1"`, targeting
`oapp=0xcd2eb13d6831d4602d80e5db9230a57596cdca63`, `lib=0xbb2ea70c9e858123480642cf96acbcce1372dce1`
(`L1_SEND_302`), governing ETH->* outbound verification), entry for `eid=30111` (OP):

```
configType = 2 (ULN)
confirmations = 45
requiredDVNCount = 4, optionalDVNCount = 0, optionalDVNThreshold = 0
requiredDVNs = [0x380275805876ff19055ea900cdb2b46a94ecf20d (Horizen),
                0x589dedbd617e0cbcb916a9223f4d1300c294236b (LayerZero Labs),
                0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd (Canary),
                0xa59ba433ac34d2927232918ef5b2eaafcf130ba5 (Nethermind)]
optionalDVNs = []
```

**Decoded from the same file, tx[4]** (`setConfig` via `lib=0xc02ab410f0734efa3f14628780e6e695156024c2`
= `L1_RECEIVE_302`, governing OP->ETH inbound verification), entry for `eid=30111`: byte-identical
to the above (confirmations=45, same 4 required DVNs, 0 optional).

**Decoded from `output/op-SecurityUpgrade.json`, tx[3]/tx[4]** (Safe
`0x764682c769ccb119349d92f1b63ee1c03d6aecff` on chainId `"10"`, `oapp=0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff`,
`lib=0x1322871e4ab09bc7f5717189434f97bbd9546e95` send / `0x3c4962ff6258dcfcafd23a814237b7d6eb712063`
receive), entry for `eid=30101` (ETH), both send and receive: confirmations=45,
requiredDVNCount=4, optionalDVNCount=0, optionalDVNThreshold=0, requiredDVNs =
`[0x5b6735c66d97479ccd18294fc96b3084ecb2fa3f (Canary), 0x6a02d83e8d433304bba74ef1c427913958187142 (LayerZero Labs),
0x9e930731cb4a6bf7ecc11f695a295c60bdd212eb (Horizen), 0xa7b5189bca84cd304d8553977c7c614329750d99 (Nethermind)]`.

**Cross-check against the generator script** — `scripts/SecurityUpgrade.s.sol`,
`_encode4DVNUlnConfig` (lines 225-251), hard-codes:

```solidity
UlnConfig memory ulnConfig = UlnConfig({
    confirmations: 45,
    requiredDVNCount: 4,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: requiredDVNs,   // bubble-sorted ascending by address
    optionalDVNs: new address[](0)
});
```

applied identically to **every** L2 peer including OP (`run()` line 32:
`_generateL2Json(OP, OP_LIMIT, true);`) — the `confirmations: 45` value is a blanket policy
constant, not an OP-specific tuning. The decoded `requiredDVNs` order in both directions is
strictly ascending by address value, matching the script's bubble-sort — an internal
consistency check that the decode is structurally sound.

**Cross-check against LayerZero's own metadata API** (`https://metadata.layerzero-api.com/v1/metadata/dvns`,
retrieved 2026-07-22, independent of ether.fi): looked up each of the 8 addresses above by
chain key (`ethereum`, `optimism`) and confirmed every one resolves to the claimed
`canonicalName`:

| Address | Chain | `canonicalName` (LayerZero API) |
| --- | --- | --- |
| `0x589dedbd617e0cbcb916a9223f4d1300c294236b` | ethereum | LayerZero Labs |
| `0xa59ba433ac34d2927232918ef5b2eaafcf130ba5` | ethereum | Nethermind |
| `0x380275805876ff19055ea900cdb2b46a94ecf20d` | ethereum | Horizen |
| `0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd` | ethereum | Canary |
| `0x6a02d83e8d433304bba74ef1c427913958187142` | optimism | LayerZero Labs |
| `0xa7b5189bca84cd304d8553977c7c614329750d99` | optimism | Nethermind |
| `0x9e930731cb4a6bf7ecc11f695a295c60bdd212eb` | optimism | Horizen |
| `0x5b6735c66d97479ccd18294fc96b3084ecb2fa3f` | optimism | Canary |

Note: the repo's own `utils/dvn-deployments.json` (fetched 2026-07-22) is **incomplete** — it
lists only `LayerZero_Labs` and `Nethermind` entries per chain and has no `Horizen`/`Canary`
keys at all, even though those two addresses are hard-coded elsewhere in the same repo
(`L2Constants.sol`) and are actually used in the executed-intent `setConfig` calldata. This is
recorded as gap G4 (§5), not a route-config problem — the DVN addresses used in the route are
independently confirmed via `L2Constants.sol` and the LayerZero metadata API regardless.

**Blog corroboration** (`ether.fi/blog/weeth-bridge-security-hardening`, dated May 29, 2026,
retrieved and HTML-stripped 2026-07-22 for verbatim search): *"ether.fi executed `setConfig`
on every pathway to pin the four-DVN set into the OApp-specific slot and raise the
verification threshold to 4-of-4. All four DVNs are now `requiredDVNs` with no optional
slots… (Canary, Horizen, Nethermind, LayerZero Labs)."* This matches the decoded
`optionalDVNCount=0`/`optionalDVNThreshold=0` structure exactly. The blog names the chains
generically ("all 20 weETH chains") and **does not mention Optimism, ETH, or the number 45
anywhere in its body text** — confirmed by grepping the HTML-stripped page text for
`Optimism`, `OP `, `confirmation`, and `20 chain` (0, 0, 0, and 0 raw hits respectively; only
"20 weETH chains" appears, twice). The blog is therefore corroborating evidence for the
*policy shape* (4-of-4, no optional, library pinning, pair-wise rate limits) but not a
chain-specific or numeric source for OP<->ETH.

Per LayerZero's DVN/executor configuration doc
(`https://docs.layerzero.network/v2/developers/evm/configuration/dvn-executor-config`,
retrieved 2026-07-22): *"confirmations: minimum block confirmations required on the source
chain before DVNs and executors proceed with message verification and delivery… all
`requiredDVNs` must attest for a message to verify. Additionally, if `optionalDVNCount` is
set, at least `optionalDVNThreshold` of the `optionalDVNs` must also attest."* With
`optionalDVNCount=0`, the "4-of-4" language used by both ether.fi and WR2 means *all four
required DVNs, no optional quorum* — there is no separate M-of-N threshold beyond "all
required DVNs."

### 2.5 Executor

Both chains' canonical LayerZero executor addresses are known (Ethereum
`0x173272739Bd7Aa6e4e214714048a9fE699453059`, Optimism `0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e`
— `utils/layerzero-v2-deployments.json` and LayerZero metadata API, both retrieved 2026-07-22,
agree exactly), but **no `configType=1` (executor) `SetConfigParam` entry was found** in any
of the decoded `setConfig` calldata for this route. Every entry decoded from
`ethereum-SecurityUpgrade.json` and `op-SecurityUpgrade.json` for eid 30111/30101 was
`configType=2` (ULN/DVN config) only. This is recorded as gap G1 (§5): whether ether.fi has
explicitly pinned the executor for this pathway (vs. relying on the LayerZero default
executor resolution path) is not established from the reviewed batches.

### 2.6 Rate-limit intent

`contracts/PairwiseRateLimiter.sol` (fetched at the pinned commit) defines the mechanism: a
`RateLimitConfig{peerEid, limit, window}` struct, separate `outboundRateLimits`/
`inboundRateLimits` mappings keyed by peer EID, and linear decay
(`_amountCanBeSent`, lines 140-157: `decay = limit * timeSinceLastDeposit / window`). This
matches LayerZero's own "Rate Limiting" design pattern
(`https://docs.layerzero.network/v2/developers/evm/oapp/message-design-patterns`, retrieved
2026-07-22: `RateLimitConfig{dstEid, limit, window}`, imported from
`@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol`) with an ether.fi-specific
extension adding a symmetric inbound-side check (LayerZero's stock `RateLimiter` only covers
outbound).

Declared numeric values, ABI-decoded from calldata (Appendix A) and cross-checked against the
generator scripts' named constants:

| Batch file (chainId) | Function | eid | limit (wei) | limit (weETH) | window (s) | Script constant |
| --- | --- | --- | --- | --- | --- | --- |
| `output/ethereum-SecurityUpgrade.json` (1) | `setOutboundRateLimits` | 30111 (OP) | 3000000000000000000000 | 3,000 | 14400 (4h) | `OP_LIMIT = 3_000 ether`, `RATE_WINDOW = 4 hours` — `scripts/SecurityUpgrade.s.sol` lines 19-20 |
| `output/ethereum-SecurityUpgrade.json` (1) | `setInboundRateLimits` | 30111 (OP) | 3000000000000000000000 | 3,000 | 14400 | same |
| `output/op-SecurityUpgrade.json` (10) | `setOutboundRateLimits` | 30101 (ETH) | 3000000000000000000000 | 3,000 | 14400 | same (symmetric, confirmed by decode) |
| `output/op-SecurityUpgrade.json` (10) | `setInboundRateLimits` | 30101 (ETH) | 3000000000000000000000 | 3,000 | 14400 | same |
| `output/mainnet-increase-rate-limits.json` (1) | `setOutboundRateLimits` | 30111 (OP) | 10000000000000000000000 | 10,000 | 14400 | `NEW_LIMIT = 10_000 ether`, `NEW_WINDOW = 4 hours` — `scripts/increaseRateLimits.s.sol` lines 14-15, `_generateMainnetJson` line 30 |
| `output/mainnet-increase-rate-limits.json` (1) | `setInboundRateLimits` | 30111 (OP) | 10000000000000000000000 | 10,000 | 14400 | same |
| `output/op-increase-rate-limits.json` (10) | `setOutboundRateLimits` | 30101 (ETH) | 10000000000000000000000 | 10,000 | 14400 | same, `_generateOpJson` line 62 |
| `output/op-increase-rate-limits.json` (10) | `setInboundRateLimits` | 30101 (ETH) | 10000000000000000000000 | 10,000 | 14400 | same |

`output/mainnet-increase-rate-limits.json` tx[2] additionally calls
`transferToOftAdapter(uint256)` on `0x344169Cc4abE9459e77bD99D13AA8589b55b6174` (the ETHFI
governance-token Wormhole NTT Manager, per `scripts/increaseRateLimits.s.sol` line 18-19,
`MAINNET_NTT_MANAGER`) — **unrelated to the weETH bridge route**, bundled administrative
cleanup in the same Safe batch. Excluded from the route manifest.

`output/op-ReducePathways.json` and `output/Mainnet-ReducePathways.json` (both decoded) set 5
EIDs each to 50 weETH / 43,200 s (12h): `30243` (Blast), `30260` (Mode), `30165` (zkSync),
`30322` (Morph), `30332` (Sonic). **Neither file touches EID 30101 or 30111** — confirmed both
by absence in the decoded array and by the generator's explicit target list:
`scripts/reduceOFTRateLimit.s.sol` line 15, `targetChains = ["blast","mode","morph","sonic","zksync"]`
— OP is not a member and is only affected as a *non*-target chain whose rate limit *to those
five* gets clamped (`op-ReducePathways.json`), leaving OP's own ETH-facing limit untouched by
this script.

### 2.7 Reciprocal peers

Declared intent is that `L1_OFT_ADAPTER.peers(30111) == bytes32(OP.L2_OFT)` and
`OP.L2_OFT.peers(30101) == bytes32(L1_OFT_ADAPTER)`, per LayerZero's OApp reference
(`https://docs.layerzero.network/v2/concepts/technical-reference/oapp-reference`, retrieved
2026-07-22): *"Registering on Chain A -> Chain B does not register the reverse. Each side
must call `setPeer`"*, and on receipt the Endpoint enforces `peers[origin.srcEid] ==
origin.sender`. The integration checklist states the same requirement more sharply:
*"Peers must be reciprocal. The pathway A->B requires `OApp(A).peers(eidB) ==
bytes32(OApp(B))` **and** `OApp(B).peers(eidA) == bytes32(OApp(A))`… A non-reciprocal peer
creates a half-open channel."*

This lane could **not** find an executed-intent `setPeer(uint32,bytes32)` calldata for the
30101/30111 pair anywhere in the fetched `output/*.json` set. The only `setPeer`-generating
script found, `scripts/oft-deployment/02_UpdateOFTPeersTransactions.s.sol`, is a **reusable
template** keyed to `DEPLOYMENT_EID`/`DEPLOYMENT_OFT` constants in `L2Constants.sol` that
currently point at Monad (`DEPLOYMENT_EID = 30390`, chain ID "143"), i.e. whichever L2 is
*next* being onboarded — not at OP, which was deployed in an earlier commit not reachable
from this pinned tree via this script. The declared peer values above are therefore an
**inference from registry co-declaration** (both addresses are the sole declared canonical
route endpoints for chain 1 / chain 10 in `L2Constants.sol`, and `SecurityUpgrade.s.sol`
explicitly treats `OP.L2_EID` as `L1_OFT_ADAPTER`'s pairwise counterpart for rate limits and
DVN config), not a directly observed `setPeer` transaction. Recorded as gap G2 (§5).

### 2.8 Route lifecycle intent

The repo has **no explicit lifecycle-status field** (no `active`/`candidate`/`disabled`/
`decommissioned` enum anywhere in `L2Constants.sol`, the scripts, or the READMEs reviewed).
Per `docs/ENGINEERING_SPEC.md:526`: *"a `candidate`, `disabled`, or `decommissioned` route
remains visible but is not required to satisfy active-route activity predicates; zero limits
or a pause may be the expected disabled state."* Applying that lens to what was found:

- OP<->ETH received the full 26Q2 hardening batch (`unpauseBridge()`, non-zero rate limits,
  4-DVN `setConfig`) in `output/{ethereum,op}-SecurityUpgrade.json` — the same treatment as
  every other still-supported chain.
- OP<->ETH is explicitly **excluded** from both "reduce pathway" batches (§2.6) — the
  generator script (`scripts/reduceOFTRateLimit.s.sol`) enumerates a fixed 5-chain
  deprecation target list that does not include OP, and OP's own rate limit to ETH is left
  untouched by that script.
- OP<->ETH received a rate-limit **increase** (§2.6) — an affirmative capacity-raising
  action, the opposite signal from a pause/decommission pattern.
- `constructor()` in `L2Constants.sol` (lines 135-154) only pushes `BASE` into the `L2s[]`
  array actually iterated by some scripts (e.g. `02_UpdateOFTPeersTransactions.s.sol`'s
  `run()` loop, `scripts/reduceOFTRateLimit.s.sol`'s `run()` loop); `L2s.push(OP)` is present
  in the file but commented out. This array is used by a *different* subset of scripts than
  the ones that actually touch OP (OP's `SecurityUpgrade`/rate-limit/`unpauseBridge` batches
  are generated by scripts that reference `OP` directly by name, not via `L2s[]`). Recorded
  as a note, not a lifecycle signal, in gap G5 (§5) — it is plausible this only reflects
  which chains are due for the *next* templated peer/rate-limit run, not OP's route status.

None of this is an *observed* lifecycle state (that would require on-chain reads, explicitly
out of scope). The inferred classification is **"active/hardened,"** based on the three
affirmative signals above, not a status field.

### 2.9 Adjacent, distinct route: L1 Sync Pool <-> OP (native minting) — NOT the OFT route

`output/op_L1_ControllerConfig.json` (decoded) is a **separate** `setConfig` call, `oapp =
0xd789870bea40d056a4d26055d0befcc8755da146` (`L1_SYNC_POOL`, not the OFT Adapter),
`lib = 0xc02ab410f0734efa3f14628780e6e695156024c2` (`L1_RECEIVE_302`), for `eid=30111` (OP):
**`confirmations=64`, `requiredDVNCount=2`** (`LayerZero Labs 0x589dedbd…`, `Nethermind
0xa59ba433…` only — **no Horizen, no Canary**), `optionalDVNCount=0`. This is a materially
**weaker** DVN policy (2-of-2 vs. the OFT route's 4-of-4) governing the *native-minting sync
pool* messaging channel between OP and L1, which is a different contract pair from the weETH
OFT Adapter <-> OP OFT route that is this document's primary subject. Flagged here so a
manifest author does not conflate the two when building `ROUTE-ETH-OP-v1` — the sync pool is
a distinct pathway with its own (weaker) declared policy and its own lifecycle (governed via
`L1_TIMELOCK`, `output/op_L1_TimelockSchedule.json`/`op_L1_TimelockExecute.json`, 3-day/259,200s
schedule delay — see conflict C1 below).

---

## 3. Corroboration highlights (independent, not copied from WR2)

- Commit SHA, author date, and commit message re-fetched independently and matched (see
  header).
- All chain 1 / chain 10 addresses in `L2Constants.sol` were re-fetched and re-read directly
  from raw file bytes, not from WR2's tables.
- Every DVN/ULN and rate-limit numeric value in this document was obtained by **ABI-decoding
  the raw Safe-batch calldata** with `eth_abi`, not by reading WR2's prose. This method
  surfaced one internal repo inconsistency WR2 did not report (`utils/dvn-deployments.json`
  missing Horizen/Canary, §2.4 / gap G4) and one factual correction to a WR2 claim (§4, C1).
- The `SendUln302`/`ReceiveUln302`/`EndpointV2`/executor addresses and the four DVN
  identities were additionally cross-checked against LayerZero Labs' own public metadata API
  (`metadata.layerzero-api.com`), a source WR2 did not cite at all — this is the strongest
  independent corroboration available short of an on-chain read.

---

## 4. Conflicts and gaps

**C1 — Timelock schedule delay: this lane's decode disagrees with WR2's stated value.**
`roadmap/research/WR2/authority-map.md` §4 item 3 states: *"The only data point is a single
`schedule` call carrying a 16200 s (~4.5 h) delay parameter in `op_L1_TimelockSchedule.json`."*
This lane ABI-decoded all four `TimelockController.schedule(address,uint256,bytes,bytes32,bytes32,uint256)`
calls in that same file (`output/op_L1_TimelockSchedule.json`, safe
`0xcdd57d11476c22d265722f68390b036f3da48c21`, chainId "1") and found the `delay` parameter
(last of the six ABI-encoded arguments) is **`259200` seconds (exactly 3 days) in all four
transactions**, not 16,200. The raw hex is directly legible: each transaction's `data` field
contains the literal word
`...000000000000000000000000000000000000000000000000000000000003f480...` immediately before
the inner-call length/selector, and `0x3f480 = 259200`. This was verified by (a) an
independent `eth_abi.decode(['address','uint256','bytes','bytes32','bytes32','uint256'], …)`
call whose selector (`0x01d5062a`) was independently confirmed by computing
`keccak256("schedule(address,uint256,bytes,bytes32,bytes32,uint256)")[:4]` and matching it
against the calldata's own leading 4 bytes, and (b) manual hex inspection of the raw file
(`output/op_L1_TimelockSchedule.json`, retrieved 2026-07-22). 259,200s exactly matches the
3-day `minDelay` the repo declares for the **L2** `EtherFiTimelock` pattern
(`scripts/DeployEtherFiTimelock.s.sol` line 28: `abi.encode(3 days, controller, controller,
L2_TIMELOCK)`), which is a plausible (not proven) signal that `L1_TIMELOCK`'s configured
`minDelay` is also 3 days — but this remains an inference, not a directly observed
`getMinDelay()` value (that would require an on-chain read). **This conflict concerns the L1
Sync Pool / L1_VAMP governance surface (§2.9), not the OFT route's own rate limits or DVN
config** — it is recorded here because the deliverable instructions require every source
disagreement to stay visible, and because it directly touches a value (`L1_TIMELOCK`
scheduling delay) a sibling lane already asserted from the same underlying file. An engineer
should re-run the decode independently before relying on either number.

**C2 — Two different declared rate-limit values for the same directed pair, same pinned
commit, no execution-order proof.** `output/{ethereum,op}-SecurityUpgrade.json` declare
3,000 weETH / 4h for the OP<->ETH pair; `output/{mainnet,op}-increase-rate-limits.json`
declare 10,000 weETH / 4h for the same pair. Both files exist simultaneously in the same
pinned tree. The generator scripts' *names* ("SecurityUpgrade" = baseline hardening batch vs.
"IncreaseRateLimits" = a named follow-on adjustment) suggest 10,000/4h is the later,
currently-intended value, and `scripts/increaseRateLimits.s.sol`'s constant is literally named
`NEW_LIMIT`. But this is an inference from file/script naming semantics, not a Safe execution
nonce, timestamp, or on-chain observation — none of which were read (out of scope: live
data). **Do not treat either number as "the" current expected value without an
execution-order check** (Safe API nonce/timestamp comparison, or an on-chain
`outboundRateLimits(30111)`/`inboundRateLimits(30111)` read, both out of scope for this
research lane).

**C3 — `utils/dvn-deployments.json` is missing two of the four DVN providers actually used.**
The repo's own LayerZero-vendor DVN address mirror lists only `LayerZero_Labs` and
`Nethermind` per chain; `Horizen` and `Canary` — both hard-coded in `L2Constants.sol` and both
present in the executed-intent `setConfig` calldata — have no entry in that file at all. This
is an internal repo documentation-completeness gap, not evidence the route itself is
misconfigured (the addresses are independently confirmed via `L2Constants.sol` and LayerZero's
public metadata API, §2.4).

**C4 — Blog post predates the pinned commit by ~6.5 weeks and is chain-generic.** The
bridge-hardening post is dated May 29, 2026; the pinned "26Q2 Security Upgrade" commit's
author date is 2026-07-15. The blog's *policy description* (4-of-4 DVN, pinned libraries,
pair-wise rate limits, "20 weETH chains") is consistent with what this lane decoded for
OP<->ETH, but the blog cannot be the source of the pinned commit's specific numeric values
(45 confirmations, 3,000/10,000 weETH limits) because it predates that commit and never
states them. Treat the blog strictly as corroborating the *shape* of the policy, not its
OP-specific numbers — consistent with `docs/SOURCE_REGISTER.md`'s treatment of blog posts as
"claimed hardening" rather than a configuration source.

---

## 5. Unknown / requires on-chain decoding

- **G1 — Executor pinning.** No `configType=1` (`ExecutorConfig`) `SetConfigParam` was found
  for eid 30101/30111 in any reviewed batch; only `configType=2` (ULN/DVN) entries were
  present. Whether ether.fi has explicitly pinned the executor (as opposed to relying on
  LayerZero Labs' default executor resolution) for this specific pathway is unknown from the
  reviewed sources. Requires either a further repo script this lane did not locate, or an
  on-chain `getConfig(oapp, lib, eid, configType=1)` read (out of scope here).
- **G2 — `setPeer` transaction for the 30101/30111 pair.** Not found in the pinned tree; the
  only peer-setting script present is a reusable template currently pointed at a different
  (Monad) deployment. Declared peer values in §2.7 are a registry-co-declaration inference,
  not an observed or even a repo-declared transaction. Requires either an older commit/PR in
  this repo's history (out of scope — this lane pinned one commit only, per charter) or an
  on-chain `peers(eid)` read on both OApps.
- **G3 — `setSendLibrary`/`setReceiveLibrary` transactions.** The blog states these were
  executed "on every pathway across all 20 weETH chains," but this lane found only
  `EndpointV2.setConfig` (DVN/ULN) calls in the reviewed `output/*.json` files for the
  30101/30111 pair — no `setSendLibrary(oapp, eid, lib)` / `setReceiveLibrary(oapp, eid, lib,
  gracePeriod)` calldata was located. It is possible these were executed in an earlier batch
  not named `*-SecurityUpgrade.json` (out of scope to exhaustively search all ~90 `output/`
  files here) or that the library addresses were set at initial OFT deployment
  (`scripts/oft-deployment/01_OFTConfigure.s.sol`, not decoded in this pass). The *addresses*
  are well-established (§2.3); the *specific pin-in-place transaction* for this pair is not.
- **G4 — Whether `utils/dvn-deployments.json`'s Horizen/Canary omission is a stale-file bug
  or intentional.** No script or commit message explains the gap. Does not affect route
  values (confirmed via other sources) but is worth an owner follow-up.
- **G5 — Meaning of the commented-out `L2s.push(OP);` in `L2Constants.sol`'s constructor.**
  Only `BASE` is currently pushed; OP's line is present but commented. This lane could not
  determine from static reading alone whether this reflects (a) OP simply isn't due for the
  *next* templated peer-update/reduce-pathway run that iterates `L2s[]`, or (b) something
  more significant. The scripts that actually touch OP's route (`SecurityUpgrade.s.sol`,
  `increaseRateLimits.s.sol`) reference `OP` directly by name and do not depend on this array,
  so this is not read as a lifecycle signal in §2.8, but it remains unexplained.
- **G6 — Currently effective rate limit (3,000 vs 10,000 weETH / 4h).** See conflict C2.
  Resolving this requires an execution-order check (Safe nonce/timestamp) or a direct
  `outboundRateLimits(30111)`/`inboundRateLimits(30111)` on-chain read — both explicitly out
  of scope for this declared-intent-only research lane.
- **G7 — Live `owner()`/`delegates()`/`peers()` values for either OApp.** Entirely out of
  scope per the hard constraint (no live RPC as expected policy); WR2's authority-map.md
  covers the *declared* authority side of this in more depth and carries the same caveat.

---

## Appendix A — ABI-decoding methodology (for reproducibility)

Environment: Python 3.13.14, `eth_abi` 5.2.0, `eth_utils`/`eth_hash[pycryptodome]` (installed
fresh into this session's environment; not part of the target repo). No `git` command was
run anywhere in this lane; all repository content was retrieved via `curl`/`WebFetch` over
HTTPS from `raw.githubusercontent.com` and `api.github.com`.

1. Selectors were computed, never assumed: `keccak256(<candidate signature string>)[:4]` for
   each candidate ABI signature (`unpauseBridge()`, `setOutboundRateLimits((uint32,uint256,uint256)[])`,
   `setInboundRateLimits(...)`, `setConfig(address,address,(uint32,uint32,bytes)[])`,
   `transferOwnership(address)`, `grantRole(bytes32,address)`,
   `schedule(address,uint256,bytes,bytes32,bytes32,uint256)`,
   `execute(address,uint256,bytes,bytes32,bytes32)`, etc.), then matched against the leading
   4 bytes of each transaction's `data` field. Every selector used in this document matched
   exactly one candidate signature; no selector was guessed from WR2's prose.
2. Top-level call arguments were decoded with `eth_abi.decode([...], payload)` where `payload`
   is `bytes.fromhex(data[2:])[4:]` (strip `0x` and the 4-byte selector).
3. LayerZero `SetConfigParam.config` is `abi.encode(UlnConfig)` where the *entire struct* is
   the sole top-level argument to `abi.encode`. Because that single argument is dynamic (it
   contains `address[]` fields), Solidity's ABI encoder prepends a redundant offset word
   before the struct's own head/tail encoding. Decoding this correctly requires passing the
   full struct type as **one** tuple type string,
   `decode(['(uint64,uint8,uint8,uint8,address[],address[])'], cfg_bytes)`, **not** as six
   separate flat top-level types — the latter silently produces a wrong/misaligned result
   (`eth_abi.exceptions.InvalidPointer`) that looks like a decode failure but is actually a
   caller error. This was caught and corrected during this session (first attempt raised
   `InvalidPointer in tuple at location 128`); the working decode was re-verified against a
   manual word-by-word hex walk before being trusted for the confirmations/DVN values in §2.4.
4. Rate-limit and `Timelock.schedule` decodes used single, flat top-level type lists (these
   are genuinely flat multi-argument encodings, not single dynamic structs), and were
   spot-checked against a manual hex word count in at least one case each (the 259,200 s
   delay in C1 was manually re-verified byte-for-byte against the raw file before being
   reported as a conflict with WR2).
5. Every address decoded was independently re-derived from at least one raw file this lane
   fetched itself in this session (listed inline throughout §2); none were transcribed from
   WR2's tables.

## Appendix B — Full source list (URL, retrieval date, commit/version)

| Source | URL | Retrieval date | Commit / version |
| --- | --- | --- | --- |
| Commit metadata | `https://api.github.com/repos/etherfi-protocol/weETH-cross-chain/commits/master` | 2026-07-22 | Returned `e30c859c08a0fb44b4732e44b040f144094638ed` |
| `utils/L2Constants.sol` | `https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/utils/L2Constants.sol` | 2026-07-22 | `e30c859c…638ed` |
| `utils/layerzero-v2-deployments.json` | same base path + `utils/layerzero-v2-deployments.json` | 2026-07-22 | same |
| `utils/dvn-deployments.json` | same base path + `utils/dvn-deployments.json` | 2026-07-22 | same |
| `output/ethereum-SecurityUpgrade.json` | same base path + `output/ethereum-SecurityUpgrade.json` | 2026-07-22 | same |
| `output/op-SecurityUpgrade.json` | same base path + `output/op-SecurityUpgrade.json` | 2026-07-22 | same |
| `output/mainnet-increase-rate-limits.json` | same base path + `output/mainnet-increase-rate-limits.json` | 2026-07-22 | same |
| `output/op-increase-rate-limits.json` | same base path + `output/op-increase-rate-limits.json` | 2026-07-22 | same |
| `output/op_L1_ControllerConfig.json` | same base path + `output/op_L1_ControllerConfig.json` | 2026-07-22 | same |
| `output/op_L1_TimelockSchedule.json` | same base path + `output/op_L1_TimelockSchedule.json` | 2026-07-22 | same |
| `output/op_L1_TimelockExecute.json` | same base path + `output/op_L1_TimelockExecute.json` | 2026-07-22 | same |
| `output/op-ReducePathways.json` | same base path + `output/op-ReducePathways.json` | 2026-07-22 | same |
| `output/Mainnet-ReducePathways.json` | same base path + `output/Mainnet-ReducePathways.json` | 2026-07-22 | same |
| `output/ethereum-unpauseBridge.json`, `output/op-unpauseBridge.json` | same base path | 2026-07-22 | same |
| `output/op_L2_GrantMinter.json`, `output/op_L2_SetMinSync.json` | same base path | 2026-07-22 | same |
| `output/op-TransferProxyAdminOwnerToTimelock.json` | same base path | 2026-07-22 | same |
| `scripts/SecurityUpgrade.s.sol` | same base path + `scripts/SecurityUpgrade.s.sol` | 2026-07-22 | same |
| `scripts/increaseRateLimits.s.sol` | same base path + `scripts/increaseRateLimits.s.sol` | 2026-07-22 | same |
| `scripts/reduceOFTRateLimit.s.sol` | same base path + `scripts/reduceOFTRateLimit.s.sol` | 2026-07-22 | same |
| `scripts/updateOFTRateLimt.s.sol` | same base path + `scripts/updateOFTRateLimt.s.sol` | 2026-07-22 | same |
| `scripts/UnpauseBridges.s.sol` | same base path + `scripts/UnpauseBridges.s.sol` | 2026-07-22 | same |
| `scripts/DeployEtherFiTimelock.s.sol` | same base path + `scripts/DeployEtherFiTimelock.s.sol` | 2026-07-22 | same |
| `scripts/oft-deployment/02_UpdateOFTPeersTransactions.s.sol` | same base path + that path | 2026-07-22 | same |
| `contracts/EtherFiOFTAdapterUpgradeable.sol` | same base path + that path | 2026-07-22 | same |
| `contracts/EtherfiOFTUpgradeable.sol` | same base path + that path | 2026-07-22 | same |
| `contracts/PairwiseRateLimiter.sol` | same base path + that path | 2026-07-22 | same |
| `contracts/PausableUntil.sol` | same base path + that path | 2026-07-22 | same |
| `README.md` | same base path + `README.md` | 2026-07-22 | same |
| ether.fi blog | `https://www.ether.fi/blog/weeth-bridge-security-hardening` | 2026-07-22 | Page dated May 29, 2026 |
| LayerZero OApp reference | `https://docs.layerzero.network/v2/concepts/technical-reference/oapp-reference` | 2026-07-22 | live doc, unversioned |
| LayerZero DVN/executor config | `https://docs.layerzero.network/v2/developers/evm/configuration/dvn-executor-config` | 2026-07-22 | live doc, unversioned |
| LayerZero integration checklist | `https://docs.layerzero.network/v2/tools/integration-checklist` | 2026-07-22 | live doc, unversioned |
| LayerZero message design patterns (rate limiting) | `https://docs.layerzero.network/v2/developers/evm/oapp/message-design-patterns` | 2026-07-22 | live doc, unversioned |
| LayerZero Labs metadata API — deployments | `https://metadata.layerzero-api.com/v1/metadata/deployments` | 2026-07-22 | live API, unversioned |
| LayerZero Labs metadata API — DVNs | `https://metadata.layerzero-api.com/v1/metadata/dvns` | 2026-07-22 | live API, unversioned |

Sibling lane referenced for independence comparison only (not used as a primary source):
`roadmap/research/WR2/authority-map.md` (pinned same commit `e30c859c…638ed` independently on
2026-07-21).
