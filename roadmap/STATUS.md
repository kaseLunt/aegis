---
writer_mode: serial
parallel_readers: allowed
enforcement: bootstrap
enforcement_evidence: []
project_state: active
active_phase: P1
active_task: none
updated: 2026-07-25
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track — upgraded control-plane bundle adopted (W0F); new doctor + selftest
green locally, all achieved items re-attested with evidence receipts. Verify remote CI on
the migrated workflows after push. main protected; residuals in [[R-005]] under [[D-007]].

## Current task (WIP = 1 per agent, [[D-006]])
**No active task — W0H ACHIEVED; W5 unparks in the next commit.**

**W0H is DONE.** [[EV-W0H]] at `3bffc19`: the claim-lease clock is fully retired (D-9646fc3c),
claims remain task/scope bindings with explicit lifecycle, and the instructional-integrity
guard reached its converged design — standing tier complete-by-construction (unbounded
claim/renew co-occurrence over adjacent-block windows), narrative tier covering exactly the
session-protocol reading list plus all live capture directories, seventeen red-first selftest
cases. Codex convergence ([[D-b4ab3c69]]): ELEVEN scoped rounds, findings narrowing
monotonically, terminal verdict **approve / converged-clean, no material findings**. Residue
documented in EV-W0H and accepted under the cooperating-executor threat model.

**Next commit:** W5 -> active, `claim.py open fable-main W5 --integrator`, STATUS
`active_task: W5`, and the recon-derived S3 plan lands in the W5 charter. Then S3 TDD begins
(tests A1-A3 + B4 first, per the plan's sequencing).

Kickoff mapped the W1–W4 spine with a four-agent read-only fan-out (run wf_c29e08ca-2a8) and
established the decisive fact: **there is no packaged pass-to-report composer** — the
W1+W2+W3(+W4) composition exists only inside `tests/engine.test.ts` ("W1+W2+W3 composition",
lines 122–178). All four M1 surfaces are that same pipeline behind different transports, so
W5 builds the composer once and surfaces are transports that never evaluate.

Shape settled in [[D-6bedc848-2a42-411a-a65b-d623f7418121]] (owner delegated: "gold standard,
no shortcuts"): (1) the manifest→target binding lands **in `lib/aegis/manifest/trust.ts`**
structurally, not as an assertion — closes
[[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3; (2) the API **accepts** caller-supplied
manifest bytes (visibly noncanonical, cannot create a production pass/fail), which activates
and therefore **closes [[R-003]]** (duplicate-key JSON) in W5; (3) the CLI ships as a vite
SSR-built artifact with `node:util parseArgs` — no new dependency; (4) the M1 scenario-fixture
corpus splits out as **W6**, so **M1 closes at W6, not W5** (the prior "W5 closes M1" claim was
optimistic and is corrected).

Consequence to plan for: (1) and (2) both modify paths in W4's `invalidated_by`, so EV-W4
auto-invalidates — honest, not a defect. Slice S1 mints `EV-W4-R2` and supersedes `EV-W4`
**in the same commit** per [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]. W5's `allowed_paths`
were amended at activation to add `bin/**`, `components/**`, `package.json`,
`vite.cli.config.ts`; `.github/workflows/**` is deliberately excluded (the CI adapter ships as
library code + a documented snippet, so W5 never touches [[D-007]]/[[R-005]] machinery).

Hard constraint carried in: W5 must TRUST provenance-branded engine output, and the kickoff
sharpened why — **a WeakSet brand is process- and module-instance-local**, so it survives no
serialization boundary. Each surface re-earns the brand from raw bytes in-process and persists
only outputs ([[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]] addendum 3).

Slices: ~~S0 facade+request+trust seam~~ **DONE** → ~~S1 target extraction + identity
verifications~~ **DONE** → ~~S2 R-003 strict parse~~ **DONE** → S3 CLI → S4 report API → S5 CI adapter → S6 evidence
drawer → S7 cross-surface byte identity. Then the Codex convergence gate before any achieved
stamp.

**S0 landed** (06f44c6, 368/368, tsc + lint clean; re-attestation follow-on): the engine facade
`runVerification`, the canonical request model, and the `trustedManifestFromBytes` seam that
closes [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3 by construction. S0 absorbed the trust seam
from S1 (applicability needs the loaded manifest, so splitting meant writing then deleting a
throwaway pattern). The facade also wires `checkApplicability`, which **nothing called before** —
a trusted manifest outside its validity window or environment used to apply silently.

Two corrections from S0, both worth carrying: (1) the kickoff said the trust.ts change would need
ONE re-attestation; it needed **TWO** (`EV-W2-R2` + `EV-W4-R2`) because trust.ts is W2's own
deliverable as well as being in W4's `invalidated_by` — ask which item OWNS a file, not just
which list it. (2) A raw NUL byte from the editing tool made a source file register as BINARY to
git with every gate green (compile, tsc, eslint, 366 tests) — caught only by reading a diffstat.
New tooth `tests/repo-source-hygiene.test.ts` fails on any raw control character; written RED
against the live defect, it immediately found two pre-existing instances
([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]] addendum).

**S1 landed** (374/374): identity verifications from the trusted manifest's targets, comparison
evidence merged into top-level evidence deduped by id, and a `target_boundary_unavailable`
limitation so a target on an unresolved chain is surfaced rather than silently dropped. S1
touched only `lib/aegis/surfaces/**`, so no receipt was invalidated. It also found a real
provenance hole: the report was emitting ZERO head evidence while asserting two boundaries,
because a conjunctive filter required a `capturedAt` the W3 `ChainAdapter` head contract
structurally never supplies — nine S0 tests passed over it, including a key-set assertion,
because none looked INSIDE `evidence`. Fixed with the verified bundle's own timestamp plus a
fail-closed refusal when head provenance would be ambiguous
([[INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc]]).

**S2 landed** (3e70cf2, 384/384): [[R-003]] CLOSED — both untrusted byte boundaries now reject
duplicate JSON keys before parsing, so a document can no longer be hashed under one meaning and
read under another. Cost FOUR receipts (W1, W2, W3, W4), one more than predicted: the scanner
went into `report/canonical.ts` beside `jcsSerialize` on purpose, rather than splitting JSON
discipline across modules to save a mechanical re-attestation.
**S2 was the last re-attestation chain in W5** — S3-S7 touch only `bin/`, `app/`, `components/`
and `lib/aegis/surfaces/`.

**Standing notes for the W5 lane.** Codex-dispatch guardrails (no worktree,
neutral+static brief, .serena/ clarification, never rm -rf shared temp) in [[INS-004]] +
[[INS-fa971e14-587c-4565-907e-839ec51a3101]]. Lanes WR1/WR2/WR3/WR6 closed; WR4/WR5
deferred. W0C archived. **R-006 is CLOSED** (36a35ef) — the retry-once-then-halt rule for
red pushes is RETIRED; a red selftest is now a real failure with no known flake behind it.

## Recently completed
- **W4 — identity adapters + code-hash-scoped ABI registry** ACHIEVED (EV-W4,
  tested_commit 4fcfa17, npm test 339/339; stamped). Landed under the Codex convergence gate
  ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]): the review loop ran to a clean SHIP-READY
  pass (session 019f8e98, no material findings) after THIRTEEN passes down the input-domain
  hardening arc on compareIdentityTarget — provenance brand (5) → single-channel snapshot
  (8) → snapshot-all-before-validate (9) → REFUSE active inputs (10) → reject proxies +
  require runtime hash (11) → type-guard against RegExp.test coercion (12) → clean (13).
  Three input-domain layers closed: no active objects, no programmable reflection, no
  coerced scalars. Full disposition table in roadmap/reviews/W4-codex-review.md. Lesson
  thread: [[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]] (4 addenda). NOTE: EV-W4 will
  auto-invalidate at W5 slice S1 (manifest/** change) and be re-attested as EV-W4-R2 in that
  same commit — expected, per [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]].
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
1. W5 slices S0→S7 (active lane) — see the work file for the slice plan.
2. W6 (M1 recorded scenario fixture corpus + reorg supersession) — `candidate`; the owner
   authorized the split at the W5 kickoff but promotion to `committed` is a phase-review
   action. **M1 closes at W6.**
3. Manifest-owner open items: live rate-limit value (3k vs 10k weETH/4h), executor pin,
   historical setPeer tx. WR4/WR5 round 2 at M3/M4 planning.
4. [[W0G]] — **R-006 half is DONE** (36a35ef, risk closed): the path-containment race that had
   been blocking pushes is fixed, with two selftest teeth and a 10-run clean soak. Remaining
   W0G scope is the worktree eol/control-char snapshot fix only; it needs a second receipt round,
   knowingly accepted. Real receipt cost was FIVE, not seven — count what is actually bound, not
   what is nominally in scope.
5. Serena-in-subagents: **resolved by diagnosis, no action needed**
   ([[INS-f3f74c16-f56e-46b1-85bd-55464e4183ce]] item 2). The "untracked `.serena/`" hypothesis
   was DISPROVEN — a subagent inherits the cwd, sees the config, and `find_symbol` succeeds.
   The kickoff failure was a cold index (`.serena/cache/**`, which is gitignored and could
   never have been shipped). Mitigation is to warm the index before fanning out.

## Blockers
- OWNER (control-plane enforcement): the upgraded bundle's authoritative gate is the
  trusted `pull_request_target` audit, which needs a hosting ruleset "required workflow"
  plus repo variables `CONTROL_PLANE_TRUST_REF`, `CONTROL_PLANE_TARGET_BRANCH`, and
  `CONTROL_PLANE_POLICY_APPROVAL`. Until wired, enforcement stays `bootstrap` (advisory
  push jobs only). This is D-007 machinery-phase work (also [[R-005]]).
  **Mechanism read from the code 2026-07-25 — the framing above was incomplete:**
  1. `CONTROL_PLANE_TRUST_REF` and `CONTROL_PLANE_TARGET_BRANCH` are OPTIONAL overrides —
     `.github/workflows/control-plane.yml` already falls back to
     `github.event.repository.default_branch`. They are not what blocks anything.
  2. The trusted audit is `skipped` for one reason only: it triggers on
     `pull_request_target`, and **we push straight to main, so no PR event ever fires.**
     Likewise the advisory scope review is red because a push has no PR number —
     structurally unsatisfiable on a direct push, not a defect and not fixable by config.
     Both symptoms clear the moment work lands via branch + PR.
  3. `CONTROL_PLANE_POLICY_APPROVAL` is NOT a boolean or a static secret. `scope_diff.py`
     derives `policy_approval_token(pr_number, base_sha, head_sha)` and requires the variable
     to EQUAL that hash, so an approval is cryptographically bound to one exact
     (PR, base, head) triple and cannot be replayed onto different content. There is a
     built-in minting command: `scope_diff.py --print-policy-approval-token`. So authorizing
     an owner-gated PR is a per-PR act by the owner, not one-time setup.
  4. Agent note: this session held `admin: true` on the repo and could therefore have set
     that variable itself. It deliberately did not, and no future agent should — an agent
     minting and installing its own approval token is self-approval, and would hollow out
     the exact control D-007 exists to establish. Only the human owner mints it. Branch protection
  now requires the advisory doctor + selftest + Product tests.
- NOTE (advisory scope review): red on any push containing owner-gated transitions
  (contract changes, protected tools, recorded-evidence supersessions) because the push
  replay has no PR/approval token and fails closed — observed 2026-07-23 on the
  receipt-lifecycle chain (required checks all green). Correct behavior for the current
  bootstrap posture; clears when the trusted PR flow (ruleset + policy variables) is
  wired per [[D-007]]/[[R-005]]. Routine non-owner pushes replay green.
  **Re-confirmed 2026-07-25** on the W5 kickoff+S0+S1 chain (pushed c6fe363, run 30138208996):
  all THREE required checks green — `Product tests`, `Advisory candidate doctor`,
  `Advisory candidate selftest` — with the single red being the non-required
  `Advisory candidate scope review`, failing `owner approval requires a positive decimal
  pull-request number`. Two facts worth keeping: the `Trusted audit candidate` job reports
  **skipped** ("wire through a hosting ruleset required workflow"), which is the D-007 gap
  made visible; and a deliberately doctor-RED middle commit (06f44c6) did NOT break CI,
  confirming the doctor validates the push HEAD while `scope_diff` replays transitions — the
  two-commit re-attestation chain shape is CI-safe.
- ~~W0C (parked)~~ **ARCHIVED 2026-07-25.** The substance shipped (history rewritten, identity
  tooth installed and negative-tested, repo verifies clean). The remnant — pre-rewrite commits
  still fetchable by direct SHA from GitHub's cache until the repo is deleted and recreated —
  was judged not worth its cost: it waited indefinitely on an owner `delete_repo` auth scope,
  the exposure needs a guessed full SHA against an already-clean repo, and recreating would
  discard stars, CI history and the issue graph. Reopen if that residue ever matters; the
  procedure is recorded in the work file.

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
