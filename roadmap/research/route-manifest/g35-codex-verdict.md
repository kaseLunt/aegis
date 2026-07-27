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
