---
id: W5
type: work
title: aegis verify CLI + report API + CI adapter + web evidence drawer over one engine
phase: P1
status: committed
evidence_target: "Correct + Robust + Demonstrated"
priority: 1
depends_on: [W4]
blocked_by: []
informs: [H0]
allowed_paths:
  - lib/**
  - tests/**
  - app/**
  - bin/**
  - components/**
  - package.json
  - vite.cli.config.ts
deliverables:
  - lib/aegis/surfaces/engine.ts
  - lib/aegis/surfaces/request.ts
  - lib/aegis/surfaces/render.ts
  - lib/aegis/surfaces/ci.ts
  - bin/aegis.ts
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
  - bin/**
  - components/**
  - data/**
  - package.json
review_when: phase:P1:exit
updated: 2026-07-25
---

# W5 — One engine, four surfaces

**Why this advances the vision:** M1's exit gate is the identical canonical report via
CLI, API, CI, and web (docs/ROADMAP.md M1) — one engine, byte-identical reportHash on
every surface.

## Objective

Wire the W1–W4 spine into `aegis verify` CLI, the report API, a CI adapter, and the web
evidence drawer, all consuming **one engine facade** and emitting byte-identical canonical
reports.

The decisive structural fact from the kickoff map (run wf_c29e08ca-2a8): **there is no
packaged pass-to-report composer** — the W1+W2+W3(+W4) composition exists only inside
`tests/engine.test.ts` (describe "W1+W2+W3 composition", the reference recipe) and
`tests/identity-compare.test.ts`. Each of the four surfaces is that same pipeline behind a
different transport. So W5 builds the composer once and the surfaces are transports:
**no surface may evaluate anything.**

Shape decisions and their rejected alternatives:
[[D-6bedc848-2a42-411a-a65b-d623f7418121]].

## Acceptance

### Correct
- **One engine.** A single facade (`lib/aegis/surfaces/engine.ts`) composes
  recordings → adapters → `establishBoundary` per chain → policy trust → identity
  observe/compare per manifest target → canonical payload. Every surface calls it; no
  surface imports `establishBoundary`/`observeIdentity`/`compareIdentityTarget` directly
  (mechanically checked).
- **Targets are bound to the trusted manifest.** Targets are extracted from the
  `LoadedManifest` whose recomputed content hash IS the report's `manifestHash`, inside the
  module that establishes policy trust. A caller-supplied target cannot enter comparison —
  structurally, not by assertion. Closes [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3.
- **Delivery metadata is outside identity.** `requestId` and `generatedAt` never enter the
  hashed payload; `requestHash` is a deterministic canonical function of the request.
- **Honest trust states.** An untrusted or invalid manifest still yields a report carrying
  `policyTrust.state`; no `pass` verdict can rest on one. A caller-supplied custom manifest
  is visibly noncanonical and cannot produce a production pass/fail (M1 exit gate).
- **Fail closed.** An `unresolved` boundary surfaces `quorum.reasonCodes` and observations
  and never invents a block; dependent verdicts are `unknown`. Finality downgrades reach the
  reader on every surface. Missing evidence is never a passing value.
- **Typed errors are mapped, not swallowed.** `CanonicalizationError`/`ChainError`/
  `ManifestError`/`IdentityError` map to the spec's CLI exit codes (0 clean, 2 blocking
  fail, 3 unknown/stale/conflict, 4 invalid request/manifest, 5 engine failure) and to HTTP
  status (completed `unknown`/`stale`/`conflict` are 200 with an honest report; 503 only
  when no envelope can be constructed). A throw is an operational failure of the run, never
  rendered as a `fail` verdict.
- **Recorded mode is labeled recorded.** No surface presents recorded-fixture agreement as
  live-provider independence ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §1–2 stay open).
- **[[R-003]] closed at the byte boundary.** Duplicate JSON keys are a typed rejection at
  `loadManifestBytes` and `loadRecordingBytes`, never last-wins.

### Robust
- **The M1 gate, mechanically:** one request driven through all four surface entry paths
  (CLI `main(argv)`, the API route handler with a `Request`, the CI adapter entry, the
  drawer's server-side loader) yields four `reportHash` values equal to each other and to
  the facade's direct output.
- `reportHash(payload) === reportHash(JSON.parse(JSON.stringify(payload)))` on every
  surface's output; determinism under adapter-order permutation and repeated runs
  (injected clock).
- **Brand locality is respected and proven:** a serialized/round-tripped bundle or
  observation is refused, never silently accepted; each surface re-earns the brand from raw
  bytes in-process ([[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]] addendum 3).
- Negative scenarios (mismatch, missing evidence, stale, provider conflict, ABI mismatch)
  each produce the correct verdict AND the correct exit code, using inline `sealedBundle`
  constructions — the shipped fixture corpus is W6.
- The renderer escapes untrusted external strings (provider errors, revert data, contract
  metadata) and is a renderer only — it cannot change a verdict.
- Claim-strength discipline holds on the web surface: the existing trust-language lint
  (`tests/aegis-engine.test.ts`) is extended to the evidence drawer.

### Demonstrated
- A **documented single command** reproduces one report end to end from shipped fixtures,
  and the `reportHash` it prints matches the one recorded in EV-W5 (M1 exit gate: "a
  reviewer reproduces one real report from a documented command").
- `aegis reproduce sha256:<report-hash>` re-derives the identical hash from stored inputs.

## Non-goals

- Live production monitoring; M2 route matrix.
- Live RPC transports / provider probes (WR3 probe step). The live raw-response-hash
  threading gap stays open and must not be faked by recomputing from parsed content.
- The recorded scenario-fixture corpus + reorg supersession — **W6**, which is what closes
  M1 ([[D-6bedc848-2a42-411a-a65b-d623f7418121]] §4).
- `.github/workflows/**`: the CI adapter ships as library code + a documented workflow
  snippet; CI machinery is [[D-007]]/[[R-005]] work.
- Bundle-digest anchoring and live endpoint-identity binding
  ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §1–2).

## Slices (each TDD, each ends green)

- **S0 — engine facade + request model + the trust seam. DONE (06f44c6, 368/368).**
  `surfaces/engine.ts` (`runVerification`) + `surfaces/request.ts` (canonical request,
  deterministic `requestHash`). Returns `{ payload, reportHash, request, diagnostics }` where
  `payload` is inert frozen I-JSON and `diagnostics` carries the in-process-only detail
  (unresolved reasons, applicability) that must never enter the hashed payload.
  S0 **absorbed the trust seam** originally planned for S1: `checkApplicability` needs the
  loaded manifest, so deferring the seam would have meant writing a throwaway
  load-it-separately pattern and deleting it one slice later. `trustedManifestFromBytes`
  yields `{ block, loaded }` with `loaded` non-null ONLY when `block.state === 'trusted'`,
  and `policyTrustFromBytes` delegates to it so the two cannot diverge.
  Re-attestation done in the follow-on commit: **TWO** receipts, not one —
  `EV-W2-R2` **and** `EV-W4-R2`. The kickoff decision record said one; that was wrong,
  because `lib/aegis/manifest/trust.ts` is W2's own **deliverable** as well as sitting in
  W4's `invalidated_by`. Ask which item OWNS a file, not only which items list it.
- **S1 — target extraction + identity verifications. DONE (374/374).** Targets read from the
  trusted `loaded.manifest.targets` (untrusted/invalid manifest ⇒ zero verifications, asserted),
  `observeIdentity` per target at the pinned block, `compareIdentityTarget` into
  `payload.verifications`; comparison evidence merged into top-level `evidence` deduped by id
  for referential integrity. A target whose chain never pinned is surfaced as a
  `target_boundary_unavailable` limitation, never silently dropped (mutation-tested).
  Touched only `lib/aegis/surfaces/**` + tests, so no receipt was invalidated.
  **Defect found and fixed here:** the report was emitting ZERO `rpc_call` evidence while
  asserting two boundaries — a conjunctive filter required `o.capturedAt`, which the W3
  `ChainAdapter` head contract structurally never provides. Fixed with the verified bundle's own
  `capturedAt` plus a fail-closed `ambiguous_head_provenance` refusal when more than one heads
  recording is supplied. Full analysis and the deferred durable fix:
  [[INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc]].
- **S2 — [[R-003]] duplicate-aware strict parse. DONE (3e70cf2, 384/384).**
  `findDuplicateJsonKey` in `report/canonical.ts`; both byte boundaries reject duplicate keys
  before parsing, with typed `duplicate_json_key` errors. Per-object scoping, string-value
  colons and escaped key quotes all pinned; guard negative-tested at both call sites. R-003
  CLOSED. Four receipts re-attested (W1 included by the deliberate placement choice).
  API request size/shape limits move to **S4**, where the HTTP edge actually exists.
- **S3 — CLI.** `bin/aegis.ts` + `vite.cli.config.ts` + `package.json` bin/scripts;
  `node:util parseArgs`; `surfaces/render.ts`; exit-code matrix.
- **S4 — report API.** `app/api/v1/verify` (POST) + `app/api/v1/reports/<hash>` (GET,
  content-addressed); envelope `{requestId, generatedAt, payload, reportHash}`; provider
  allowlist (no caller-supplied URLs — never an SSRF primitive).
- **S5 — CI adapter.** `surfaces/ci.ts`: same facade → machine-readable summary + exit code;
  documented workflow snippet in EV-W5.
- **S6 — web evidence drawer.** Boundary + downgrades, provider observations, evidence refs,
  verdict vocabulary, limitations; payload-derived fields only.
- **S7 — cross-surface byte identity** (the gate) + the documented reproduce command.

Then the Codex convergence gate ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]) before any
achieved stamp.

## Canonical commands

```text
npm test
```

## Handoff

- next: **S0 + S1 + S2 DONE** (384/384, tsc + lint clean). Start at **S3 — the CLI**:
  `bin/aegis.ts` + `vite.cli.config.ts` + `package.json` bin/scripts, `node:util parseArgs`,
  `surfaces/render.ts`, and the exit-code matrix (0 clean / 2 blocking fail / 3
  unknown-stale-conflict / 4 invalid request or manifest / 5 engine failure).
  **No more re-attestation chains in W5** — verified systematically, not from memory: every
  work item's `invalidated_by` was matched against the concrete S3-S7 path set and no item
  holding a LIVE (`status: recorded`) receipt is hit. Note the precise reason, because the
  loose version of this claim is wrong: W5 and W6 DO list those paths (`bin/**`,
  `components/**`, `package.json`, and `lib/aegis/**` which covers `surfaces/`), but W5 is
  `active` with `evidence_receipts: []` and W6 is `candidate` — neither has a receipt to
  invalidate yet. Forward implication: once W5 is STAMPED it acquires a receipt over
  `lib/aegis/**`, `bin/**`, `components/**`, `data/**` and `package.json`, so any later work in
  those paths (W6 especially) will invalidate W5's own receipt. Do not stamp W5 mid-slice.
  S2 was the last chain, and it cost FOUR receipts (W1, W2, W3, W4) — one more than predicted,
  because the scanner was placed in `report/canonical.ts` on purpose.
  Carry-overs still open:
  - Verdicts over the shipped fixtures are all `unknown` by construction — the manifest's
    targets have no recorded reads and its expected hashes are placeholders. A matched
    manifest/recording pair is required for a `pass`; that constraint is now written up in the
    W6 work file. Do NOT "fix" it inside W5.
  - `manifestVersion` degrades to `"unknown"` for untrusted/invalid manifests by design (a
    refused document must not place chosen strings in a canonical field) — confirm that reads
    honestly on the CLI and in the drawer.
  - Head evidence `capturedAt` is bundle-level, identity-read `capturedAt` is per-response
    ([[INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc]]). The drawer must not imply per-call head
    timestamps.
- read_first: [[D-6bedc848-2a42-411a-a65b-d623f7418121]] (shape + rejected alternatives);
  [[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]] addendum 3 (brands are process-local —
  surfaces re-verify bytes, never ship verified objects);
  [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3; [[R-003]]; docs/ENGINEERING_SPEC.md
  §API surface + §CLI surface (envelope, exit codes); docs/ROADMAP.md M1 exit gate;
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]] (re-attestation recipe);
  [[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]] (CRLF before any stamp).
- hazards:
  - **No packaged composer exists** — do not assume one; build it in S0.
  - **WeakSet brands are process-AND-module-instance local.** Pin one import path per
    surface; a bundler that loads `chain/adapter.ts` twice (ESM+CJS, Next server/edge split)
    creates a second `VERIFIED_BUNDLES` and every bundle becomes `bundle_not_verified`.
  - `lib/` uses **extensionless relative imports** — plain Node ESM cannot resolve the
    spine; the CLI needs the vite SSR build (its own config, NOT the vinext/Workers one).
  - **Do not model the API on the M0 routes.** `lib/aegis/types.ts` is the M0 vocabulary
    (`PUBLIC_STATE`) and conflicts with canonical (`observed_public_state`); M0 hashes are
    `AGS-<64hex>`/12-hex ids, canonical is `sha256:<64hex>`. Never mix.
  - **Do not copy `app/api/health/route.ts`'s silent live-fetch fallback.** The spine's
    fail-closed idiom is the convention.
  - `checkApplicability` is called by NOBODY today — the composer must call it itself or a
    trusted manifest silently applies outside its validity window/environment.
  - `reportHash` revalidates + re-normalizes on every call; hash once and cache by content
    on the API, and never skip validation to go faster.
  - A recorded-mode provider misconfiguration (wrong `ProviderConfig` for a bundle) looks
    like a provider **outage** (`recording_missing` → observation status `timeout`) — the CLI
    should sanity-check that the bundle carries the provider's id.
  - Serena's index resolves in the main session but FAILS in subagents here
    ([[INS-f3f74c16-f56e-46b1-85bd-55464e4183ce]]) — budget fan-outs at whole-file-read cost.

## Evidence

No attained evidence yet.
