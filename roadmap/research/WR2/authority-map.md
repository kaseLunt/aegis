# WR2 — ether.fi weETH Ethereum <-> Optimism route: authority map

Research lane: WR2 (authority research). Evidence target: Correct (research rationale, not deployment evidence).
Retrieval date for all web claims: 2026-07-21 (author's local date).
Primary pinned source: `etherfi-protocol/weETH-cross-chain` @ commit
`e30c859c08a0fb44b4732e44b040f144094638ed` (author date 2026-07-15T16:53:52Z), branch `master`.

## Scope and method

Mission: independently map WHO can change the Ethereum <-> Optimism (OP) weETH LayerZero
route and adjacent ether.fi control surfaces — contract owners, LayerZero delegates, role
holders, Gnosis Safes, timelocks and declared delays, guardians/pausers, and revocation
authorities — from independent public sources.

Sources used, by source class (per `docs/SOURCE_REGISTER.md`):

- **Pinned source / deployment repository** (primary): the `weETH-cross-chain` repo's
  `utils/L2Constants.sol` address registry, the `output/*.json` Gnosis Safe transaction
  batches, and the `scripts/*.s.sol` generators. These establish *declared / intended*
  configuration and manifest expectations. They do **not** by themselves establish that a
  declared address is the current canonical production state.
- **Official documentation / blog**: the ether.fi weETH bridge-hardening post and the
  ether.fi GitBook. Establish product intent and claimed hardening only.
- **Upstream protocol specification**: LayerZero v2 OApp reference (owner/delegate model).
  Establishes correct mechanics, not ether.fi-specific values.
- **Block explorer**: used only as a discovery lead and quarantined in the "Unverified
  (explorer-only)" section — explorers are outside the Aegis trust boundary
  (`docs/THREAT_MODEL.md`).

Hard boundary honored: **no live RPC reads** were performed; nothing here is presented as
observed chain state. Every address below is a *repo-declared* or *documented* value.
Confirming that any of these is the live owner/delegate/role holder at a block hash is
explicitly out of scope and is flagged where it matters.

All addresses are reproduced as written in the source (mixed-case as in the repo). LayerZero
`EndpointV2` is the same address (`0x1a44076050125825900e736c501f859c50fE728c`) on both
chains and on all EVM chains in this deployment.

---

## 1. Authority graph

Legend for the Source column: **[REG]** = `utils/L2Constants.sol` registry; **[BATCH:x]** =
`output/x.json` Safe transaction batch; **[SCRIPT:x]** = `scripts/x`; **[BLOG]** = bridge
hardening post; **[LZ]** = LayerZero OApp reference; **[GB]** = ether.fi GitBook. All repo
references are at the pinned commit. Full URLs and per-claim provenance are in section 2.

### 1a. Ethereum L1 (chain 1, LayerZero EID 30101)

| Surface (contract) | Authority address / entity | Power held | Source |
| --- | --- | --- | --- |
| L1 weETH OFT Adapter `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` (the route lock/unlock contract) | **L1_CONTRACT_CONTROLLER Safe `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC`** | OApp owner + LayerZero delegate (derived): unpause bridge, set inbound/outbound rate limits on the adapter, and `setConfig` DVN/lib config on the Endpoint for this OApp | [REG], [BATCH:ethereum-SecurityUpgrade], [BATCH:mainnet], [LZ] |
| L1 OFT Adapter proxy admin `0xa9E9bBf04F95688D7fd82036f83544630E463CAc` | **owner not established from repo** (candidate: L1_TIMELOCK `0x9f26d4...`) | Contract upgrade authority (can swap adapter implementation; new impl declared `0xA82cc578927058af14fD84d96a817Dc85Ac4F946`) | [REG]; see Unknown §4 |
| LayerZero Endpoint config for L1 OApp (send lib `0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1` SendUln302 / receive lib `0xc02Ab410f0734EFa3F14628780e6e695156024C2` ReceiveUln302) | **L1_CONTRACT_CONTROLLER Safe `0x2aCA71...`** (as delegate) | Pins libraries; sets required DVN set to 4-of-4 | [BATCH:ethereum-SecurityUpgrade], [BLOG], [LZ] |
| Required DVNs for L1 verification | LayerZero Labs `0x589dEDbD617e0CBcB916A9223F4d1300c294236b`, Nethermind `0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5`, Horizen `0x380275805876Ff19055EA900CDb2B46a94ecF20D`, Canary `0xa4fE5A5B9A846458a70Cd0748228aED3bF65c2cd` | 4-of-4 attestation required before receive lib accepts an inbound message (each DVN can withhold = veto) | [REG], [BATCH:ethereum-SecurityUpgrade], [BLOG] |
| L1 Sync Pool `0xD789870beA40D056A4d26055d0bEFcC8755DA146` (native-minting L1 receiver) | **L1_TIMELOCK `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`**, actioned via **L1_TIMELOCK_GNOSIS Safe `0xcdd57D11476c22d265722F68390b036f3DA48c21`** (proposer/executor) | Schedules/executes config changes on the L1 sync pool through a timelock | [REG], [BATCH:op_L1_TimelockSchedule], [BATCH:op_L1_TimelockExecute] |
| L1 Sync Pool proxy admin `0xDBf6bE120D4dc72f01534673a1223182D9F6261D` | owner not established from repo (candidate: L1_TIMELOCK) | Upgrade authority for the L1 sync pool | [REG]; see Unknown §4 |
| Emergency pause of L1 bridge/sync pool | **PAUSER_EOA `0x9AF1298993DC1f397973C62A5D47a284CF76844D`** (declared "guardian"-style pauser) | Can pause (circuit-break); `PausableUntil` + `IRoleRegistry` guardian pause added in the pinned commit | [REG], [SCRIPT commit message], [BATCH:ethereum-unpauseBridge] |
| LayerZero fallback verification authority (historical) | LayerZero 3/5 multisig — **authority removed** | Formerly could change how weETH messages are verified; per the post it "no longer has any onchain path" to do so | [BLOG] |

### 1b. Optimism (chain 10, LayerZero EID 30111)

| Surface (contract) | Authority address / entity | Power held | Source |
| --- | --- | --- | --- |
| OP weETH OFT `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` (impl `0x70d7E0C93D8443325550Ba3F71576F5f346b8aA9`) | **L2_CONTRACT_CONTROLLER_SAFE `0x764682c769CcB119349d92f1B63ee1c03d6AECFf`** | OApp owner + delegate + role admin (derived): `grantRole`/revoke roles, unpause, set rate limits, and Endpoint `setConfig` for this OApp | [REG], [BATCH:op-SecurityUpgrade], [BATCH:op_L2_GrantMinter], [LZ] |
| Mint authority on OP weETH | **L2_SYNC_POOL `0xC9475e18E2C5C26EA6ADCD55fabE07920beA887e`** holds `MINTER_ROLE` (`0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6` = keccak256("MINTER_ROLE")) | Can mint weETH on OP; granted by the controller Safe (which as role admin can also revoke) | [BATCH:op_L2_GrantMinter], [REG] |
| OP OFT proxy admin `0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` | owner = **L2_TIMELOCK `0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6`** (ownership transferred to the timelock) | Contract upgrade authority for OP weETH, gated behind the L2 timelock | [BATCH:op-TransferProxyAdminOwnerToTimelock], [REG] |
| OP L2 timelock `0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6` | proposer / executor / admin = **L2_CONTRACT_CONTROLLER_SAFE `0x764682...`**; declared minimum delay **3 days (259200 s)** | Delays upgrades/admin ops; controller Safe queues + executes | [SCRIPT:DeployEtherFiTimelock.s.sol], [REG] |
| LayerZero Endpoint config for OP OApp (send lib `0x1322871e4ab09Bc7f5717189434f97bBD9546e95` SendUln302 / receive lib `0x3c4962Ff6258dcfCafD23a814237B7d6Eb712063` ReceiveUln302) | **L2_CONTRACT_CONTROLLER_SAFE `0x764682...`** (as delegate) | Pins libraries; sets required DVN set to 4-of-4 | [BATCH:op-SecurityUpgrade], [BLOG], [LZ] |
| Required DVNs for OP verification | LayerZero Labs `0x6A02D83e8d433304bba74EF1c427913958187142`, Nethermind `0xa7b5189bcA84Cd304D8553977c7C614329750d99`, Horizen `0x9E930731cb4A6bf7eCc11F695A295c60bDd212eB`, Canary `0x5b6735c66d97479cCD18294fc96B3084EcB2fa3f` | 4-of-4 attestation required (each DVN can veto by withholding) | [REG], [BLOG] |
| OP L2 sync pool proxy admin `0xecA0b8088bF30eFd476F0a4e6b7e4B5D652b1ded` | owner not established from repo (candidate: L2_TIMELOCK) | Upgrade authority for the OP sync pool | [REG]; see Unknown §4 |
| Emergency pause of OP bridge | pause via role holder; unpause executed by controller Safe `0x764682...` | Circuit-breaker on the OP OFT | [BATCH:op-SecurityUpgrade], [BATCH:op-unpauseBridge] |

### 1c. LayerZero owner/delegate model (mechanics, not ether.fi values)

- An OApp has an **owner** (OpenZeppelin `Ownable`) and a **delegate** registered at the
  Endpoint. Only the owner can call `setDelegate`. Only the delegate can call Endpoint
  `setConfig`, `setSendLibrary`, `setReceiveLibrary`, and message-recovery ops
  (`skip`/`nilify`/`burn`/`clear`). At init the delegate defaults to the address passed in
  (here the OApp `owner`). Source: [LZ].
- **Derivation used above:** the ether.fi controller Safes (`0x2aCA71...` on L1,
  `0x764682...` on OP) are the addresses the repo's batches call `setConfig` from. Because
  only the registered delegate can call `setConfig` for an OApp, the repo *intends* those
  Safes to be the delegates. This is an inference from the repo's authored batches plus the
  LayerZero mechanic — it is **not** an observed on-chain `delegates(oapp)` read. `L2Constants.sol`
  defines no explicit delegate constant, and no `setDelegate` call appears in the reviewed
  scripts (delegate is set in the LayerZero `OFTCore.__OFT_init` parent, to `owner`).

---

## 2. Per-claim provenance

Unless noted, repo files are at commit `e30c859c08a0fb44b4732e44b040f144094638ed`, retrieved
2026-07-21 via `raw.githubusercontent.com` / the GitHub contents API.

| # | Claim | Source URL | Class |
| --- | --- | --- | --- |
| P1 | Address registry: all L1 and OP constants (OFT adapter, proxy admins, controller Safes, timelocks, DVNs, libs, sync pools, `PAUSER_EOA`, `L1_WEETH`) | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/utils/L2Constants.sol | Pinned source |
| P2 | OP proxy-admin ownership transferred to L2_TIMELOCK `0x851Dd540...`: Safe `0x764682...` calls `transferOwnership(0x851dd540...)` on proxy admin `0x632304ed...`, chainId 10 | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/op-TransferProxyAdminOwnerToTimelock.json | Deployment repo (Safe batch) |
| P3 | OP `MINTER_ROLE` granted to L2_SYNC_POOL `0xc9475e18...` on OFT `0x5a7fac...`, from Safe `0x764682...`, chainId 10 | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/op_L2_GrantMinter.json | Deployment repo (Safe batch) |
| P4 | OP security upgrade (unpause + rate limits on OFT `0x5a7fac...`; `setConfig` DVN on Endpoint), authored for Safe `0x764682...`, chainId 10 | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/op-SecurityUpgrade.json | Deployment repo (Safe batch) |
| P5 | Ethereum security upgrade: Safe `0x2aca71...`, chainId 1, `setConfig` on Endpoint pinning 4 DVNs (`0x380275...`, `0x589ded...`, `0xa4fe5a...`, `0xa59ba4...`) for send lib `0xbb2ea7...` and receive lib `0xc02ab4...`; OFT-adapter target `0xcd2eb1...` | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/ethereum-SecurityUpgrade.json | Deployment repo (Safe batch) |
| P6 | OP L1-side controller config: Safe `0x2aca71...`, chainId 1, `setConfig`/multicall on Endpoint `0x1a4407...`, referencing OFT-adapter/sync-pool addresses | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/op_L1_ControllerConfig.json | Deployment repo (Safe batch) |
| P7 | OP L1 timelock schedule: Safe `0xcdd57d...` calls `schedule` on L1_TIMELOCK `0x9f26d4...` (delay param 16200 s in this artifact), chainId 1, targeting L1_SYNC_POOL `0xd78987...` and `0x9ffdf4...` | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/output/op_L1_TimelockSchedule.json | Deployment repo (Safe batch) |
| P8 | L2 EtherFiTimelock deploy declares `minDelay = 3 days`; proposer/executor/admin = that chain's L2_CONTRACT_CONTROLLER_SAFE; verifies deployed address == `L2_TIMELOCK` | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/scripts/DeployEtherFiTimelock.s.sol | Deployment repo (script) |
| P9 | SecurityUpgrade generator: executed by `L2_CONTRACT_CONTROLLER_SAFE`/`L1_CONTRACT_CONTROLLER`; calls `unpauseBridge`, `set{Out,In}boundRateLimits` on OFT and `setConfig` on Endpoint; does NOT call `setDelegate`/`transferOwnership` | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/scripts/SecurityUpgrade.s.sol | Deployment repo (script) |
| P10 | OFT roles in current master use numeric ids (`MINTER_ROLE=1`, `PAUSER_ROLE=2`, `UNPAUSER_ROLE=3`) via `setRole` gated by `owner`; init sets `__Ownable_init(owner)` and delegate via parent `__OFT_init(owner)` | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/contracts/EtherfiOFTUpgradeable.sol | Deployment repo (source) |
| P11 | README L2_OFT table: OP weETH = `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF`, chain id 10 | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/README.md | Deployment repo (docs) |
| P12 | DVN provider->address map (LayerZero Labs / Nethermind per chain) | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/utils/dvn-deployments.json | Deployment repo (config) |
| P13 | LayerZero v2 deployment map (endpoint, EIDs 30101/30111, SendUln302/ReceiveUln302, executor for ETH and OP) | https://raw.githubusercontent.com/etherfi-protocol/weETH-cross-chain/e30c859c08a0fb44b4732e44b040f144094638ed/utils/layerzero-v2-deployments.json | Deployment repo (config) |
| P14 | Pinned commit SHA `e30c859c08a0fb44b4732e44b040f144094638ed`, author date 2026-07-15T16:53:52Z; commit adds `PausableUntil`, `IRoleRegistry`, guardian-controlled emergency pause on `EtherfiL1SyncPoolETH` | https://api.github.com/repos/etherfi-protocol/weETH-cross-chain/commits/master | Deployment repo (VCS metadata) |
| P15 | "every weETH bridge parameter that can authorize a mint or release of weETH is controlled exclusively by ether.fi multisigs"; libraries/DVN(4-of-4)/rate-limits controlled by ether.fi Safes; LayerZero multisig "no longer has any onchain path to change how weETH messages are verified"; 4 DVNs = Canary, Horizen, Nethermind, LayerZero Labs | https://www.ether.fi/blog/weeth-bridge-security-hardening | Official blog |
| P16 | LayerZero OApp owner/delegate model: only owner calls `setDelegate`; only delegate calls `setConfig`/`setSendLibrary`/`setReceiveLibrary`/recovery; delegate defaults to init address | https://docs.layerzero.network/v2/concepts/technical-reference/oapp-reference | Upstream spec |
| P17 | ether.fi governance framing: "Admin" is a multisig (strategy team + community) that acts fast in time-sensitive cases; a Timelock owned by the Admin gates non-time-sensitive ops; EtherFiTimelock extends OZ `TimelockController` | https://etherfi.gitbook.io/etherfi/ (governance description surfaced via GitBook) | Official docs |

Notes on decoded selectors (for reproducibility): `transferOwnership(address)` = `0xf2fde38b`;
`grantRole(bytes32,address)` = `0x2f2ff15d`; Endpoint `setConfig(address,address,(uint32,uint32,bytes)[])`
is the target of the `setConfig` batches. These were decoded from the batch calldata in the
cited `output/*.json` files; treat decoded method names as ABI candidates, not runtime-verified.

---

## 3. Unverified (explorer-only) — discovery leads only, NOT evidence

Block explorers are outside the Aegis trust boundary (`docs/THREAT_MODEL.md`). The following
appeared in explorer search results and is recorded as a lead to be independently verified,
never as an authority fact:

- Etherscan labels `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` as "ether.fi: Timelock",
  consistent with the repo's `L1_TIMELOCK` constant. (Source: etherscan.io address page,
  surfaced 2026-07-21.) Label attribution is user/explorer-supplied and unverified.
- Gnosis Safe signer sets and thresholds for the controller Safes and the timelock-gnosis
  Safe are, in principle, readable from a Safe UI / explorer, but were **not** retrieved and
  would be explorer/RPC-derived — outside the trust boundary. Not included as facts (see §4).

Any promotion of these leads into an Aegis manifest requires the block-hash-bound observation
path and the `docs/SOURCE_REGISTER.md` promotion checklist.

---

## 4. Unknown — could not be established from public non-explorer sources

1. **Gnosis Safe signers and thresholds.** The signer addresses and the M-of-N threshold for
   L1_CONTRACT_CONTROLLER `0x2aCA71...`, OP L2_CONTRACT_CONTROLLER_SAFE `0x764682...`, and
   L1_TIMELOCK_GNOSIS `0xcdd57D...` are **not** published in the repo, the bridge-hardening
   post, or the GitBook. The blog only says control rests with "ether.fi multisigs"; the
   GitBook only says the Admin is "a multisig of strategy team + community." Signer/threshold
   facts would require on-chain / Safe reads (outside trust boundary).
2. **L1 proxy-admin owners.** No `output/*.json` batch in the repo transfers the L1 OFT
   Adapter proxy admin (`0xa9E9bBf0...`) or the L1 sync-pool proxy admin (`0xDBf6bE12...`) to
   a timelock (there is no `ethereum-TransferProxyAdminOwnerToTimelock.json`; that pattern
   exists only for L2s). The L1_TIMELOCK is the strong candidate owner given it governs L1
   sync-pool ops, but the ownership edge itself is not established from the repo.
3. **L1 timelock configured `minDelay`.** No repo deploy script fixes the L1 timelock's
   minimum delay. The only data point is a single `schedule` call carrying a 16200 s (~4.5 h)
   delay parameter in `op_L1_TimelockSchedule.json`, which bounds but does not equal the
   configured `minDelay`. (The 3-day figure is documented only for the L2 timelock deployer.)
4. **Whether L1_CONTRACT_CONTROLLER and L1_TIMELOCK_GNOSIS are the same signer set.** They are
   distinct addresses used for distinct purposes (direct config vs. timelock proposer);
   whether they share signers is not public.
5. **Live delegate.** The controller Safes are the *intended* LayerZero delegates (§1c
   derivation), but the on-chain `delegates(oapp)` value was not read and is not asserted.
6. **Live owner of the OP OFT and L1 OFT adapter.** Inferred to be the controller Safes from
   the authored batches; no explicit ownership-record file confirms the current `owner()`.
7. **Guardian/pauser wiring at the deployed contracts.** `PAUSER_EOA 0x9AF1...` is a declared
   pauser and the pinned commit adds `IRoleRegistry` guardian pause to the L1 sync pool, but
   the RoleRegistry address and the exact guardian membership are not in `L2Constants.sol`,
   and the deployed OP OFT predates the numeric-role/RoleRegistry refactor (see caveat below).
8. **Emergency-council / revocation beyond the above.** No additional guardian, veto, or
   revocation authority (e.g. a separate security council with pause-and-freeze powers over
   the route) is documented in the reviewed sources.

---

## 5. Caveats that affect every claim above

- **Declared, not observed.** Everything here is repo-declared or documented intent. Per
  `docs/SOURCE_REGISTER.md`, a pinned repo cannot establish that a declared address/commit is
  the current canonical production state; that requires block-hash-bound reads with proxy/impl
  resolution and runtime-bytecode-to-ABI binding — none of which were performed.
- **Repo-vs-deployment role-model epoch mismatch.** `op_L2_GrantMinter.json` grants an
  OpenZeppelin-`AccessControl`-style `MINTER_ROLE` (keccak `0x9f2df0...`) on the deployed OP
  OFT (impl `0x70d7E0C9...`). The current `master` `EtherfiOFTUpgradeable.sol` instead uses
  numeric role ids (`MINTER_ROLE=1`, etc.) via `setRole`/`IRoleRegistry`. The live OP role
  model therefore likely differs from `master`; do not assume the master ABI decodes the
  deployed contract's roles.
- **OP native-minting discrepancy.** The README L2 table lists OP with an L2_OFT only (no
  sync pool), but `L2Constants.sol` defines an OP `L2_SYNC_POOL 0xC9475e18...` and
  `op_L2_GrantMinter.json` grants it `MINTER_ROLE`. Treat OP as having a sync-pool minter per
  the constants/batches; the README table is stale on this point.
- **DVN veto is authority too.** Under the 4-of-4 policy, each of the four DVNs per direction
  is effectively a single point that can block message verification by withholding
  attestation. This is a liveness/authority surface distinct from the ether.fi Safes.
- **Forbidden-inference discipline.** Per `docs/THREAT_MODEL.md`: a published 4-of-4 DVN
  description is not live configuration until decoded at an identified block; a deployed OFT
  endpoint is not proof the route is active or symmetric; authorization is not proof of safe
  intent. This map documents *who is authorized*, not that any action is safe or that the
  route is live.

## Integrator adjudication note (2026-07-22)

**Correction:** this document's reading of `output/op_L1_TimelockSchedule.json` as carrying a
16,200s schedule delay is **wrong by hex truncation**: the delay slot in ALL FOUR schedule
calls is `0x3f480` = **259,200s (72h)**, not `0x3f48` (16,200s). Independently derived twice:
WR1's eth_abi decode (roadmap/research/WR1/expected-route-policy.md, conflict section) and
the integrator's byte-slot decode of the raw file at the pinned commit
(sha256 5c45a8f432a3ddda0263a4db4c423470..., retrieved 2026-07-22). Two-of-three agreement
with reproduction steps supersedes the single truncated reading. Downstream inferences built
on 16,200s (including any "minDelay was later raised" reasoning) must be re-derived.
