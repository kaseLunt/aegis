<!-- G-01 build-derivation dossier — route-cartographer standing lane, 2026-07-26.
Persisted verbatim by the orchestrator from the lane's final report (agent output, same
session). Research input only; NOTHING in this file is a manifest-grade
expectedRuntimeCodeHash. Companion finding: the blueprint's G-01 ether.fi clause requires a
deploy-vintage amendment (see §7) — blueprint patch pending from the originating persona.
D-006: this lane sourced expected-side inputs only; no chain read of any target was made. -->

# G-01 BUILD-DERIVATION DOSSIER — ROUTE-ETH-OP-v1 identity targets

Route Cartographer standing lane G-01 · 2026-07-26 · evidence closes over: pinned local clones + npm artifacts in scratchpad (paths in §0.3) · **D-006 statement:** no RPC call of any kind was made in this session; no `eth_getCode`, no tx reads, no Etherscan queries. Every value here is a repo/artifact read (OBSERVED), an external registry claim (SOURCED with URL), or flagged INFERRED. No build was executed (toolchain absent, §0.2) — **no value in this dossier is a manifest-grade `expectedRuntimeCodeHash`.** The two sha256 values printed in §5 are artifact-template checkpoints, explicitly NOT runtime hashes, and must never be placed in the `expectedRuntimeCodeHash` field.

## 0.1 Summary table

| # | Target | Chain | Source pin status | Toolchain declared | Immutables | Feasibility |
|---|---|---|---|---|---|---|
| T1 | L1 OFT Adapter impl `0xA82cc578…F946` (behind proxy `0xcd2eb13D…CA63`) | ETH (1) | Source file byte-identical at pinned `e30c859c` and deploy-vintage `a71ea7e`; **deploy tree INFERRED** = `a71ea7e^` era; deps pinned by era yarn.lock | solc 0.8.20, optimizer 200, **evm paris** (in-repo claim), ipfs metadata (pre-`bytecode_hash='none'`) | 3: `endpoint`, `innerToken`, `decimalConversionRate` | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T2 | OP OFT impl `0x70d7E0C9…8aA9` (behind proxy `0x5A7fACB9…CBFF`) | OP (10) | **Pinned-tree source PROVEN ≠ deploy-vintage source** (27-line diff); deploy tree INFERRED = `a71ea7e` era | solc 0.8.20, optimizer 200, **evm shanghai**, ipfs metadata | 2: `endpoint`, `decimalConversionRate` | **DERIVABLE-WITH-CAVEATS** (unexecuted; pinned-commit-only derivation is structurally wrong for this target) |
| T3 | L1 SendUln302 `0xbB2Ea70C…dCe1` | ETH (1) | Full vendor build artifact w/ embedded literal sources (npm `lz-evm-sdk-v2@2.3.44`), corroborated by `@3.1.7` + fork-tree byte-match | solc 0.8.22+commit.4fc1097e, optimizer 20000, paris, ipfs+literalContent | 3: `endpoint`, `localEid`, `treasuryGasLimit` | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T4 | L1 ReceiveUln302 `0xc02Ab410…24C2` | ETH (1) | same as T3 | same as T3 | 2: `endpoint`, `localEid` | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T5 | OP SendUln302 `0x1322871e…6e95` | OP (10) | same as T3 | same as T3 | 3 declared; ~~localEid=30111 ⇒ differs from T3 bytes~~ *[corrected at execution — F1 in g01-derivation-execution.md: `localEid` is declared but unreferenced in SendUln302's runtime code, so T5's expected bytes EQUAL T3's; the per-chain difference holds only for ReceiveUln302. Orchestrator-applied cross-reference to the same persona's execution finding.]* | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T6 | OP ReceiveUln302 `0x3c4962Ff…2063` | OP (10) | same as T3 | same as T3 | 2 | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T7 | EndpointV2 `0x1a440760…728c` (chain-1 target) | ETH (1) | same artifact family; constructor args `(30101, owner)` | same as T3 | 2: `eid`, `blockedLibrary` | **DERIVABLE-WITH-CAVEATS** (unexecuted) |
| T8 | EndpointV2 `0x1a440760…728c` (chain-10 target) | OP (10) | same; constructor args `(30111, owner)` | same as T3 | 2 (eid=30111 ⇒ distinct code hash from T7, structurally confirmed) | **DERIVABLE-WITH-CAVEATS** (unexecuted) |

No target is BLOCKED; no target is DERIVABLE-AS-SPECIFIED, because (a) no toolchain exists on this machine to execute any build, and (b) for T1/T2 the task's literal instruction — "compile the pinned source @ `e30c859c`" — is provably the wrong tree for T2 and probably the wrong toolchain for T1 (§2, §3). The G-01 recipe in the blueprint needs the amendment in §7.

## 0.2 Toolchain probe (OBSERVED, this machine)

`forge` — **not found**. `solc` — **not found**. `node` v22.20.0, `npm` 10.9.3, `git` 2.52.0.windows.1 present. Python 3.13 present but `eth-hash` has no keccak backend installed. Per execution policy no toolchain was installed; every build command below is **UNEXECUTED** and labeled so.

## 0.3 Acquisition log (all local, reviewer-reproducible)

| Artifact | Location (scratchpad) | Pin |
|---|---|---|
| `etherfi-protocol/weETH-cross-chain` full clone | `C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\weeth-cross-chain` | checked out `e30c859c08a0fb44b4732e44b040f144094638ed`; `git rev-parse HEAD` confirmed (OBSERVED). Note: merge subject is "Merge pull request #77 from etherfi-protocol/**feat/pause-l1-sync-pool**" — WR1's header calls PR #77 "26Q2 Security Upgrade"; SHA and author date (2026-07-15T11:53:52-05:00) match WR1 exactly, the PR-title wording does not appear in the merge subject. Minor WR1 provenance nit, not a conflict. |
| `JorgeAtPaladin/LayerZero-v2` (ether.fi's vendored upgradeable-OApp source) | `…\scratchpad\lz-fork` | shallow checkout `21ad027cf323c323619566d2c9d1f2fa404f021f` = exactly the commit ether.fi's yarn.lock resolves (OBSERVED both sides) |
| `@layerzerolabs/lz-evm-sdk-v2@3.1.7` tarball | `…\scratchpad\lz-sdk\lz-evm-sdk-v2-3.1.7.tgz` | sha256 `4b70d97a0f8cc8f193523f2b01290f24dd875b918a64f1ab12e1a1c4e3847de2`; SOURCED `https://registry.npmjs.org/@layerzerolabs/lz-evm-sdk-v2/-/lz-evm-sdk-v2-3.1.7.tgz`, published 2026-07-23 (registry `time` field) |
| `@layerzerolabs/lz-evm-sdk-v2@2.3.44` tarball | `…\scratchpad\lz-sdk\v2344\sdk.tgz` | sha256 `33bce9ec073fc892f3dc801ff3fcb490bdd7d5acbdf9f12f442436e24bfa40bc`; SOURCED same registry, published 2024-09-25T08:41:43Z |

## 0.4 Engine convention this dossier derives toward (OBSERVED, aegis repo)

`lib/aegis/identity/resolve.ts:129-130` — identity = `sha256:` over the **runtime code bytes** (never keccak, never the hex string). Lines 196–203 (`deriveEip1967`): for proxied targets the engine hashes the **terminal implementation** code only — so for T1/T2 the derivation target is the implementation's runtime bytecode; the proxy's own bytecode is walked but never hashed. All eight expected hashes are therefore hashes of post-constructor, immutable-patched **runtime** bytecode.

---

# Part I — ether.fi targets (weETH-cross-chain)

## 1. Shared build-input facts

**Pinned-tree toolchain (OBSERVED, verbatim).** `…\scratchpad\weeth-cross-chain\foundry.toml` @ `e30c859c`:

```
1  [profile.default]
2  src = "contracts"
3  evm_version = "shanghai"
…
9  optimizer = true
10 optimizer_runs = 200
11 solc_version = "0.8.20"
12
13 # remove the hash of the metadata for more deterministic code
14 bytecode_hash = 'none'
```

No `via_ir`, no `cbor_metadata` key (defaults apply). No hardhat config exists in the repo (OBSERVED: `ls hardhat.config.*` → none; foundry-only, `package.json:23` build = `yarn install && forge install && forge build`).

**Dependency pins (OBSERVED, pinned-tree `package.json` + `yarn.lock`).** `package.json:9-20`: `@layerzerolabs/lz-evm-{messagelib,oapp,protocol}-v2` as **caret ranges**; `layerzero-v2` = `github:JorgeAtPaladin/LayerZero-v2#21ad027cf323c323619566d2c9d1f2fa404f021f` (a personal fork, commit-pinned — this fork supplies the entire upgradeable OApp/OFT base via `remappings.txt:6`: `@layerzerolabs/lz-evm-oapp-v2/contracts-upgradeable/=node_modules/layerzero-v2/oapp/contracts/`); `solady` = `github:Vectorized/solady` **unpinned range**, resolved by yarn.lock to `208e4f31cfae26e4983eb95c3488a14fdc497ad7` (v0.1.26). yarn.lock resolves the three LZ packages to **2.3.44**, OZ contracts and contracts-upgradeable both to **5.0.2**.

**Reproducibility hazard H-1 (OBSERVED):** `package.json:17-20` `resolutions` pins `@openzeppelin/contracts` to **5.0.1**, but the committed yarn.lock entry `"@openzeppelin/contracts@^5.0.1"` resolves **5.0.2**. A fresh `yarn install` honoring resolutions may install 5.0.1 and silently change bytecode. The recipe must use `yarn install --frozen-lockfile`, then **verify the version that actually landed** in `node_modules/@openzeppelin/contracts/package.json` and record it in the derivation record.

**Deploy-vintage divergence (OBSERVED, git history of the pinned clone).** Both declared impl addresses first enter the repo in commit `a71ea7e` (2024-10-20, "deploy and test new implementations") — `git log --all --reverse -S "A82cc578…"` and `-S "70d7E0C9…"` both list `a71ea7e` first. At `a71ea7e`:
- `foundry.toml` had **no `bytecode_hash` key** — the setting first appears in commit `e5c1ef1` (2024-12-12, "Update foundry.toml", diff shows `+bytecode_hash = 'none'`). CANON (Foundry config reference / Etherscan-verification culture): absent `bytecode_hash`, Foundry defaults to solc's default `ipfs` — **the deployed impls embed the full ipfs metadata hash in their runtime bytecode**, making the hash sensitive to every source byte including dependency files, while the pinned tree's config would strip it. A pinned-tree-config build can never byte-match the live impls even if all sources matched.
- **`a71ea7e` itself flips `evm_version` from `paris` to `shanghai`** (diff OBSERVED) while recording the new impl addresses.
- era yarn.lock (OBSERVED via `git show a71ea7e:yarn.lock`): LZ packages **2.1.27** (not 2.3.44), OZ 5.0.2/5.0.2, fork = **same commit `21ad027`** (via branch ref `#lz-upgrade`). No solady.
- `.gitmodules` @ `a71ea7e`: only `lib/forge-std`.

**In-repo deploy-toolchain testimony (OBSERVED).** `scripts/archive/OFTSecurityUpgrade/verifyDeploymentBytecode.s.sol` — the repo's own bytecode-reproduction harness — encodes per-chain EVM versions: `"op"` → `"shanghai"` (lines 74-84) and, line 50: `// OFTAdapter was deployed with paris hence we verify it as well on the paris run`. Two independent in-repo signals (this comment + the pre-flip `paris` in `a71ea7e^`'s foundry.toml) agree the **L1 adapter impl was built with evm `paris`**; the OP OFT impl with **`shanghai`**. No executed result of this harness is recorded in-tree — reproduction success is asserted nowhere (SOURCED-absence).

## 2. T1 — L1 OFT Adapter implementation `0xA82cc578927058af14fD84d96a817Dc85Ac4F946`

**VERDICT: DERIVABLE-WITH-CAVEATS (UNEXECUTED).** Caveats: deploy-commit inference; evm `paris` per in-repo testimony (not per pinned foundry.toml); ipfs metadata embedded ⇒ full-source-byte sensitivity incl. LZ deps @ 2.1.27; H-1 lockfile hazard; immutable patching required; no toolchain on this machine.

1. **Source location.** Repo `etherfi-protocol/weETH-cross-chain`, contract `contracts/EtherFiOFTAdapterUpgradeable.sol` (contract name `EtherfiOFTAdapterUpgradeable`). OBSERVED: `git diff a71ea7e e30c859c -- contracts/EtherFiOFTAdapterUpgradeable.sol` is **empty** — the first-party source is byte-identical at the pinned commit and at deploy vintage. Dependencies are NOT identical across the two trees (LZ 2.1.27 vs 2.3.44), so the derivation tree must be the deploy-vintage one: **candidate `a71ea7e^` (adapter/paris era)** — INFERRED from address-introduction commit + the paris testimony; the exact deploying checkout is not provable from the repo alone (GAP G-01.B). Deployment call shape confirmed in-tree: `scripts/adapter-migration/01_DeployUpgradeableAdapter.s.sol:34` `new EtherfiOFTAdapterUpgradeable(L1_WEETH, L1_ENDPOINT)` and the archived `deployConfigureOFTAdapter.s.sol:26` (same constructor args, commented post-deploy).
2. **Build recipe (declared by the deploy-vintage tree, OBSERVED).** foundry.toml @ `a71ea7e^`: solc `0.8.20`, `optimizer = true`, `optimizer_runs = 200`, `evm_version = "paris"` (pre-flip), no `bytecode_hash` (⇒ ipfs), no viaIR. Deps: era yarn.lock (LZ 2.1.27, OZ 5.0.2, fork `21ad027`); remappings @ `a71ea7e` OBSERVED verbatim (6 lines, upgradeable-OApp → fork path).
3. **Immutables (OBSERVED from fork sources @ `21ad027` — same commit in both eras' lockfiles).** Three, all in the LayerZero base chain; the ether.fi contract itself declares none:
   - `endpoint` — `oapp/contracts/oapp/OAppCoreUpgradeable.sol:28`, set constructor line 34-36 from `_lzEndpoint` = `L1_ENDPOINT` = `0x1a44076050125825900e736c501f859c50fE728c` (SOURCED WR1 §2.1, 4-way corroborated).
   - `innerToken` — `oapp/contracts/oft/OFTAdapterUpgradeable.sol:23`, set from `_token` = `L1_WEETH` = `0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee` (SOURCED WR1 §2.2).
   - `decimalConversionRate` — `oapp/contracts/oft/OFTCoreUpgradeable.sol:50,71-74` = `10 ** (_localDecimals − sharedDecimals())`; `sharedDecimals()` returns **6** (OBSERVED, line 105-107); `_localDecimals` is read **at deploy time** via `IERC20Metadata(_token).decimals()` (`OFTAdapterUpgradeable.sol:30-35`). Expected value 10^12 assuming weETH `decimals()==18` — that 18 needs its own SOURCED anchor (GAP G-01.C, micro): reviewer verifies `WeETH` in `etherfi-protocol/smart-contracts` inherits the OZ 18-decimals default. A wrong assumption fails closed (32-byte mismatch ⇒ hash mismatch).
   The deploy-time external call also means a naive `forge create` on empty local state reverts — the recipe patches compiler output instead (below), which is why `immutableReferences` is load-bearing.
4. **Metadata hazard.** YES — deploy-vintage default `ipfs`: the runtime bytecode ends with a CBOR blob containing the ipfs hash of the full metadata JSON (compiler version, settings, **keccaks of every source file including `node_modules` deps**). It is inside the deployed runtime code and inside the expected hash. Nothing neutralizes it; it must be **reproduced**, which is exactly why the era lockfile, remappings, and forge-project-relative source naming must all be exact. (The pinned tree's `bytecode_hash='none'` is irrelevant to this target's live bytecode — it postdates deployment by ~7 weeks.)
5. **Reproduction commands (UNEXECUTED — forge absent).**
```
git clone https://github.com/etherfi-protocol/weETH-cross-chain && cd weETH-cross-chain
git checkout a71ea7e^                       # record exact SHA in derivation record
git submodule update --init                 # lib/forge-std
yarn install --frozen-lockfile              # yarn 1.x; then RECORD node_modules/@openzeppelin/contracts/package.json version (H-1)
forge build                                 # foundry.toml already declares paris/0.8.20/200; record forge --version
# out/EtherFiOFTAdapterUpgradeable.sol/EtherfiOFTAdapterUpgradeable.json:
#   .deployedBytecode.object  (immutables zeroed)  + .deployedBytecode.immutableReferences
# patch, at each immutableReferences offset:
#   endpoint              -> 0x1a44076050125825900e736c501f859c50fe728c (left-padded 32B)
#   innerToken            -> 0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee
#   decimalConversionRate -> 0xe8d4a51000... (10^12, 32B big-endian)   # after G-01.C anchor
# sha256 over the patched BYTES -> "sha256:<hex>" candidate for T1 expectedRuntimeCodeHash
```

## 3. T2 — OP OFT implementation `0x70d7E0C93D8443325550Ba3F71576F5f346b8aA9`

**VERDICT: DERIVABLE-WITH-CAVEATS (UNEXECUTED) — and the pinned-commit-only derivation is structurally wrong for this target.** OBSERVED: `git diff --stat a71ea7e e30c859c -- contracts/EtherfiOFTUpgradeable.sol` = **27 lines changed** (the 2025-09-25 `f6246c7` "improve the OFT role system" rework: OZ `AccessControlUpgradeable` bytes32 roles → solady `EnumerableRoles` numeric roles `MINTER_ROLE=1/PAUSER_ROLE=2/UNPAUSER_ROLE=3`, OBSERVED in both file versions). A build of the pinned `e30c859c` source **cannot** hash-match an impl deployed in 2024; presenting such a hash as the expectation for the declared impl `0x70d7E0C9…` would manufacture a guaranteed false alarm. Honest expected-state for this target derives from the deploy-vintage tree.

1. **Source location.** Same repo, `contracts/EtherfiOFTUpgradeable.sol`, **candidate tree `a71ea7e`** (shanghai era; address recorded in that commit for multiple L2 chains' `L2_OFT_NEW_IMPL` fields simultaneously — same impl address across chains, consistent with a repeated-nonce deployer pattern; INFERRED, not proven). Deployment call shape: `new EtherfiOFTUpgradeable(currentDeploymentChain.L2_ENDPOINT)` (archived `deployConfigureOFT.s.sol:38`, `deployOFTzksync.s.sol:25`, and `verifyDeploymentBytecode.s.sol:31` — OBSERVED). OP `L2_ENDPOINT` = `0x1a4407…728c` (SOURCED WR1 §2.1).
2. **Build recipe.** foundry.toml @ `a71ea7e`: solc `0.8.20`, optimizer 200, **`evm_version = "shanghai"`** (post-flip; corroborated by the verify-harness mapping `"op" → shanghai`), no `bytecode_hash` ⇒ ipfs metadata. Deps: era yarn.lock (LZ **2.1.27**, OZ 5.0.2, fork `21ad027`; no solady at this vintage).
3. **Immutables.** Two: `endpoint` (`OAppCoreUpgradeable.sol:28`) ← `0x1a4407…728c`; `decimalConversionRate` (`OFTCoreUpgradeable.sol:50`) ← `10^(decimals()−6)`; `OFTUpgradeable.sol:17` passes its own `decimals()`, the era contract does not override it (OBSERVED: no `decimals` in either version of `EtherfiOFTUpgradeable.sol`) ⇒ OZ 5.0.2 `ERC20Upgradeable` default **18** (CANON, OpenZeppelin; reviewer confirms in the era `node_modules`) ⇒ 10^12. No token external call in this constructor — local build is simpler than T1's, but patch-based derivation is still the recommended uniform path.
4. **Metadata hazard.** Identical to T1: ipfs CBOR embedded in runtime, reproduce-don't-neutralize.
5. **Reproduction (UNEXECUTED).** As T1 but `git checkout a71ea7e`, artifact `out/EtherfiOFTUpgradeable.sol/EtherfiOFTUpgradeable.json`, patch `endpoint` + `decimalConversionRate` (10^12), sha256 over patched bytes.
6. **Side-finding for G-10 (INFERRED, date-grounded).** Deploy vintage (2024-10) predates the role-model rework (2025-09) ⇒ the deployed impl's role model is the **OZ AccessControl bytes32 epoch**, not the pinned tree's numeric-role epoch. This corroborates WR2 §5's warning and pre-answers G-10's "which ABI epoch" — final binding still waits on resolved identity per the blueprint.

---

# Part II — LayerZero vendor targets

## 4. Shared provenance and correspondence chain

**Primary pinned build artifact (SOURCED + OBSERVED content).** `@layerzerolabs/lz-evm-sdk-v2@2.3.44` (LayerZero-Labs' own deployment-registry npm package, published 2024-09-25, tarball sha256 in §0.3) ships full hardhat-deploy artifacts: `deployments/{ethereum-mainnet,optimism-mainnet}/{EndpointV2,SendUln302,ReceiveUln302}.json`, each with `address`, `args`, `transactionHash`, `receipt`, `bytecode`, `deployedBytecode`, `solcInputHash`, and a full solc `metadata` JSON with **`useLiteralContent: true`** — i.e. the artifact embeds the complete literal source text of every compilation unit. The artifact is therefore a self-contained pinned source release; no external repo is required to recompile.

**Correspondence to the deployed contracts — how established, and its limit.**
- All six artifact addresses equal WR1's independently 4-way-corroborated addresses exactly (OBSERVED vs SOURCED WR1 §2.1/§2.3) — including EndpointV2 `0x1a44076050125825900e736c501f859c50fE728c` on both chains.
- Two independent package versions agree: `@3.1.7` (published 2026-07-23, trimmed artifacts) carries the **same deployment transaction hashes** as `@2.3.44` for all six targets (OBSERVED both tarballs). Vendor registry is internally consistent across a ~22-month span.
- Constructor args in the artifacts cross-check against ether.fi-independent facts: EndpointV2 args `(30101, …)` on Ethereum and `(30111, …)` on Optimism (the EIDs, SOURCED WR1 §2.1); Uln constructor arg endpoint = `0x1a4407…728c` (same).
- First-party sources embedded in the artifacts **byte-match ether.fi's independently commit-pinned vendored fork** (`JorgeAtPaladin/LayerZero-v2@21ad027`, resolved by ether.fi's own yarn.lock): every embedded file that exists in the fork tree matched with **zero diffs** (EndpointV2 19/19, SendUln302 12/12, ReceiveUln302 6/6 first-party files; OBSERVED, LF-normalized). The only unmatched paths are third-party dependency imports (`@openzeppelin/*`, `@layerzerolabs/lz-evm-protocol-v2/*` as the messagelib's dep, `solidity-bytes-utils/*`) — whose literal content the artifact also embeds.
- **Limit (GAP G-01.D):** the artifact-to-chain link ("this build is what was deployed at these addresses") is a **vendor claim**. It is corroborated but not independently proven within this dossier; the engine's expected-vs-observed comparison is precisely the instrument that will prove or refute it. An upstream `LayerZero-Labs/LayerZero-v2` git tag/commit pin was NOT established (the npm artifact makes it unnecessary for reproduction; closing it is optional hardening — recipe: match the metadata source keccaks against upstream tags).

**Vendor deployment provenance recorded by the artifacts (SOURCED, vendor claims — for the manifest's provenance block, not for verification):** deployer `0x9F403140Bc0574D7d36eA472b82DAa1Bbd4eF327` for all six; blocks: ETH EndpointV2 19093715, SendUln302 19093729, ReceiveUln302 19093731; OP EndpointV2 115353583, SendUln302 115353620, ReceiveUln302 115353623. Tx hashes: EndpointV2 ETH `0x1011937701c617575f33ff93dfe22b15868897cd5fd9dd78da5a3cd5c19f78fe`, OP `0xe5794078dc9880c731ea6cd45c805e0a979887087535e36be6776aee51ec792f`; SendUln302 ETH `0x03e4f47cc92c91a4484df0ac9bd56af073b980d8365f503faf808df22f4c475e`, OP `0x13fefd23d15c3a98abfb2b81e043fafea729b53ba2a0fbccee08c1d65ff19bfe`; ReceiveUln302 ETH `0x4721041cf849dc19a6bfb0c7a0451967b3f01652112c85a7fa158d82d0903a0b`, OP `0x1bef6f515148d8ed81eaaaa335abeff44753a5ccd42ee2b7438badc1413d23d2`. (Artifact nuance: the EndpointV2 receipts carry no `contractAddress` field; the Uln receipts do.) Per the blueprint's §4 preamble, decoding these historical deploy transactions is an admissible expected-side path for constructor-arg corroboration — assigned to the evidence lane, not performed here.

**Build recipe declared by the artifacts (OBSERVED, identical across all six):** compiler `0.8.22+commit.4fc1097e`; `optimizer {enabled:true, runs:20000}`; `evmVersion: paris`; `viaIR` absent (false); `metadata {bytecodeHash:"ipfs", useLiteralContent:true}`; compilationTargets `contracts/EndpointV2.sol:EndpointV2`, `contracts/uln/uln302/SendUln302.sol:SendUln302`, `contracts/uln/uln302/ReceiveUln302.sol:ReceiveUln302`; `solcInputHash` `b3a9b3fa9db8c1c58102b0c1c149f74e` (EndpointV2, both chains) / `ade53835615c312c80a1fb3fe043db8d` (both Ulns, both chains).

**Metadata hazard:** YES for all six — `bytecodeHash: ipfs`; artifact `deployedBytecode` visibly ends in the ipfs CBOR tail (`…64736f6c63430008160033` = solc 0.8.22). The hash is part of the runtime bytes and thus of the expected hash. Because `useLiteralContent` embeds sources in the metadata itself, reproducing the ipfs tail requires byte-exact literal sources — which the artifact supplies. Reproduce, don't neutralize.

**Template checkpoints (DERIVED locally from the SOURCED artifact — NOT runtime hashes; immutables are zeroed in compiler output; never place these in `expectedRuntimeCodeHash`):**
- sha256(EndpointV2 artifact `deployedBytecode`) = `47493a3f9b543edc10aa72f2b910af6e7badd3baf8e37cfd3d920e8813a2a661` (identical in both chains' artifacts — one build, 24005 bytes)
- sha256(SendUln302 template) = `8f51340585e7269bc048bca7e015eb795de0455306adab45d3c035375891b6be` (22995 B); sha256(ReceiveUln302 template) = `9ac3d18a1c3908a0b39323f639f1d279960728187ce0deeb8b7d57d4f5606d53` (11010 B)
These serve one purpose: a reviewer's recompilation must reproduce them **before** immutable patching; a recompile that fails the checkpoint has the wrong toolchain.

## 5. T3–T6 — SendUln302 / ReceiveUln302 (both chains)

**VERDICT (each): DERIVABLE-WITH-CAVEATS (UNEXECUTED).** Caveats: vendor-claimed artifact-to-chain link (G-01.D); solc `0.8.22+commit.4fc1097e` required; immutable patching required; per-chain `localEid` makes L1 and OP instances **different runtime bytes from identical constructor args**.

1. **Source location.** The `@2.3.44` artifact metadata (literal content) is the pinned source; corroborated byte-identical to `JorgeAtPaladin/LayerZero-v2@21ad027` `messagelib/contracts/uln/uln302/{SendUln302,ReceiveUln302}.sol` and first-party deps (OBSERVED, §4).
2. **Build recipe.** §4 block, verbatim from artifact metadata.
3. **Immutables (OBSERVED in embedded sources).**
   - `endpoint` (`contracts/MessageLibBase.sol:7`) ← constructor arg = `0x1a4407…728c` (SOURCED WR1 §2.1, cross-checked artifact `args`).
   - `localEid` (`MessageLibBase.sol:8`) ← **deploy-time call** `ILayerZeroEndpointV2(_endpoint).eid()` (`SendLibBaseE2.sol:26-30`, `ReceiveLibBaseE2.sol:19`) ⇒ expected 30101 (T3/T4) / 30111 (T5/T6) — SOURCED WR1 §2.1, independent of the vendor.
   - SendUln302 only: `treasuryGasLimit` (`SendLibBase.sol:35,57-65`) ← arg `200000` (SOURCED artifact `args`, both chains). `treasuryNativeFeeCap` (arg `450000000000000`) is **storage, not immutable** (OBSERVED — absent from the immutable inventory) ⇒ does not affect the code hash.
4. **Metadata hazard.** §4 — ipfs, in-runtime, reproduce.
5. **Reproduction (UNEXECUTED — solc absent).**
```
npm pack @layerzerolabs/lz-evm-sdk-v2@2.3.44        # verify sha256 33bce9ec…40bc
# for each of the four artifacts:
#  1. reconstruct solc standard-json input from artifact .metadata:
#     sources[path].content -> input.sources, settings {optimizer, evmVersion, remappings,
#     metadata:{useLiteralContent:true}} ; outputSelection: evm.deployedBytecode + immutableReferences
#  2. run solc 0.8.22+commit.4fc1097e --standard-json  (binary checksum-verified from
#     https://binaries.soliditylang.org)
#  3. CHECKPOINT: recompiled deployedBytecode == artifact deployedBytecode
#     (sha256 must equal the §4 template value)
#  4. patch immutableReferences:  endpoint=0x1a4407…728c ; localEid=30101|30111 ;
#     (SendUln302) treasuryGasLimit=200000
#  5. sha256 over patched bytes -> "sha256:<hex>" candidate per chain-scoped target
```

## 6. T7–T8 — EndpointV2 (chain-1 and chain-10 targets)

**VERDICT (each): DERIVABLE-WITH-CAVEATS (UNEXECUTED).** Same caveat family as T3–T6 plus one extra derivation step for `blockedLibrary`.

1. **Source location.** `@2.3.44` artifact, compilationTarget `contracts/EndpointV2.sol` (protocol package); 19/19 first-party embedded sources byte-match the fork @ `21ad027` `protocol/contracts/` tree (OBSERVED).
2. **Build recipe.** §4 block; `solcInputHash b3a9b3fa…` identical on both chains — one build, two deployments.
3. **Immutables (OBSERVED in embedded sources).**
   - `eid` (`contracts/MessagingChannel.sol:14`, set at `:23-25`) ← constructor arg: **30101 (T7) / 30111 (T8)** (artifact `args`, cross-checked SOURCED WR1 §2.1). This 4-byte difference is the structural proof of the blueprint's two-chain-scoped-Endpoint-targets census: same address, necessarily different runtime hashes.
   - `blockedLibrary` (`contracts/MessageLibManager.sol:18`, constructor `:34-37`) ← `address(new BlockedMessageLib())` executed **inside the EndpointV2 constructor** ⇒ a CREATE by the EndpointV2 account at nonce 1 ⇒ expected value is offline-deterministic: `keccak256(rlp([0x1a44076050125825900e736c501f859c50fe728c, 1]))[12:]` — identical on both chains because the endpoint address is identical. SOURCED-D formula; the numeric value is deliberately **not** printed here (no keccak backend on this machine — §0.2; computing it is recipe step 4b, one line of any keccak-capable environment). Constructor arg 2 (`_owner` = `0x9F403140…F327`) sets storage only, not an immutable, and does not affect the code hash.
4. **Metadata hazard.** §4 — ipfs, in-runtime, reproduce.
5. **Reproduction (UNEXECUTED).** As §5 recipe with the EndpointV2 artifact; checkpoint sha256 `47493a3f…a661`; patch step: `eid` = 30101|30111, `blockedLibrary` = the computed CREATE address (4b: compute + record the formula inputs in the derivation record); sha256 over patched bytes, one value per chain-scoped target.

---

# 7. Ruling on the G-01 recipe text, gaps, and verdict

**Recipe amendment required (finding, for the blueprint's next revision).** G-01's ether.fi clause reads "compile the pinned source (`weETH-cross-chain @ e30c859c…638ed`)". For T2 this dossier **proves** (27-line source diff) and for T1 makes probable (evm-version flip + dependency drift + metadata-config change, all OBSERVED) that the pinned tree is the wrong build input for the *deployed* impls. The pinned commit remains the authority for *addresses and policy*; the build derivation must run on the **deploy-vintage trees within the same repo history** (`a71ea7e^` / `a71ea7e`, candidates), with the pinned commit citing them. This stays fully inside the blueprint's provenance rule — the vintage selection above was made from repo-history evidence only, never from a chain read.

**Anti-fitting rule (binding on whoever executes).** The candidate tree and all inputs must be committed to the derivation record **before** the engine ever compares expected to observed. If the engine then reports mismatch, that is a reviewable finding; re-deriving from a different commit is a *documented revision with rationale*, never a silent retry-until-match — an iterate-until-pass loop against observed bytecode is observation-seeded expected-state, the exact circular-verification class the gap ledger's preamble forbids.

**Named gaps.**
- **G-01.A (blocking, all 8):** no execution environment — foundry + solc 0.8.20 (ether.fi) and solc `0.8.22+commit.4fc1097e` (vendor) absent on this machine. Closes by running §2.5/§3.5/§5.5/§6.5 on a machine with the pinned toolchains; every other input is now pinned in this dossier.
- **G-01.B (T1/T2):** deploy-commit inference (`a71ea7e^`/`a71ea7e` are evidence-based candidates, not proven checkouts). Closes via owner/ether.fi deployment records, or is absorbed by the anti-fitting review path above.
- **G-01.C (T1/T2, micro):** SOURCED anchor for weETH `decimals()==18` (and era-OZ default for T2). Closes with one source lookup in `etherfi-protocol/smart-contracts` / era `node_modules`.
- **G-01.D (T3–T8):** artifact-to-chain link is vendor-claimed. Corroborated three ways (WR1 addresses, cross-version txHash agreement, fork byte-match); optional hardening: upstream LayerZero-Labs git pin via metadata source-keccak match; the engine's comparison is the final arbiter.
- **G-01.E (T1/T2):** H-1 resolutions-vs-lockfile discrepancy — the executed derivation must record the OZ version that actually landed.

**VERDICT: BLOCKED ON G-01.A (execution) for all eight expected hashes; per-target feasibility as tabled — 8× DERIVABLE-WITH-CAVEATS, 0× BLOCKED, 0× AS-SPECIFIED.** Until G-01.A closes, the only honest manifest state remains exactly what the round-3 blueprint says: identity `unknown`, ABI-dependent cells blocked, no fallback. Nothing in this dossier is a certifiable hash; per D-006 I will not implement the observed-side comparison nor certify any check against values sourced here.
