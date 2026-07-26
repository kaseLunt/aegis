<!-- G-01 derivation-execution report — route-cartographer standing lane, 2026-07-26.
Persisted verbatim by the orchestrator from the lane's final report. Companion to
g01-build-derivation.md (the input dossier); executes its §2.5/§3.5/§5.5/§6.5 recipes under
the round-7 anti-fitting rule. The eight values below are DERIVED candidates with
committed-before-execution provenance — NOT manifest-grade expectedRuntimeCodeHash values
(M2 owner review + the disclosed caveats stand between them and the manifest; see §5).
D-006: zero chain reads of any target; the observed-side lane is a different role. -->

# G-01 DERIVATION-EXECUTION REPORT — ROUTE-ETH-OP-v1 identity targets

Route Cartographer · 2026-07-26 · executes the dossier recipes (`roadmap/research/route-manifest/g01-build-derivation.md` §2.5, §3.5, §5.5, §6.5) under the round-7 anti-fitting rule. **D-006 held throughout: zero RPC calls, zero chain reads of any target; every network fetch was a git/npm/soliditylang source or registry fetch.** The derivation-input record was written to disk **before** any build ran: `C:\Users\kasel\AppData\Local\Temp\claude\C--Users-kasel-source-repos-etherfi-aegis\baab8c2b-840d-4b6b-b619-359eee75ac04\scratchpad\derivation-input-record.md` (its full content is reproduced in §3; two revisions were appended during execution, both documented, neither changing any committed value).

## 1. Results table

| # | Target | Tree / artifact pin | Build executed | Checkpoint | Patched immutables (value @ sites) | Candidate hash |
|---|---|---|---|---|---|---|
| T1 | L1 OFT Adapter impl (expected `0xA82cc578…F946`) | `weETH-cross-chain @ c223c2bb652959ab09c6a6d157f898f15bafd2a4` (= `a71ea7e^`) | `forge build --skip test --build-info` · forge 1.7.1/4072e48 · Solc 0.8.20 (svm), **evm paris**, opt 200, ipfs CBOR (all OBSERVED in build-info) | n/a (ether.fi lane) | `endpoint`=`0x1a4407…728c` @8 sites; `innerToken`=`0xcd5fe2…b7ee` @3; `decimalConversionRate`=10^12 @4 | **DERIVED `sha256:6bafa8450a6fcc1bf171a992ed34730ca20595c234e490bc06dc1eef2cf6a4cf`** |
| T2 | OP OFT impl (declared `0x70d7E0C9…8aA9`) | `weETH-cross-chain @ a71ea7eaec47ffa3187711ead4e85e1310eafe3a` (= `a71ea7e`) | same command · Solc 0.8.20, **evm shanghai**, opt 200, ipfs CBOR | n/a | `endpoint` @8 sites; `decimalConversionRate`=10^12 @4 | **DERIVED `sha256:907045f646883012fd15b5fe7308a54781f6af7a8e2201e80a4d647ea1fd13a8`** |
| T3 | L1 SendUln302 `0xbB2Ea70C…dCe1` | `lz-evm-sdk-v2@2.3.44` artifact (tarball sha256 `33bce9ec…40bc`) | reconstructed standard-json → `solc-0.8.22.exe --standard-json` (0.8.22+commit.4fc1097e, checksummed) | **PASS** (`8f513405…b6be`, byte-identical incl. ipfs tail) | `endpoint`; `treasuryGasLimit`=200000; `localEid` **0 sites** (R1) | **DERIVED `sha256:281e2b773062ba45ff33aab2a78d221667bafd036529d7cf651794404d7f93e2`** |
| T4 | L1 ReceiveUln302 `0xc02Ab410…24C2` | same artifact family | same | **PASS** (`9ac3d18a…6d53`) | `endpoint`; `localEid`=30101 | **DERIVED `sha256:03187ce0424c808bed2cc413034e3abe0b1c8976c2875208d9a4b9f71f6c43f2`** |
| T5 | OP SendUln302 `0x1322871e…6e95` | same | same | **PASS** (same compile as T3) | `endpoint`; `treasuryGasLimit`; `localEid` **0 sites** | **DERIVED `sha256:281e2b773062ba45ff33aab2a78d221667bafd036529d7cf651794404d7f93e2`** (= T3, see §4-F1) |
| T6 | OP ReceiveUln302 `0x3c4962Ff…2063` | same | same | **PASS** (same compile as T4) | `endpoint`; `localEid`=30111 | **DERIVED `sha256:2fb604434f244f67b5fde7181c4aed42b10371cb14086ca46892be911455759e`** |
| T7 | EndpointV2 chain-1 `0x1a440760…728c` | same | same | **PASS** (`47493a3f…a661`) | `eid`=30101; `blockedLibrary`=`0x1ccbf0db…d862` | **DERIVED `sha256:344d48a336f08651dc1a643b45d80c5197d6ed33ff49ce4b694dacb98d711fd0`** |
| T8 | EndpointV2 chain-10 `0x1a440760…728c` | same | same | **PASS** (same compile as T7) | `eid`=30111; `blockedLibrary` same | **DERIVED `sha256:917d75e563fd35926df21ff8672b53be8fca503b8cfff7debf889eee3fe572be`** |

All three vendor checkpoints passed **byte-identically, including the ipfs CBOR metadata tails** — the reconstructed standard-json + pinned solc reproduce the vendor's published build exactly (EndpointV2 24005 B, SendUln302 22995 B, ReceiveUln302 11010 B).

## 2. Toolchain verification (OBSERVED, performed before the input record)

- forge/cast 1.7.1, commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8` (`--version` run directly).
- `solc-0.8.20.exe` sha256 `a0fa8eb7…1946`, `solc-0.8.22.exe` sha256 `a67dd619…0afa` — both computed locally AND matched against an independently fetched `binaries.soliditylang.org/windows-amd64/list.json` (entries `0.8.20+commit.a1b79de6`, `0.8.22+commit.4fc1097e`). `--version` output confirms the commit strings.
- T1/T2 builds used forge's svm-managed Solc 0.8.20 (recorded from build-info `solcVersion`; CBOR tails end `…0008140033` = 0.8.20). Vendor lane used the checksummed 0.8.22 binary directly (tails `…0008160033`).
- Dep installer: `npx --yes yarn@1.22.22` (classic yarn absent — recorded).

## 3. Written-before-execution input record (verbatim summary; full file at the path above)

Fixed before any build: **T1** tree `c223c2bb…f2a4`, era toolchain (0.8.20/200/paris/ipfs), values `endpoint=0x1a44076050125825900e736c501f859c50fe728c` [SOURCED WR1 §2.1], `innerToken=0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee` [SOURCED WR1 §2.2], `decimalConversionRate=10^12` [sharedDecimals()=6 OBSERVED fork @`21ad027`; weETH `decimals()==18` anchored: `etherfi-protocol/smart-contracts @ b4a0968087b178bc346cdf6bee6c0597bf4c42c7` `src/core/WeETH.sol` has **no decimals override** (OBSERVED this session) ⇒ OZ ERC20Upgradeable default 18 — **G-01.C discharged**, with the recorded caveat that this anchors today's master source, fail-closed if wrong]. **T2** tree `a71ea7e…fe3a`, era toolchain (0.8.20/200/shanghai/ipfs), `endpoint` + `decimalConversionRate=10^12` [OZ default `return 18` re-confirmed OBSERVED in era `node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:104` after install]. **T3–T8** artifact sha256, standard-json reconstruction rule, the three checkpoint hashes, and all immutable values including `blockedLibrary = 0x1ccBf0db9C192d969de57E25B3fF09A25bb1D862` (computed offline pre-record: `cast compute-address 0x1a4407…728c --nonce 1`; formula `keccak256(rlp([endpoint,1]))[12:]`; identical both chains). Slot identification by AST `VariableDeclaration` id → `immutableReferences` key matching in the **same** build output — no offset guessing, fail-closed on any unresolvable id or missing value.

**H-1 / G-01.E discharged (OBSERVED):** `--frozen-lockfile` installs landed `@openzeppelin/contracts` **5.0.2** and `@openzeppelin/contracts-upgradeable` **5.0.2** in both era trees (LZ packages 2.1.27; fork `layerzero-v2@21ad027` present with `sharedDecimals()==6`). The lockfile governed; recorded.

**Line endings (OBSERVED):** fresh clones with `core.autocrlf=false`; zero CR bytes in both target sources pre-build; vendor sources written via node with content escaped inside JSON (no EOL translation possible).

## 4. Execution deviations and findings — all documented, no silent retries

- **D1 (T1/T2, build-set narrowing):** plain `forge build` failed at both era trees with a genuine era defect — `test/OFTSecurityUpgrades.t.sol` references undeclared `L1_UPGRADEABLE_OFT_ADAPTER` (exact error retained; the 2024 snapshots' tests do not compile as committed). Re-ran with `--skip test`. Rationale: test files are outside the target contracts' import closure; the targets' compilation inputs and settings are unchanged. First-class observation, recorded.
- **R1 (vendor lane, appended to the input record before accepting any Uln hash):** the fail-closed guard rejected the SendUln302 patch because `localEid` — declared in `MessageLibBase.sol:8` and fixed in the input record — has **zero `immutableReferences` sites** in SendUln302's runtime code: the compiler emits sites only for immutables the runtime code actually reads. No value was changed; the patcher's disposition of provided-but-unreferenced values was changed from abort to per-target report. EndpointV2 hashes produced before R1 stand unchanged.
- **F1 (finding, corrects dossier §0.1):** because `localEid` is unreferenced in SendUln302, **T3 and T5 have identical expected runtime bytecode** (same endpoint, same treasuryGasLimit, no chain-varying immutable) — the dossier's summary-table note "localEid=30111 ⇒ differs from T3 bytes" is wrong for SendUln302 (it holds for ReceiveUln302, where T4 ≠ T6 as derived). The two chain-scoped target records remain separate manifest entries; they simply carry the same expected hash. Dossier correction belongs to its next revision (caller persists; I don't edit).

Scripts used (scratchpad, reviewer-runnable): `patch-immutables.js` (forge-artifact mode, T1/T2), `vendor-derive.js` (standard-json reconstruction + checkpoint + patch, T3–T8), inputs `vendor-in-*.json` alongside.

## 5. What these values are — and are not

**They are:** DERIVED candidates, each with a complete, committed-before-execution provenance chain: pinned tree/artifact → checksummed compiler → recorded settings → AST-resolved immutable patching with SOURCED values → sha256 over the patched runtime bytes, in the engine's `sha256:` convention (`lib/aegis/identity/resolve.ts:129-130`). The vendor three additionally carry byte-exact recompilation proof against the vendor's published template.

**They are NOT:** manifest-grade `expectedRuntimeCodeHash` values. Standing between these candidates and the manifest: (1) the **M2 owner review** the promotion checklist requires; (2) the open caveats — **G-01.B** (T1/T2 trees are evidence-based candidates, not proven deploy checkouts; a future engine mismatch is reviewable drift and any re-derivation must be a documented revision per the round-7 anti-fitting rule) and **G-01.D** (the vendor artifact-to-chain link is a corroborated vendor claim; the engine's comparison is its arbiter); (3) the observed-side acquisition and comparison, which belong to a different role — per D-006 I did not read any target's chain state, will not implement the observed lane, and will not certify any check against the values I have just derived.
