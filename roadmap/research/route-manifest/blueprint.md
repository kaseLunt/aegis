<!-- DRAFT - route-cartographer persona ruling, 2026-07-26. PRE-CODEX-REVIEW.
Provenance: fable persona agent (latent space: L2BEAT / OP Labs / LayerZero / Trail of
Bits / OpenZeppelin), first standing assignment; evidence base WR1/WR2 at pinned commit
e30c859c. Status: CODEX-REVIEWED 2026-07-26 (review-ms25esga) -- PROMOTABLE-WITH-CORRECTIONS; ALL CODEX CORRECTIONS APPLIED 2026-07-26 by the originating persona instances (diff patches), awaiting scoped confirmation pass. Two P1s: target census 6->8 (Endpoint x2 missing); G-01 recipe crosses the expected/observed boundary. See codex-review-wave1.md. D-006: this document sources
EXPECTED values only; its authors may not implement or certify observed-side checks. -->

# ROUTE-ETH-OP-v1 Directed-Route Manifest — BLUEPRINT

**Ruling authority read before this blueprint:** `docs/THREAT_MODEL.md` (claim strength), `docs/ENGINEERING_SPEC.md` §Bridge directed-route controls + §Bridge-first vertical slice (the ROUTE-ETH-OP-v1 matrix), `docs/SOURCE_REGISTER.md` (promotion checklist, route research blockers), `roadmap/research/WR1/expected-route-policy.md` (WR1), `roadmap/research/WR2/authority-map.md` (WR2), `lib/aegis/manifest/trust.ts` (the schema the trust engine actually enforces today), `lib/aegis/identity/resolve.ts` (code identity = **sha256 over `eth_getCode` runtime bytes**, never keccak `EXTCODEHASH`), `data/manifests/reference-code-identity.json` (current shape example).

**Evidence basis:** every ether.fi-specific value below traces to WR1/WR2, both pinned independently to `etherfi-protocol/weETH-cross-chain` @ `e30c859c08a0fb44b4732e44b040f144094638ed` (2026-07-15). Everything from that repo is **declared intent, not deployment evidence** — the manifest may carry it as expected policy, but no cell may report a live verdict until the observed-side lane decodes it at an identified block. Per D-006 I source expected values only; every "verification recipe" below is a specification for a lane I will not implement and whose results I will not certify.

**Role-boundary note for Codex:** one WR2 value was corrected by cross-lane adjudication (16,200s → 259,200s timelock schedule delay, WR2 integrator note 2026-07-22, corroborated by WR1 C1). I treat the corrected value as the admissible one and the incident as evidence the two-lane discipline works.

---

## 1. Section structure — entities enumerated, mapped to consuming matrix cells

The manifest is one document, eight sections. Directionality is explicit: "ETH→OP" means source = Ethereum (chain 1, EID 30101), destination = Optimism (chain 10, EID 30111); "OP→ETH" is the reverse. The two directions share one OApp pair but are separate evaluation subjects — every direction-scoped entry appears twice.

| # | Manifest section | Entities enumerated | ROUTE-ETH-OP-v1 cells consuming it |
|---|---|---|---|
| S1 | `route.header` | routeId, chain IDs (1, 10), EIDs (30101, 30111), lifecycle (`active`), pinned source commit, review record | All cells (lifecycle gates which predicates are mandatory); Peer/EID |
| S2 | `identity.targets` | Eight chain-scoped identity targets per the engine's `targets[]` shape: L1 OFT Adapter (eip1967), OP OFT (eip1967), L1 SendUln302, L1 ReceiveUln302, OP SendUln302, OP ReceiveUln302 (direct), Ethereum EndpointV2 (direct), OP EndpointV2 (direct) — the two Endpoint deployments are first-class target records, not prose annotations: same address on both chains, but two chain-scoped entries, each with its own `expectedRuntimeCodeHash` (ENGINEERING_SPEC requires participating endpoint identity explicitly; `lib/aegis/manifest/trust.ts` requires the field per target). Each entry carries `identityStrategy`, `expectedImplementation` where proxied, `expectedRuntimeCodeHash` | Identity (both directions); every other cell transitively — ABI selection is code-hash-gated (spec §Deployment code identity) |
| S3 | `directions[2].peer` | Expected `peers(dstEid)` value on each source OApp (bytes32) | Peer/EID |
| S4 | `directions[2].libraries` | Expected send library (source chain) and receive library (destination chain), plus the assertion "explicit, not inherited default" | Send library; Receive library |
| S5 | `directions[2].ulnConfig` | Per (oapp, lib, remote-eid): confirmations, requiredDVNCount, requiredDVNs[], optionalDVNCount, optionalDVNThreshold, optionalDVNs[]; executor sub-entry (or explicit not-pinned declaration) | Send verification; Receive verification |
| S6 | `directions[2].rateLimits` | Mode (pairwise linear-decay, inbound+outbound per `PairwiseRateLimiter`), per-EID limit (wei, decimal string) and window (seconds) for outbound-at-source and inbound-at-destination | Rate limit |
| S7 | `controlPlane` | Per chain: OApp owner, LayerZero delegate, proxy admin + its owner, timelock + expected minDelay, controller Safes, pauser/guardian entities, role assignments (OP `MINTER_ROLE` → L2 sync pool), expected pause state (`unpaused`) | Control plane; also supplies the change-latency metadata every other cell's freshness policy consumes |
| S8 | `tokenPairing` + `uncovered` | L1 weETH token bound by the adapter; OP OFT as the destination representation; explicit exclusions: the L1 Sync Pool ↔ OP native-minting pathway (distinct OApp, weaker 2-DVN policy — WR1 §2.9), the five ReducePathways EIDs, DVN operator offchain health, Safe signer custody | Coverage/limitations block of every report; prevents cell conflation |

Schema-fit ruling: the engine's current loader (`lib/aegis/manifest/trust.ts`) supports only S2 (`targets[]`) plus header/policy plumbing. S1, S3–S8 are new manifest surface. They inherit the existing canonicalization discipline: content hash excludes itself, JCS after domain normalization, set-like arrays need documented stable sort keys — DVN arrays sort ascending by address (which is also exactly how the repo's generator emits them, WR1 §2.4, so expected and observed sets compare canonically); `directions` is a 2-member set keyed by `(srcEid, dstEid)`. Addresses must be **lowercased** at authoring time — the loader's `ADDRESS_STRICT` rejects checksummed hex, and WR1/WR2 reproduce repo mixed-case verbatim.

---

## 2. Entry classes — shape, changing authority, change latency, verification recipe

The organizing thesis: **almost every value on this route is hot-mutable behind a Safe with zero enforced delay.** The only sourced timelock on the route proper is the OP implementation-upgrade path (3 days). That asymmetry is the manifest's most important fact — it dictates freshness policy, and it is what an adversary who quietly rotated a DVN set or delegate would be exploiting.

### E1. Chain / EID / Endpoint constants (S1, part of S2)
- **Shape:** integer chain IDs; EIDs as decimal strings; Endpoint address per chain.
- **Changing authority:** LayerZero Labs assigns EIDs; EndpointV2 is a deployed contract whose identity the manifest pins like any other. No ether.fi authority here.
- **Latency:** effectively static, but never asserted immutable — CANON (Trail of Bits): every address is a question until its runtime code is hashed.
- **Recipe:** `OApp.endpoint()` read on both OApps at the pinned boundary must equal the manifest Endpoint; `eth_getCode(endpoint)` → sha256 for identity. EID correctness is proven transitively by the peer and ULN reads being keyed by these EIDs.

### E2. Contract identity (S2) — consumed by the Identity row
- **Shape:** engine `targets[]` entries: `identityStrategy` (`eip1967` for the two OApps — both are declared proxies with named proxy admins; `direct` for ULN libs and Endpoint), `expectedImplementation`, `expectedRuntimeCodeHash` (`sha256:` over runtime bytes — the engine's convention, not keccak).
- **Changing authority:** proxy admin owner. OP: proxy admin `0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` owned by L2 timelock `0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6`, proposer/executor = OP controller Safe (SOURCED WR2 §1b, P2, P8). L1: proxy admin `0xa9E9bBf04F95688D7fd82036f83544630E463CAc`, owner **not established** (GAP G-06).
- **Latency:** OP upgrades ≥ 259,200s (declared minDelay, SOURCED WR2 P8 — declared in the deploy script, not read from chain). L1 upgrades: **unknown** — possibly instant if the proxy admin is Safe-owned. The manifest must not print a delay it cannot source.
- **Recipe:** `eth_getStorageAt(proxy, EIP-1967 impl slot)` at pinned block hash → implementation address; `eth_getCode(impl)` → sha256; compare both against manifest; two administratively independent providers; retain the full indirection path in evidence. An observed upgrade is drift-requiring-review, never auto-classified compromise (threat model).

### E3. Peers (S3) — Peer/EID row
- **Shape:** per direction, `bytes32` = 12 zero bytes + lowercase destination-OApp address.
- **Changing authority:** OApp owner (`setPeer` is owner-gated — CANON, LayerZero OApp reference, cited in WR1 §2.7). Intended owner = controller Safe on each chain (derived, WR2 §1c).
- **Latency:** **zero** — one Safe execution. A peer rewrite instantly redirects the route's trust to an arbitrary contract.
- **Recipe:** `peers(30111)` on the L1 adapter and `peers(30101)` on the OP OFT at a time-aligned two-chain boundary (spec: `time_aligned`, never atomic). Both must match; a one-sided match is the asymmetric-peer failure the spec's negative fixture 14 exists for.

### E4. Message libraries (S4) — Send library / Receive library rows
- **Shape:** per direction: send-lib address on source chain, receive-lib address on destination chain, plus boolean policy `mustBeExplicit: true`.
- **Changing authority:** the OApp's registered **delegate** at the Endpoint (`setSendLibrary`/`setReceiveLibrary` are delegate-gated — CANON, LayerZero). Intended delegate = controller Safes (derived — WR2 §1c; live value GAP G-08).
- **Latency:** zero — one Safe execution. Additionally, if the OApp ever falls back to defaults, **LayerZero Labs' default-library governance becomes the effective authority** — that is precisely the fallback the hardening closed, so "not inherited default" is a first-class predicate, not decoration.
- **Recipe:** Endpoint `getSendLibrary(oapp, dstEid)` and `getReceiveLibrary(oapp, srcEid)` at the pinned boundary; the MessageLibManager surface exposes an is-default signal on the receive path and a comparable default-check on the send path — exact selectors are bound by the observed lane only after Endpoint code identity resolves (spec: ABI selection is code-hash-gated). Both the address match and the not-default flag are required.

### E5. ULN / DVN security stack (S5) — Send verification / Receive verification rows
- **Shape:** per (oapp, lib, remote EID): `confirmations` (uint64 as decimal string), `requiredDVNCount`, `requiredDVNs[]` (address set, sorted ascending), `optionalDVNCount`, `optionalDVNThreshold`, `optionalDVNs[]` (empty). Optionally per-DVN display labels from LayerZero's metadata API — labels are annotation, never identity (anti-canon: green-checkmark-as-identity).
- **Changing authority:** the delegate, via `EndpointV2.setConfig`. Same Safes, same **zero latency**. Each of the four DVN contracts is additionally a liveness authority: under 4-of-4 any one DVN halts the route by withholding (SOURCED WR2 §5 caveat) — and each DVN's own operator can change its offchain signing infrastructure invisibly (outside trust boundary).
- **Latency:** zero for the config; unknowable for DVN-internal key rotation.
- **Recipe:** `getConfig(oapp, lib, remoteEid, configType=2)` at pinned boundary; ABI-decode the single dynamic `UlnConfig` tuple `(uint64,uint8,uint8,uint8,address[],address[])` — WR1 Appendix A documents the exact double-encoding trap (`InvalidPointer` on flat decode) the observed lane must not rediscover the hard way. Compare counts, threshold, confirmations, and DVN address sets after lowercase normalization. Four cells total: send-side and receive-side on each chain. Negative fixtures 15–16 (default fallback; DVN removed/threshold reduced) hang off this class.

### E6. Executor config (S5 sub-entry)
- **Shape:** either an expected executor address per direction, or an explicit `executorPinning: "not_pinned_expected_default"` declaration. Canonical LayerZero executor addresses are known (E7 table) but **no configType=1 pin was found in the reviewed batches** (SOURCED-absence WR1 §2.5, gap G1→G-05).
- **Claim cap (CANON, LayerZero security model):** under ULN, executor compromise degrades liveness/delivery, not message verification — the manifest may say that and no more.
- **Recipe:** `getConfig(oapp, sendLib, dstEid, configType=1)`; until the expectation is decided, the cell is `unknown` or owner-marked optional (`not_applicable` is legal only if the reviewed manifest marks it so — spec).

### E7. Rate limits (S6) — Rate limit row
- **Shape:** mode = pairwise linear-decay with symmetric inbound checks (ether.fi extension of LayerZero's stock outbound RateLimiter — SOURCED WR1 §2.6); per direction and side: `{ limitWei: decimal string, windowSeconds: decimal string }`, 18-decimal weETH units (script constants use `ether` literals).
- **Changing authority:** OApp owner (rate-limit setters were executed directly by the controller Safes in the batches — SOURCED WR1 §2.6). **Zero latency.**
- **Latency of the policy value itself:** two declared candidates exist in the same pinned tree — 3,000/4h (SecurityUpgrade) and 10,000/4h (increase-rate-limits) — with **no execution-order proof** (WR1 C2). The manifest cannot pin either without new evidence (G-02).
- **Recipe:** `outboundRateLimits(peerEid)` / `inboundRateLimits(peerEid)` mapping reads on both OApps at the pinned boundary; integer comparison of decimal strings. Active lifecycle + reviewed policy requires **positive** caps/windows (spec; negative fixture 17).

### E8. Control plane (S7) — Control plane row
- **Shape:** per chain: `owner` (address), `delegate` (address), `proxyAdmin` + `proxyAdminOwner`, `timelock` + `expectedMinDelaySeconds`, `pauserEntities[]`, `expectedPauseState: "unpaused"`, `roles[]` (holder, role id, role-model epoch tag), `safes[]` (address; signer set/threshold as facts-only sub-entries).
- **Changing authority and latency:** `transferOwnership` — owner, instant. `setDelegate` — owner, instant. Timelock minDelay — self-administered through its own delay (OP: 3 days). Safe signer rotation — internal to the Safe, instant, and **invisible to every route predicate** until Safe storage is read. Pause — role holders, instant (that is its purpose); an observed pause is not, by itself, an exploit (forbidden inference).
- **Recipe:** `owner()` on both OApps; `EndpointV2.delegates(oapp)`; `owner()` on both proxy admins; `getMinDelay()` on both timelocks; `paused()` on both OApps; Safe `getOwners()`/`getThreshold()` as **EvidenceFacts, never pass/fail** (population of signers is not a predicate Aegis can ground); OP `MINTER_ROLE` holder check only after G-10 resolves the deployed role-model ABI epoch. Governance-delay predicate per spec: `getMinDelay() == manifest.expectedDelay`, reported as drift on mismatch.

---

## 3. Value table — every ether.fi-specific entry, tagged

Tags: **SOURCED** (WR file/§), **SOURCED-D** (deterministic derivation from sourced values — stated, not fabricated), **GAP** (ledger ref). Addresses reproduced as in the WR sources; manifest authoring lowercases them.

**S1 — header**

| Entry | Value | Tag |
|---|---|---|
| Chains / EIDs | ETH 1 / 30101; OP 10 / 30111 | SOURCED WR1 §2.1 (four independent artifacts incl. LayerZero metadata API) |
| Endpoint (both chains) | `0x1a44076050125825900e736c501f859c50fE728c` | SOURCED WR1 §2.1 |
| Pinned commit | `e30c859c08a0fb44b4732e44b040f144094638ed` | SOURCED WR1 header + WR2 header, independently |
| Lifecycle | `active` | SOURCED-as-inference WR1 §2.8 (three affirmative signals; no status field exists) — **GAP G-11** for the reviewed sign-off the spec demands |
| Validity window anchor blocks | — | **GAP G-14** |

**S2 — identity targets**

| Entry | Value | Tag |
|---|---|---|
| L1 OFT Adapter (proxy) | `0xcd2eb13D6831d4602D80E5db9230A57596CDCA63` | SOURCED WR1 §2.2 |
| L1 adapter declared new impl | `0xA82cc578927058af14fD84d96a817Dc85Ac4F946` | SOURCED WR1 §2.2 — declared upgrade target; whether live is an observed-side question |
| L1 adapter proxy admin | `0xa9E9bBf04F95688D7fd82036f83544630E463CAc` | SOURCED WR1 §2.2; owner **GAP G-06** |
| OP OFT (proxy) | `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` | SOURCED WR1 §2.2 |
| OP OFT impl | `0x70d7E0C93D8443325550Ba3F71576F5f346b8aA9` | SOURCED WR1 §2.2 |
| OP OFT proxy admin | `0x632304Edc891Afed1a7bDe9A40b19F1c393ad5F3` | SOURCED WR1 §2.2 |
| ULN libs (4) | L1 send `0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1`, L1 receive `0xc02Ab410f0734EFa3F14628780e6e695156024C2`, OP send `0x1322871e4ab09Bc7f5717189434f97bBD9546e95`, OP receive `0x3c4962Ff6258dcfCafD23a814237B7d6Eb712063` | SOURCED WR1 §2.3 (repo + decoded calldata + LayerZero metadata API) |
| Ethereum EndpointV2 (chain-1 target) | `0x1a44076050125825900e736c501f859c50fE728c` | SOURCED WR1 §2.1 |
| OP EndpointV2 (chain-10 target) | `0x1a44076050125825900e736c501f859c50fE728c` (same address, distinct chain-scoped target with its own code hash) | SOURCED WR1 §2.1 |
| `expectedRuntimeCodeHash` for **all eight** targets above | — | **GAP G-01. Schema-mandatory; blocks the Identity row outright.** |

**S3 — peers**

| Entry | Value | Tag |
|---|---|---|
| L1 adapter `peers(30111)` | `bytes32(0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF)` | SOURCED-D from WR1 §2.7 registry co-declaration; no `setPeer` artifact in the pinned tree — **GAP G-03** on provenance strength |
| OP OFT `peers(30101)` | `bytes32(0xcd2eb13D6831d4602D80E5db9230A57596CDCA63)` | same |

**S5 — ULN config (all four cells: L1 send/receive, OP send/receive)**

| Entry | Value | Tag |
|---|---|---|
| Confirmations | 45 (blanket policy constant, both legs) | SOURCED WR1 §2.4 (ABI-decoded calldata + generator script cross-check) |
| Required / optional / threshold | 4 / 0 / 0 | SOURCED WR1 §2.4; "4-of-4" = all-required, no optional quorum |
| Required DVNs, Ethereum-side libs | Horizen `0x380275805876Ff19055EA900CDb2B46a94ecF20D`, LayerZero Labs `0x589dEDbD617e0CBcB916A9223F4d1300c294236b`, Canary `0xa4fE5A5B9A846458a70Cd0748228aED3bF65c2cd`, Nethermind `0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5` | SOURCED WR1 §2.4, provider names cross-checked against LayerZero metadata API |
| Required DVNs, Optimism-side libs | Canary `0x5b6735c66d97479cCD18294fc96B3084EcB2fa3f`, LayerZero Labs `0x6A02D83e8d433304bba74EF1c427913958187142`, Horizen `0x9E930731cb4A6bf7eCc11F695A295c60bDd212eB`, Nethermind `0xa7b5189bcA84Cd304D8553977c7C614329750d99` | SOURCED WR1 §2.4 |
| Executor expectation | canonical addresses known (ETH `0x173272739Bd7Aa6e4e214714048a9fE699453059`, OP `0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e`) but pinning policy undetermined | SOURCED WR1 §2.5 for the addresses; **GAP G-05** for the expectation |

**S6 — rate limits:** mode SOURCED WR1 §2.6; values **GAP G-02** (3,000 vs 10,000 weETH / 14,400s, conflict C2 — both candidates SOURCED, neither pinnable).

**S7 — control plane**

| Entry | Value | Tag |
|---|---|---|
| L1 controller Safe (intended owner + delegate, L1 adapter) | `0x2aCA71020De61bb532008049e1Bd41E451aE8AdC` | SOURCED WR2 §1a — declared/derived; live `owner()`/`delegates()` **GAP G-08** |
| OP controller Safe (intended owner + delegate + role admin, OP OFT) | `0x764682c769CcB119349d92f1B63ee1c03d6AECFf` | SOURCED WR2 §1b; same caveat, G-08 |
| OP L2 timelock / expected minDelay | `0x851Dd540f4D2Ec78120De0a0cc87B21EdE5Df5C6` / 259,200s | SOURCED WR2 P8 (deploy-script declaration) |
| L1 timelock / minDelay | `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` / ≤259,200s bound only | SOURCED WR2 §1a; minDelay **GAP G-07** (corrected schedule-delay decode, WR1 C1 + WR2 adjudication note) |
| L1 timelock proposer Safe | `0xcdd57D11476c22d265722F68390b036f3DA48c21` | SOURCED WR2 §1a |
| Declared pauser | `0x9AF1298993DC1f397973C62A5D47a284CF76844D` (PAUSER_EOA) | SOURCED WR2 §1a; guardian/RoleRegistry wiring **GAP G-12** |
| OP `MINTER_ROLE` holder | L2 sync pool `0xC9475e18E2C5C26EA6ADCD55fabE07920beA887e`, role id keccak("MINTER_ROLE") | SOURCED WR2 §1b (P3); role-model ABI epoch **GAP G-10** |
| Expected pause state | unpaused (both OApps; `unpauseBridge()` declared in the 26Q2 batches) | SOURCED WR1 §1 |
| Safe signers / thresholds | — | **GAP G-09** (facts-only when closed) |

**S8 — pairing and exclusions**

| Entry | Value | Tag |
|---|---|---|
| L1 weETH token | `0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee` | SOURCED WR1 §2.2; the adapter→token binding itself **GAP G-13** (small) |
| Excluded pathway: L1 Sync Pool | `0xD789870beA40D056A4d26055d0bEFcC8755DA146`, ULN config 64 confirmations / **2** required DVNs (LayerZero Labs + Nethermind only) | SOURCED WR1 §2.9 — enumerated in `uncovered` precisely so its materially weaker policy is never conflated with the OFT route's cells |
| Excluded EIDs (ReducePathways) | 30243, 30260, 30165, 30322, 30332 — neither batch touches 30101/30111 | SOURCED WR1 §2.6 |

---

## 4. GAP LEDGER — closing recipe per gap

Non-negotiable acquisition rule for every closure: expected-side evidence must come from a **different acquisition path** than the read it will later verify (threat model: circular verification). Decoded historical governance-execution transactions (block-hash-bound Safe `ExecutionSuccess`-era calldata, config-change event logs) are an admissible expected-side path; reading today's config getter and copying it into the manifest is not.

| Gap | What is missing | Blocks | Closing recipe |
|---|---|---|---|
| **G-01** | `expectedRuntimeCodeHash` for every S2 target; impl→pinned-commit build mapping | **Identity row, and transitively every ABI-dependent cell** (schema-mandatory field) | EXPECTED side: derive each hash reproducibly from reviewed pinned build artifacts — compile the pinned source (ether.fi targets: `weETH-cross-chain` @ `e30c859c…638ed`; LayerZero vendor targets — EndpointV2, SendUln302, ReceiveUln302: the upstream LayerZero-Labs source release, pinned by its own commit) under a documented toolchain (solc version, optimizer setting/runs, EVM version, metadata and immutables handling), hash the build output's runtime (deployed) bytecode with the engine's sha256-over-bytes convention, and record the full derivation so any reviewer can re-run it. OBSERVED side, separately and blind: hash block-pinned `eth_getCode` bytes via 2 administratively independent providers. Neither side sees the other's value before the engine compares them; an observed chain read can never seed the expected manifest value — role separation between people does not create acquisition-path independence, and a seeded hash is the circular-verification class this ledger's preamble forbids. Where build-artifact derivation is genuinely infeasible for a target (unverifiable source, unpinnable toolchain, immutable-dependent bytecode that cannot be reconstructed), the manifest entry is demoted to an explicitly labeled weaker claim class — `first_observation_baseline`, drift-detection-only, disclosed in every report that cites it — never a silent seed presented at full claim strength. D-006 role separation still applies on top of, not instead of, this provenance separation. |
| **G-02** | Which declared rate limit (3,000 vs 10,000 weETH / 4h) is currently intended | **Rate limit row** | Execution-order evidence: locate and decode the executed Safe transactions for both batches on-chain (nonce/block order), or an owner-recorded policy decision. WR1 C2's naming inference (`NEW_LIMIT`) supports 10,000 but is inadmissible alone. |
| **G-03** | `setPeer` provenance for the 30101/30111 pair | Peer/EID claim strength (values authorable via derivation) | Repo history at earlier commits (the OP onboarding deployment), or on-chain peer-set event history on both OApps. |
| **G-04** | The library pin-in-place transactions (blog asserts, batches show only `setConfig`) | Send/Receive library claim strength | Search remaining `output/*.json` + `01_OFTConfigure.s.sol` at the pinned commit, or Endpoint library-set event history. The observed is-default flag is the decisive runtime closer regardless. |
| **G-05** | Executor pinning expectation | Executor sub-cell of Send verification | Owner decision recorded in the manifest review: either pin the canonical executor as expected or declare default-resolution-expected; observed `getConfig(configType=1)` then verifies whichever is declared. |
| **G-06** | L1 proxy admin owner; hence L1 upgrade latency | Control plane; Identity latency metadata | Ownership-transfer event history on `0xa9E9bBf0…`; candidate L1_TIMELOCK per WR2 §4.2 remains a candidate until then. |
| **G-07** | L1 timelock configured minDelay | Control plane (sync-pool-adjacent) | Observed `getMinDelay()` for the live value; expected-side from deployment artifact or min-delay-change event history. Known bound: ≤ 259,200s (corrected decode). |
| **G-08** | Live-intended `owner()` and `delegates()` for both OApps as reviewable expected values | **Control plane row** | Expected = controller Safes (WR2 derivation) promoted only after owner review plus ownership/delegate event-history corroboration — the derivation is currently an inference from batch authorship + LayerZero mechanics. |
| **G-09** | Safe signer sets and thresholds | Control plane facts sub-entries | On-chain Safe storage reads as **EvidenceFacts** with declared-configuration provenance; never a pass/fail predicate; signer custody remains permanently out of scope. |
| **G-10** | Deployed OP OFT role-model ABI epoch (OZ `AccessControl` vs master's numeric roles) | Role sub-cells; pause-role reads | Bind the ABI to the observed runtime code hash of impl `0x70d7E0C9…` (after G-01) and review which role model that bytecode implements. WR2 §5 warns the master ABI likely does not decode the deployed roles. |
| **G-11** | Reviewed lifecycle sign-off (`active`) | Gate semantics of every cell | HITL review record in the manifest per the spec's "independent reviewed source" requirement; WR1 §2.8's inference is the input, not the authority. |
| **G-12** | Guardian/RoleRegistry wiring on the L1 side | Control plane pause sub-cell | Repo follow-up at the pinned commit (RoleRegistry address) + observed role reads after ABI epoch resolution. |
| **G-13** | Adapter→token binding artifact | Token pairing | Constructor/initializer artifact in repo history; observed `token()` read verifies. |
| **G-14** | Applicability-window anchor blocks (`validity.fromBlock` per chain) | Manifest loadability against real boundaries | Derive from the execution blocks of the 26Q2 batches once G-02's execution-order work locates them. |

---

## 5. Claim-strength notes — what the manifest may assert and must disclaim

1. **Every security-stack value is mutable state.** The DVN set, threshold, confirmations, libraries, peers, delegate, owner, and rate limits can each be rewritten by one Safe execution with zero enforced delay. The manifest asserts *expected configuration at an identified block*, and each report names that block. It never asserts "this route is secured by 4 DVNs" as a standing property — a published four-of-four description is not live configuration until decoded at an identified block (threat model, forbidden inferences).
2. **A route-control `pass` is bounded.** It does not vouch for LayerZero the messaging system, the DVN operators' offchain infrastructure, OP sequencer/derivation assumptions, or settlement (threat model). OP-side observations carry the OP-stack finality caveat; two-chain results are `time_aligned`, never atomic.
3. **DVN entries are contract addresses, not organizations.** Provider names ride along as labels sourced from LayerZero's metadata API (upstream vendor, itself mutable); identity is the address plus — post-G-01 — the runtime hash. Under 4-of-4 each DVN is simultaneously a veto/liveness authority; the manifest records that as an authority fact, with no competence or independence judgment (anti-canon: "secured by N validators").
4. **Authority claims cap at "declared."** "ether.fi multisigs control the route" is blog prose until `owner()`/`delegates()` are observed (G-08); even then, *who controls the Safes* caps at signer-set facts (G-09) — custody and collusion are unknowable from public state. The blog's claim that LayerZero's multisig "no longer has any onchain path" is reported as official-blog provenance, never as verified absence — proving a negative over the Endpoint's authority surface exceeds current predicate coverage.
5. **Drift is drift.** An implementation change, DVN rotation, pause, or delay change within declared authority is a `fail`/drift finding demanding review — never auto-escalated to "compromise" and never softened into a pass (authorized ≠ safe; paused ≠ exploited).
6. **Absence discipline.** The executor gap, the unresolved rate-limit pair, and the sync-pool exclusion stay visible in `uncovered`/limitations. Completeness theater — filling a cell with an unverifiable value — is strictly worse than the explicit gap (threat model asset 8). And no cell, ever, aggregates into a route score.

---

## 6. Verdict

**BLOCKED ON: G-01, G-02, G-05, G-08, G-11.**

- **G-01 (runtime code hashes)** is the hard blocker: `expectedRuntimeCodeHash` is schema-mandatory per the engine's own loader, and the Identity row gates ABI selection for every other cell.
- **G-02 (rate-limit two-valued conflict)** blocks the Rate limit row — the manifest cannot pick 3,000 or 10,000 without execution-order evidence.
- **G-05 (executor expectation)** blocks completing the Send-verification cell honestly — it needs an owner decision, not more research.
- **G-08 (owner/delegate expected values)** blocks the Control plane row at anything above inference strength.
- **G-11 (lifecycle sign-off)** blocks the `active` classification that determines which predicates are mandatory.

Everything else is authorable today at the claim strength stated in §3: EIDs, all eight chain-scoped target addresses (including both EndpointV2 deployments), both proxy admins, all four libraries, the full 4-of-4 DVN sets with 45 confirmations on all four legs, peer values by stated derivation, the OP timelock delay, pause expectation, and the exclusion map. G-03/04/06/07/09/10/12/13/14 degrade claim strength or narrow sub-cells but do not block drafting.

Recommended sequence to MANIFEST-READY: (1) commission the observed-side identity lane for G-01 under D-006 separation; (2) one evidence session for G-02 + G-14 (same execution-history work closes both); (3) an owner review session closing G-05, G-08, G-11 as recorded decisions. After those, this blueprint converts directly into a loadable manifest draft for the promotion checklist in `docs/SOURCE_REGISTER.md`.
