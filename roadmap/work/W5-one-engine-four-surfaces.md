---
id: W5
type: work
title: aegis verify CLI + report API + CI adapter + web evidence drawer over one engine
phase: P1
status: active
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

## S3 plan (recon-derived, 2026-07-25)

> Synthesized from the four-mapper read-only recon (run `wf_d8cdf4b2-e93`: engine-surface,
> packaging, canon-constraints, test-patterns reports; journal preserved on disk under the
> session's workflow directory). Every claim cites a report or `path:line`; `W5:` line cites
> refer to this file AT COMMIT `ec1e85f`, before this section was inserted. OBSERVED = read
> from the repo by a mapper; RULING = a design choice this plan makes, to be validated by the
> S3 tests themselves and the Codex loop.

### 0. Ground rules binding this slice

- Surfaces are transports: the CLI calls `runVerification` only, never an evaluator, and can
  never re-derive or alter a verdict (W5:62-67; D-6bedc848:88-89; ENGINEERING_SPEC:899).
- A throw is an operational failure of the run, never rendered as a `fail` verdict (W5:83-84).
- Recorded mode is labeled recorded; the `recorded_inputs` limitation is surfaced verbatim from
  the payload, never restated (W5:86-87; engine.ts:251).
- No new files under `data/` — W5 `allowed_paths` has no `data/**`; all non-shipped inputs are
  synthesized in-test (W5:102-103).
- Do not stamp W5 mid-slice (W5:196).

### 1. TDD test matrix (write in this order; each observed RED first)

New file `tests/cli.test.ts`, importing `main` from `../bin/aegis` in-process (§4 for why).
House idioms: `rejects`-style code assertions (tests/surfaces-request.test.ts:53-60), reseal
helper (tests/engine.test.ts:39-49), byte-tamper (tests/strict-json.test.ts:56-63).

**A. Harness + envelope**
1. `main returns instead of exiting` — `main(argv, io)` resolves a number; no `process.exit`
   reachable from the exported path (zero subprocess precedent repo-wide; vitest `include`
   covers `tests/**` only).
2. `--json emits canonical bytes + reportHash` — shipped manifest + heads + identity,
   `--evaluation-time 2026-07-24T00:00:00Z`; stdout parses; payload has exactly the 15
   mandatory keys (canonical.ts:153-157); `reportHash` matches `/^sha256:[0-9a-f]{64}$/`;
   serialization is `jcsSerialize`, not `JSON.stringify` (ENGINEERING_SPEC:846).
3. `determinism` — two runs with identical argv produce byte-identical stdout and equal hashes
   (ENGINEERING_SPEC:26; injected `--evaluation-time`, no hidden clock).

**B. Exit codes — one test per row, every row**
4. **exit 3 (unknown), the shipped-fixture reality**: shipped manifest + heads + identity → 3
   verifications, all `unknown` by construction (tests/surfaces-engine.test.ts:132-140,
   154-166; W5:200-203) → exit 3. This is also the *documented command's* honest exit — record
   it as 3 in EV-W5, never tune it to 0.
5. **exit 0 (in-test only)**: re-sealed manifest targeting the addresses the shipped identity
   recording actually covers — `address 0xa1a1…`, `expectedImplementation 0xb2b2…`,
   `expectedRuntimeCodeHash
   sha256:30c48c422efb56515e475a018747730c0c390352e0035cc389d8a8f2f1e275d3`
   (= `sha256(bytes("608060405f"))`, the value tests/identity-compare.test.ts:33-42 derives and
   proves `pass` at :139-141), `contentHash` re-sealed via `manifestContentHash`. Assert exit 0
   and that the human summary uses only "no blocking failure … within declared coverage"
   language (THREAT_MODEL:153).
   *W6 interaction, stated for the record:* exit 0 is **deliberately not reachable from shipped
   fixture files** — W6's constraint that no shipped fixture produces a `pass` makes the
   synthesized-manifest recipe the permanent test path. Canon-aligned, not a gap.
6. **exit 2 (blocking fail)**: same synthesized manifest with `expectedRuntimeCodeHash
   sha256:${"7".repeat(64)}` → `runtime_code_hash` verification `fail` alongside an
   `implementation` `pass` (tests/identity-compare.test.ts:230-244) — proves worst-state-wins
   precedence, not just single-state mapping.
7. **exit 3 (conflict)**: reseal the identity bundle so providers disagree on one read
   (compare.ts:490,512-515 sets `conflict` on `observation_conflict`); the reseal must
   recompute BOTH per-response hashes (tests/engine.test.ts:39-49).
8. **exit 4 (invalid request, thrown)**: representative `RequestError` recipes — `--chain`
   absent (`empty_chain_ids`), duplicate chain, `--at latest` (`unsupported_at_selector`) — all
   10 codes already unit-tested at request level (request.ts:72-128); the CLI test asserts
   mapping + that `code at path` reaches stderr.
9. **exit 4 (invalid manifest, NOT thrown)**: `"{ not json"` bytes → payload completes with
   `policyTrust.state === "invalid"`, `verifications: []` (trust.ts:310-334;
   tests/surfaces-trust-seam.test.ts:60-69) → exit 4 derived **from payload state**. Also the
   duplicate-key tamper (tests/strict-json.test.ts:56-63).
10. **exit 3 (untrusted manifest)**: valid manifest, trust policy that does not approve it →
    `policyTrust.state === "untrusted"`, `verifications: []` → exit 3, not 0 and not 4
    (RULING, §3) — kills the dishonest "zero verifications reads as clean" path.
11. **exit 4 (corrupt recording bytes)**: tampered heads bundle → CLI pre-validation
    `ChainError integrity_mismatch` → 4 (RULING, §3 — recording corruption is caller input).
12. **exit 5 (`no_observation_boundary`)**: heads bundle with every quicknode response filtered
    out — no reseal needed (tests/surfaces-engine.test.ts:230-247, reusable verbatim).
13. **exit 5 (`ambiguous_head_provenance`)**: two byte-different but content-equal heads
    recordings (`JSON.stringify(JSON.parse(...))` re-encode); NB two *identical* byte arrays
    are `duplicate_recording` → 4 — the ordering trap at engine.ts:106-128.

**C. Render language (the canon teeth)**
14. `boundaries before results` — human output states observation boundaries, manifest
    identity, `policyTrust.state` + reasonCodes, and coverage before any verification line
    (PRODUCT_SPEC:213-220, :351).
15. `state words are text` — `unknown`/`stale`/`conflict` appear as words, never collapsed into
    an aggregate; `manifestVersion` prints `"unknown"` untouched for refused manifests
    (PRODUCT_SPEC:354; THREAT_MODEL:98; W5:204-206).
16. `limitations always printed` — every `limitations[]` entry rendered, `recorded_inputs` text
    verbatim; reproduce line printed (full-flag form; §6) (PRODUCT_SPEC:303, :426).
17. `untrusted strings escaped` — a resealed bundle carrying ANSI/control bytes in a provider
    string renders escaped (THREAT_MODEL:125; ENGINEERING_SPEC:883).
18. `claim-language lint` — source-level test over `bin/aegis.ts` + `surfaces/render.ts`
    forbidding `live`, `safe`, `healthy`, `verified` claim tokens (patterned on
    tests/aegis-engine.test.ts:142-149); **negative-tested** by temporarily inserting a
    violation.
19. `hygiene coverage` — add `"bin"` to `SOURCE_DIRS` in tests/repo-source-hygiene.test.ts:15
    (the scanner currently has a blind spot exactly where S3 adds files); negative-tested with
    a CR byte.

**D. Diagnostics**
20. `provider-id sanity warning` — heads bundle stripped of one configured provider's responses
    → stderr warning naming the missing `providerId`; exit code and verdicts UNCHANGED
    (misconfig masquerades as outage — W5:233-235; diagnostics may not alter outcomes).
21. `downgrade visibility` — chain 10 pins with `finality "confirmations"` + downgrade
    `finality_tag_unsupported` (tests/engine.test.ts:69-75); human render shows the downgrade
    reason, not just the finality word (needs §5's engine addition — write this test RED
    against the un-extended diagnostics).

### 2. CLI design

**Command (M1):** `aegis verify` only. `reproduce`/`diff`/`preflight`
(ENGINEERING_SPEC:888-896) are later slices; `aegis reproduce` needs the S4 store — S3
*prints* the reproduction command instead (§6).

**argv (node:util parseArgs, strict, no invented defaults):**

```text
aegis verify
  --manifest <file>            required  raw bytes -> inputs.manifestBytes
  --heads <file>               required  role "heads" recording
  --identity <file>            repeatable, role "identity"
  --chain <id>                 repeatable, required -> selector.chainIds
  --at <selector>              required; passed through verbatim — the ENGINE refuses anything
                               but "finalized" (request.ts:77) -> exit 4
  --evaluation-time <ISO-UTC>  required -> deployment.evaluationTime (determinism is an
                               explicit input, never a hidden clock; ENGINEERING_SPEC:26)
  --profile reference          required (only value at M1) -> builds DeploymentConfig in code
  --trust-policy <file>        optional {trustPolicyId, approvedHashes[]} JSON
  --json                       canonical envelope to stdout; human render otherwise
```

Files only at S3 (stdin is an S4/API concern). Fixture paths resolve from `process.cwd()` —
never `__dirname`, undefined in the ESM bundle.

**DeploymentConfig sourcing:** `--profile reference` reproduces the reference instantiation
verbatim from tests/surfaces-engine.test.ts:29-45 (`engineVersion "aegis-core/0.1.0"`,
`environment "reference"`, `provenanceClass "reference_scenario"`, quorum `pq-reference`
alchemy+quicknode min 2, `confirmationDepth "12"`, `maxHeadLagBlocks "1000"`,
`PROVIDERS.alchemy/quicknode`, `fp-reference`), hosted in code (`lib/aegis/surfaces/profiles.ts`
or `bin/`), since `data/**` is out of scope. Without `--trust-policy`, the profile derives
`approvedHashes` from the supplied manifest — **self-approval**, legitimate only as reference
analysis (THREAT_MODEL:136); the human render must show `policyTrust` with its reasonCodes so
this is visibly non-canonical (W5:73-75). `--trust-policy` is the honest operator mode; the
self-approval default must be named in `--help`.

**`lib/aegis/surfaces/render.ts`:** pure functions, no I/O — `renderHuman(run): string` (may
read `diagnostics`; engine.ts:63-64 explicitly licenses this for a CLI renderer) and
`renderJson(run): string` = `jcsSerialize({ payload, reportHash })`. Every displayed label
derives from hashed payload fields (ENGINEERING_SPEC:846). Human layout: header (protocol,
per-chain boundary block+finality, manifest version+hash, trust state, coverage) →
verifications (state word first, statement, expected/actual, per-item limitations) → top-level
limitations → reportHash → reproduction line. Friendly labels allowed in human mode only;
`--json` is canonical states verbatim (PRODUCT_SPEC:333).

**`bin/aegis.ts`:** `export async function main(argv: string[], io): Promise<number>`; a
guarded entry (`import.meta.url` main-module check) does
`process.exit(await main(process.argv.slice(2), process))`. No side effects at import —
required for in-process vitest driving.

### 3. Exit-code mapping (RULING — total, every path accounted)

Precedence: pre-validation throw → engine throw → payload-derived.

| Source | Condition | Exit |
|---|---|---|
| CLI argv | parseArgs failure, missing required flag, unreadable file | 4 |
| CLI pre-validation | `loadRecordingBytes(bytes)` throws `ChainError` on any supplied recording (adapter.ts:101-164) | 4 |
| engine throw | `RequestError` (all 10 codes, request.ts:72-128) | 4 |
| engine throw | `SurfaceError` (`ambiguous_head_provenance`, `no_observation_boundary`) — doc comment engine.ts:77-80: "Maps to CLI exit 5" | 5 |
| engine throw | `ChainError` / `IdentityError` / `CanonicalizationError` escaping AFTER pre-validation passed | 5 |
| payload | `policyTrust.state === "invalid"` | 4 |
| payload | any `verifications[].state === "fail"` | 2 |
| payload | else: `state` in {unknown, stale, conflict} anywhere, OR `policyTrust.state === "untrusted"`, OR `verifications` empty, OR any `target_boundary_unavailable` limitation | 3 |
| payload | else (trusted, >=1 verification, all `pass`, no unevaluated target) | 0 |

Two deliberate rulings to put in front of the Codex loop explicitly:

- **Attribution over class.** A `ChainError` from quorum/selection *after* valid inputs is not
  an "invalid request or manifest"; it is a run that could not construct an envelope → 5, per
  "a throw is an operational failure of the run" (W5:83-84). Caller-input `ChainError`s are
  caught at pre-validation → 4. Pre-validation is input validation, not evaluation; the engine
  still re-earns the brand from raw bytes itself (W5:98-100) — the CLI passes bytes, never
  bundles.
- **Untrusted → 3, not 0/4.** Exit 0 requires "no … incomplete blocking claim"
  (ENGINEERING_SPEC:903); an untrusted manifest leaves every declared invariant unevaluated —
  incomplete, not invalid. `unknown`-shaped uncertainty is exit 3's definition.

At M1 every verification is blocking (`severity` hardcoded `"high"`, compare.ts:112). `stale`
is currently unreachable through the facade (freshness hardcoded `"current"`,
engine.ts:233-240) — covered by the mapping, untestable today; note it in the test as such
rather than faking it.

### 4. Packaging

- **Test-drive decision: import `main()` in-process.** OBSERVED: zero subprocess/execa/spawn
  usage across `tests/`; vitest `include: ["tests/**/*.test.ts"]`; `lib/` extensionless
  relative imports mean plain Node cannot resolve the spine anyway (W5:222-223). The built
  artifact gets one manual smoke use via the documented command in EV-W5.
- **`vite.cli.config.ts`** (INFERRED shape from OBSERVED constraints — ESM repo, `noEmit` +
  `moduleResolution: bundler`, vite 8.1.5 already present, `dist/` owned by vinext):
  standalone `defineConfig` importing only `"vite"` (never the async Workers `vite.config.ts`);
  `build.ssr: "bin/aegis.ts"`, `target: "node22"`, `outDir: "dist/cli"` (avoids `npm run
  build` collision), `minify: false`, `sourcemap: true`, `inlineDynamicImports: true` (single
  file => one spine instance => WeakSet brands hold — D-6bedc848:55-66), `ssr.noExternal: true`
  with only `node:*` external, `output.banner: "#!/usr/bin/env node"`.
- **package.json**: `"bin": { "aegis": "dist/cli/aegis.js" }`, scripts
  `"build:cli": "vite build --config vite.cli.config.ts"`,
  `"cli": "npm run build:cli && node dist/cli/aegis.js"` (namespacing matches
  `test:property`; `build` is taken by vinext). `dist/` already git-ignored and lint-excluded;
  `bin/**` is linted and type-checked with zero config changes (tsconfig `include: ["**/*.ts"]`).

### 5. Known gaps & risks

- **Finality-downgrade propagation (the recon's one real engine gap).** `establishBoundary`
  returns `downgrades` but `runVerification` drops them — `BoundaryDiagnostic` has no such
  field (engine.ts:138-143); only `block.finality === "confirmations"` survives. W5 acceptance:
  "Finality downgrades reach the reader on every surface" (W5:77-78). Options: (a) add
  `readonly downgrades: readonly FinalityDowngrade[]` to `BoundaryDiagnostic` — diagnostics
  are explicitly excluded from the hashed payload (engine.ts:63-64), so `reportHash` is
  untouched and the edit is confined to `lib/aegis/surfaces/engine.ts`; or (b) render
  `block.finality` only — loses the reasonCode/requested/used record and arguably fails the
  acceptance line. **RECOMMEND (a)**, TDD'd via matrix test 21; run the doctor after the edit
  to *derive* (not predict) receipt impact per INS-ede05c7a.
- **`IdentityError` has no `path`** (resolve.ts:17-26) — the uniform `code at path` stderr
  renderer must not assume `.path`.
- **Exit-0 honesty:** the documented single command over shipped fixtures exits **3**, and
  EV-W5 must record 3. Any pressure to make it 0 is pressure to violate W6's constraint.
- **`invalid_chain_id` exists in both adapter and selection code sets** — map by error class +
  phase (pre-validation vs engine), never by code string.

### 6. Byte-identity forward hook (S7)

- The shared artifact is `canonicalBytes(payload)` + `run.reportHash` — hash once, reuse;
  never re-serialize via `JSON.stringify` (W5:231-232).
- `renderJson` = `jcsSerialize` of `{ payload, reportHash }` with nothing else — no timestamps,
  no request ids, no CLI version stamp (delivery metadata is excluded from identity,
  ENGINEERING_SPEC:846, :879). S7 then asserts CLI/API/CI payload bytes are identical directly.
- The reproduction line printed by the human render is the *full-flag* `aegis verify` form —
  every determinism input explicit, so the line alone re-derives the identical hash
  (PRODUCT_SPEC:303; W5:110-113). `aegis reproduce sha256:<hash>` (stored-input form) lands
  with the S4 store and must not be advertised before it exists.

### Sequencing

1. Matrix tests A1–A3 + B4 (harness + shipped-fixture reality) RED → minimal `main` + `render`
   GREEN.
2. B5–B13 exit codes, one at a time (each RED first; mutation-check the mapping table by
   inverting one row and watching exactly one test die).
3. C14–C19 render language + teeth (lint + hygiene token, both negative-tested).
4. §5(a) engine addition via test 21 (RED against current diagnostics), then D20.
5. Packaging (§4) last — config + scripts + one manual smoke run of the built artifact; verify
   `npm test`, `tsc`, lint, doctor, selftest all green; derive receipt impact with a doctor run
   before committing anything.

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
