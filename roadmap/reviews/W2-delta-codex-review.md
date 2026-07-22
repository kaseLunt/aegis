# Codex cross-vendor review — W2 delta (f7e6dbd)

- Scope: `a04a946..f7e6dbd` (W2 completion: loadManifestBytes, sealed fixture,
  policyTrustFromBytes, applicability hardening, set dedup, nesting cap).
- Session: `019f8b83-b164-7843-9b46-df21c3eb3bcd` (resume: `codex resume 019f8b83-…`).
- Framing: correctness/spec-conformance brief per [[INS-004]] ladder step 1 — no
  moderation block this time.
- Verdict: needs-attention — 3 P1 findings. All three verified real in-session (each
  reproduced as a RED test before fixing) and fixed the same day; fixes + tests in
  `tests/codex-w2delta-fixes.test.ts` (17 tests).
- Clean dimensions per Codex: exact approved-hash membership; invalid-byte anchoring.
- Reviewer environment notes: Codex sandbox denied Vite child-process spawn (EPERM), so
  it could not run the suite (suite verified locally: 176/176 after fixes); it detected
  mid-review HEAD drift from this session's own W3 commits (9cf6369, 882cf8c — verified
  disjoint from all reviewed files) and correctly halted read-only.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | P1 | Wrong container/component types pass structural validation: scalar `invariantIds`/`uncovered`/`reviewers`, non-array `policyRefs`, array-coerced `policyRefs[].kind` / `targetId` / `identityStrategy` (`String(["x"]) === "x"`), non-object `validity`, fractional `validity.*.chainId` silently ignoring the window bound — all loadable, and trustable once resealed. | FIXED. `requireString`/`requireArray` type gates before uniqueness/enum checks; `invalid_field_type` code; validity requires object + integer chainIds. E2E test: wrong-typed manifest with its recomputed hash approved → `invalid`, never trusted. |
| 2 | P1 | Nesting cap only guarded canonical-bytes entry points: `validateReport`, `validateReportStructure`, `normalizeReport` threw raw `RangeError` on a 10k-deep `decodedResult` (platform-dependent crash instead of typed rejection). | FIXED. `assertJsonDomain` now runs FIRST in all three exports; each tested at depth 10k → typed `nesting_depth_exceeded`. |
| 3 | P1 | `checkApplicability` never checked boundary kind — a `source_snapshot` boundary carrying a block-shaped field evaluated as an execution block; missing `block` escaped as raw `TypeError`; `deploymentEnvironment` unvalidated. | FIXED. Typed `invalid_observation_boundary` for wrong/missing structure, `invalid_environment` for a non-string/empty comparand, before any nested access. |

## Class notes
- Findings 1 and 3 are one class: **presence checks + coercing key-builders are not type
  validation**. The W2 module now type-gates every consumed field before any coercion,
  matching the report layer's typed-key discipline (spine review P1#4).
- Finding 2 is the completeness half of the in-session depth-cap fix: a guard added for
  one entry point must be swept across EVERY exported recursive path — the teeth test now
  pins all three.
