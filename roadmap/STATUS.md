---
writer_mode: serial
parallel_readers: allowed
enforcement: bootstrap
enforcement_evidence: []
project_state: active
active_phase: P1
active_task: W5
updated: 2026-07-26
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track — upgraded control-plane bundle adopted (W0F); new doctor + selftest
green locally, all achieved items re-attested with evidence receipts. Verify remote CI on
the migrated workflows after push. main protected; residuals in [[R-005]] under [[D-007]].

## Current task (WIP = 1 per agent, [[D-006]])
**W5 — one engine, four surfaces. ACTIVE at slice S3 (the CLI), claim generation 7.**

S0/S1/S2 are DONE (384/384). S3 executes against the recon-derived plan now embedded in the
W5 charter ("S3 plan" section): 21 TDD tests in sequence, the total exit-code mapping, the
per-tier render rules from canon, and the finality-downgrade diagnostics extension.
**Plan steps 1-2 DONE** (through e5d19ce, 399/399): step 1 = `bin/aegis.ts` `main(argv,io)`
harness + strict parseArgs + `renderJson`/`exitCodeForPayload`; step 2 = the FULL B-series
exit-code matrix (A1-A3 + B4-B13, all ten rows). Every exit value has a guardian test with a
verified mutation bite: 0←B5, 2←B6, 3←B4/B7/B10, 4←B8/B9/B11/B13-dup, 5←B12/B13-ambiguous;
six per-row mutation checks each isolated exactly one row (no dead/redundant branch). Two
red-first CLI additions landed under the series: recording pre-validation (B11, corruption =
caller input exit 4, bundle discarded so the engine re-earns the brand) and repeatable
`--heads` (B13, the ambiguous-vs-duplicate ordering trap, both exits pinned).
**Plan step 3 DONE** (404/404): C14-C19 landed — canon render layout (boundaries/manifest/
trust+reasonCodes/coverage BEFORE any verification line; per-item limitations; full-flag
reproduce line via a pure `renderHuman(run, {reproduce})` param), renderer-wide `esc()`
(control bytes → visible `\uXXXX`, line-forgery pinned; C17 test-spec deviation recorded in
the charter: vectors are manifestVersion + trustPolicyId since provider strings can't ride
at M1), claim-language lint (C18) and hygiene `+bin` (C19) both negative-tested with real
inserted violations; C15 double-mutation-checked (state-word collapse, version prettify).
**Plan step 4 DONE** (406/406): test 21 red-first drove the §5(a) engine addition —
`BoundaryDiagnostic.downgrades` threads the full finality-downgrade record
(requested/used/depth/reasonCode) to the render frame; reportHash pinned untouched
(diagnostics stay unhashed); doctor-derived receipt impact: none. D20 red-first added the
transport diagnostic: a configured provider with zero responses in a recording draws a
stderr warning naming it per role (misconfig vs outage), outcome pinned unchanged against
B12/B4. **Resume at plan step 5 (LAST): packaging (§4)** — config + scripts + one manual
smoke run of the built artifact recorded in EV-W5 (documented command exits 3, honestly);
verify npm test, tsc, lint, doctor, selftest all green. Then the S3→S7 sequence continues
(S4 API, S5 CI, S6 web drawer, S7 byte-identity gate) and the Codex convergence loop before
any stamp. Do NOT stamp W5 mid-slice.

**W0H is DONE.** [[EV-W0H]] at `3bffc19`: the claim-lease clock is fully retired (D-9646fc3c),
claims remain task/scope bindings with explicit lifecycle, and the instructional-integrity
guard reached its converged design — standing tier complete-by-construction (unbounded
claim/renew co-occurrence over adjacent-block windows), narrative tier covering exactly the
session-protocol reading list plus all live capture directories, seventeen red-first selftest
cases. Codex convergence ([[D-b4ab3c69]]): ELEVEN scoped rounds, findings narrowing
monotonically, terminal verdict **approve / converged-clean, no material findings**. Residue
documented in EV-W0H and accepted under the cooperating-executor threat model.

## Research program (persona bench) — session handoff 2026-07-26

**Note:** commit `0aa42dc`'s message claimed this section already existed in STATUS; it did
not — the handoff lived only in `codex-review-wave1-confirmation.md` and wr5-ruling §5 until
this commit landed it here. Recorded for the honesty ledger.

Four persona agents are registered and re-invocable by type: `route-cartographer`,
`chain-historian`, `rehearsal-master`, `evidence-warden`. Wave 1 ran the full loop —
persona rulings → Codex adversarial review (`codex-review-wave1.md`) → diff-only corrections
by the originating instances → scoped Codex confirmation
(`codex-review-wave1-confirmation.md`, review-ms26cg2y: 6/9 CLOSED, 3 OPEN). Per-document
verdicts stamped on every draft header: blueprint PROMOTABLE-WITH-CORRECTIONS; custody-chain
PROMOTABLE; wr4 NOT-PROMOTABLE; wr5 PROMOTABLE. All four remain research inputs only;
INFERRED/probe material stays quarantined from manifest-grade use.

**Round 3 (next research action)** — the three open findings, fixes named by the reviewer:
1. blueprint G-01: remove the unenforced `first_observation_baseline` fallback from
   manifest-grade (identity stays unknown, ABI cells blocked, when build provenance is
   unavailable).
2. wr4: complete the SupersessionRecord schema (`affectedArtifacts`, domain-separated
   canonical bytes + content hash), anchor in an append-only register, split the tests.
3. wr4 Candidate 5: reframe the temporal disqualifier on the absent chain-10 window, not the
   chain-1 window. Then scoped re-confirmation → promotion.

**Captures filed 2026-07-26** (were queued in wr5-ruling §5): [[INS-ce3c634f]]
(discovery-query recall teeth), [[INS-035ae3e4]] (hex/word truncation class, 3rd strike),
[[D-74472e1d]] (fork-engine pair + CLI-artifact architecture — **PROPOSED, owner
ratification required**), [[R-85f86c4d]] (ROUTE-ETH-OP-v1 absence blocks M4 — derived
independently by three wave-1 documents).

**Engine findings awaiting triage into work items:** unconditional "reviewed" limitation
text (`engine.ts:250-251` — a trust-me attestation in prose; pairs with the
bundleContentHash slice); quorum sourceMode mixing (`quorum.ts:29-31` — pre-live gate);
OP finality vs confirmation-depth (`selection.ts` — owner design decision).

**Owner decisions resolved 2026-07-26** (decision-queue session, all four items):
- [[D-74472e1d]] fork-engine pair **RATIFIED** (EthereumJS L1 + EDR OP/cross-check;
  CLI-produces-artifact) **with early spikes authorized** — S6 EDR OP-deposit replay gate and
  S7 RPC budget probe run as research in scratch environments now; dependencies enter the
  repo only at P4.
- G-05 executor pinning: **PIN the canonical executor** as the expected value, sourced from
  the executed config batches (G-02/G-04 evidence lane) — not default-resolution-declared.
- G-08 + G-11: **one owner review ritual at M2 authoring** — the owner/delegate derivation
  sign-off and the manifest lifecycle review batch into a single structured session once the
  evidence lanes have corroborated the derivations.
- D-007 enforcement wiring: **DEFERRED** — bootstrap mode (advisory checks + branch
  protection) stays, documented and honest; wire the PR-based trusted gate when a second
  contributor or a demo reason exists.

**Research lanes 2026-07-26 — results:**
- **wr4 review loop CONVERGED at round 7** (approve, no material findings;
  codex-review-wave1-round7.md) — wr4 PROMOTABLE (loop-converged), promotion itself a
  phase-review action. Findings narrowed 9→3→2→line-level→2→1→0 across seven rounds.
- **G-01 COMPLETE through execution** (g01-build-derivation.md + g01-derivation-execution.md):
  all EIGHT expectedRuntimeCodeHash candidates DERIVED with committed-before-execution
  provenance; vendor builds reproduced byte-identically incl. ipfs metadata tails; blueprint
  recipe amended to deploy-vintage (round 7). Remaining before manifest grade: M2 owner
  review + disclosed caveats G-01.B/G-01.D.
- **G-02/G-03/G-04 CLOSED** (g02-04-execution-order.md): rate limit = 3,000 weETH/4h
  (WR1's 10k inference REFUTED by execution order — 10k lived 11 days then was reverted
  twice); peers decoded on-chain incl. one OP supersession + a real 8-day one-sided-peer
  interval; library pins exist (2026-04-22, defaults were byte-identical — the pin changed
  authority, not the library). **Blueprint-invalidating finding: both OApps are now
  TIMELOCK-owned** (ETH 2-day timelock 0xcd425f44… NOT in WR2's map, since blk 25296945;
  OP L2 timelock since blk 154486119) — E7 "zero latency" and G-08 "Safe = owner" are stale;
  authoring the Safes as expected owner today would false-alarm. New gaps: timelock
  proposer/executor roles (GAP-3), delegates() unread (GAP-5), OP pre-window single-provider
  (GAP-1). G-14 anchors available (24932629 / 150613167 for mustBeExplicit).
- **S6/S7 rehearse spikes COMPLETE** (spike-s6-s7.md): **S6 GATE-FAIL** — EDR 0.14.2
  applies mempool nonce validation to deposits, making admission and depositNonce fidelity
  mutually exclusive; receipts-root reproduction unavailable on OP → **per the ratified
  rule, the M4 gate case is L1-only, R1 stands** (a weaker disclosed criterion exists as an
  unexercised owner waiver — EDR hit 34/35 receipts + exact block gas; INS-e14fbbbc).
  **S7 MEASURED** — 52/52 gas-faithful prefix replay, 912 logical RPC calls, 1.5 s
  state-resident vs ~24 min cold-remote: CLI-artifact architecture confirmed, and the
  5.8 MiB pinned-state bundle makes third-party re-execution a first-class artifact-format
  candidate. Corrections: wr5's "pinning is structural" CANON claim refuted at runtime
  (INS-4668c697 — blockTag is type-level only); hex-misread strikes 4-5 self-reported
  (INS-035ae3e4 rule broadened: numerics in deliverables must be produced by executed
  code). New hard blocker: reproducible timing needs the WR3 paid provider pair (S7-G3).

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
- **OWNER (money, small): funded archive provider pair** (WR3 pair 1 — Alchemy + QuickNode).
  Graduated to hard blocker 2026-07-26 in two independent lanes: reproducible rehearsal
  timing (spike S7-G3) and OP pre-window dual-provider completeness (g02-04 GAP-1); also
  prerequisite plumbing for the M2 observed-side lane. Needs owner accounts/keys.
- **Tripwire — EDR upstream issue #1578** (filed 2026-07-26 from the owner's account): on
  any EDR release referencing it, re-run the S6 gate harness before any OP claim
  strengthens; if silent ~1 month AND OP rehearsal has become important, revisit writing
  the PR ourselves (fix-site scout results in roadmap/research/rehearse-selection/).
- **Anti-residual object:** [[IDEA-94b7ef88]] is the P4/M4 chartering checklist sweeping
  every spike-derived precondition, asset (incl. the evidence archive at
  `C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad`), and tripwire; phase
  review dispositions every line.
- **IN FLIGHT across a compaction boundary (2026-07-26 late) — results arrive as task
  notifications, persist verbatim + doctor + commit + push when they land:**
  1. ~~GAP-3/5/1 control-plane evidence lane~~ **COMPLETE 2026-07-26 late (post-resume).**
     Dossier persisted verbatim: `roadmap/research/route-manifest/g35-dossier.md` (13
     sections); lane report + resume audit in `g35-lane-report.md`; evidence archived
     (36 MB, 156 ledgered acquisitions, `aegis-evidence-archive/2026-07-26-scratchpad/g35/`).
     GAP-3/5/1 all CLOSED (dual/three-provider concordant), G-06/G-07 bonus closures, G-10
     adjacent finding (different OZ role-model epochs). Headlines stand: OP timelock roles
     moved to NEW Safe `0x7a00657a…` (identical 7-of-7 signer set) on 2026-07-23; delegate
     on BOTH chains is the timelock itself (wave-2 "delegate-gated zero-latency" thesis
     REFUTED); minDelay superseded to 864,000 s. Blueprint is KNOWN-STALE on those rows.
     Evidence-handling defect self-disclosed → [[INS-56e771b0]].
     **NEXT research-lane step: wave-3 blueprint patch pass** (fold dossier into S7
     control-plane rows, supersede refuted claims, re-pose G-08 on the new Safe) + then
     independent review before anything is manifest-grade.
  2. ~~Codex verification of the EDR fix-site scout~~ **LANDED 2026-07-26 late: verdict
     NEEDS-CORRECTIONS** — persisted verbatim in
     `roadmap/research/rehearse-selection/edr-scout-codex-verdict.md`. Core diagnosis
     CONFIRMED (placeholder nonce → mempool rejection; receipt-half already correct); two
     conclusions REFUTED ("mempool is sole blocker", "small guard unblocks replay") — automine
     fee validation, mint-unaware balance check, and miner-fee overflow are additional
     blockers. All 8 corrections applied to the scout doc supersede-in-place; postable
     comment is now §(d′); §(e) re-estimated S–M → M. **OWNER ACTION EXECUTED 2026-07-26:**
     owner approved posting §(d′) (posted:
     <https://github.com/NomicFoundation/edr/issues/1578#issuecomment-5085997048>) and chose
     the pointer-style body edit (append-only `Edit (2026-07-26)` paragraph, Codex-CONFIRMED
     claim only, verified by re-fetch). Upstream lane is now WATCH-ONLY per
     [[IDEA-94b7ef88]] line 10 (EDR release referencing #1578 → re-run S6 gate; silent
     ~1 month + OP matters → revisit PR).
- **Prior lanes this session (all landed):** wave-1 wr4 loop CONVERGED (round 7 approve);
  G-01 8/8 hashes derived; G-02/03/04 closed; S6/S7 spikes; wave-2 blueprint revision (fa3e26d).
