# Codex review loop — G-08 Safe-provenance dossier (D-b4ab3c69)

Verdicts persisted VERBATIM the moment they land ([[INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a]]).
Subject: `g08-safe-dossier.md` + evidence archive `g08-evidence/`. No row manifest-grade until
GATE-PASSES; promotion owner-gated regardless.

# Round 1 (2026-07-30)

Reviewed at commit `4768f6b` (fresh Codex session, new subject). Verbatim verdict follows
(hyperlink markup flattened to plain line references; content byte-preserved).

---

[codex task-ms77dmde-x2y6hb | completed | ~52min | fresh session, G-08 dossier review round 1 (thread 019fb1f6-df3d-73e3-9f42-2bf82757154a)]

# NEEDS-CORRECTIONS

1. **Committed-state header is false.** Opening comment, lines 1–5 says "NOT COMMITTED." The dossier is tracked and committed at `3abf579d…`. Replace with "COMMITTED, LANE-REPORTED, QUARANTINED PENDING INDEPENDENT REVIEW"; retain the non-manifest-grade and D-006 language.

2. **Historical-event claims exceed the mandatory by-last-decoded-event cap.** §0 lines 32–35, §3 lines 170–184, §5.2 lines 254–270, and §10 claims 3 and 7 (line 423) say "No RemovedOwner ever," "proves … at the rotation block," and "gap CLOSED." No storage read was retained at rotation block `154619344`. Required replacement:

   > By the last decoded OwnerManager event at or before OP block 154619344, both Safes fold to the same seven-owner set and threshold 4. This is event-history evidence; storage at the rotation block remains a separate observed-side check.

   Replace "No `RemovedOwner` ever" with "No `RemovedOwner` appears through pinned head 154897427." Likewise cap §9 lines 412–413 to the pinned heads. Either downgrade "claim-19 gap CLOSED" to event-history strength or retain a dual-provider storage walk at the rotation block.

3. **The dual-history range is misstated.** §3 lines 170–172 says the history was swept "from block 0 on two providers." Tenderly covers `[0,154897427]`; OP Labs begins at each creation block. State those actual ranges and tag the no-pre-creation-emission bridge **INFERRED**, conditional on the dual-provider code boundary.

4. **Item 4 conflates pinned state, acquisition-time state, independence, and nonce support.** Pinned-head statement lines 20–23, headline line 34, §4 lines 208–227, and claim 5 line 425 overclaim:

   - The Safe-service response is an acquisition-time snapshot without a block identifier—not pinned to `154897427`.
   - Event fold and storage walk share the same chain and RPC-provider roots, so the three methods are not "mutually independent."
   - Event folding does not establish nonce or singleton; only storage and service agree on those fields.
   - `OBSERVED-multi-path` improperly aggregates distinct strengths.

   Required replacement:

   > At OP block 154897427, dual-provider event folding and dual-provider storage reads agree on seven owners and threshold 4. A separately acquired Safe-service snapshot reported the same owners and threshold at acquisition time. The storage and service legs additionally agree on nonce 1 and singleton. These are three concordant methods/acquisition surfaces, not three independent evidence roots.

5. **Owner-history completeness is an untagged inference.** §1.3 lines 98–102, §3 lines 191–197, and §6.4 lines 332–337 turn a sourced write/emission model plus decoded execution analysis into "the event stream is the state" and "complete." Required wording:

   > **INFERRED + SOURCED:** conditional on the deployed singleton obeying the retained Safe v1.3 OwnerManager write/emission model and on the decoded execution set, no alternate owner-storage write is evidenced. Pinned-head storage corroborates the head state but does not provide a rotation-block storage observation.

6. **The no-overwrite archive claim is false.** §11 line 462 says filenames prevent overwriting, while process notes lines 464–469 omit two collisions. Independent verification found 442/444 ledger rows matching retained bytes:

   - Ledger row 101 cites `g08_code_OP_0x764682c7_blk120754634_tenderly.json`, 96 bytes, digest `22946166…`; retained file is 380 bytes, digest `3deb5e1e…` from row 105.
   - Ledger row 103 cites `g08_code_OP_0x764682c7_blk120754633_tenderly.json`, 38 bytes, digest `50c7abcb…`; retained file is 96 bytes, digest `80d8ec2d…` from row 104.

   Disclose both overwritten exhibits and limit the no-overwrite assertion to `s12`'s guarded artifacts. Do not claim full ledger-to-retained-byte verifiability.

7. **The pinned-commit deploy-source provenance and "24 batches" claim are not retained sufficiently.** §0 line 37, §7.1 lines 344–372, and claim 11 line 431 claim committed-source provenance at `e30c859c` and 24 tx-builder files. The retained `L2Constants.sol` is present, 41,970 bytes, digest `ddd02778…`, and directly contains the stated address declarations; however, the evidence retains no Git object/command record establishing that those bytes belong to `e30c859c`, and only one tx-builder file (`base`, digest `025b9223…`) is retained. Retain a reproducible commit/tree/blob record and the 24-file inventory/digests, or downgrade to "the retained source copy reports…" and remove the 24-file claim. The "fresh verification is optional" statement at line 371 is too strong while pinned-commit provenance remains load-bearing.

8. **Item 7 contains untagged inference and an overbroad absence claim.** §7.1 lines 355–366, §7.2 lines 374–377, and claims 12–13 (line 432) call `0x7a00657a…` "canonical," say the rotation "brought OP into line," and assert `0x055a8B2B…` is "in no artifact." The source directly establishes address declarations; "canonical/fleet alignment" is **INFERRED** and must be tagged or removed. Replace the canceller claim with:

   > `0x055a8B2B…` was not located in the explicitly named searched corpus as of the reviewed revisions; no broader artifact-absence claim is made.

   Retain a search manifest/output covering that corpus before calling the residual G-15 result independently verifiable.

Item 6's material role finding itself is sound at its stated event-history cap: the retained OP sweep is contiguous, digest-correct, and folds to unreversed grants of `DEFAULT_ADMIN_ROLE` and `UNPAUSER_ROLE`; it is correctly single-provider and filter-scoped. All 14 whole-sweep artifacts also passed independent range, parse, size, and digest verification.

Codex session ID: `019fb1f6-df3d-73e3-9f42-2bf82757154a`

Codex session ID: 019fb1f6-df3d-73e3-9f42-2bf82757154a
Resume in Codex: codex resume 019fb1f6-df3d-73e3-9f42-2bf82757154a

---

## Disposition status (round 1)

- Verdict persisted BEFORE the correction dispatch. All 8 findings ACCEPTED — they are the
  G35 correction classes (caps, ranges, tag discipline, disclosure) plus two coordinator-side
  facts: the header state (finding 1 — the coordinator committed a dossier whose header said
  NOT COMMITTED) and the archive collisions (finding 6 — disclosed, not repaired; the
  overwritten exhibits stay lost and the ledger's verifiability claim is capped).
- The material item-6 role finding SURVIVES review at its stated cap; all 14 whole-sweep
  artifacts independently verified.
- Corrections being applied supersede-in-place by the correction lane; scoped round-2
  re-verification follows. NO row manifest-grade until GATE-PASSES; promotion owner-gated.
