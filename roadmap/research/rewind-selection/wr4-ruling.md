<!-- DRAFT - chain-historian persona ruling, 2026-07-26. PRE-CODEX-REVIEW.
Provenance: opus persona agent (latent space: TrueBlocks / The Graph / Index Supply /
Flashbots / NTSB flight-recorder ethos), first standing assignment on WR4 + W6 supersession
design. Status: CODEX-REVIEWED 2026-07-26 (review-ms25esga) -- NOT-PROMOTABLE pending corrections. GUID join wrong vs EndpointV2 events; supersession hash-retention impossible; Candidate 5 disqualifier contradicts sibling blueprint S7. See codex-review-wave1.md. Two INFERRED claims flagged by the
author for hardest scrutiny: the LayerZero-packet-GUID causal-edge reframing, and the
selection.ts OP confirmation-depth defect. -->

## Chain Historian ruling — WR4 Rewind case selection, supersession design for W6

Constitution read: `docs/THREAT_MODEL.md`, `docs/ENGINEERING_SPEC.md` (§Replay and indexer L727-760, §Storage and caching L924-932, §Bridge-first slice L627-640), `docs/PRODUCT_SPEC.md` (§Rewind L86-88, L274-286), `roadmap/research/WR4/{rewind-candidates,completeness-critique}.md`, `lib/aegis/chain/{quorum,selection,adapter,engine}.ts`, `lib/aegis/identity/observe.ts`, `roadmap/work/W6-m1-scenario-fixtures.md`, `roadmap/evidence/{EV-W4-R3,EV-WR2}.md`, `data/recordings/*`, `data/manifests/*`, `roadmap/research/WR{2,3}/*`.

---

## 1. Verdict per candidate

Test applied: does the candidate, **as posed in `rewind-candidates.md`**, support M3's exit-gate clause "at least one real configuration or implementation change traces from transaction to affected route assertions" (`docs/ROADMAP.md` M3 exit gate) using public data inside Aegis's trust boundary (`docs/THREAT_MODEL.md:43-52`)?

| # | Candidate | Verdict |
|---|---|---|
| 1 | Paired L1/OP `setOutboundRateLimits`, 2026-05-28 | **NOT RECONSTRUCTABLE AS POSED** — reconstructable when split |
| 2 | OP `MINTER_ROLE` grant, 2026-04-03 | **RECONSTRUCTABLE** |
| 3 | L1 Sync Pool receive-lib + DVN `setConfig`, 2026-06-02 | **NOT RECONSTRUCTABLE AS POSED** |
| 4 | L1 `setInboundRateLimits`, 2026-05-20 | **RECONSTRUCTABLE** |
| 5 | OP ProxyAdmin `transferOwnership`, 2025-08-12 | **NOT RECONSTRUCTABLE AS POSED** |

### Candidate 1 — paired outbound rate limits

- **Block range / data classes.** Chain 1: parent 25194943 → target 25194944. Chain 10: parent 152192875 → target 152192876. Needs: block lineage both chains (`BlockRef` per `ENGINEERING_SPEC:180-188`); receipt + calldata; `OutboundRateLimitsChanged` log; EIP-1967 slot + `eth_getCode` at each **parent** hash for the ABI epoch; pre/post reads of the per-EID rate-limit tuple; the `ROUTE-ETH-OP-v1` Rate-limit row.
- **Why public data suffices.** All execution-layer. Both configured providers declare ETH archive (OBSERVED `roadmap/research/WR3/provider-matrix.md:44,46`); QuickNode declares OP "archive… no pruning" `[P-Q3]` (`:77`), Alchemy OP archive is `I — probe depth` (`:75`).
- **Why it fails as posed.** The posed framing is "genuine crosschain causal-edge material" (`rewind-candidates.md:120-124`). The integrator's own disposition already withdrew it (D2, `:390-392`), and I concur on stronger grounds: **two configuration transactions on two chains share no linking artifact of any kind.** There is no batch id, no proposal id, no message. Fourteen seconds is wall-clock coincidence. Per `ENGINEERING_SPEC:737-740` crosschain timestamps are navigation-only.
- **Supersession scenario exercised.** Not an L1 reorg (both blocks are ~2 months final). What it actually exercises is **cross-chain non-atomicity plus OP's two-class finality** — an OP observation taken at the unsafe head and the same observation after L1-derived finalization can differ with no L1 fork at all. That is critique item C5, left undiscussed.
- **Acceptance-evidence shape.** See §1.6 below; the L1 leg is the gate unit, the OP leg is a chronology-only companion carrying an explicit `no_causal_link_established` limitation.

### Candidate 2 — OP `MINTER_ROLE` grant

- **Blocks.** Chain 10: 149815467 → 149815468. Data classes: receipt; `RoleGranted(bytes32,address,address)` log; `hasRole(bytes32,address)` at both pins; EIP-1967 + code hash at the parent (the epoch resolution is the point).
- **Why it works.** Boolean membership flip — the simplest honest before/after in the set. The value is fully carried in the event, so log-derived state and the direct checkpoint read reconcile trivially (M3 deliverable "checkpoint reconciliation between indexed and direct state").
- **The ABI-epoch property is the asset, not the caveat.** WR2 established current `master` moved to numeric role ids via `IRoleRegistry`; the 2026-04 transaction predates it. This is the only located candidate that **crosses an epoch boundary**, which is the M3 exit-gate clause "ABI changes decode through explicit epochs."
- **Correction to the posed text.** `:167-168` states the before-state as fact; it is INFERRED. It becomes observed only via `eth_call hasRole(...)` at parent hash with `requireCanonical: true` (critique D4).
- **Affected assertion.** `ROUTE-ETH-OP-v1` **Control plane** row — "applicable owner/delegate/role authorities" (OBSERVED `ENGINEERING_SPEC:638`). Conditional on the route manifest enumerating which roles it pins — see G10.

### Candidate 3 — Sync Pool receive-lib + DVN

- **Disqualifying finding.** The OApp is the L1 Sync Pool `0xD789870b…`, which is **not a `ROUTE-ETH-OP-v1` participant** (`ENGINEERING_SPEC:627-638` binds the matrix to the OFT Adapter route). The transaction is reconstructable; its **affected-assertion set within the canonical matrix is empty**, so the gate clause cannot be satisfied without an owner decision to rescope the matrix.
- **Second, independent blocker (my addition).** The before-state as posed — "whatever previously governed" (`:216`) — is not merely unread, it is **ambiguous by protocol design**. LayerZero distinguishes *effective* config from *explicit override* from *inherited default*; `getConfig` returns the effective value and cannot by itself tell you whether an override existed. Establishing the before-state requires the `(lib, isDefault)` pair from `MessageLibManager`, not a single read (critique C3, unflagged in the candidate).
- Third: MultiSend decode path is undocumented in Aegis.

### Candidate 4 — L1 inbound rate limits

- **Verdict RECONSTRUCTABLE**, and it is the cleanest single-chain provider story in the set: Ethereum mainnet, both providers declare `finalized` (OBSERVED `lib/aegis/chain/providers.ts:26-28,34-36`) and archive, so **zero finality downgrade records**.
- **Affected assertion is exactly a named matrix row** — Rate limit, OP→ETH direction (inbound on the L1 adapter governs messages arriving from OP). Paired with Candidate 1's L1 leg (outbound = ETH→OP), the two cover **both directions of the Rate-limit row on one contract**, which partially closes critique B6/A4's directed-pathway complaint.
- **Not disqualified — demoted.** As the gate case it adds no capability the selection already proves. It is the cheap second L1 case, not an independent fallback (same contract, same source path: if the Safe-API-derived hash is bad, both fail together).

### Candidate 5 — ProxyAdmin ownership transfer

- **Disqualifying findings.** (a) The changed value is `ProxyAdmin.owner`. The matrix's **Identity** row pins the implementation and the **Control plane** row pins "owner/delegate/role authorities" — whether *the proxy admin's owner* is a manifest-pinned authority is **not established anywhere in the repo**, so the transaction→assertion trace terminates in "no assertion moved." (b) OP block 139,705,022 (2025-08) is a full year deeper than any other candidate; Alchemy's OP archive depth is undocumented (`WR3:75`). (c) Critique D7 stands uncorrected: the named ABI dependency is wrong.
- Reconstructable as a *transaction*. Retain as the structural-simplicity fallback only, and only after G10 resolves (a).

### 1.6 Common acceptance-evidence shape

Rhyming with `EvidenceRef` (`ENGINEERING_SPEC:210-231`), a gate-qualifying case lands seven evidence records plus a gap record:

| Id | kind | boundary | content |
|---|---|---|---|
| E1 | `transaction` | execution_block{target} | receipt: `from`, `to`, `transactionIndex`, `blockHash` |
| E2 | `event_log` | execution_block{target} | canonical identity `(chainId, blockHash, transactionHash, logIndex)` + decoded args |
| E3 | `storage_read`/`rpc_call` | execution_block{**parent**} | observed before-value, `requireCanonical: true` |
| E4 | `storage_read`/`rpc_call` | execution_block{target} | observed after-value |
| E5 | `rpc_call` | execution_block{**parent**} | EIP-1967 slot + `eth_getCode` → runtime hash → epoch binding |
| E6 | `rpc_call` ×2 providers | execution_block{target, parent} | `BlockRef` lineage incl. `parentHash` |
| E7 | `manifest` | — | the route-manifest entry pinning the expected value |
| GAP | — | block range | log-scan ledger proving no other change in `[from,to]` |

`Verification{ invariantId: "route.rate_limit.outbound", expectedEvidenceIds:[E7], actualEvidenceIds:[E4], derivationInputIds:[E2,E3,E5] }`. **An empty change-set is only meaningful with GAP present** — completeness claims without a gap ledger are anti-canon.

---

## 2. Ranked selection

**THE case for M3's gate: Candidate 1 split — the L1 leg alone.**
`setOutboundRateLimits` on `0xcd2eb13D…`, chain 1, block 25194944, EID-30111 slice.

Rationale:
1. **Best provider posture of any candidate.** Ethereum only; both providers declare `finalized` + archive; no OP finality downgrade, no OP archive question, no `[P-Q2]` exposure.
2. **Tightest transaction→assertion trace.** The changed value *is* a named matrix row (`ENGINEERING_SPEC:637`), in the primary demo direction (ETH→OP).
3. **The 20-EID array is a feature.** One call writes ~20 destination EIDs (`rewind-candidates.md:106-109`). Isolating the 30111 slice exercises "mutate one configuration and verify only affected assertions change" (`ENGINEERING_SPEC` fork/e2e tests) *and* forces coverage-integrity honesty about the 19 routes Aegis has no manifest for.
4. **The event carries the full after-state**, so indexed-vs-checkpoint reconciliation is provable, not asserted.
5. **The discarded OP leg becomes the strongest asset in the set.** Retained as an explicitly **chronology-only companion**, it is the only real data in the corpus that *looks* causal and demonstrably is not — which is precisely how you satisfy the exit-gate clause "chronological display and causal inference remain separate in data and UI." You cannot demonstrate that separation convincingly with synthetic data. Critically, the gate does **not** depend on it: if OP archive fails, the companion is `unknown` and the gate still passes on L1. Risk is quarantined to the optional leg.

**Runner-up: Candidate 2 (OP `MINTER_ROLE`).** Chosen over Candidate 4 as runner-up because it is a *genuinely independent* fallback — different chain, different contract, different ABI family, different source path — whereas Candidate 4 shares the winner's contract and discovery path and would fail with it. It also carries the epoch crossing (see §3/A1).

**Sequencing ruling.** The winner alone does **not** satisfy the exit-gate clause "ABI changes decode through explicit epochs" unless its own epoch turns out to cross a boundary — unknown until G5 runs. **Plan on shipping the runner-up too.** Candidate 4 is the cheap third case if a second L1 direction is wanted.

**Disqualifying findings, rejected candidates:**
- **C3:** OApp is outside the canonical matrix → affected-assertion set is empty. Secondary: before-state ambiguous by protocol design (effective vs. explicit vs. inherited); MultiSend decode undocumented.
- **C5:** changed value not established as a manifest-pinned authority → trace terminates; deepest archive risk in the set; D7 uncorrected.
- **C4:** not disqualified; demoted for adding zero new coverage over the winner and being non-independent as a fallback.
- **C1 as posed:** the causal-edge claim is unreconstructable from public data — no linking artifact exists. Split, and it wins.

---

## 3. Completeness critique, item by item

Nothing has moved since the critique — WR4's handoff still reads `next: ROUND 2` (`roadmap/work/WR4-research-lane.md`). So the question is not "answered yet" but **"does the selection make it moot, and is it blocking?"**

### A — missed candidate classes

| Item | Status | Ruling |
|---|---|---|
| A1 implementation upgrades | **OPEN, conditionally blocking** | Largely **relieved**: the epoch is resolvable far more cheaply by reading the EIP-1967 slot at the parent hash than by locating the upgrade tx — decoding needs the *code-hash-scoped ABI*, not the upgrade transaction. A1 stays blocking **only** for the "ABI changes decode through explicit epochs" clause, and only if the runner-up (C2, which crosses an epoch) is not shipped. Downgrade P0→P1. |
| A2 setPeer/EID | OPEN, not blocking | Highest-severity class, but the gate needs one change, not the worst one. |
| A3 send-lib / primary receive-lib | OPEN, not blocking gate | C3's disqualification leaves the Send/Receive-library rows with **no located historical change**. The tape will legitimately read "no observed change in range" — honest **only if** the gap ledger proves the range was fully scanned (G7). |
| A4 full ULN + executor + directed matrix | OPEN | Partially relieved: winner + C4 cover both directions of the Rate-limit row on L1. ULN/executor uncovered. |
| A5 owner/delegate changes | OPEN, blocking *Control-plane* claims | Owner ≠ delegate ≠ ProxyAdmin owner (WR2 §1c). An unindexed `setDelegate` in range makes any Control-plane before-state wrong. Not blocking the Rate-limit gate case. |
| A6 pause/role transitions | OPEN | Half-closed by shipping the runner-up. |
| A7 timelock schedule/execute pairs | **OPEN — I elevate this to P0 for M3** | See below. |

**A7 elevation.** Timelock pairs are the **only class in the entire candidate set that yields a genuine causal edge**: `CallScheduled` and `CallExecuted` share an explicit `bytes32 id`. Given D2 stripped the causal-edge claim from Candidate 1, M3 currently has **no located source of causal edges at all**. A7 is not "another class"; it is the missing ingredient for the M3 deliverable "explicit causal edges."

**Structural finding neither WR4 nor the critique surfaces (INFERRED — LayerZero v2 mechanics; CANON: upstream-spec class per `SOURCE_REGISTER`):** the route's real *crosschain* causal edge is the **LayerZero packet identity** — `PacketSent` on the source carries an encoded packet including a GUID; `PacketVerified`/`PacketDelivered` on the destination carry the matching `Origin{srcEid, sender, nonce}`. That is an explicit linking artifact satisfying `ENGINEERING_SPEC:739`. **Configuration changes on two chains have no causal edge; message deliveries do.** M3's "explicit causal edges for crosschain event bundles" should therefore be satisfied by a *message* bundle, not a *config* bundle. Requires pinning the LayerZero-v2 commit first (G12).

### B — missed search angles

- **B1 event-first history — OPEN, P0 regardless of candidate.** M3 is log-first by construction (`ENGINEERING_SPEC:727-733`). Safe-nonce-first is a discovery method, not an indexing method. **This is also the fix for G2** (see below) — it inverts the trust direction in one query.
- **B2 git→deployment mapping — OPEN, downgraded.** Not blocking *decoding* (code-hash-scoped ABI suffices, W4 shipped). Still blocking `SOURCE_REGISTER` promotion-checklist item 1.
- **B3 output/*.json inventory — OPEN, P2.** Not blocking.
- **B4 timelock event streams — OPEN**, folds into A7 (now P0).
- **B5 LZ-Scan-class tooling — OPEN; I recommend against.** LayerZero Scan is a hosted indexer, the same trust class as `api.safe.global` and explorers (`THREAT_MODEL:43-46`); the §0.1 fabrication hazard (`rewind-candidates.md:40-53`) applies identically. Discovery-only, quarantined, never an input to a canonical claim.
- **B6 complete each directed pathway — OPEN**, partially relieved by winner + C4.

### C — hazards

| Item | Status |
|---|---|
| C1 canonical event identity | **OPEN — the single blocking gap.** Nothing moves until `(chainId, blockHash, txHash, logIndex)` exists from two independent providers. G1. |
| C2 ABI/code epoch for 1,3,4,5 | **OPEN but mechanically closable.** The capability already ships: `adapter.ts:242-254` (`getStorageWord` EIP-1898 + `requireCanonical`), `lib/aegis/identity/*`, and `data/recordings/reference-identity-reads.json:27` already exercises the exact EIP-1967 slot. Only the data is missing. G5. |
| C3 default vs explicit vs timeout | **ANSWERED-BY-SELECTION.** `PairwiseRateLimiter` is ether.fi-authored storage with no LayerZero default-inheritance semantics. Re-opens the moment any library/DVN candidate is selected (A3/A4). |
| C4 Safe actor collapse | **OPEN, blocking** the M3 deliverable "tied to transaction, initiator, and executor." G11. |
| C5 OP Bedrock finality/reorg lineage | **OPEN — answered substantively in §4**, and it surfaces a design defect in `selection.ts` (G8). |
| C6 getLogs availability / gap detection | **OPEN, blocking.** Concretely: **WR3 §6 contains no log-retrieval probe.** It has §6.1 tags, §6.2 EIP-1898, §6.3 archive depth, §6.4 trace, §6.5 fork, §6.6 tiers, §6.7 independence — `eth_getLogs` appears exactly once, at `provider-matrix.md:262`, as a repeat of the 1898 probe. No range cap, no result cap, no overflow taxonomy. G7. |
| C7 tx-boundary vs block-end isolation | **OPEN, cheaply closable** without trace APIs. G6 — which matters because trace is paid-tier-gated on both providers (`WR3:44,46`). |

### D — internal consistency

| Item | Status |
|---|---|
| D1 gate claimed without assertion map | Relabel **ANSWERED** (`:385-387`); substance **OPEN** — and it has a hard upstream dependency, see G10. |
| D2 causal-edge mislabel | Relabel **ANSWERED** (`:390-392`); **extended** by the GUID finding above. |
| D3 per-claim provenance ledger | **OPEN**, P1. |
| D4 before/after overstated (C2/C5) | **OPEN** — listed under EXTEND (`:400-403`), not among the accepted gaps. |
| D5 blog date | **ANSWERED** by withdrawal (`:393`). |
| D6 residual OP block-range statement | **OPEN, uncorrected.** `:376` still reads "(~149.8M-154.5M, spanning 2025-08 to 2026-07)"; 2025-08 is Candidate 5's block 139.7M. Internally inconsistent as written. |
| D7 C5 names wrong ABI dependency | **OPEN, uncorrected.** |

---

## 4. Supersession design notes for W6

W6's acceptance requires "a reorged block is superseded, not silently replaced, and orphaned observations are marked rather than deleted" (`roadmap/work/W6-m1-scenario-fixtures.md:75-79`), against `ENGINEERING_SPEC:733,932` and `THREAT_MODEL:110`. **No supersession machinery exists today** — a repo-wide search of `lib/` finds only comments (`adapter.ts:230-233`, `identity/compare.ts:435`).

### 4.1 Mechanical constraint that dictates the file layout

`loadRecordingBytes` rejects duplicate `(chainId, method, params, providerId)` keys (OBSERVED `lib/aegis/chain/adapter.ts:158-160`). Therefore:

- Identity/state reads on **both branches can coexist in one bundle**, because reads are keyed by EIP-1898 `{blockHash, requireCanonical:true}` (`adapter.ts:236-240`) and the two branches have different hashes.
- `eth_getBlockByNumber [N,false]` on both branches **collides** and is rejected.

⇒ **The fixture must be a bundle *pair*, not a single bundle** — a pre-reorg capture and a post-reorg re-capture, joined by an explicit supersession record. This is not a workaround; it is the honest shape, and it rhymes with the house's own receipt convention (`supersedes: [EV-W4-R2]`, OBSERVED `roadmap/evidence/EV-W4-R3.md:15`) — the NTSB pattern: both exhibits retained, the later one supersedes in the open.

### 4.2 What the fixture must contain

1. **Both observations retained**, each with its own `envelopeSha256`. Never an in-place edit — a mutable-row UPDATE on an observation is evidence tampering with extra steps.
2. **Block-hash pinning everywhere.** Every read carries `{blockHash, requireCanonical:true}`. A log without a block-hash pin is a rumor.
3. **The common ancestor, as data.** Both branch heads must record the *same* `parentHash` P, and P's own block record must be in the fixture. **The common ancestor is the exhibit that makes the supersession claim falsifiable** — without it you cannot distinguish a reorg from two unrelated chains. (CANON: The Graph's rollback-to-common-ancestor playbook.) `PinnedBlock` already carries `parentHash` (`selection.ts:11-18`), and `engine.ts:63-67` hashes it into `rawResultHash` while stripping `finality` — so **lineage disagreement already surfaces as a quorum conflict today**, and same-number/different-hash already yields `block_hash_mismatch` → `conflict` (`quorum.ts:101-109`). W6 adds retention, not detection.
4. **Superseded-by linkage**, explicit and additive.
5. **A derived artifact that must survive.** At least one report computed on branch A, retained with its original hash, gaining a `supersededEvidence` limitation — never silently recomputed. Cache invalidation is already mechanical (`ENGINEERING_SPEC:930` keys include block hash); the *retention* is the honesty requirement.
6. **The orphaned branch's post-reorg reads must be ABSENT from the post-image bundle.** Under `requireCanonical:true` a canonical node refuses an orphaned hash. Omission yields `status:"timeout"` = missing evidence (OBSERVED `engine.ts:71-75`, `identity/observe.ts:163-170`), which is the correct answer. **Schema note:** `RecordedResponse` has no error variant, so "provider refused as noncanonical" and "we never captured this" both collapse to `timeout`. Honest but imprecise; W6 should consider an explicit recorded-error variant so `quorum.ts`'s `malformed` path is reachable from recordings.
7. **Finality-class honesty guard — the hard one.** `PinnedBlock.finality` admits `"finalized"` (`selection.ts:17`). **A fixture that reorgs a block labelled `finalized` on chain 1 fabricates protocol history** — exactly W6's own stated hazard (`:105-107`). Ethereum finalized blocks do not reorg absent a >1/3 slashable fault. The chain-1 reorg fixture must orphan an `unconfirmed` block at depth 1-2.

### 4.3 OP-specific — this answers critique C5

OP finality is three-class, derived from L1: `unsafe` (sequencer-published) → `safe` (batch on L1) → `finalized` (that L1 block finalized), ~20-30 min (OBSERVED `WR3/provider-matrix.md:60-62` `[P-O1]`). Therefore, for the OP fixture:

- The honest OP failure is **not an L1-style fork-choice reorg**; it is **unsafe-head replacement** by the sequencer. Orphan an `unconfirmed` block. A `safe` block can also be orphaned if the L1 block carrying its batch reorgs — a second, deeper scenario worth a separate fixture.
- **Design defect I am raising against `selection.ts` (INFERRED, needs owner review).** QuickNode declares no `finalized`/`safe` tags on OP (OBSERVED `lib/aegis/chain/providers.ts:37`; `WR3:77` `[P-Q2]`), so Aegis's OP boundary falls to `confirmationDepthTarget` (`selection.ts:85-94`) — an L2 **block-depth** count. On OP, block depth does not bound reorg risk: unsafe-head replacement is bounded by *L1 batch posting*, not by L2 block count. **A confirmation-depth policy on OP measures the wrong quantity** — depth-N superstition, asserted without citing a finality mechanism. The correct fallback derives OP finality from L1: pin the highest L2 block whose batch originates in an L1-finalized block. WR3's own probe already proposes the cross-check (`provider-matrix.md:245-247`). This is worth an `INS-*` capture; I do not edit repo files.

### 4.4 Proposed module — extend, never fork

`lib/aegis/chain/lineage.ts`, matching the house style of `quorum.ts`/`selection.ts` (pure evaluator, no I/O, no clock, typed `ChainError`):

```ts
interface SupersessionRecord {
  superseded:   { observationId: `sha256:${string}`; chainId: number;
                  block: { number: string; hash: string; parentHash: string } };
  supersededBy: { /* same shape */ };
  commonAncestor: { number: string; hash: string };
  depth: string;                                    // canonical decimal
  reasonCode: "reorg_block_hash_changed" | "reorg_lineage_diverged";
  finalityAtObservation: "unconfirmed" | "confirmations" | "safe";  // never "finalized"
  detectedAt: { number: string; hash: string };
}
```

Rules, each one a test:

- **R1** supersession requires same `(chainId, number)` with different hash, or a descendant whose recorded `parentHash` chain no longer contains the superseded hash.
- **R2** `finalityAtObservation === "finalized"` → throw `finalized_reorg_unsupported`. On chain 1 a fixture asserting this fabricates history; if it ever occurs live it is a consensus fault deserving its own loud reason code, never silent modelling.
- **R3** common ancestor absent or not an ancestor of both by recorded `parentHash` → `lineage_not_established`; outcome `unknown`, never an asserted supersession.
- **R4** no deletion — superseded observations stay resolvable; the record is purely additive.
- **R5** acyclic and totally ordered per chain: A←B←C; asserting C←A throws `supersession_cycle`.
- **R6** a reorg *back* to an earlier branch is a **new** observation with a new envelope hash superseding the current head. "Un-supersede by deletion" is forbidden.
- **R7** ordering key is `(chainId, blockNumber, capturedAt-of-superseding)` — **never block number alone**, because two branches share a number. This is W6's "property tests over supersession ordering."

### 4.5 Proposed files (shapes rhyme with `data/recordings/*.json`)

- `data/recordings/reorg-preimage-op-unsafe.json` — chain 10 `eth_getBlockByNumber ["latest",false]` → block N, hash A, `finality:"unconfirmed"`, `parentHash: P`; identity/state reads keyed `{blockHash:A,requireCanonical:true}`; both providers.
- `data/recordings/reorg-postimage-op-unsafe.json` — later `capturedAt`; `["latest",false]` and `[N,false]` → hash B, `parentHash: P`; reads keyed `{blockHash:B,…}`; **no** reads at A.
- `data/recordings/reorg-lineage-op.json` — the block-record exhibit P/A/B with `parentHash` links, so the common ancestor is *proved from data*.
- A supersession record joining them, front-matter-styled after `EV-W4-R3.md:15`.
- Mirror set on chain 1 at `finality:"unconfirmed"`, depth 1, to satisfy `THREAT_MODEL:174-178` required adversarial test #4.

**README obligation.** `data/recordings/README.md:3-10` already disclaims live capture; W6 must extend it to say explicitly that the reorg pair is a **constructed branch pair demonstrating engine supersession behaviour, and is not evidence that this reorg occurred on OP.**

**Teeth (D-004).** Tamper-evidence already exists free — mutating a recorded `result` trips `integrity_mismatch` at load (`adapter.ts:143-153`). W6 adds *retention* teeth: neutralize the supersession linkage and exactly the supersession tests must fail, nothing else; plus a test that a report citing a superseded observation retains its original hash and gains its limitation rather than being recomputed.

---

## 5. Gap list — blocking the selected case, with closing recipes

Ordered by what blocks first.

| # | Gap | Closing recipe |
|---|---|---|
| **G1** | **No canonical event identity** (critique C1) — blocks everything | `eth_getTransactionReceipt` from Alchemy **and** QuickNode on chain 1 → assert identical `blockHash`, `transactionIndex`, and the `logIndex` of `OutboundRateLimitsChanged`; then `eth_getBlockByHash(blockHash,false)` → `number`, `parentHash`. Two administratively independent providers is a floor, not a preference (`quorum.ts:70-72`). |
| **G2** | **Tx hash provenance is a hosted indexer** (`api.safe.global`), same trust class as an explorer (`rewind-candidates.md:31-35`, `THREAT_MODEL:43-46`) | **Invert the trust direction.** Do not let the Safe-derived hash be an input to a canonical claim. Go log-first: `eth_getLogs` over `0xcd2eb13D…` filtered on topic0 across the range; the located log's `transactionHash` *is* the evidence, and the Safe API hash becomes a cross-check that either matches or is discarded. **This closes B1 for the selected case in one query.** |
| **G3** | topic0 never computed | Derive the exact canonical signature (tuple-array encoding) from pinned-source `PairwiseRateLimiter` at `e30c859…`; keccak256 it; pin signature **and** topic0 in the manifest. Negative test: a wrong-arity signature returns zero logs, which must surface as `unknown`/gap — never as "no change occurred." |
| **G4** | Before/after **getter unidentified** — WR4 names only the setter and event (`:62,73`) | Read `PairwiseRateLimiter` at the pinned commit for the public accessor and storage layout; `eth_call` at parent hash (before) and target hash (after), `requireCanonical:true`. If no public getter exists, `eth_getStorageAt` with a derived slot — which is `claimKind:"derived"`, and must be labelled so. |
| **G5** | ABI epoch at block 25194943 unresolved (critique C2) | `eth_getStorageAt(0xcd2eb13D…, 0x360894a1…382bbc, {blockHash:parent,requireCanonical:true})` → impl; `eth_getCode(impl, …)` → runtime hash → code-hash-scoped ABI registry. Machinery ships (W4); shape already exercised at `reference-identity-reads.json:27`. Only the data is missing. |
| **G6** | Transaction-boundary isolation (critique C7) | `eth_getBlockByHash(blockHash, true)` → enumerate txs with `to == 0xcd2eb13D…`. If the target is the only one, isolation is **proved by enumeration with no trace API** — which matters because trace is paid-tier-gated on both providers (`WR3:44,46`). Otherwise a trace/state diff is required and the case gets more expensive. |
| **G7** | **No log-retrieval capability probe anywhere** (critique C6) | Add WR3 §6.8: per provider per chain, record max accepted block range, max result count, overflow error taxonomy, and behaviour of the `blockHash`-qualified `eth_getLogs` filter form. Then implement adaptive range-splitting **with an explicit gap ledger** — M3's "adaptive ranges and gap detection" and the exit-gate clause "an injected missing range is detected." |
| **G8** | OP finality vs confirmation-depth policy (critique C5; §4.3) | Blocks the OP companion leg and the OP reorg fixture, **not** the L1 gate case. Recipe: run WR3 §6.1 step 4 (`provider-matrix.md:245-247`) — compare the OP block's L1 origin against the L1 finalized head; design an L1-derived OP boundary rather than an L2 block-depth count. Owner-level design decision. |
| **G9** | Archive depth unproven **at the exact blocks** | L1 25,194,943-44: both declare archive; Alchemy free tier carves out "archival beyond 30M CU" `[P-A1]`. OP 152,192,875-76: QuickNode "no pruning" `[P-Q3]`; Alchemy = probe. Run WR3 §6.3 **at these blocks**, not a generic old block. |
| **G10** | **No route manifest exists** (critique D1) — the deepest blocker | `data/manifests/` holds exactly two files: `reference-code-identity.json` (placeholder targets at `0xcccc…`/`0xeeee…`) and `etherfi-reference-v1.json` (an M0 contract-address list — grep for `rate`/`peer`/`eid`/`route` returns nothing). **⇒ M3's gate clause "traces to affected route assertions" cannot be satisfied before M2 ships the `ROUTE-ETH-OP-v1` manifest.** Recipe: M2 must give the Rate-limit row a machine-readable binding `{direction, peerEid, mode, cap, window, lifecycle}`. Until then "affected assertions" has no denominator. **Sequencing finding — raise before scheduling M3.** |
| **G11** | Safe actor decomposition (critique C4) | Three evidence records: receipt `from` (EOA relayer), the Safe as `msg.sender` on the target log, and the Safe's own `ExecutionSuccess`/`SafeMultiSigTransaction` log. Signer recovery from the `signatures` blob is a **derivation**, not an observation; per WR2 §4 the threshold is unknown, so any "N-of-M authorized" statement stays `unknown`. |
| **G12** | LayerZero-v2 signatures read at unpinned `main` HEAD (`:370-373`) | Pin the commit SHA (`SOURCE_REGISTER` checklist item 1). Blocks the library/DVN work and the GUID causal-edge path — **not** the selected case. |

---

### Closing note for the reviewer

Two claims in this report are mine rather than the repo's and should draw the hardest scrutiny: (1) that **the route's only genuine crosschain causal edge is the LayerZero packet identity, not any pair of configuration transactions** — which reframes M3's causal-edge deliverable away from config bundles entirely; and (2) that **`selection.ts`'s confirmation-depth fallback measures the wrong quantity on OP**, because unsafe-head replacement is bounded by L1 batch posting rather than L2 block depth. Both are INFERRED from protocol mechanics, not observed in this repo. Both warrant `INS-*` capture; I do not edit repo files.
