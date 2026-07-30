# G35 dossier — independent Codex review verdict (the wave-3 gate)

- **Job:** `task-ms2o0tel-1yz0gm` (resumed Codex thread `019fa193-bbd6-7513-b4d7-bce1f25cf65b`), ~20 min, completed 2026-07-27 ~03:47Z.
- **First dispatch** `task-ms2nossx-hnnne2` self-halted per D-004 on the untracked `.serena/`
  tooling cache (no verdict, nothing touched); resolved via `.git/info/exclude`
  ([[INS-8ae8601e-5d15-4a36-8412-0e08504abcb1]]) and re-dispatched on the same thread.
- **Scope:** independent adversarial review of `g35-dossier.md` against the evidence archive
  at `C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\g35\`. Reviewer recomputed
  Keccak-256 independently (validated against standard vectors), re-decoded raw bodies, and
  re-parsed every retained sweep chunk.
- **Role separation (D-006):** the chain-historian lane sourced the evidence; Codex certifies;
  the integrator (this session) dispositions. No role overlap.
- **Worktree note:** reviewer observed "unrelated untracked W5 API files appeared during the
  read-only review" — that is the integrator's in-progress W5 S4 work (uncommitted
  `app/api/v1/**`, `lib/aegis/surfaces/api.ts`, `tests/api.test.ts`), unrelated to the review
  and untouched by it.

## Verdict: NEEDS-CORRECTIONS

"Do not promote the wave-3 rows to manifest grade yet. The two principal refutations are
sound: OP roles moved from `0x764682c7…` to `0x7a00657a…` at block `154619344`; the current
delegate by last event is the per-chain timelock on both ETH and OP. The gate fails because
several completeness conclusions, claim-strength tags, archive-integrity statements, and
Safe-history claims exceed what the retained evidence proves."

## Findings, verbatim

### 1. Derivations: confirmed, with one dossier omission

All values in §2.2 are correct (`RoleGranted`, `RoleRevoked`, `RoleAdminChanged`,
`DelegateSet(address,address)`, `MinDelayChange`, `Upgraded`, `PeerSet`, `PROPOSER_ROLE`,
`EXECUTOR_ROLE`, `CANCELLER_ROLE`, `TIMELOCK_ADMIN_ROLE`). The OZ 5.x distinction is
correct: `DEFAULT_ADMIN_ROLE = bytes32(0)`; `keccak256("DEFAULT_ADMIN_ROLE") = 0x1effbbff…`
correctly discarded as a decoy. **Omission:** `OwnershipTransferred(address,address)`
independently derives to `0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`;
it is used correctly by the scripts and raw decodes but is missing from the §2.2 topic
table. Add it.

### 2. OP role refutation: CONFIRMED

Raw role histories in §3.3 agree exactly across Tenderly, OP Labs, and OnFinality: 11/11
events on the full comparison key. At OP block `154619344`: logs 187/189/191 grant
proposer/executor/canceller to `0x7a00657a…`; log 193 grants canceller to `0x055a8b2b…`;
logs 195/197/199 revoke proposer/executor/canceller from `0x764682c7…`. All grant/revoke
senders decode to the timelock itself. The seven calls were scheduled at block `154486119`
with delay `259200`, then executed under the same operation ID at block `154619344`. The 11
OP Labs rate-limited chunks match the artifact's gaps; all 11 retained repair bodies are
successful empty results. No coverage gap remains.

### 3. Delegate refutation: CONFIRMED

Source and raw event shape in §4.1–§4.5 are correct: `DelegateSet` has one topic and
exactly two non-indexed data words (word 0 = `sender`, word 1 = `delegate`). Independent
raw-body decoding: ETH block `25296945` log 126 → word 0 `0xcd2eb13d…`, word 1
`0xcd425f44…`, ownership moves to the same timelock at log 127. OP block `154486119` log 64
→ word 0 `0x5a7facb9…`, word 1 `0x851dd540…`, ownership moves to the same timelock at log
65. Both receipts status `0x1`, dual-provider concordant. No word-offset error.

### 4. Sweep coverage: retained sweeps are contiguous

| Sweep | Chunks | Errors | Logs | Result |
|---|---:|---:|---:|---|
| ETH delegate, 250k, mevblocker | 103 | 0 | 6,368 | contiguous |
| ETH delegate, 250k, Tenderly | 103 | 0 | 6,368 | contiguous |
| ETH delegate, 100k, mevblocker | 257 | 0 | 6,368 | contiguous |
| OP delegate, 1M, Tenderly | 155 | 0 | 1,953 | contiguous |
| OP delegate, 10k, OP Labs | 3,384 | 0 | 1,756 | contiguous |
| OP roles, 10k, OP Labs | 1,534 | 11 repaired | 11 | complete after repairs |
| OP roles, 100k, OnFinality | 154 | 0 | 11 | contiguous |
| GAP-1, 10k, OP Labs | 2,966 | 0 | 18 | contiguous |

No off-by-one boundary or duplicate-log defect. The retained ETH 100k/250k event sets are
exactly equal; ETH 250k is also exactly equal across providers. OP delegate and role sets
are likewise provider-invariant.

## Per-claim disposition (§8 register)

| # | Disposition |
|---:|---|
| 1–2 | **CONFIRMED** as complete dual-provider event histories. |
| 3–4 | **CONFIRMED** triple-provider. "Safe" characterization remains separately single-provider. |
| 5 | **NEEDS CORRECTION.** Zero address-account role events is observed dual/triple. "EXECUTOR_ROLE is not open" is an inference conditional on the deployed code obeying the sourced AccessControl write/emission model. |
| 6 | **CONFIRMED AS INFERRED.** Existing `INFERRED + SOURCED` tag appropriate. |
| 7 | **TAG INCORRECT.** The cited schedule/execute receipts are dual-provider on both chains; the complete operation-history scan is single-provider. The `0xcd425…` `MinDelayChange` history is single-provider in this archive, not dual. |
| 8 | **NEEDS CORRECTION.** Runtime literals and construction event shapes confirmed, but exact "OZ 4.x/OZ 5.x" lineage is inferred without an exact deployed-bytecode/source build match. Use `INFERRED`, or say "OZ-4-style/OZ-5-style role model." |
| 9 | **CONFIRMED SOURCED.** |
| 10–12 | **CONFIRMED.** |
| 13 | **NEEDS CORRECTION.** The negatives are real, but "write path is closed" overstates them (see replacement text). |
| 14 | **CONFIRMED**, but the `g35` directory is not self-contained for the Tenderly half. |
| 15 | **NEEDS CORRECTION.** "OBSERVED-dual on ETH via two surfaces" violates the dossier's own definition of dual-provider. The claim is also broader than the decoded filters. |
| 16 | **CONFIRMED AS EVENT HISTORY.** Say "owner by last decoded event"; current storage remains an observed-side check. |
| 17 | **CONFIRMED AS EVENT HISTORY.** Likewise "minDelay by last decoded event." |
| 18 | **CONFIRMED** as an acquisition-time, single-provider Safe-service snapshot. |
| 19 | **NEEDS CORRECTION.** Current snapshots report identical owner sets; they do not prove the signer sets were identical at the rotation block or that the role change was a Safe "re-deployment." |
| 20–21 | **CONFIRMED** as limitations/non-claims. |

## Wrong assertions requiring correction

1. §3.2 line 293 says all nine role events were in one transaction "plus one later grant."
   There were eight construction role events; the transaction's ninth log is
   `MinDelayChange`. The ninth role event is the later canceller grant.
2. §4.2 lines 512–515 claims exact 100k/250k/1M set equality "on both providers." There was
   no Tenderly 100k sweep, and the two 1M bodies are gone. The ledger proves only their
   reported count, not exact set equality.
3. §9.2 line 901 says no claim depends on the lost bytes. The core delegate result does
   not, but the claimed exact 10× step-invariance does.
4. §3.6 lines 442–448 overstates Safe evidence: current matching snapshots do not prove
   the rotation preserved that signer set at block `154619344`; they do not prove
   "re-deployment"; Safe nonce zero does not exclude module/fallback execution — only
   nonce-consuming Safe transactions.
5. §3.5 lines 416–418 treats zero `Upgraded` events as proof that none of five contracts
   is a proxy and that no code swap occurred. Absence of this one event signature proves
   neither proposition.
6. §6.4 lines 797–798 says no hop has zero latency. That must be limited to the enumerated
   OApp configuration and upgrade routes. The dossier itself leaves Safe-internal changes,
   cancellation, pause, DVN key rotation, and vendor control outside that conclusion.

## Archive defect is understated

- The ledger has **170 rows**, not 156. Rows 157–170 are a second 14-block reorg recheck
  appended after the hardening sweeps.
- **Four paths — not two — have multiple ledgered digests:** two lost 1M delegate sweep
  artifacts (ledger lines 28–31); one overwritten failed ETH header response (lines 63 and
  66); one overwritten failed OP bytecode response (lines 105 and 108). The latter two do
  not affect surviving factual conclusions (successful replacements remain; the old OP
  error body survives under another filename), but the disclosure must say four path
  collisions.
- Inventory corrections: `raw/` = 146 files, 119 unique retained bodies, 22,897,975
  current bytes; ledger = 122 unique digests; `38,050,641` is the sum of the first 156
  ledger rows' byte counts (including duplicate acquisitions and lost bodies) — not "raw
  bytes retained"; the reorg script contains 14 pins, not 12, and was run twice; there are
  13 sweep ledger entries but only 10 unique sweep digests and eight retained sweep files.

## Unverifiable from `g35` alone

Not demonstrated false, but the supplied directory cannot independently certify them:

- GAP-1's Tenderly half. `gap1_compare.py` hardcodes the adjacent parent archive's
  `op_ratelimit_logs.json`; the two Tenderly raw bodies and their ledger rows are outside
  `g35`. Reviewer checked those adjacent raw bodies and the 18/18 comparison is correct,
  but the dossier package is not self-contained.
- Exact deployed-code binding to the archived OZ and LayerZero source files. Literals and
  event shapes corroborate the model but are not a byte-for-byte source build identity.
- Safe signer/threshold history at the role-rotation block.
- Process negatives such as "no explorer was used" or "no unledgered calls occurred." The
  ledger is consistent with them but cannot prove actions outside itself.

## Required replacement text

For the central write-path claim:

> Full Endpoint `DelegateSet` history through the pinned heads contains no later event for
> either OApp. The retained 555-call timelock operation histories contain no direct
> `setDelegate` selector, and no standard `Upgraded(address)` event post-dates either
> assignment. The 555-call scan is single-provider per chain; `Upgraded` coverage is
> dual-provider on ETH and single-provider on OP. These checks corroborate the last-event
> delegate result but do not independently prove exhaustive OApp reinitialization or every
> alternate code-replacement path.

For step invariance:

> Retained bytes prove exact equality between mevblocker's 100k and 250k sweeps and exact
> 250k cross-provider equality with Tenderly. The ledger records 6,368 results for both 1M
> sweeps, but their overwritten bodies prevent exact-set verification. The core delegate
> conclusion does not depend on those lost bodies; the former 10× exact-set claim is
> withdrawn.

"The same corrections must propagate to the blueprint's 'write path closed,' exact epoch,
construction-event-count, and 'every enumerated hop' wording before this gate can pass."

## Disposition status

- 2026-07-26 late: verdict persisted verbatim (this file). Corrections to
  `g35-dossier.md` and `blueprint.md` pending; scoped Codex re-verification after patching;
  NO wave-3 row is manifest-grade until the gate passes (D-006).
- 2026-07-26 late +1: all 36 corrections applied supersede-in-place (`9af7c23`); scoped
  re-verification dispatched on the same thread.

---

# Round 2 — scoped re-verification (task-ms2q246k-vefeop, ~9 min): FURTHER-CORRECTIONS

"Commit `9af7c23` applies most corrections correctly, but the gate does not pass. Several
superseded claims remain asserted live outside strikethrough, including in blueprint rows
intended for promotion. The two principal findings remain confirmed."

All 6 wrong-assertion primary sites, both VERBATIM replacement texts, the §2.2 addition,
the §8 register tags/caveats, the archive totals, and blueprint G-10/note-4/claim-7/claim-18
propagations: **PASS**. The gate blocks on live repeats outside the corrected sites.

## Blocking corrections still required (verbatim)

1. **§4.7 still claims exhaustive closure** (dossier ~635–647: "exactly two possible
   writers", reinitialization "reachable only via a proxy upgrade", "Closed", "no
   re-initialisation has occurred since"). Replace/supersede with: "The reviewed source
   exposes two relevant write routes. No standard `Upgraded(address)` event post-dates
   either assignment, but that absence does not prove that reinitialization or every
   alternate code-replacement path is impossible."
2. **Withdrawn 1M exact-set claim live in §10** (~1021–1025: code block
   "`ETH adapter delegate history identical at all step sizes: True`" presented as active
   evidence). Mark the output line explicitly superseded; exact equality retained only for
   100k/250k and 250k cross-provider; 1M is count-only.
3. **Claim 15's uncapped negative live in §5.5** (~735: "`ANY post-timelock write touching
   30111/30101: False`"). Replace with: "No post-window touch appears in the decoded OP
   rate-limit/`PeerSet` event filters or the decoded ETH timelock `CallExecuted` selector
   filters. This does not exclude every possible write path."
4. **Exact OZ lineage asserted live** in §1 (~57–63), the §3.7 table (~483), §7 (~863).
   Strike exact versions; only `OZ-4-style`/`OZ-5-style`, tagged INFERRED.
5. **Claims 16/17 current-state language live** in §1 (~96–100), §6.1 (~770), §6.2 (~795),
   §7 (~860); propagates to blueprint E2 (~48), S2 (~108), S7 (~146), G-06 (~174), G-07
   (~175). Required formulation: "Owner/minDelay by last decoded event; no later
   corresponding standard event appears through the pinned head. Current storage remains a
   separate observed-side check."
6. **Safe historical equality/redeployment asserted** at dossier ~864 ("identical 7-of-7
   signer set across the OP rotation"), ~907–910 ("an identically-signed Safe received
   them"); blueprint G-08 ~176 ("re-deployment"). Replace with "acquisition-time snapshots
   report identical current owner sets"; the historical event is a role/address rotation —
   not a redeployment.
7. **Claim 5's inference cap not propagated** to §6.3 (~812–816), §12 (~1073–1079),
   blueprint S7 (~144–146). Each must carry: "Zero `address(0)` role events are observed;
   'not open' is INFERRED, conditional on the deployed code obeying the sourced
   AccessControl write/emission model."
8. **Exact sweep-collision pairs incomplete** in §9.2 (~938–952, says only "ledger lines
   28–31"). Required exact mapping: mevblocker sweep ledger **28/30** (same-digest repeat
   **32**); Tenderly sweep **29/31** (repeat **43**); ETH header **63/66**; OP epoch
   bytecode **105/108**.

## Wrong vs archive-unverifiable (round-2 framing)

- Wrong as logical assertions: §4.7's closure chain; §5.5's ANY-write negative.
- Not shown false but unverifiable from the retained archive: exact 1M set equality, exact
  OZ 4.x/5.x lineage, signer equality at the rotation block / "redeployment", current
  owner/minDelay storage, unconditional "EXECUTOR_ROLE not open".

Non-gating administrative note from the reviewer: `9af7c23` also changed a roadmap insight
file beyond the two named research files (the incident capture — roadmap/** capture is
always in scope; recorded here for completeness).

## Disposition status (round 2)

- Round-2 verdict persisted (this section). The 8 blocking items are being applied
  supersede-in-place; scoped round-3 re-verification follows. NO wave-3 row is
  manifest-grade until GATE-PASSES (D-006).

# Round 3 — scoped re-verification (2026-07-29)

Fresh Codex session (thread continuity died with the prior session — per
[[INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a]] the persisted rounds above were the context
source). Verbatim verdict follows.

---

[codex task-ms7482ph-qne68w | completed | ~26min | fresh session (thread 019fb1a6-0e33-7883-a879-382621c93945) — verified against written record per coordinator's established pattern, HEAD 9de8a29]

# Verdict: FURTHER-CORRECTIONS

HEAD is `9de8a297a0607470ff2abedadc281dc569d6e291`; the tree is clean, and both subject files are byte-identical to `d96eb8d`. All eight round-2 corrections pass. One additional live overclaim remains in Blueprint S3, so the wave-3 rows must not yet be promoted.

## Round-2 checklist

| Item | Disposition |
|---|---|
| a. §4.7 closure | **PASS.** Exhaustive language is struck at §4.7 lines 644–670; the corrected corroboration passage is present at lines 672–679. Blueprint mirrors the correction at §2 line 38 and E4 line 60. |
| b. §10 quoted output | **PASS.** The quoted line remains byte-verbatim at line 1059, unchanged from `9af7c23`; the immediately adjacent note withdraws it and correctly distinguishes exact 100k/250k and 250k cross-provider equality from 1M count-only evidence at lines 1062–1067. |
| c. §5.5 ANY-write negative | **PASS.** The old assertion is struck and replaced by the within-filters formulation, including the alternate-path limitation, at lines 752–773. |
| d. OZ lineage | **PASS.** OZ-4-style/OZ-5-style and INFERRED appear in dossier §1 lines 57–65, §3.7 lines 491–503, and §7 line 893, plus Blueprint G-10 line 178. Exact version phrases survive only in strikethrough or correction explanations. |
| e. Claims 16/17 | **PASS.** Correctly capped in dossier §1 lines 98–110, §6.1 lines 782–797, §6.2 lines 805–824, and §7 lines 890–892. Blueprint propagation is present at E2 lines 48–49, S2 line 108, S7 line 146, and G-06/G-07 lines 174–175. |
| f. Safe history | **PASS.** Acquisition-time snapshot and historical non-proof language appears at dossier §3.6 lines 469–475, §7 line 894, and §8 lines 932–940; Blueprint carries it at S7 line 142, line 151, and G-08 line 176. "Re-deployment" remains only struck, negated, or in correction notes. |
| g. Claim-5 inference cap | **PASS.** Present in dossier §6.3 lines 840–846 and §12 lines 1111–1120, and in all three Blueprint S7 timelock rows at lines 144–146. |
| h. Collision mapping | **PASS.** Exact mapping is present at §9.2 lines 968–979: mevblocker 28/30 with repeat 32; Tenderly 29/31 with repeat 43; ETH header 63/66; OP bytecode 105/108. |

## Judgment calls

1. **Blueprint S3: yes, it needs the by-last-decoded-event cap.**
   S3 line 121 says "set once … never changed." The evidence establishes decoded `PeerSet` history, not a separate current-storage read. The same issue also appears as "current value" at line 122 and "Both current values" in G-03 line 171.

   Required formulation:

   > Peer by last decoded `PeerSet`; no later corresponding `PeerSet` appears through the pinned head. Current storage remains a separate observed-side check.

   Apply it to both S3 rows and change G-03's "Both current values" to "Both values by last decoded `PeerSet`."

2. **Blueprint G-08 item (4): acceptable.**
   At G-08 line 176, "tag carried verbatim" refers to the corrected `OBSERVED-single, facts class` strength, while the subject is explicitly the **current** owners/threshold. Item (5) supplies the set-equality and no-motive/redeployment limitations; S7 independently supplies the acquisition-time and historical-block cap at lines 142 and 151. No correction is required there.

Apart from the S3/G-03 peer wording above, no other live correction-class overclaim remains outside strikethrough, quoted-output-with-adjacent-withdrawal, negation, or explicit correction-note contexts.

Codex session ID: 019fb1a6-0e33-7883-a879-382621c93945
Resume in Codex: codex resume 019fb1a6-0e33-7883-a879-382621c93945

---

## Disposition status (round 3)

- Round-3 verdict persisted (this section) BEFORE the correction dispatch, per
  [[INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a]].
- Blocking set: ONE item — Blueprint S3 peer wording (lines 121–122) + G-03 line 171,
  required formulation quoted verbatim above. Judgment call 2 (G-08 item 4): no change.
- Being applied supersede-in-place; scoped round-4 re-verification follows. NO wave-3 row
  is manifest-grade until GATE-PASSES (D-006), and row promotion remains owner-gated
  regardless of the gate.

# Round 4 — convergence check (2026-07-29)

Resumed Codex thread `019fb1a6-0e33-7883-a879-382621c93945` (the round-3 session — the
registry entry survived this time). Verbatim verdict follows.

---

[codex task-ms74umgq-mmhc4k | completed | ~3min | resumed thread 019fb1a6-0e33-7883-a879-382621c93945 (round-3 session, registry entry survived)]

# Verdict: GATE-PASSES

Verified at HEAD `aa52a6513fe6f255eac9d78bacc1ea73c6838e61`. The persisted round-3 blocker is correctly resolved.

- **S3 L1 row — PASS:** required wording is verbatim; "never changed" is struck and the round-3 supersession marker is present at blueprint.md:121.
- **S3 OP row — PASS:** required wording is verbatim; "to the current value" is struck and the round-3 marker is present at blueprint.md:122.
- **G-03 row — PASS:** "both current values" is struck and replaced with "both values by last decoded `PeerSet`," with a round-3 marker at blueprint.md:171.

Judgment calls:

- **"This row's expected value" — acceptable.** At line 122, it identifies the expected-side table value assigned by the decoded historical event. It does not assert current storage, and the immediately following prescribed wording explicitly preserves that boundary.
- **"; the" → ". The" — cosmetic only.** The sentence break changes no claim content and leaves the required formulation complete and verbatim at line 122.

No other correction-class overclaim was introduced or re-exposed by the three-line edit. The dossier remains unchanged, and unrelated W5 S6 files were excluded from review.

The Codex correction gate is closed; wave-3 rows may now proceed to manifest-grade promotion under the project's owner-controlled promotion process.

Codex session ID: 019fb1a6-0e33-7883-a879-382621c93945
Resume in Codex: codex resume 019fb1a6-0e33-7883-a879-382621c93945

---

## Disposition status (round 4 — LOOP CONVERGED)

- **The wave-3 Codex convergence loop is CLOSED: GATE-PASSES at round 4** (rounds:
  NEEDS-CORRECTIONS 36 → FURTHER-CORRECTIONS 8 → FURTHER-CORRECTIONS 1 → GATE-PASSES),
  findings narrowing monotonically, per [[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]].
- Wave-3 rows are now PROMOTABLE per their corrected tags. **Promotion itself remains an
  owner/phase-review action** — nothing in this file promotes anything (HITL barrier;
  D-006 quarantine of INFERRED/lane-reported material from manifest-grade use still
  applies row by row).
- Next in this lane: the re-posed G-08 charter (OP Safe
  `0x7a00657a45420044bc526B90Ad667aFfaee0A868`).
