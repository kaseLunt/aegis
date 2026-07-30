# Codex convergence loop — W5 "one engine, four surfaces" (D-b4ab3c69)

Verdicts persisted VERBATIM the moment they land, per [[INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a]]
(review-thread continuity dies with the session; the written record is the resume mechanism).
Subject: the full W5 surface stack at code-complete (S0–S7). No stamp until this loop converges.

# Round 1 — full-stack adversarial review (2026-07-30)

Reviewed at commit `9bd67af` (fresh Codex session, new subject — no relation to the G35 threads).
Verbatim verdict follows.

---

[codex task-ms76hm1o-26ifcb | completed | ~18min | fresh session, W5 review round 1 (thread 019fb1e0-16a0-7eb1-b98d-77faac3ef71b)]

NEEDS-CORRECTIONS

Session ID: `019fb1e0-16a0-7eb1-b98d-77faac3ef71b`

1. A trusted but inapplicable manifest is still evaluated and can produce `pass`/`fail` with exit 0. Applicability is merely recorded, while the target loop ignores it and the classifier ignores `manifest_not_applicable`. The existing test uses an unknown-only fixture and cannot expose the false-clean path. engine.ts:190, engine.ts:215, render.ts:76, surfaces-engine.test.ts:122. Fix by gating each target on its chain's applicability before observation/comparison, emitting only canonically permitted incomplete/not-applicable outcomes, forcing non-clean classification, and testing pass-capable environment/validity mismatches across surfaces.

2. Freshness is fabricated as `current`; no facade path can produce the required stale result. Every identity comparison receives a hardcoded current assessment regardless of capture time, evaluation time, or evaluated policy. engine.ts:236. Fix by implementing an actual freshness-policy evaluation over evidence timestamps/boundaries, using `unknown` when freshness cannot be assessed, and adding a pass-capable stale case proving state `stale`, exit 3, API 200, and four-surface parity.

3. The HTTP and CLI edges accept arbitrary strings as `evaluationTime`; values such as `not-an-iso-time` enter a successful canonical report and are also used as evidence timestamps. api.ts:41, aegis.ts:136. Fix with shared strict ISO-UTC validation before engine execution, mapping rejection to HTTP 400/CLI 4, plus empty, malformed, offset, and boundary tests.

4. CLI trust-policy parsing reopens last-wins JSON handling and misclassifies malformed caller input as engine failure. `JSON.parse` is used without duplicate-key or shape validation; a wrong-shaped valid JSON file currently exits 5, and duplicate `approvedHashes` keys can silently change the trust decision. aegis.ts:98. Fix with duplicate-aware byte parsing and a strict trust-policy schema—nonempty ID, strict unique SHA-256 identifiers—mapping all failures to exit 4 with regression tests.

5. The canonical payload unconditionally claims arbitrary caller-provided recordings were "reviewed." The API accepts caller bytes, so integrity-valid material is not evidence of review. The CLI test pins this false statement, while the claim-language lint does not cover `reviewed` or this engine path. engine.ts:255, cli.test.ts:532. Remove "reviewed" unless review status is derived from authenticated engine-licensed provenance, and add a machine check using arbitrary valid recordings.

6. Manifest evidence falsely aliases the injected evaluation clock to `capturedAt`, and the drawer renders it unqualified as "captured." This can present a modeled or future evaluation time as source-snapshot acquisition time. The test currently enshrines that conflation. engine.ts:307, report-drawer.tsx:80, drawer.test.ts:184. Thread an actual manifest acquisition timestamp with explicit scope—or represent it as unavailable—and test capture and evaluation clocks as distinct values.

7. The charter's required mechanical "one engine" import guard does not exist. J1 proves parity for one unknown reference fixture, but it cannot fail if a surface later imports an evaluator and diverges only on another scenario. byte-identity.test.ts:89. Add an AST/import-restriction check forbidding `establishBoundary`, `observeIdentity`, and `compareIdentityTarget` outside `surfaces/engine.ts`, covering all four entry paths and negative-tested with a planted forbidden import.

Verification: TypeScript passed. ESLint returned 0 errors and one unrelated `.remember/**` warning. An equivalent no-spawn Vitest run passed 411 tests; the remaining 27 could not run because this read-only sandbox denied their temporary-directory writes.

Codex session ID: 019fb1e0-16a0-7eb1-b98d-77faac3ef71b
Resume in Codex: codex resume 019fb1e0-16a0-7eb1-b98d-77faac3ef71b

---

Reviewer-agent addendum (not part of the Codex finding): the "411 passed" figure is a partial
re-run — 27 of 438 tests could not execute in the review sandbox (temporary-directory writes
denied), distinct from the 7 numbered findings.

## Disposition status (round 1)

- Verdict persisted BEFORE any correction work. All 7 findings ACCEPTED for TDD disposition
  (none contested): F5 independently confirms the already-triaged engine finding recorded in
  STATUS ("unconditional reviewed limitation text — a trust-me attestation in prose").
- Order of work (red-first, each with its own bite): F7 (the missing mechanical guard — cheap,
  charter-required), F3 (edge validation), F4 (CLI trust-policy R-003 regression), F5 (claim
  language), F6 (capturedAt conflation), F1 (applicability gating), F2 (freshness evaluation).
  F1/F2 are engine-semantics changes and land last with pass-capable inline fixtures.
- Scoped round-2 re-verification follows the applied set. NO stamp until GATE-PASSES.

## Round-1 corrections APPLIED (2026-07-30, all seven, red-first with bites)

- **F7** → `2854bb1`: J4 mechanical evaluator guard (full-source token scan over every
  surface file except engine.ts; bite-proven with a planted import).
- **F3** → `2854bb1`: strict ISO-UTC clock shared at construction (`referenceDeployment`
  throws `invalid_evaluation_time` at `/evaluationTime`); V8's Feb-30 rollover refused via
  round-trip comparison; CLI exit 4 / API 400 (K1, E12).
- **F4** → `2854bb1`: `loadTrustPolicyBytes` in surfaces/request — duplicate-key scan
  before parse + strict shape; every failure typed caller-input exit 4 (K2, K3; K3's
  control now distinguishes trusted-3 from untrusted-3).
- **F5** → `639be67`: "reviewed" removed from the recorded_inputs text; machine check over
  arbitrary re-encoded valid recordings pins /\breviewed\b/i out of all payload texts.
- **F6** → `639be67`: manifest evidence capturedAt = canonical degraded `"unknown"`
  (caller bytes carry no acquisition metadata; a wall clock would break determinism);
  clocks tested as distinct values.
- **F1** → `d54a7bf`: applicability gates targets per chain BEFORE observation;
  gated targets surfaced by name (`target_manifest_not_applicable`); the shared
  classifier refuses clean on any inapplicability row (F1a/F1b engine scenarios + F1c
  all-pass-payload false-clean pin).
- **F2** → `f58955c`: `evaluateFreshness` over the observation's own per-response capture
  timestamps vs the injected clock, under the declared `fp-reference` 7-day window;
  `unknown` when unassessable (F2a); pass-capable stale case proves state `stale`,
  exit 3, API 200, and four-surface hash parity (K4, J5).
- Suite: 438 → 451 tests, all green; tsc + eslint clean. Ready for scoped round-2
  re-verification.

# Round 2 — scoped re-verification (2026-07-30)

Fresh Codex session (the `--resume-last` hazard below made resuming the round-1 thread
unsafe). Reviewed at `f6d4c02` base; the job self-detected the concurrent G-08 commit
advancing HEAD to `b746746` mid-run, confirmed W5-relevant paths byte-unchanged, and
correctly did not halt. Verbatim verdict follows.

---

[codex task-ms7902la-mcz8am | completed | ~27min | fresh session, W5 round 2 (thread 019fb220-7beb-7060-97c6-1719134082aa)]

# FURTHER-CORRECTIONS

Session ID: `019fb220-7beb-7060-97c6-1719134082aa`

## Blocking finding

1. F2 remains incomplete for calendar-invalid evidence timestamps. The recording loader verifies only that `capturedAt` is a string at adapter.ts:131, while freshness uses permissive `Date.parse` at engine.ts:363. V8 normalizes `2026-02-30T00:00:00Z` to March 2, so integrity-valid caller evidence containing an impossible timestamp is classified `current` or `stale` rather than the required `unknown`.

   Required fix: strictly validate each freshness-bearing observation timestamp as a real instant using grammar plus exact calendar round-trip. Any malformed, overflowing, or otherwise unassessable timestamp must force `unknown`. Add a re-sealed recording test containing an overflowing `capturedAt` that would otherwise produce a non-unknown result.

## Disposition rulings

- F6: Acceptable. `"unknown"` honestly represents unavailable acquisition time, preserves determinism, and is rendered without aliasing the evaluation clock.
- F2 seven-day policy: Legitimate for the explicitly reference-only fixture profile. It is a fixed declared policy, not a hardcoded result. It must not be promoted as an independently reviewed production policy.
- F2 scope: Sufficient. Identity freshness may cover identity-read acquisition timestamps while block-head divergence remains a separate `maxHeadLagBlocks` axis. This does not imply absolute wall-clock chain-head freshness.

F1, F3–F7 otherwise resolve their original failure modes. No additional blocking overclaim was found in `target_manifest_not_applicable`, K3's trusted-3 control, or J5's fixture.

J4, I5, and F1c are binding and passed directly: 3/3. The broader sandbox run reached 420 passing tests; 31 were blocked by temp-directory `EPERM`. TypeScript passed. ESLint reported 0 errors and one pre-existing `.remember/**` warning.

Codex session ID: 019fb220-7beb-7060-97c6-1719134082aa
Resume in Codex: codex resume 019fb220-7beb-7060-97c6-1719134082aa

---

## Disposition status (round 2)

- ONE blocking item: strict-instant validation extended to evidence timestamps (the F3
  round-trip rule, shared — one validator for clock AND captures) + the re-sealed
  overflowing-capturedAt test. All three round-1 judgment calls ACCEPTED; F1/F3–F7 closed.
- The fp-reference 7-day window ruling carries a standing cap: it must never be promoted
  as an independently reviewed production policy.
- **Operational finding (multi-lane review pattern):** the companion's `--resume-last`
  resolves to the chronologically newest job in the workspace+session, NOT a semantically
  named thread — with G35/W5/G-08 interleaved it attached to the WRONG subject's thread;
  the reviewer agent detected the mismatch, cancelled before any output surfaced, and
  dispatched fresh. Standing rule: `--resume-last` is safe only when no other review
  thread has been dispatched since the one being resumed; otherwise dispatch FRESH against
  the persisted verdict file. Recorded as an addendum to
  [[INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a]].

## Round-2 correction APPLIED (2026-07-30) → `cc44c3a`

- One shared `parseStrictInstant` in surfaces/request (grammar + exact calendar
  round-trip, epoch-ms or null) now backs BOTH the deployment clock validation
  (profiles — replacing its inline copy of the same rule) and `evaluateFreshness`'s
  per-observation capture timestamps. A calendar-invalid `capturedAt` forces `unknown`.
- Test F2b: re-sealed identity recording (per-response envelope hashes recomputed — the
  loader's integrity check binds capturedAt, so an unsealed edit is refused bytes) with
  `2026-02-30T00:00:00Z` → freshness `unknown`, state `unknown`; in-test control with the
  real instant `2026-02-28T00:00:00Z` proves the scenario is otherwise stale-capable.
- Suite 452/452; tsc + eslint clean. Ready for scoped round-3 re-verification.

# Round 3 — convergence check (2026-07-30)

Fresh Codex session per the standing multi-lane rule (no `--resume-last`). Reviewed at
`b86d6a4`; correction commit verified `cc44c3a`. Verbatim verdict follows.

---

[codex task-ms7a0ntq-aaqo3l | completed | ~27min | fresh session, W5 round 3, final queued round (thread 019fb23a-8828-7211-8270-6bebdecd44d7)]

GATE-PASSES

Session ID: `019fb23a-8828-7211-8270-6bebdecd44d7`

- Strict validation covers the evaluation clock and all successful observation timestamps; invalid values force `unknown`.
- F2b is binding: reverting to `Date.parse` yields `stale`, causing the test to fail.
- Shared-helper behavior is equivalent to the prior profile validation.
- Re-sealing claims only envelope integrity, not authenticity or review.
- F2b/K1/E12 passed directly; TypeScript passed; ESLint had 0 errors. The read-only sandbox ran 421 tests, with the remaining 31 blocked solely by temporary-file permissions.

Codex session ID: 019fb23a-8828-7211-8270-6bebdecd44d7
Resume in Codex: codex resume 019fb23a-8828-7211-8270-6bebdecd44d7

---

## Disposition status (round 3 — LOOP CONVERGED)

- **The W5 convergence loop is CLOSED: GATE-PASSES at round 3** (7 findings → 1 → 0,
  monotone) per [[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]. Green local tests were
  necessary; this loop was the sufficiency.
- Reviewer-agent operational note (recorded): its first round-3 dispatch self-halted under
  D-004 because the reviewer's own brief omitted the standing g08-evidence untracked
  exception — a prompt omission, not a repo problem; corrected and redispatched once, the
  non-answer discarded. The fail-closed halt worked exactly as designed.
- Unlocked: EV-W5 (documented command + recorded hash, workflow snippet, drawer smoke,
  verification-boundary disclosure) and the W5 achieved stamp. The recorded reference
  hash must be RE-DERIVED post-corrections (the round-1/2 fixes changed the payload).
- Standing cap carried into EV-W5: the fp-reference freshness window is a declared
  reference-profile constant, never an independently reviewed production policy.
