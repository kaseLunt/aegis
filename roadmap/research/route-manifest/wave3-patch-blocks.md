# WAVE-3 PATCH BLOCKS — `roadmap/research/route-manifest/blueprint.md`

**Drafted:** 2026-07-26, route-cartographer persona (wave-3 blueprint patch pass).
**Drafting only.** This file edits nothing; the integrator (main session) applies and commits.
**Evidence base:** `roadmap/research/route-manifest/g35-dossier.md` (lane G35), with the
pause/resume audit trail in `g35-lane-report.md` and the gap charters in
`g02-04-execution-order.md` §7. Every value below is traceable to a cited dossier section;
nothing is invented.

**Claim-strength cap on EVERY block (do not drop when applying):** the G35 dossier is the
lane's own report — dual/three-provider concordant where stated — **NOT independently
reviewed** (dossier integrator provenance note). Every wave-3-derived row is
**lane-reported pending independent review**; no wave-3 value is manifest-grade until that
review lands. Claim-strength vocabulary is carried verbatim from dossier §8:
OBSERVED-dual / OBSERVED-triple / OBSERVED-single / SOURCED / INFERRED / facts-class.
Per D-006 this pass sources expected-side content only: no observed-side check is
implemented or certified here, and no dossier code hash may seed `expectedRuntimeCodeHash`
(dossier §2.7 anti-seeding rule).

**Conventions:** supersede-in-place — old text stays visible under `~~strikethrough~~`,
replacement follows in a `*[superseded — wave-3, g35 §X]*` / `*[REFUTED — wave-3, g35 §X]*`
bracket with the dossier citation. Addresses are reproduced in the case the dossier uses;
manifest authoring lowercases them (blueprint §1 rule). Each block gives an **Anchor**
(unique existing text to locate), an **Operation**, and the **Patch** text.

---

## PB-01 — Header comment: wave-3 status stamp *(covers g)*

**Anchor:** the header HTML comment sentence ending `…the CLOSED G-01 review finding stays closed.` (immediately before `D-006: this document sources`).
**Operation:** insert after that sentence, inside the comment.
**Patch:**

> ROUND-9 / WAVE-3 AMENDMENT 2026-07-26 (evidence dossier: `roadmap/research/route-manifest/g35-dossier.md`, chain-historian standing lane G35; pause/resume audit trail: `g35-lane-report.md`): g02-04 GAP-3 / GAP-5 / GAP-1 CLOSED and blueprint G-06 / G-07 CLOSED on decoded governance-execution history. The wave-2 "presumed proposer/executor = controller Safe" rows are superseded — TRUE on ETH, REFUTED on OP as of OP blk 154619344 (2026-07-23; roles migrated to Safe `0x7a00657a…`, identical 7-of-7 signer set, g35 §3.3/§3.6). The "delegate-gated path NOT proven timelocked, zero latency floor" organizing-thesis claims (§5.1/E4/E5) are REFUTED — the delegate on BOTH chains is the per-chain timelock itself (ETH `0xcd425f44…` since blk 25296945, OP `0x851dd540…` since blk 154486119, g35 §4). The L1 timelock minDelay "≤259,200 s bound" is superseded by 864,000 s since ETH blk 24982415 (g35 §6.2). G-08 is RE-POSED on the new OP Safe `0x7a00657a…` (g35 NEW-1). CLAIM-STRENGTH CAP on every wave-3 row: G35 is the lane's own report, dual/three-provider concordant where stated, NOT independently reviewed — no wave-3-derived value is manifest-grade until independent review (Codex or second lane) lands; prior review-loop stamps cover waves 1–2 only and are untouched.

**Evidence:** g35 integrator provenance note; g35 §1, §3.3, §4, §6.2, §11.
**Claim strength:** meta (status), carrying the dossier's own cap.

---

## PB-02 — §2 organizing thesis: delegate clock refuted; revised threat picture *(covers b)*

**Anchor:** §2 opening paragraph, from `delegate-gated surfaces (send/receive libraries, ULN/DVN config) are **NOT proven timelocked**` through `…the fastest quiet-rotation route an adversary holds.`
**Operation:** supersede-in-place (strike the quoted span; keep everything before it in the paragraph).
**Patch:**

> ~~delegate-gated surfaces (send/receive libraries, ULN/DVN config) are **NOT proven timelocked** — `delegates()` is unread (g02-04 GAP-5), so their honest latency floor remains zero. That split is the manifest's most important fact — it dictates freshness policy per surface, and the unproven delegate path is now the fastest quiet-rotation route an adversary holds.~~ *[REFUTED — wave-3, g35 §4 (lane-reported, pending independent review): the delegate on both chains is the per-chain timelock itself — ETH adapter delegate = `0xcd425f44…` since ETH blk 25296945 (tx `0x15f25bb0…`, DelegateSet logIdx 126 in the same tx as the OwnershipTransferred at logIdx 127), OP OFT delegate = `0x851dd540…` since OP blk 154486119 (tx `0xfc990c72…`, logIdx 64/65); both OBSERVED-dual. Behaviourally corroborated on an independent evidence surface: at ETH blk 25418960 the ETH timelock successfully executed `setSendLibrary`/`setReceiveLibrary`/`setConfig` on the Endpoint, which gates all three behind `_assertAuthorized(_oapp)` = OApp-or-delegate (g35 §4.6, OBSERVED-dual receipt + SOURCED). The delegate write path is closed: 0 `setDelegate` (`0xca5eb5e1`) occurrences across all 548 ETH + 7 OP scheduled timelock calls, and no `Upgraded` post-dates the assignments (last: ETH blk 21366263, OP blk 129082737) — g35 §4.7 (delegate history OBSERVED-dual both chains; `Upgraded` OBSERVED-dual ETH / OBSERVED-single OP; write-path enumeration SOURCED).]* The delegate-gated path IS the timelocked path. The thesis, restated for wave-3: **every enumerated on-chain hop of this route now has a non-zero latency with a decoded block anchor** (g35 §6.4), on three clocks — 172,800 s (ETH OApp config *and* libraries/DVN, owner and delegate both = `0xcd425f44…`), 259,200 s (OP OApp config, libraries/DVN, *and* code — the OP proxy admin's owner is the same timelock), 864,000 s (L1 code: proxy admin `0xa9E9bBf0…` owned by `0x9f26d4C9…`, minDelay 864,000 s since ETH blk 24982415 — g35 §6.1/§6.2, OBSERVED-dual). All floors are time-varying properties with validity windows, not constants: before ETH 25296945 / OP 154486119 the delegates were the controller Safes with zero enforced delay, and any Rewind reconstruction of those windows must return the Safe, not the timelock (g35 §7 caveat 2). **The revised threat picture — what quiet-rotation routes remain:** (1) DVN-operator offchain key rotation — invisible, latency unknowable, outside the trust boundary (unchanged from wave-2); (2) signer rotation *inside* a proposer Safe — instant, and invisible to every route predicate until Safe storage is read (G-09, facts-only); the 2026-07-23 OP rotation demonstrates control-plane authority replacement as live practice, executed with exactly one timelock delay of public notice (g35 §3.4); (3) the instant liveness powers — cancellation by the canceller Safes and pause by the pauser entities — visible when used, and an observed pause is not an exploit (forbidden inference); (4) and every timelock delay is warning time only for a watcher of `CallScheduled` — the delay changes detection budget, not blast radius. The minDelay floors cannot themselves be quietly lowered: both route timelocks self-administer through their own delay and neither has an external admin (g35 §3.5.4 — INFERRED from OBSERVED event count + SOURCED OZ constructor). Scope cap: this enumeration covers ether.fi-authored authority; vendor-side authority (Endpoint code governance, the DVN contracts' own admins) is outside it, and §5.4's negative-proof cap stands.

**Evidence:** g35 §4.3–§4.7, §6.4, §3.4, §3.5, §6.1–§6.2, §8 claims 7, 10–13, 16–17.
**Claim strength:** OBSERVED-dual (delegate assignments, behavioural corroboration, G-06/G-07), OBSERVED-single (OP `Upgraded` leg), INFERRED+SOURCED (no-external-admin) — all lane-reported, pending independent review.

---

## PB-03 — §2 E2 changing authority: OP roles enumerated; L1 proxy-admin owner closed *(covers a, c)*

**Anchor:** E2 `**Changing authority:**` bullet, from `proposer/executor = OP controller Safe (SOURCED WR2 §1b, P2, P8` through `owner **not established** (GAP G-06).`
**Operation:** supersede-in-place, twice within the bullet.
**Patch (OP half):**

> ~~proposer/executor = OP controller Safe (SOURCED WR2 §1b, P2, P8 — deploy-script declaration; on-chain `RoleGranted` enumeration outstanding, g02-04 GAP-3 class)~~ *[superseded — wave-3, g35 §3.3: enumeration complete, block 0 → head, OBSERVED-triple (Tenderly + OP Labs + OnFinality). The deploy-script declaration is stale: the OP controller Safe `0x764682c7…` held PROPOSER+EXECUTOR+CANCELLER from OP blk 139414997 and all three were REVOKED at OP blk 154619344 (2026-07-23, tx `0x36d3ed1c…`), granted in the same batch to Safe `0x7a00657a…`, plus CANCELLER-only to `0x055a8B2B…`. The proxy-admin ownership itself is now dated with decoded events: `0x632304Ed…` owner chain deployer → Safe (OP blk 121917486) → L2 timelock (OP blk 139705022), g35 §6.1, OBSERVED-single. EXECUTOR_ROLE is NOT open (zero `address(0)` grants — g35 §1, OBSERVED-triple + SOURCED). Lane-reported, pending independent review.]*

**Patch (L1 half):**

> ~~owner **not established** (GAP G-06)~~ *[superseded — wave-3, g35 §6.1: **G-06 CLOSED** — `0xa9E9bBf0…` has exactly one `OwnershipTransferred`, at its deployment block ETH 20865339, to `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` (WR2's L1 timelock); never changed. OBSERVED-dual, lane-reported.]*

**Evidence:** g35 §3.3, §6.1; §8 claims 3–5, 16.
**Claim strength:** as bracketed above.

---

## PB-04 — §2 E2 latency: L1 upgrades are 10 days, not "possibly instant" *(covers c)*

**Anchor:** E2 `**Latency:**` bullet, `L1 upgrades: **unknown** — possibly instant if the proxy admin is Safe-owned. The manifest must not print a delay it cannot source.`
**Operation:** supersede-in-place; keep the closing principle sentence.
**Patch:**

> ~~L1 upgrades: **unknown** — possibly instant if the proxy admin is Safe-owned.~~ *[superseded — wave-3, g35 §6.1 + §6.2: L1 upgrades ≥ **864,000 s (10 days)** — the proxy admin's owner is L1 timelock `0x9f26d4C9…`, whose `MinDelayChange` history closes at 259,200 → 864,000 at ETH blk 24982415; the 259,200 s figure is a superseded state (live ETH blk 19384524 → 24982415). OBSERVED-dual, lane-reported, pending independent review. The delay is a time-varying property: Rewind boundaries before blk 24982415 use the ladder in g35 §6.2.]* The manifest must not print a delay it cannot source — the sourcing requirement is now met for this cell at lane-reported strength.

**Evidence:** g35 §6.1, §6.2; §8 claims 16–17.
**Claim strength:** OBSERVED-dual, lane-reported.

---

## PB-05 — §2 E3: proposer/executor presumption resolved (split verdict) *(covers a)*

**Anchor:** E3 `**Changing authority:**` bracket, `The controller Safes are prior owners, presumed proposer/executor on the timelocks — presumption open at g02-04 GAP-3.`
**Operation:** supersede-in-place.
**Patch:**

> ~~The controller Safes are prior owners, presumed proposer/executor on the timelocks — presumption open at g02-04 GAP-3.~~ *[superseded — wave-3, g35 §3.2/§3.3: presumption resolved with a split verdict. TRUE on ETH — `0x2aCA7102…` holds PROPOSER+EXECUTOR+CANCELLER on `0xcd425f44…` since ETH blk 22089226, never revoked (OBSERVED-dual). REFUTED on OP — `0x764682c7…`'s roles were revoked at OP blk 154619344; live holder is Safe `0x7a00657a…` (OBSERVED-triple). Lane-reported, pending independent review.]*

**Evidence:** g35 §3.2, §3.3; §8 claims 1, 3–4.

---

## PB-06 — §2 E4 changing authority: delegate identified — it is the timelock *(covers b)*

**Anchor:** E4 `**Changing authority:**` bullet, from `Intended delegate = controller Safes (derived — WR2 §1c; live value GAP G-08).` through `…the incumbent delegate's library/config powers are not proven timelocked.]*`
**Operation:** supersede-in-place (the round-8 bracket stays visible inside the strike).
**Patch:**

> ~~Intended delegate = controller Safes (derived — WR2 §1c; live value GAP G-08). *[Round-8 / wave-2: `delegates()` is still unread — g02-04 GAP-5 — and the ownership move to timelocks does NOT extend here: `setDelegate` is owner-gated, so rotating the delegate is now timelocked, but the incumbent delegate's library/config powers are not proven timelocked.]*~~ *[REFUTED — wave-3, g35 §4: incumbent delegate by last decoded Endpoint `DelegateSet` event = the per-chain timelock — ETH `0xcd425f44…` since blk 25296945, OP `0x851dd540…` since blk 154486119, each assigned in the same transaction as the ownership transfer (g35 §4.5); OBSERVED-dual on both chains. Behavioural corroboration: the ETH timelock executed `setSendLibrary`/`setReceiveLibrary`/`setConfig` on the Endpoint at ETH blk 25418960 (g35 §4.6, OBSERVED-dual receipt + SOURCED `_assertAuthorized`). Write path closed: no scheduled `setDelegate` in 548 ETH + 7 OP timelock calls; no `Upgraded` after ETH blk 21366263 / OP blk 129082737 (g35 §4.7; `Upgraded` OBSERVED-dual ETH / OBSERVED-single OP). Prior delegates, for Rewind: deployer, then the controller Safes (ETH blk 20865365 → 25296945; OP blk 121196110 → 154486119), zero enforced delay in those windows (g35 §4.3/§4.4). Method note the observed lane inherits: the OApp emits NO delegate event — `DelegateSet(address sender, address delegate)` lives on the Endpoint with both params non-indexed, so only a full-history data-side sweep is sound (g35 §4.1, SOURCED). Lane-reported, pending independent review.]*

**Evidence:** g35 §4.1–§4.7; §8 claims 9–13.

---

## PB-07 — §2 E4 latency: zero floor superseded by time-varying timelock floor *(covers b)*

**Anchor:** E4 `**Latency:**` bullet, `zero for the incumbent delegate — and "one Safe execution" is itself unproven until the delegate is identified *[round-8 / wave-2: delegate-gated path NOT proven timelocked — g02-04 GAP-5; zero remains the honest latency floor]*.`
**Operation:** supersede-in-place; the default-fallback caution that follows stays untouched.
**Patch:**

> ~~zero for the incumbent delegate — and "one Safe execution" is itself unproven until the delegate is identified *[round-8 / wave-2: delegate-gated path NOT proven timelocked — g02-04 GAP-5; zero remains the honest latency floor]*.~~ *[superseded — wave-3, g35 §4/§6.4: time-varying — zero (Safe-delegate era) before ETH blk 25296945 / OP blk 154486119; **≥ 172,800 s ETH / ≥ 259,200 s OP** at and after those blocks, because the delegate is the timelock and a library change now requires a scheduled operation. Lane-reported, pending independent review.]*

**Evidence:** g35 §4, §6.4; §7 row "§2 E4, E5, E7 + §5.1".

---

## PB-08 — §2 E5 changing authority + latency: same closure for ULN/DVN config *(covers b)*

**Anchor 1:** E5 `**Changing authority:**` bullet, the round-8 bracket `*[round-8 / wave-2: same unidentified delegate, same zero-latency floor — `delegates()` unread (g02-04 GAP-5); the owner-to-timelock handover does not cover this path, and "Safes" was a derived claim, never a decode.]*`
**Operation:** strike that bracket in place and append.
**Patch 1:**

> ~~*[round-8 / wave-2: same unidentified delegate, same zero-latency floor — `delegates()` unread (g02-04 GAP-5); the owner-to-timelock handover does not cover this path, and "Safes" was a derived claim, never a decode.]*~~ *[REFUTED — wave-3, g35 §4: the delegate is identified by decoded Endpoint history — the per-chain timelock (ETH `0xcd425f44…` since blk 25296945; OP `0x851dd540…` since blk 154486119; OBSERVED-dual both chains). `setConfig` authority therefore runs on the timelock clock since those blocks, and on the Safe clock (zero delay) before them. Lane-reported, pending independent review.]*

**Anchor 2:** E5 `**Latency:**` bullet, `zero for the config (delegate-gated, NOT proven timelocked — g02-04 GAP-5); unknowable for DVN-internal key rotation.`
**Patch 2:**

> ~~zero for the config (delegate-gated, NOT proven timelocked — g02-04 GAP-5);~~ *[superseded — wave-3, g35 §4/§6.4: time-varying — zero before ETH blk 25296945 / OP blk 154486119, ≥ 172,800 s ETH / ≥ 259,200 s OP since; lane-reported]*; unknowable for DVN-internal key rotation.

*(The DVN veto/liveness caution in this bullet is preserved verbatim — do not weaken.)*

**Evidence:** g35 §4, §6.4; §8 claims 10–12.

---

## PB-09 — §2 E8 authority/latency: roles enumerated, delegate closed, EXECUTOR not open *(covers a, b)*

**Anchor 1:** E8 `**Changing authority and latency:**` bullet, `` `setDelegate` — owner, same time-varying latency (delegate *rotation* is now timelocked; the incumbent delegate's own powers are not — g02-04 GAP-5).``
**Patch 1:**

> `setDelegate` — owner, same time-varying latency ~~(delegate *rotation* is now timelocked; the incumbent delegate's own powers are not — g02-04 GAP-5)~~ *[superseded — wave-3, g35 §4: the incumbent delegate IS the per-chain timelock on both chains (OBSERVED-dual), so delegate rotation and delegate powers run on the same timelock clock since ETH blk 25296945 / OP blk 154486119; lane-reported]*.

**Anchor 2:** same bullet, `the Safes' surviving control-plane standing (presumed proposer/executor on the timelocks) is unestablished — g02-04 GAP-3.`
**Patch 2:**

> ~~the Safes' surviving control-plane standing (presumed proposer/executor on the timelocks) is unestablished — g02-04 GAP-3.~~ *[superseded — wave-3, g35 §3: standing enumerated, block 0 → head. ETH: controller Safe `0x2aCA7102…` = PROPOSER+EXECUTOR+CANCELLER on `0xcd425f44…` since ETH blk 22089226, never revoked (OBSERVED-dual). OP: controller Safe `0x764682c7…` REVOKED at OP blk 154619344; live P/E/C = Safe `0x7a00657a…` (OBSERVED-triple). Canceller-only Safe `0x055a8B2B…` holds CANCELLER on all three control-plane timelocks (ETH blk 25533308 / 25533314; OP blk 154619344 — g35 §3.2/§3.3/§6.3). EXECUTOR_ROLE is NOT open on either route timelock — zero `address(0)` grants over the full histories (OBSERVED-dual/triple + SOURCED: the OZ event stream is the role state, g35 §3.5). Neither timelock has an external admin — exactly one admin-role grant each, to `address(this)` (INFERRED from OBSERVED event count + SOURCED OZ constructor, g35 §3.5). Lane-reported, pending independent review. The signer-rotation caution stands and is sharpened: signer rotation inside `0x2aCA7102…` or `0x7a00657a…` is now the fastest quiet change of effective control on this route.]*

**Evidence:** g35 §3.2–§3.5, §6.3, §4; §8 claims 1–6, 10–11.

---

## PB-10 — §3 S2 table: L1 adapter proxy admin row — owner gap closed *(covers c)*

**Anchor:** S2 row `| L1 adapter proxy admin | `0xa9E9bBf04F95688D7fd82036f83544630E463CAc` | SOURCED WR1 §2.2; owner **GAP G-06** |`
**Operation:** replace the Tag cell.
**Patch:**

> SOURCED WR1 §2.2; ~~owner **GAP G-06**~~ *[superseded — wave-3, g35 §6.1: **G-06 CLOSED** — owner `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` since deployment blk 20865339, exactly one `OwnershipTransferred`, never changed; OBSERVED-dual, lane-reported, pending independent review]*

**Evidence:** g35 §6.1; §8 claim 16.

---

## PB-11 — §3 S7 table: L1 controller Safe row — presumption confirmed; delegate half closed *(covers a, b)*

**Anchor:** S7 row beginning `| L1 controller Safe (L1 adapter:` … Tag cell ending `delegate half still **GAP G-08 / g02-04 GAP-5** |`
**Operation:** replace the parenthetical in the Entry cell and the tail of the Tag cell.
**Patch (Entry cell parenthetical):**

> (L1 adapter: ~~intended owner + delegate~~ *[round-8 / wave-2: owner role SUPERSEDED on-chain at ETH blk 25296945 — g02-04 §6.1; continuing role = ~~presumed timelock proposer/executor, open at g02-04 GAP-3~~ *[wave-3, g35 §3.2: PROPOSER+EXECUTOR+CANCELLER on `0xcd425f44…` since ETH blk 22089226, never revoked — OBSERVED-dual, lane-reported]*]*)

**Patch (Tag cell tail):**

> ~~delegate half still **GAP G-08 / g02-04 GAP-5**~~ *[superseded — wave-3, g35 §4.3: delegate history complete — this Safe WAS the ETH adapter's delegate from blk 20865365 to blk 25296945 (zero-delay era, Rewind must honor); current delegate = the timelock `0xcd425f44…` (OBSERVED-dual). GAP-5 closed; lane-reported, pending independent review]*

**Evidence:** g35 §3.2, §4.3; §8 claims 1, 10.

---

## PB-12 — §3 S7 table: OP controller Safe row — standing REFUTED as of blk 154619344 *(covers a, b)*

**Anchor:** S7 row beginning `| OP controller Safe (OP OFT:` … Tag cell ending `delegate/role-admin halves still **G-08 / g02-04 GAP-5** |`
**Operation:** replace the Entry-cell parenthetical and the Tag-cell tail.
**Patch (Entry cell parenthetical):**

> (OP OFT: ~~intended owner~~ *[round-8 / wave-2: owner role SUPERSEDED at OP blk 154486119 — g02-04 §6.1; ~~presumed proposer/executor, GAP-3 class~~ *[REFUTED — wave-3, g35 §3.3: PROPOSER+EXECUTOR+CANCELLER held OP blk 139414997 → 154619344, then REVOKED (2026-07-23, tx `0x36d3ed1c…`) and granted to Safe `0x7a00657a…` — OBSERVED-triple. Validity interval retained for Rewind: any OP boundary in [139414997, 154619344) returns `0x764682c7…` as proposer/executor. Authoring this Safe as a live proposer/executor today would manufacture a false control-plane claim (g35 §7).]*]* + delegate + role-admin claims)

**Patch (Tag cell tail):**

> ~~delegate/role-admin halves still **G-08 / g02-04 GAP-5**~~ *[superseded — wave-3, g35 §4.4 + §3.3: delegate history complete — this Safe WAS the OP OFT's delegate from blk 121196110 to blk 154486119 (zero-delay era); current delegate = the OP timelock `0x851dd540…` (OBSERVED-dual). Role-admin: the OP timelock's admin is itself (`bytes32(0)` self-grant, no external admin — g35 §3.3/§3.5). G-08's remaining subject is the NEW Safe `0x7a00657a…` — see the re-posed G-08 row. Lane-reported, pending independent review]*

**Evidence:** g35 §3.3, §3.5, §4.4; §8 claims 3–4, 11.

---

## PB-13 — §3 S7 table: NEW ROW — incoming OP proposer/executor/canceller Safe `0x7a00657a…` *(covers a, d)*

**Anchor:** insert as a new row immediately after the OP controller Safe row (PB-12's row).
**Operation:** insert row.
**Patch:**

> | **OP timelock proposer/executor/canceller Safe** *[NEW ENTITY — wave-3, g35]* | `0x7a00657a45420044bc526B90Ad667aFfaee0A868` — PROPOSER + EXECUTOR + CANCELLER on OP timelock `0x851dd540…` since OP blk 154619344 (2026-07-23, tx `0x36d3ed1c…`) | g35 §3.3, **OBSERVED-triple** (Tenderly + OP Labs + OnFinality), lane-reported pending independent review. The rotation was itself a timelocked 7-call batch — scheduled OP blk 154486119 with delay word 259,200 s, executed after ≈266,450 s; grants precede revokes within the batch so the timelock is never role-less (g35 §3.4, OBSERVED-single per chain, delay cross-checked against `MinDelayChange` OBSERVED-dual on ETH — claim 7 tag carried verbatim). Facts sub-entries (g35 §3.6, **OBSERVED-single**, Safe transaction service — facts-only, never a predicate): Safe 1.3.0+L2, threshold 4 of 7 owners, nonce 1; signer-set delta vs outgoing Safe `0x764682c7…` **IDENTICAL — 7 of 7 shared, 0 added, 0 removed, same 4-of-7 threshold** — a Safe re-deployment, not a change of signing body, reported as fact with no motive claimed (g35 §3.6, §8 claims 19, 21). No located repo-side declared-intent artifact (g35 NEW-1) — **G-08 re-posed on this entity** |

**Evidence:** g35 §3.3, §3.4, §3.6, §11 NEW-1; §8 claims 4, 7, 19, 21.

---

## PB-14 — §3 S7 table: NEW ROW — cross-chain canceller Safe `0x055a8B2B…` *(covers a)*

**Anchor:** insert as a new row immediately after PB-13's row.
**Operation:** insert row.
**Patch:**

> | **Cross-chain canceller Safe** *[NEW ENTITY — wave-3, g35]* | `0x055a8B2B65d0aB4E0C17a0168d032464B7E97bdF` — CANCELLER-only on all three control-plane timelocks: L1 timelock `0x9f26d4C9…` (ETH blk 25533308), ETH adapter-owner timelock `0xcd425f44…` (ETH blk 25533314), OP timelock `0x851dd540…` (OP blk 154619344) | g35 §3.2/§3.3/§6.3 — OBSERVED-dual on ETH, OBSERVED-triple on OP; lane-reported pending independent review. Facts sub-entries (g35 §3.6, OBSERVED-single, facts-only): Safe 1.4.1 / 1.4.1+L2, threshold 4 of 6, owner set **disjoint** from both controller Safes, nonce 0 on both chains (has never executed a transaction); same address on both chains with identical proxy runtime code, consistent with deterministic deployment (characterisation only — never seeds `expectedRuntimeCodeHash`, g35 §2.7). The six-blocks-apart ETH grants and the OP grant form a coordinated canceller rollout — stated as sequence, motive NOT claimed (g35 §6.3, §8 claim 21). No located declared-intent artifact (g35 NEW-1). Authority class: cancellation is an instant veto/liveness power over scheduled operations, visible when used |

**Evidence:** g35 §3.2, §3.3, §3.6, §6.3, §11 NEW-1; §8 claims 2, 18, 21.

---

## PB-15 — §3 S7 table: ETH adapter-owner timelock row — proposer/executor resolved, epoch tagged *(covers a, e)*

**Anchor:** S7 row `| **ETH adapter-owner timelock / expected minDelay** …` — Tag cell ending `Proposer/executor unknown — **g02-04 GAP-3** |`
**Operation:** replace the Tag-cell tail.
**Patch:**

> ~~Proposer/executor unknown — **g02-04 GAP-3**~~ *[superseded — wave-3, g35 §3.2: role ledger complete from construction (all nine construction events in one tx, ETH blk 22089226) — PROPOSER+EXECUTOR+CANCELLER = L1 controller Safe `0x2aCA7102…` since blk 22089226, never revoked; CANCELLER additionally to `0x055a8B2B…` since blk 25533314; EXECUTOR_ROLE NOT open; no external admin (admin = self; deploy-time admin arg `address(0)` — INFERRED from OBSERVED event count + SOURCED OZ constructor). Role-model epoch: **OZ 4.x** (`TIMELOCK_ADMIN_ROLE` — literal present in block-pinned runtime bytecode @ blk 22089226 AND 4× `RoleAdminChanged` construction event shape; two independent legs, g35 §3.7 — G-10 input). OBSERVED-dual; lane-reported, pending independent review]*

**Evidence:** g35 §3.2, §3.5, §3.7; §8 claims 1–2, 5–6, 8.

---

## PB-16 — §3 S7 table: OP L2 timelock row — role history and epoch appended *(covers a, e)*

**Anchor:** S7 row `| OP L2 timelock / expected minDelay |` — Tag cell ending `*[round-8: also the OP OFT's `owner()` since OP blk 154486119]* |`
**Operation:** append to the Tag cell.
**Patch (append):**

> *[wave-3, g35 §3.3/§3.5/§3.7: proposer/executor/canceller history complete, OBSERVED-triple — `0x764682c7…` P/E/C [OP blk 139414997, 154619344), `0x7a00657a…` P/E/C since 154619344, `0x055a8B2B…` CANCELLER-only since 154619344; EXECUTOR_ROLE NOT open; no external admin (admin = self — INFERRED + SOURCED). Also the OP OFT's Endpoint delegate since OP blk 154486119 (g35 §4.4, OBSERVED-dual). Role-model epoch: **OZ 5.x** — role admin is `DEFAULT_ADMIN_ROLE = bytes32(0)`, the OZ constant, NOT `keccak256("DEFAULT_ADMIN_ROLE")` (decoy hash on the record in g35 §2.2); `TIMELOCK_ADMIN_ROLE` literal ABSENT from block-pinned runtime bytecode @ blk 139414997 (g35 §3.7 — G-10 input). Lane-reported, pending independent review]*

**Evidence:** g35 §3.3, §3.5, §3.7, §4.4, §2.2; §8 claims 3–6, 8, 11.

---

## PB-17 — §3 S7 table: L1 timelock minDelay row — G-07 supersession *(covers c)*

**Anchor:** S7 row `| L1 timelock / minDelay | `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` / ≤259,200s bound only | SOURCED WR2 §1a; minDelay **GAP G-07** …`
**Operation:** replace the Value cell and the Tag-cell G-07 clause.
**Patch (Value cell):**

> `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` / ~~≤259,200s bound only~~ *[superseded — wave-3, g35 §6.2: **864,000 s (10 days)** since ETH blk 24982415; the 259,200 s figure is a superseded state, live ETH blk 19384524 → 24982415; full `MinDelayChange` ladder decoded from block 0 (0 → 3,600 → 3,601 → 300 → 86,400 → 259,200 → 864,000)]*

**Patch (Tag cell G-07 clause):**

> SOURCED WR2 §1a; ~~minDelay **GAP G-07** (corrected schedule-delay decode, WR1 C1 + WR2 adjudication note)~~ *[wave-3: **G-07 CLOSED** — g35 §6.2, OBSERVED-dual, lane-reported pending independent review; the prior "bound" was stale in the wrong direction (live value LARGER than the bound)]* *[round-8: NOT the L1 adapter's owner — that is `0xcd425f44…`, previous row]* *[wave-3, g35 §6.1: owner of the L1 proxy admin `0xa9E9bBf0…` since ETH blk 20865339 — the L1 upgrade-authority timelock; OZ 4.x epoch, EXECUTOR_ROLE not open, no external admin (g35 §6.3)]*

**Evidence:** g35 §6.1, §6.2, §6.3; §8 claims 16–17.

---

## PB-18 — §3 S7 table: L1 timelock proposer Safe row — declaration upgraded to decoded event *(covers a)*

**Anchor:** S7 row `| L1 timelock proposer Safe | `0xcdd57D11476c22d265722F68390b036f3DA48c21` | SOURCED WR2 §1a |`
**Operation:** replace the Tag cell.
**Patch:**

> SOURCED WR2 §1a *[wave-3, g35 §6.3: upgraded from declaration to decoded event — `RoleGranted` PROPOSER+EXECUTOR+CANCELLER at ETH blk 19298624, never revoked; OBSERVED-dual, lane-reported pending independent review]*

**Evidence:** g35 §6.3.

---

## PB-19 — §3 S7 table: Safe signers row — G-09 facts in hand *(adjacent to d)*

**Anchor:** S7 row `| Safe signers / thresholds | — | **GAP G-09** (facts-only when closed) |`
**Operation:** replace Value and Tag cells.
**Patch:**

> | Safe signers / thresholds | Facts in hand for four Safes (g35 §3.6): `0x2aCA7102…` ETH 1.3.0, 4-of-7, nonce 825; `0x764682c7…` OP 1.3.0+L2, 4-of-7, nonce 36; `0x7a00657a…` OP 1.3.0+L2, 4-of-7, nonce 1 (signer set identical 7-of-7 to `0x764682c7…`); `0x055a8B2B…` ETH+OP 1.4.1/1.4.1+L2, 4-of-6, nonce 0 both chains, disjoint owner set | **G-09 remains open as a predicate question — these are EvidenceFacts only, never pass/fail** (g35 §3.6 cap, verbatim: "Signer custody is permanently out of scope and no competence or independence judgment is made"). OBSERVED-single (Safe transaction service, an acquisition path independent of the RPC evidence); lane-reported, pending independent review; single-provider tag carried verbatim per g35 §8 claims 18–19 |

**Evidence:** g35 §3.6; §8 claims 18–19.

---

## PB-20 — §4 gap ledger: G-06 row → CLOSED *(covers c)*

**Anchor:** ledger row `| **G-06** | L1 proxy admin owner; hence L1 upgrade latency | Control plane; Identity latency metadata | Ownership-transfer event history on `0xa9E9bBf0…`; candidate L1_TIMELOCK per WR2 §4.2 remains a candidate until then. |`
**Operation:** supersede-in-place (row retained, restyled like the closed G-02/G-03/G-04 rows).
**Patch:**

> | **G-06 — CLOSED** *(wave-3, g35 §6.1)* | ~~L1 proxy admin owner; hence L1 upgrade latency~~ Answered: owner = `0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761` since deployment blk 20865339 — exactly one `OwnershipTransferred` event, never changed; WR2 §4.2's L1_TIMELOCK candidate is the decoded answer | Control plane; Identity latency metadata **unblocked** (L1 upgrade latency = the owner timelock's minDelay, see G-07) | Closed by the recipe as prescribed: full-history `OwnershipTransferred` sweep, dual-provider agreement True (g35 §6.1, OBSERVED-dual). Bonus symmetry: the OP proxy admin's chain is now dated — deployer (blk 120917167) → OP controller Safe (blk 121917486) → L2 timelock (blk 139705022), g35 §6.1, OBSERVED-single. Lane-reported, pending independent review. |

**Evidence:** g35 §6.1; §8 claim 16.

---

## PB-21 — §4 gap ledger: G-07 row → CLOSED with supersession *(covers c)*

**Anchor:** ledger row `| **G-07** | L1 timelock configured minDelay | Control plane (sync-pool-adjacent) | Observed `getMinDelay()` for the live value; expected-side from deployment artifact or min-delay-change event history. Known bound: ≤ 259,200s (corrected decode). |`
**Operation:** supersede-in-place.
**Patch:**

> | **G-07 — CLOSED** *(wave-3, g35 §6.2)* | ~~L1 timelock configured minDelay~~ Answered: **864,000 s (10 days)** since ETH blk 24982415, from the complete decoded `MinDelayChange` history (block 0 → head) | Control plane — now also the L1 **upgrade** latency figure via G-06 | Closed by the prescribed min-delay-change event-history leg, dual-provider agreement True (OBSERVED-dual, lane-reported). ~~Known bound: ≤ 259,200s (corrected decode).~~ *[the bound was stale in the wrong direction: the live value is LARGER; 259,200 s is a superseded state, live ETH blk 19384524 → 24982415, retained for Rewind]* The observed lane's `getMinDelay()` read remains the separate observed-side check (D-006 — not performed by, and never certified by, the sourcing lanes). |

**Evidence:** g35 §6.2; §8 claim 17.

---

## PB-22 — §4 gap ledger: G-08 row → RE-POSED on `0x7a00657a…` *(covers d)*

**Anchor:** ledger row `| **G-08** *(re-posed, round-8 / wave-2)* | …` (the full row).
**Operation:** replace the closing-recipe cell's tail (after the round-8 strike, which stays) and retitle the row `**G-08** *(re-posed again, wave-3)*`.
**Patch (recipe cell — append after the existing round-8 text, striking the two "await" clauses):**

> ~~The Safes' continuing role (presumed proposer/executor) awaits **g02-04 GAP-3** (`RoleGranted` enumeration on both timelocks).~~ *[wave-3: GAP-3 CLOSED — g35 §3: ETH Safe `0x2aCA7102…` P/E/C since blk 22089226, never revoked (OBSERVED-dual); OP Safe `0x764682c7…` REVOKED at blk 154619344, live P/E/C = `0x7a00657a…` (OBSERVED-triple)]* ~~Delegate half: **`delegates()` unread — g02-04 GAP-5**; the library/DVN change path is delegate-gated and NOT proven timelocked — the control plane's most urgent unknown.~~ *[wave-3: GAP-5 CLOSED — g35 §4: delegate = the per-chain timelock on both chains (OBSERVED-dual), same-tx as the ownership transfers; write path closed]* **G-08 as re-posed for wave-4 — subject: the new OP Safe `0x7a00657a45420044bc526B90Ad667aFfaee0A868`, now a first-class control-plane authority with no located declared-intent artifact (g35 NEW-1). The next evidence lane must establish, at facts-class cap throughout (G-09 rules apply — never a predicate, custody permanently unknowable):** (1) **creation provenance** — the Safe's deployment transaction, factory, and sender, none of which g35 characterised (its §3.6 senders/factory rows cover the timelocks; g35 §8 claim 20 leaves related deployment actors UNLABELLED); (2) **signer-set provenance from creation** — full `SafeSetup`/`AddedOwner`/`RemovedOwner`/`ChangedThreshold` event history from the creation block, not a head snapshot; (3) **threshold history** — same event surface; (4) **second acquisition path** for the current owners/threshold — the identical-7-of-7 claim and the 4-of-7 threshold currently ride the Safe transaction service alone (OBSERVED-single, facts class — g35 §8 claims 18–19, tag carried verbatim); (5) **relationship to the outgoing Safe `0x764682c7…`** — capped at set-equality facts: an identical signer set is NOT evidence of identical organizational control, and no motive for the re-deployment may be stated (g35 §8 claim 21, causality discipline); (6) **residual authority sweep for the outgoing Safe** — enumerate any remaining ownership/role standing `0x764682c7…` holds over S2/S7 entities (the OP handover tx moved six additional contracts to the timelock, g35 §4.5 — the outgoing Safe's remaining surface is uncharted); (7) **declared-intent artifact** — locate the governance/deploy artifact naming `0x7a00657a…` (and `0x055a8B2B…`), or record both as chain-only entities with that provenance stated (g35 NEW-1 closing recipe); (8) the **owner-review promotion** of all wave-3 control-plane values, which subsumes the round-8 "owner review" residue. Until (1)–(8): the manifest's expected OP proposer/executor is `0x7a00657a…` at lane-reported OBSERVED-triple strength pending independent review; authoring `0x764682c7…` would manufacture a false control-plane claim (g35 §7); and the controller of `0x7a00657a…` is a NAMED GAP, not an inference. |

**Evidence:** g35 §3, §4, §3.6, §4.5, §7, §11 NEW-1; §8 claims 1–5, 18–21.

---

## PB-23 — §4 gap ledger: G-10 row — timelock role-model epochs folded in *(covers e)*

**Anchor:** ledger row `| **G-10** | Deployed OP OFT role-model ABI epoch (OZ `AccessControl` vs master's numeric roles) | Role sub-cells; pause-role reads | Bind the ABI to the observed runtime code hash of impl `0x70d7E0C9…` (after G-01) and review which role model that bytecode implements. WR2 §5 warns the master ABI likely does not decode the deployed roles. |`
**Operation:** append to the closing-recipe cell; retitle `**G-10** *(advanced, wave-3 — not closed)*`.
**Patch (append):**

> *[wave-3 adjacent finding — g35 §3.7: the route's two OApp-owner TimelockControllers run DIFFERENT OpenZeppelin role-model epochs, proven by two independent legs — construction event shape (ETH: 4× `RoleAdminChanged` + `TIMELOCK_ADMIN_ROLE` self-grant; OP: no `RoleAdminChanged`, `bytes32(0)` self-grant) AND block-pinned runtime-bytecode literal scan (`TIMELOCK_ADMIN_ROLE` literal present in `0xcd425f44…` @ blk 22089226, absent in `0x851dd540…` @ blk 139414997). ETH = OZ 4.x (role admin `TIMELOCK_ADMIN_ROLE`); OP = OZ 5.x (role admin `DEFAULT_ADMIN_ROLE = bytes32(0)`, the OZ constant — NOT `keccak256("DEFAULT_ADMIN_ROLE")`, a decoy value g35 §2.2 derives and discards on the record). The L1 timelock `0x9f26d4C9…` is also OZ 4.x (g35 §6.3). Manifest consequence: control-plane role rows CANNOT share one role-id vocabulary across chains — each roles[] entry carries a per-entity role-model epoch tag. Strength: OBSERVED-single (pinned `eth_getCode` literal scan) + OBSERVED event shape + SOURCED OZ constructors (g35 §8 claim 8, tag carried verbatim); lane-reported, pending independent review. The two characterisation code hashes in g35 §3.7 must never seed `expectedRuntimeCodeHash` (g35 §2.7). The ORIGINAL G-10 subject — the OP OFT's own role model on impl `0x70d7E0C9…` — remains open and still waits on G-01 (g35 §11).]*

**Evidence:** g35 §3.7, §6.3, §2.2, §2.7, §11; §8 claim 8.

---

## PB-24 — §4 gap ledger: G-02 row residual — GAP-1 dual-provider complete *(covers f)*

**Anchor:** G-02 row tail `Residuals disclosed, not blocking: g02-04 GAP-1 (OP pre-window single-provider; Safe-service corroboration in hand), GAP-4 (no declared-intent artifact for the 04-14 reversion — sequence stateable, motive not).`
**Operation:** supersede-in-place.
**Patch:**

> Residuals disclosed, not blocking: ~~g02-04 GAP-1 (OP pre-window single-provider; Safe-service corroboration in hand),~~ *[CLOSED — wave-3, g35 §5: OP pre-window now dual-provider — independent 2,966-chunk sweep of `mainnet.optimism.io` over [120917167, 150567893], 0 chunk errors, 0 transport retries, whole-sweep artifact sha256 `44600465c259a78bb00651aa9aaab05fc337ebb35d1e85822228aaf7dd58d62a`; **18/18 events exact agreement** with the prior lane's Tenderly set on (direction, blockNumber, blockHash, transactionHash, logIndex, data), all four decisive 30101-touching writes reproduced value-for-value (OBSERVED-dual, g35 §8 claim 14; lane-reported, pending independent review). The sweep's `fromBlock` justification is INFERRED — tag carried verbatim from g35 §5.1: proxy created at blk 120917167, so no emission by that emitter can precede it.]* GAP-4 (no declared-intent artifact for the 04-14 reversion — sequence stateable, motive not) *[wave-3: still open, and g35 §11 adds three more motive-less sequences of the same class — the OP role rotation, the cross-chain canceller rollout, and the L1 delay increase to 10 days; Rewind may state all four sequences and must not state why]*.

**Evidence:** g35 §5, §5.1, §11; §8 claims 14, 21.

---

## PB-25 — §4 gap ledger: NEW ROW — chain-only control-plane entities (g35 NEW-1) *(covers d)*

**Anchor:** insert as a new row at the end of the §4 ledger table (after G-14).
**Operation:** insert row. *(Numbering `G-15` is this pass's proposal — integrator may renumber; the substance is g35 NEW-1 verbatim.)*
**Patch:**

> | **G-15** *(new, wave-3 — g35 NEW-1)* | Two live control-plane authorities — `0x7a00657a…` (OP proposer/executor/canceller Safe) and `0x055a8B2B…` (cross-chain canceller Safe) — appear in **no reviewed ether.fi artifact** the G35 lane could locate: chain-decoded standing with no declared-intent provenance | Control plane row claim strength; the docs-trusting inversion (here the CHAIN leads and the DOCS are the gap) | Closing recipe (g35 §11): locate the governance proposal/deploy artifact naming them, or record them in the control-plane map as **chain-only entities with that provenance stated** — an explicit gap, never filler. Folds into the re-posed G-08 lane for `0x7a00657a…`; `0x055a8B2B…` rides the same lane. |

**Evidence:** g35 §11 NEW-1.

---

## PB-26 — §5.1 claim-strength note: two clocks re-drawn *(covers b)*

**Anchor:** §5.1, `Delegate-gated values (DVN set, threshold, confirmations, libraries) can still be rewritten with zero enforced delay by a delegate whose identity is unread (g02-04 GAP-5); owner-gated values`
**Operation:** supersede-in-place; the rest of §5.1 (identified-block discipline, no standing-property claims) stays untouched.
**Patch:**

> ~~Delegate-gated values (DVN set, threshold, confirmations, libraries) can still be rewritten with zero enforced delay by a delegate whose identity is unread (g02-04 GAP-5);~~ *[REFUTED — wave-3, g35 §4: the delegate on both chains is the per-chain timelock (OBSERVED-dual), so delegate-gated values share the owner clock — a DVN-set, confirmations, or library rewrite since ETH blk 25296945 / OP blk 154486119 requires a scheduled timelock operation (≥ 172,800 s ETH / ≥ 259,200 s OP), and was one zero-delay Safe execution before those blocks — a validity window Rewind must honor; lane-reported, pending independent review]* owner-gated values (peers, rate limits, delegate rotation, ownership) require a timelocked operation — ≥ 2 days ETH / ≥ 3 days OP — since ETH blk 25296945 / OP blk 154486119, and were zero-delay before those blocks. *[wave-3 addition, g35 §6: the code surfaces run slower still — OP upgrades ≥ 259,200 s; L1 upgrades ≥ 864,000 s since ETH blk 24982415. The zero-warning surfaces that remain are DVN-internal key rotation (unknowable), Safe-internal signer rotation (instant, invisible until Safe storage is read — G-09 facts-only), cancellation, and pause.]*

**Evidence:** g35 §4, §6, §6.4.

---

## PB-27 — §5.4 claim-strength note: authority claims re-capped at the new evidence *(covers a, b)*

**Anchor:** §5.4, `the Safes' surviving control runs through *presumed* proposer/executor roles that remain unestablished (g02-04 GAP-3), while `delegates()` remains unread (GAP-5).`
**Operation:** supersede-in-place; the custody cap and the LayerZero-blog negative-proof cap that follow stay untouched verbatim.
**Patch:**

> ~~the Safes' surviving control runs through *presumed* proposer/executor roles that remain unestablished (g02-04 GAP-3), while `delegates()` remains unread (GAP-5).~~ *[superseded — wave-3, g35 §3/§4 (lane-reported, pending independent review): the surviving control is enumerated. ETH: the controller Safe holds proposer/executor/canceller on the adapter-owner timelock, never revoked (OBSERVED-dual). OP: those roles moved at blk 154619344 to Safe `0x7a00657a…` (OBSERVED-triple) — a Safe with a dossier-reported identical 7-of-7 signer set (OBSERVED-single, facts class) and no located declared-intent artifact (g35 NEW-1 / re-posed G-08). The delegate on both chains is the timelock itself (OBSERVED-dual), so no Safe holds a direct zero-delay config path any more.]*

**Evidence:** g35 §3.2, §3.3, §3.6, §4, §11 NEW-1.

---

## PB-28 — §6 verdict: BLOCKED-ON list and G-08 bullet *(covers a–f)*

**Anchor 1:** `**BLOCKED ON: … G-01 (M2 review + G-01.B/G-01.D), G-05, G-08 (GAP-3 roles + GAP-5 delegates + owner review), G-11.** G-02 is closed and leaves the list.`
**Operation:** supersede the wave-2 list in place.
**Patch 1:**

> **BLOCKED ON: ~~G-01, G-02, G-05, G-08, G-11~~ *[round-8 / wave-2]* ~~G-01 (M2 review + G-01.B/G-01.D), G-05, G-08 (GAP-3 roles + GAP-5 delegates + owner review), G-11~~ *[wave-3]* G-01 (M2 review + G-01.B/G-01.D), G-05, G-08 (re-posed: `0x7a00657a…` provenance lane + owner review — its GAP-3/GAP-5 components are CLOSED, g35 §3/§4), G-11, **and the wave-3 review gate: the G35 dossier is lane-reported and not independently reviewed — no wave-3-derived row is manifest-grade until that review lands (D-006: the sourcing lane may not certify its own evidence).**** G-02 is closed and leaves the list; G-06 and G-07 close at wave-3 and leave the degrade list.

**Anchor 2:** the `**G-08 (owner/delegate expected values)**` bullet, from `*[Round-8 re-pose:` to the bullet's end.
**Patch 2:**

> *[Round-8 re-pose: the owner half now HAS decoded evidence — expected `owner()` = per-chain timelock (g02-04 §6.1), pending owner review; ~~what still blocks is the Safes' proposer/executor standing (g02-04 GAP-3) and the unread `delegates()` (g02-04 GAP-5) — the delegate-gated library/DVN path is NOT proven timelocked.~~ *[superseded — wave-3, g35 §3/§4: both closed. Proposer/executor standing: confirmed on ETH (`0x2aCA7102…`, OBSERVED-dual), superseded on OP (`0x7a00657a…` since blk 154619344, OBSERVED-triple). Delegate: the per-chain timelock, both chains (OBSERVED-dual) — the delegate-gated path IS timelocked since ETH blk 25296945 / OP blk 154486119. What blocks now: the re-posed G-08 lane on `0x7a00657a…` (creation + signer provenance + second acquisition path + declared-intent artifact — see the §4 row), the owner-review promotion of all wave-3 control-plane values, and independent review of the G35 dossier itself.]*]*

**Evidence:** g35 §3, §4, §11; integrator provenance note.

---

## PB-29 — §6 verdict: closing paragraph and recommended sequence *(covers f, g)*

**Anchor 1:** `G-06/07/09/10/12/13 degrade claim strength or narrow sub-cells but do not block drafting; G-14's anchors are in hand … g02-04's GAP-1 (OP pre-window single-provider) and GAP-4 (missing reversion-intent artifact) ride along as disclosed evidence caveats.`
**Patch 1:**

> ~~G-06/07/09/10/12/13 degrade claim strength or narrow sub-cells but do not block drafting~~ *[wave-3: G-06 and G-07 are CLOSED (g35 §6) and leave the list; G-09 now has facts-class content in hand for four Safes (g35 §3.6, OBSERVED-single, never a predicate); G-10 is advanced by the timelock-epoch finding (g35 §3.7) but its original OP-OFT subject still waits on G-01; G-12/G-13 unchanged]*; G-14's anchors are in hand but authoring waits on the per-chain-validity machinery ([[INS-a76edd46]]); ~~g02-04's GAP-1 (OP pre-window single-provider) and~~ *[wave-3: GAP-1 CLOSED — dual-provider, 18/18 exact, artifact `44600465c259a78b…` (g35 §5)]* GAP-4 (missing reversion-intent artifact) ~~ride along~~ rides along as a disclosed evidence caveat, now covering four motive-less sequences (g35 §11); g02-04 GAP-2 (non-emitting-write exclusion is code-path reasoning, not a state diff) also remains open (g35 §11). Every wave-3-derived value in this document carries the lane-reported cap until the G35 dossier passes independent review.

**Anchor 2:** recommended-sequence step `(2) ~~one evidence session for G-02 + G-14 (same execution-history work closes both)~~ *[done — g02-04]* one evidence session for g02-04 GAP-3 (`RoleGranted` enumeration on `0xcd425f44…` and `0x851dd540…`) + GAP-5 (`delegates()` provenance) + GAP-1 (second-provider OP pre-window sweep);`
**Patch 2:**

> (2) ~~one evidence session for G-02 + G-14 (same execution-history work closes both)~~ *[done — g02-04]* ~~one evidence session for g02-04 GAP-3 (`RoleGranted` enumeration on `0xcd425f44…` and `0x851dd540…`) + GAP-5 (`delegates()` provenance) + GAP-1 (second-provider OP pre-window sweep);~~ *[done — g35 (GAP-3/GAP-5/GAP-1 closed, G-06/G-07 bonus)]* **independent review of the G35 dossier** (Codex or a second lane — the gate every wave-3 row waits behind), then the re-posed **G-08 lane on `0x7a00657a…`** (creation provenance, signer/threshold history from creation, second acquisition path for the facts, outgoing-Safe residual-authority sweep, declared-intent artifact — §4 G-08 row items 1–8);

**Evidence:** g35 §5, §6, §3.6, §3.7, §11; integrator provenance note.

---

# TALLY AND VERDICT

**Patch blocks: 29** (PB-01 … PB-29).
Coverage of the commissioned items: (a) PB-03, PB-05, PB-09, PB-11–PB-18; (b) PB-02, PB-06–PB-09, PB-26, PB-27; (c) PB-03, PB-04, PB-10, PB-17, PB-20, PB-21; (d) PB-13, PB-19, PB-22, PB-25; (e) PB-15, PB-16, PB-23; (f) PB-24, PB-29; (g) PB-01, PB-28, PB-29.

**Revised organizing thesis (as patched by PB-02):** the wave-2 split — timelocked owner
path vs zero-latency delegate path — is refuted; the delegate on both chains is the
per-chain timelock itself, so every enumerated on-chain hop of the route now carries a
decoded, block-anchored, non-zero latency on three clocks (172,800 s ETH config+libraries,
259,200 s OP config+libraries+code, 864,000 s L1 code), all time-varying with zero-delay
Safe-era validity windows that Rewind must honor. The fastest quiet-rotation routes an
adversary now holds are not config writes at all: DVN-operator offchain key rotation
(invisible, unknowable), signer rotation inside a proposer Safe (instant, invisible to
every route predicate — and the 2026-07-23 OP rotation shows authority replacement is live
practice), and the instant liveness powers (cancel, pause); every timelock delay is warning
time only for a watcher of `CallScheduled`.

**Verdict for this consult:** patch set complete and ready for integrator application.
The blueprint, once patched, remains **BLOCKED ON: G-01 (M2 review + G-01.B/G-01.D), G-05,
G-08 (re-posed on `0x7a00657a…` + owner review), G-11, and the wave-3 independent-review
gate** (the G35 dossier is lane-reported; per D-006 neither the lane nor this pass may
certify it).
