---
writer_mode: serial
parallel_readers: allowed
enforcement: bootstrap
enforcement_evidence: []
project_state: active
active_phase: P1
active_task: W4
updated: 2026-07-23
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track — upgraded control-plane bundle adopted (W0F); new doctor + selftest
green locally, all achieved items re-attested with evidence receipts. Verify remote CI on
the migrated workflows after push. main protected; residuals in [[R-005]] under [[D-007]].

## Current task (WIP = 1 per agent, [[D-006]])
**W4 — identity adapters + code-hash-scoped ABI registry** — fable-main (serial writer).
All three slices IMPLEMENTED (HEAD 2fd0ba8, 319 tests, lint clean): slice 1 pure
derivation (resolve.ts), slice 2 quorum-wired observation (observe.ts) + adapter reads,
slice 3 manifest comparison (compare.ts) + ABI registry (abi.ts). W4's invalidated_by
already narrowed pre-receipt to the consumed modules.

**IN CODEX CONVERGENCE ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]] — no achieved stamp
until Codex returns clean).** Eight passes dispositioned so far, ALL in
roadmap/reviews/W4-codex-review.md (full finding/fix table): 10 findings → down to the
caller-channel class; pass 5's root-cause pivot (provenance brand →
[[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]]) plus pass 8's completion of it (snapshot
the context once — validate and emit the same plain copy; no caller-dispatched array
methods). Pass 9 (scoped re-verify of the snapshot fix, d138818..2fd0ba8) dispatched
at 2fd0ba8, verdict pending.

**On the next resume:** check the pass-9 Codex result. If SHIP-READY → mint EV-W4 at the
landing commit (`python roadmap/tools/doctor.py --receipt-basis W4 --snapshot <HEAD>`,
honest `npm test` run), stamp achieved (`--stamp W4`), flip the ladder row + this block,
push. If findings remain → reproduce each as a failing test, fix, re-verify, loop.
Known non-blocking boundary tracked in [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]]
(recorded-fixture independence; bundle-digest anchoring deferred). W5 (one engine, four
surfaces) closes M1 after. Lanes WR1/WR2/WR3/WR6 closed; WR4/WR5 deferred. W0C parked.
NOTE: R-006 selftest flake hit 4× today — retry the push if it reds; fix batched with the
next roadmap/tools change.

## Recently completed
- **W0F — control-plane bundle migration** ACHIEVED ([[IDEA-003]] promotion): seven tools
  + shared runtime replaced with the upstream bundle; corpus on the new grammar;
  D-001..D-004 re-issued as D-010..D-013 under the append-only decision law; 12
  pre-migration achievements re-attested with honest evidence receipts. Landed as a
  prepared commit chain (the outgoing validator could not authorize a pre-migration base),
  each commit valid under its own plane. See EV-W0F + [[INS-006]], [[R-006]].
- **W3 — finalized-block selection + quorum + RPC adapters** ACHIEVED (4 slices, all TDD;
  228-test suite): quorum with administrative-domain independence, hash-pinned selection
  with downgrade exposure, envelope-verified recorded adapters, engine pass composing
  with W2 policyTrust into W1-valid payloads. Codex review BEFORE stamp: 2 P0 + 4 P1 +
  2 P2 all fixed same-day (roadmap/reviews/W3-codex-review.md).
- **W2 — manifest model + trust root** ACHIEVED: schema + content addressing + approved-hash
  trust root + loadManifestBytes + sealed reference fixture + policyTrustFromBytes report
  wiring; adversarial-review round 2 (4 lenses, 3-skeptic panels) dispositioned — P1
  boundary fail-open + P2 environment applicability fixed TDD, RangeError depth escape
  killed at root (assertJsonDomain cap), set-member dedup, test-quality gaps closed.
  144/144 tests, lint clean. See work file evidence + [[IDEA-002]], [[INS-005]].
- **W0B — control-plane hardening per external review** (commit 6bf2c03): staged-index scope
  gate, fail-closed states, protected files, evidence fingerprints, decision ratification,
  14/14 gate selftests; public GitHub remote + green CI — see [[D-005]], [[R-001]].
- **W0A — orchestrator directive adopted, right-sized** (commit daa9d8a): ladder-drift +
  handoff doctor checks, pre-commit scope gate, one-command capture, standing rules §13–20 —
  see [[D-004]], [[INS-001]].
- **W0 — control plane stood up** (commit 3d01b6c): cockpit, doctor, git+CI gates, session
  protocol in CLAUDE.md/AGENTS.md — see [[D-001]], [[D-003]].
- Doc canon in place: `docs/` (product spec, threat model, engineering spec, roadmap M0–M10,
  source register, interview brief) — authority hierarchy in `docs/README.md`.

## Next up
1. W3 slices 2–3 (block selection; adapter interface + recorded fixtures + provider configs).
2. W4 (identity adapters + ABI registry) after W3.
2. Manifest-owner open items: live rate-limit value (3k vs 10k weETH/4h), executor pin,
   historical setPeer tx. WR4/WR5 round 2 at M3/M4 planning.
3. R-001 residual (owner, low urgency): enable branch protection requiring the "Control plane"
   check once PR flow starts mattering.

## Blockers
- OWNER (control-plane enforcement): the upgraded bundle's authoritative gate is the
  trusted `pull_request_target` audit, which needs a hosting ruleset "required workflow"
  plus repo variables `CONTROL_PLANE_TRUST_REF`, `CONTROL_PLANE_TARGET_BRANCH`, and
  `CONTROL_PLANE_POLICY_APPROVAL`. Until wired, enforcement stays `bootstrap` (advisory
  push jobs only). This is D-007 machinery-phase work (also [[R-005]]). Branch protection
  now requires the advisory doctor + selftest + Product tests.
- NOTE (advisory scope review): red on any push containing owner-gated transitions
  (contract changes, protected tools, recorded-evidence supersessions) because the push
  replay has no PR/approval token and fails closed — observed 2026-07-23 on the
  receipt-lifecycle chain (required checks all green). Correct behavior for the current
  bootstrap posture; clears when the trusted PR flow (ruleset + policy variables) is
  wired per [[D-007]]/[[R-005]]. Routine non-owner pushes replay green.
- W0C (parked): GitHub repo deletion needs owner auth — run
  `gh auth refresh -h github.com -s delete_repo` or delete kaseLunt/aegis via web; agent
  then recreates, pushes, verifies, and closes W0C.

## Owner decisions resolved 2026-07-22 (audit #2 follow-through)
- W2→W3 transition: AEGIS-OWNER-APPROVED marker landed (9e4d0d8) with the CI
  independent-reporting fix; pushed.
- Branch protection: ON — main requires Control plane doctor + Product tests (strict),
  force-pushes/deletions blocked, admins exempt until [[D-007]] merge-queue machinery
  exists (R-001 residual closed).
- Authorship: keep history as-is ("Review Test" name-only defect, email correct;
  rewrite declined — recorded in audit #2 dispositions).
- Concurrency architecture: [[D-007]] accepted (wave model / serialized integrator);
  W3 finishes serially; machinery after W3; pilot after W4 contract freeze.

## Queued / awaiting decision
- Route research blockers (`docs/SOURCE_REGISTER.md` §Hiring-ready route research blockers) —
  needed before P2 can produce live verdicts; can start during P1 as research capture.
