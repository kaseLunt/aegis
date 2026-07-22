# WR4 — Rewind case selection: candidate real configuration changes on the Ethereum <-> OP weETH route

Research lane: WR4 (rewind case selection). Evidence target: Correct (research rationale, not
deployment evidence). Retrieval date for all web claims: 2026-07-22 (author's local date).
Primary pinned source: `etherfi-protocol/weETH-cross-chain` @ commit
`e30c859c08a0fb44b4732e44b040f144094638ed` (same commit WR2 pinned), branch `master`.

Mission: locate at least two candidate real, public configuration/implementation changes on
the Ethereum <-> OP weETH route that are suitable inputs for Aegis's first Rewind
reconstruction (docs/ENGINEERING_SPEC.md "Replay and indexer"; docs/ROADMAP.md Milestone 3).

## 0. Method, source classes, and hard boundary

Per `docs/SOURCE_REGISTER.md`, this lane used four source classes:

- **Pinned source / deployment repository**: `weETH-cross-chain` `output/*.json` Safe
  Transaction Builder batches and `contracts/*.sol` — establish *declared* function
  selectors, struct layouts, and event names. I decoded several `output/*.json` calldata
  blobs by hand (hex arithmetic) rather than trusting a summarizer; that decoding is noted
  inline as self-derived.
- **Official documentation/blog**: the ether.fi bridge-hardening post — establishes
  claimed intent/scope only, not a specific transaction.
- **Upstream protocol specification**: `LayerZero-Labs/LayerZero-v2` GitHub source
  (`MessageLibManager.sol`, `UlnBase.sol`) — establishes event *names and parameter types*
  for library/DVN configuration, fetched at the `main` branch HEAD (no commit SHA captured;
  flagged in §5 as needing pinning before any manifest promotion).
- **Block explorer / third-party transaction indexer** (`api.safe.global` Safe Transaction
  Service, and one `etherscan.io` address-page fetch): used **only as a discovery lead**,
  per this lane's charter ("Explorers may LOCATE transactions... label unverified"). Every
  transaction hash, block number, timestamp, and nonce sourced this way is marked
  **[unverified-pending-onchain-decoding]** below and must be re-derived by Aegis's own
  RPC adapters from two independent providers at an exact block hash before it can support
  any canonical claim. `api.safe.global` is *not* the LayerZero Endpoint, the OFT, or an RPC
  node — it is a hosted indexer outside the Aegis trust boundary (`docs/THREAT_MODEL.md`),
  functionally equivalent to a block explorer for this purpose.
- No live RPC reads were performed. No manifest was written or promoted. No indexing code
  or production code was written. All work is confined to
  `roadmap/research/WR4/rewind-candidates.md`.

### 0.1 A tooling hazard worth naming explicitly

One `WebFetch` of `etherscan.io/address/0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` (the L1
controller Safe) returned a page summary describing ETH/stETH/DFLY/HEX/DIXT token holdings
and an unrelated EOA (`0xB7b51eD6EB6b615A4dd4623CB7b5cF0a49307529`) as the frequent caller.
That profile is inconsistent with a protocol-controller Safe and was not corroborated by any
other source. **It is not used as evidence anywhere below** and is flagged here as a fetch
reliability hazard: page-rendering/summarization tools can silently fabricate plausible-looking
on-chain-shaped content, which is exactly the failure mode Aegis's RPC-adapter/raw-hash
discipline (docs/ENGINEERING_SPEC.md "Evidence acquisition") exists to prevent. Everything
sourced from `api.safe.global` below was cross-checked for at least internal plausibility
(block-number-vs-timestamp consistent with each chain's known block time; function selector
consistent with the repo's declared ABI; DVN/library addresses consistent with WR2's
independently sourced authority map) before inclusion — but plausibility is not verification.

### 0.2 Selectors and events resolved from pinned source (for reproducibility)

Decoded from `weETH-cross-chain` contracts at the pinned commit:

| Selector | Function | Contract(s) | Source |
| --- | --- | --- | --- |
| `0xa82f143c` | `unpauseBridge()` (0 args, `onlyRole(UNPAUSER_ROLE)`) | `EtherfiOFTAdapterUpgradeable.sol` (L1), `EtherfiOFTUpgradeable.sol` (L2) | contracts/EtherFiOFTAdapterUpgradeable.sol L64; contracts/EtherfiOFTUpgradeable.sol |
| `0xe96e38e2` | `setOutboundRateLimits(RateLimitConfig[])`, `RateLimitConfig = (uint32 peerEid, uint256 limit, uint256 window)` | same, via `PairwiseRateLimiter` mixin | contracts/PairwiseRateLimiter.sol |
| `0xf51b1aca` | `setInboundRateLimits(RateLimitConfig[])` | same | contracts/PairwiseRateLimiter.sol |
| `0x6dbd9f90` | `EndpointV2.setConfig(address oapp, address lib, SetConfigParam[])` | `0x1a44076050125825900e736c501f859c50fE728c` (both chains) | utils/layerzero-v2-deployments.json; upstream LayerZero-v2 |
| `0x2f2ff15d` | `grantRole(bytes32 role, address account)` (OZ `AccessControl`) | OP weETH OFT `0x5A7fACB9...` (this ABI epoch only — see §4 caveat) | output/op_L2_GrantMinter.json |
| `0xf2fde38b` | `transferOwnership(address)` (OZ `Ownable`, used here on a `ProxyAdmin`) | OP OFT proxy admin `0x632304Edc8...` | output/op-TransferProxyAdminOwnerToTimelock.json |

Events (pinned source / upstream spec, not yet bytecode-verified against the deployed
contracts — see §4):

| Event | Signature | Emitted by |
| --- | --- | --- |
| `OutboundRateLimitsChanged` | `(RateLimitConfig[] rateLimitConfigs)` | ether.fi `PairwiseRateLimiter` mixin (pinned source) |
| `InboundRateLimitsChanged` | `(RateLimitConfig[] rateLimitConfigs)` | ether.fi `PairwiseRateLimiter` mixin (pinned source) |
| `Unpaused` | `(address account)` | OZ `PausableUpgradeable` / ether.fi `PausableUntil` |
| `SendLibrarySet` | `(address indexed oapp, uint32 indexed eid, address indexed newLib)` | LayerZero `EndpointV2`/`MessageLibManager` (upstream, `main` HEAD) |
| `ReceiveLibrarySet` | `(address indexed oapp, uint32 indexed eid, address indexed newLib)` | LayerZero `EndpointV2`/`MessageLibManager` (upstream, `main` HEAD) |
| `UlnConfigSet` | `(address oapp, uint32 eid, UlnConfig config)` | `SendUln302`/`ReceiveUln302` (`UlnBase`, upstream, `main` HEAD) |
| `RoleGranted` | `(bytes32 indexed role, address indexed account, address indexed sender)` | OZ `AccessControl` (this ABI epoch of the OP OFT only) |
| `OwnershipTransferred` | `(address indexed previousOwner, address indexed newOwner)` | OZ `Ownable` (`ProxyAdmin`) |

---

## 1. Candidate 1 (top recommendation) — paired L1/OP outbound rate-limit reconfiguration, 2026-05-28

**What changed:** the ether.fi controller Safes on both Ethereum and OP called
`setOutboundRateLimits(RateLimitConfig[])` on the respective weETH OFT/Adapter contracts,
within 14 seconds of each other, one day before the ether.fi bridge-hardening blog post.

| Field | Ethereum (L1) | Optimism (OP) |
| --- | --- | --- |
| Chain | 1 | 10 |
| Tx hash [unverified-pending-onchain-decoding] | `0x5de1ff3c9dbf8b97dfcaa232eea062bf92a1c0b17dd951e770c71fa405853bb8` | `0xfe64aac14d7604bde6887c3291c40a53529a982ee9d85c676e3cb44027727811` |
| Block [unverified-pending-onchain-decoding] | 25194944 | 152192876 |
| Timestamp [unverified-pending-onchain-decoding] | 2026-05-28T16:08:35Z | 2026-05-28T16:08:49Z |
| Safe (nonce) | `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` (nonce 772) | `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` (nonce 30) |
| Emitting/target contract | L1 weETH OFT Adapter `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` | OP weETH OFT `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` |
| Function (selector) | `setOutboundRateLimits(RateLimitConfig[])` (`0xe96e38e2`) | same |
| Expected event | `OutboundRateLimitsChanged(RateLimitConfig[])` | same |

**Before/after:** not independently observed (would require the pre-call `outboundRateLimits`
storage read at the parent block plus the post-call read/event decode). The repo's
`output/ethereum-SecurityUpgrade.json` declares the *intended* after-state as a struct array of
~20 `(peerEid, limit, window)` tuples. I independently decoded that hex blob (not via a
summarizer) and confirmed EID `0x759f` = **30111 (Optimism)** is one of the ~20 destination
EIDs configured, each with `limit = 0x1158e460913d0000` (~1,250,000,000000000000 wei-scale
units — needs unit confirmation against the contract's decimals) and `window = 0x384` (900
seconds). This matches the blog's "pair-wise rate limits... for every source-destination
chain route" and "all 20 weETH chains" language.

**Initiator/executor:** the L1 and OP controller Safes per WR2's authority map
(`0x2aCA71...` on L1, `0x764682...` on OP), each requiring their configured signature
threshold (unknown — WR2 §4). Both are "owner"-gated calls per `PairwiseRateLimiter`
(`onlyOwner`), consistent with WR2's derivation that these Safes are the OApp owners.

**Why reconstructable:** single-purpose calldata (one struct-array write, no nested
MultiSend to decode), ether.fi-authored function/event names are pinned source (not
upstream boilerplate), the destination EID list gives a natural per-route before/after
diff (only the OP-EID entry needs to be isolated from a large array), and the L1/OP pairing
gives genuine crosschain causal-edge material (two independently mined events on two
chains, correlated by close wall-clock time — never described as atomic, per
ENGINEERING_SPEC's crosschain rules) for M3's "explicit causal edges for crosschain event
bundles" and "one real configuration or implementation change traces from transaction to
affected route assertions."

**Reconstruction blockers:**
- The exact calldata of the two discovered transactions has **not** been fetched and
  diffed byte-for-byte against the repo's declared blob — only the function selector and a
  hand-decoded EID value were cross-referenced. This is the single most important next step
  before promoting this candidate (`eth_getTransactionByHash` + `eth_getTransactionReceipt`
  against two independent providers, per docs/ENGINEERING_SPEC.md evidence-acquisition rules).
- `RateLimitConfig.limit`/`.window` units and pre-call values are unknown until an
  `eth_getStorageAt`/`eth_call` read is taken at the parent block; nothing here should be
  read as an observed before-value.
- Provider archive depth for OP mainnet at block ~152.19M (roughly two months old at
  retrieval time) needs confirmation; most commercial archive nodes cover this, but Aegis
  has not yet configured or tested two independent OP archive providers.
- The blog's own publish date is itself unresolved — a `WebFetch` of the article reported
  "May 29, 2026," which lines up neatly with this 2026-05-28 pair, but a secondary media
  summary (WEEX/Phemex, surfaced via `WebSearch`) instead associated the hardening with
  "April 2026," tied to the April 18 Kelp DAO incident. Both are recorded; neither is treated
  as authoritative (see §5).

---

## 2. Candidate 2 — OP `MINTER_ROLE` grant to the L2 sync pool, 2026-04-03

**What changed:** the OP controller Safe called `grantRole(MINTER_ROLE, L2_SYNC_POOL)` on
the OP weETH OFT, granting the sync pool contract mint authority.

| Field | Value |
| --- | --- |
| Chain | 10 (Optimism) |
| Tx hash [unverified-pending-onchain-decoding] | `0xef1f04876e07e9d91d4a1072abc4b913ba6646eb01fc3f173d9c0b31beb019ec` |
| Block [unverified-pending-onchain-decoding] | 149815468 |
| Timestamp [unverified-pending-onchain-decoding] | 2026-04-03T15:21:53Z |
| Safe (nonce) | `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` (nonce 20) |
| Emitting/target contract | OP weETH OFT `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` |
| Function (selector) | `grantRole(bytes32,address)` (`0x2f2ff15d`) |
| Role / grantee | `MINTER_ROLE` = `keccak256("MINTER_ROLE")` = `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`; grantee = OP L2 Sync Pool `0xC9475e18E2C5C26EA6ADCD55fabE07920beA887e` |
| Expected event | `RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)` |

The discovered selector (`0x2f2ff15d`) and target/role/grantee triple match
`output/op_L2_GrantMinter.json` exactly (see WR2 §2, claim P3), which is strong (though still
not byte-for-byte-diffed) corroboration.

**Before/after:** before = sync pool does not hold `MINTER_ROLE` on the OP OFT; after =
it does. This is a boolean membership flip, the simplest possible before/after shape.

**Initiator/executor:** OP controller Safe `0x764682...`, acting as role admin (WR2 §1b).

**Why reconstructable:** minimal ABI surface (standard OpenZeppelin `AccessControl`,
well-documented upstream), single chain, single call, no MultiSend to unwrap, and a single
boolean-membership before/after — the cleanest possible exercise of M3's event-identity
`(chainId, blockHash, transactionHash, logIndex)` and epoch-handling machinery before adding
crosschain or MultiSend complexity.

**Reconstruction blockers:**
- **ABI epoch mismatch (a first-class case study, not just a caveat):** WR2 already flagged
  that current `master` `EtherfiOFTUpgradeable.sol` has moved from OpenZeppelin
  `AccessControl`-style roles to numeric role IDs (`MINTER_ROLE = 1`) gated by
  `setRole`/`IRoleRegistry`. This 2026-04-03 transaction almost certainly predates that
  refactor and must be decoded against an **older** ABI epoch (`grantRole(bytes32,address)`),
  not the current `master` source. Selecting the wrong epoch's ABI would silently
  misdecode or fail to decode this event — precisely the scenario M3's exit gate ("ABI
  changes decode through explicit epochs") and the negative fixture list ("ABI/code-hash
  mismatch prevents decoding") are meant to catch. Locating the exact implementation
  contract/commit in force at block 149815468 is the concrete next step.
- Byte-for-byte calldata confirmation against the repo JSON has not been performed (same
  caveat as Candidate 1).

---

## 3. Candidate 3 — L1 sync-pool receive-library + DVN `setConfig` pinning for the OP EID, 2026-06-02

**What changed:** the L1 controller Safe executed a Safe MultiSend batch that (a) pinned the
`ReceiveUln302` library for the L1 Sync Pool OApp on EID 30111 (Optimism) and (b) called
`EndpointV2.setConfig` for that same OApp/EID pinning the four required DVNs.

| Field | Value |
| --- | --- |
| Chain | 1 (Ethereum) |
| Tx hash [unverified-pending-onchain-decoding] | `0x37dd6662042eccc361f8b4ea1d67e3c37353195187f2febec6bd09fc8df33a20` |
| Block [unverified-pending-onchain-decoding] | 25232255 |
| Timestamp [unverified-pending-onchain-decoding] | 2026-06-02T21:01:59Z |
| Safe (nonce) | `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` (nonce 776) |
| Top-level `to` (MultiSend, `operation=1`/delegatecall) | `0x40A2aCCbd92BCA938b02010E17A5b8929b49130D` |
| Sub-call 1: `setReceiveLibrary` | Endpoint `0x1a44076050125825900e736c501f859c50fE728c`, OApp = L1 Sync Pool `0xD789870beA40D056A4d26055d0bEFcC8755DA146`, eid = 30111, newLib = `0xc02Ab410f0734EFa3F14628780e6e695156024C2` (ReceiveUln302), grace period 0 |
| Sub-call 2: `setConfig` | same Endpoint/OApp/lib, DVN set = `0x380275805876Ff19055EA900CDb2B46a94ecF20D` (Horizen), `0x589dEDbD617e0CBcB916A9223F4d1300c294236b` (LayerZero Labs), `0xa4fE5A5B9A846458a70Cd0748228aED3bF65c2cd` (Canary), `0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5` (Nethermind) |
| Expected events | `ReceiveLibrarySet(oapp, 30111, 0xc02Ab410...)`; `UlnConfigSet(oapp, 30111, config)` |

The four decoded DVN addresses match WR2's independently sourced L1 DVN set exactly
(WR2 §1a), which is meaningful corroboration across two unrelated source paths (WR2's repo
read vs. this lane's Safe Transaction Service lookup).

**Before/after:** before = whatever library/DVN set previously governed the Sync Pool's
EID-30111 receive path (not observed; would need the pre-call `getConfig`/`receiveLibrary`
read at the parent block); after = `ReceiveUln302` + the 4-of-4 DVN set above. This is the
closest match in this pass to the mission's headline "send/receive library pinning, DVN set
changes" hunting ground.

**Initiator/executor:** L1 controller Safe `0x2aCA71...`, acting as the registered
LayerZero delegate for the Sync Pool OApp (derived, not observed — same caveat as WR2 §1c).

**Why reconstructable:** the sub-calls are individually well-typed (`setReceiveLibrary`,
`setConfig`) against a public, well-documented upstream ABI (LayerZero `EndpointV2`), and
the DVN addresses are independently cross-checked against WR2. Reconstructing it requires
decoding one level of Safe `MultiSend` nesting (2 sub-calls here, some sibling nonces bundle
6-7), which is good coverage for M3's "before/after configuration diffs tied to transaction,
initiator, and executor" beyond a single flat call.

**Reconstruction blockers:**
- **Wrong OApp for the primary route manifest.** This transaction's OApp is the **L1 Sync
  Pool** (`0xD789870b...`), which participates in native-minting on the route but is *not*
  the `weETH OFT Adapter` (`0xcd2eb13D...`) that anchors the canonical `ROUTE-ETH-OP-v1`
  matrix in docs/ENGINEERING_SPEC.md. Promoting this candidate either requires explicitly
  scoping M3's first case to "the route's native-minting leg" or locating the sibling
  transaction that performs the equivalent library/DVN pinning for the OFT Adapter OApp on
  EID 30111 — **not located in this pass.** Nearby Safe nonces were checked and ruled out:
  nonce 773 (2026-05-31) is the same Sync-Pool pinning pattern but for six *other* EIDs
  (30243, 30260, 30184, 30183, 30214, 30362 — none is 30111/Optimism); nonce 778
  (2026-06-04) is an unrelated `TimelockController.scheduleBatch` call. This is a concrete,
  actionable open item for whoever continues WR4.
- MultiSend decoding is required (unlike Candidates 1, 2, 4, 5); Aegis's indexer does not
  yet have a documented MultiSend-aware decode path.
- Requires the same byte-for-byte calldata confirmation and pre-state read caveats as
  Candidates 1-2.

---

## 4. Candidate 4 — L1 inbound rate-limit reconfiguration, 2026-05-20 (precursor/companion)

| Field | Value |
| --- | --- |
| Chain | 1 (Ethereum) |
| Tx hash [unverified-pending-onchain-decoding] | `0x885bb661ff86dc42082c360453ff633db11df684f5d4dbe7baf8c34da197f273` |
| Block [unverified-pending-onchain-decoding] | 25134295 |
| Timestamp [unverified-pending-onchain-decoding] | 2026-05-20T05:16:59Z |
| Safe (nonce) | `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` (nonce 764) |
| Emitting/target contract | L1 weETH OFT Adapter `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` |
| Function (selector) | `setInboundRateLimits(RateLimitConfig[])` (`0xf51b1aca`) |
| Expected event | `InboundRateLimitsChanged(RateLimitConfig[])` |

Same shape as Candidate 1 (before/after = a rate-limit struct-array write), executed eight
days earlier and, in this pass, without a located OP-side counterpart (the OP Safe's direct
calls to its OFT, queried in full, show only nonces 1, 2, 3, 6, 20, and 30 — no
`0xf51b1aca` among them). It is recorded because it is real and independently useful, but it
is ranked below Candidate 1 because the crosschain pairing that makes Candidate 1 valuable
for M3's causal-edge requirement is not established here.

**Why reconstructable / blockers:** identical to Candidate 1's entry, minus the crosschain
pairing. The missing OP-side inbound-limit counterpart (if one exists) has not been located
in this pass — an open item.

---

## 5. Candidate 5 — OP OFT proxy-admin ownership transfer to the L2 timelock, 2025-08-12

| Field | Value |
| --- | --- |
| Chain | 10 (Optimism) |
| Tx hash [unverified-pending-onchain-decoding] | `0x7a2c3041c1f8ca5848a118ec97cc7eb90f4ed193ce7a0c946255b90153d59b8b` |
| Block [unverified-pending-onchain-decoding] | 139705022 |
| Timestamp [unverified-pending-onchain-decoding] | 2025-08-12T14:27:01Z |
| Safe (nonce) | `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` (nonce 18) |
| Emitting/target contract | OP OFT proxy admin `0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` |
| Function (selector) | `transferOwnership(address)` (`0xf2fde38b`), argument = OP L2 timelock `0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6` |
| Expected event | `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)` |

Selector, target, and argument match `output/op-TransferProxyAdminOwnerToTimelock.json`
exactly (WR2 §2, claim P2).

**Before/after:** before = proxy-admin owner is the controller Safe `0x764682...`; after =
owner is the L2 timelock `0x851Dd540...` (3-day declared `minDelay`, per WR2 §1b/P8). This
is an **upgrade-authority** change (who can swap the OP OFT's implementation), not a
bridge-security-parameter change — it predates and is unrelated to the May/June 2026
hardening window.

**Why reconstructable:** the simplest possible shape in this entire set — one OZ `Ownable`
call, one event, no struct decoding, no MultiSend, no per-EID arrays. Best candidate if the
team instead wants the *lowest-engineering-risk* first Rewind case, deferring rate-limit
struct decoding and MultiSend unwrapping to later cases.

**Reconstruction blockers:** same generic caveats (byte-for-byte calldata confirmation, no
independent pre-state read yet); additionally, because this predates the pinned commit's
guardian-pause/role refactor (WR2 P14), decoding it may require an even earlier ABI epoch
of the proxy admin/OFT than Candidate 2 needs — not yet identified.

---

## 6. Ranked recommendation

1. **Candidate 1 (paired L1/OP outbound rate-limit reconfiguration, 2026-05-28)** — top
   recommendation. It is the best available match to the mission's stated hunting ground
   (pair-wise rate-limit configuration, part of the branded bridge-hardening rollout), gives
   genuine, non-atomic crosschain causal-edge material from two real, independently mined
   transactions correlated by close wall-clock proximity, and has the lowest decode
   complexity of any hardening-era candidate (no MultiSend unwrapping, ether.fi-authored
   pinned-source function/event names, a natural per-destination-EID before/after slice).
   Its main gap — byte-for-byte calldata confirmation and a pre-state read — is exactly the
   kind of gap Aegis's own RPC-adapter evidence acquisition is built to close, not a reason
   to reject the candidate.
2. **Candidate 2 (OP `MINTER_ROLE` grant, 2026-04-03)** — best "minimum viable" case if the
   team wants to bring up the indexer/epoch machinery itself before tackling crosschain
   pairing or MultiSend decoding. Its ABI-epoch mismatch (numeric roles in current `master`
   vs. `AccessControl` roles at execution time) is a valuable, low-risk rehearsal of M3's
   explicit-epoch requirement.
3. **Candidate 3 (L1 Sync Pool receive-library + DVN pinning for OP EID, 2026-06-02)** — the
   closest real match to "send/receive library pinning, DVN set changes" specifically, and
   cross-corroborated against WR2's independently sourced DVN set, but it sits on the Sync
   Pool OApp rather than the OFT Adapter that anchors the M2 route matrix, and it requires
   MultiSend-aware decoding Aegis does not yet document. Promote only after either scoping
   M3 explicitly to include the Sync Pool leg, or locating the OFT-Adapter equivalent.
4. **Candidate 4 (L1 inbound rate-limit call, 2026-05-20)** — real and useful, but ranked
   below Candidate 1 because no OP-side counterpart was located, so it does not yet supply
   crosschain causal-edge material.
5. **Candidate 5 (OP proxy-admin ownership transfer, 2025-08-12)** — the structurally
   simplest transaction found, but it is an upgrade-authority change from outside the
   hardening window rather than a bridge-security-parameter change; keep in reserve as a
   fallback "simplest possible" case if Candidate 1/2's complexity proves too high for a
   first pass.

The acceptance target (docs/ROADMAP.md Milestone 3 exit gate: "at least one real
configuration or implementation change traces from transaction to affected route
assertions") is satisfied by Candidate 1 or Candidate 2 alone; this document supplies five,
comfortably exceeding this lane's "at least two" charter requirement.

---

## 7. Open questions and residual blockers (repository-wide, not per-candidate)

1. **No transaction above has been byte-for-byte diffed** between its on-chain calldata and
   the repo's declared `output/*.json` blob. This is the single highest-priority next step
   before any candidate can move past "candidate" status — it requires an actual RPC read
   (`eth_getTransactionByHash`), which is out of scope for this research lane.
2. **Bridge-hardening blog date is unresolved.** A `WebFetch` extraction reported a publish
   date of "May 29, 2026" (one day after Candidate 1). A `WebSearch` surfaced secondary media
   (WEEX, Phemex) associating the same hardening narrative with "April 2026," tied to the
   April 18 Kelp DAO incident date already on record in `docs/SOURCE_REGISTER.md`. Both are
   recorded; neither is treated as authoritative. An owner should re-fetch the blog page
   directly (ideally via a rendering path less prone to the hazard in §0.1) and record its
   actual publish/update timestamp with a content hash.
3. **Safe signer sets and thresholds remain unknown**, per WR2 §4 — unchanged by this lane's
   work and still blocking any claim about how many/which signers authorized these
   transactions.
4. **The Sync-Pool-vs-OFT-Adapter OApp gap in Candidate 3** (see §3) is the most concrete
   unresolved lead: the equivalent library/DVN-pinning transaction for the primary OFT
   Adapter OApp, targeting EID 30111, was searched for but not found among the nonces
   checked in this pass.
5. **LayerZero-v2 event signatures were read from the `main` branch HEAD**, not a pinned
   commit SHA — acceptable for this research document but must be pinned before any of this
   material enters a reviewed manifest, per the `docs/SOURCE_REGISTER.md` promotion
   checklist.
6. **Archive-provider depth for OP mainnet** at the block range used here (~149.8M-154.5M,
   spanning 2025-08 to 2026-07) has not been confirmed against Aegis's actual configured
   providers; this is an operational prerequisite for Milestone 1's two-independent-provider
   requirement, not something this research lane can resolve.

## Post-critique disposition (integrator, 2026-07-22)

An independent completeness critic (Codex, INS-003; full report in
`completeness-critique.md`) reviewed this deliverable against charter and specs. Standing
corrections, effective immediately and superseding the wording above where they conflict:

1. **Recommendation downgraded (D1):** Candidates 1/2 are *promising leads toward* the M3
   exit gate, not M3-qualified recommendations. Qualification additionally requires the
   directed-pathway matrix, canonical event identities, ABI/code epochs per candidate, and
   an affected-assertion map.
2. **Causal-edge relabel (D2):** the L1/OP pair in Candidate 1 (~14s apart) is
   **chronology-only** evidence. Per ENGINEERING_SPEC ordering rules, a causal edge
   requires an explicit linking artifact (common authored batch, operation id, proposal);
   none has been shown.
3. **"One day before the blog post" (D5):** withdrawn until the post's publish date is
   independently resolved.
4. **Accepted gaps (C1, C6, C7):** no candidate has canonical event identity yet
   (chainId, blockHash, txHash, logIndex); per-chain log-availability/gap-detection
   capability is unassessed; transaction-boundary isolation from later same-block writes is
   unverified. Every recommendation is gated on closing these during M3 implementation.
5. **Round-2 scope (EXTEND items):** A1–A7 candidate classes (implementation upgrades,
   setPeer, send/receive library changes, full ULN+executor matrix, owner/delegate, pause
   and role transitions, timelock pairs), B1–B6 search angles (event-first, git history,
   batch inventory, timelock streams, LZ pathway tooling, per-direction completion),
   C2–C5 hazard analyses, and D3/D4/D6/D7 corrections. Tracked in the WR4 charter handoff.
