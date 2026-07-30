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
