---
id: W5
type: work
title: aegis verify CLI + report API + CI adapter + web evidence drawer over one engine
phase: P1
status: achieved
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
evidence_receipts:
  - roadmap/evidence/EV-W5-R2.md
invalidated_by:
  - lib/aegis/**
  - bin/**
  - components/**
  - data/**
  - package.json
review_when: phase:P1:exit
updated: 2026-07-30
evidence_fingerprint: sha256:dfe1a3e08c8ffe350aa57519b3332fc6c9051855b4cf347f59af4ad1d1686f17
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
    string renders escaped (THREAT_MODEL:125; ENGINEERING_SPEC:883). *Landed with a recorded
    test-spec deviation: at M1 a provider-authored string cannot ride into the render (a
    recording's providerId must equal the in-code deployment config's to be matched at all;
    boundary block fields are format-bound), so the test's vectors are the two caller strings
    that DO flow to the render — manifestVersion and trustPolicyId — including a smuggled-
    newline line-forgery attempt. The escape (`render.ts esc()`) is renderer-wide, so any
    future provider-string flow inherits it.*
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

## S4 plan (recon-derived, 2026-07-26)

> Synthesized from the four-mapper read-only recon (run `wf_3f608169-b43`: http-surface,
> store, canon-constraints, test-patterns; journal preserved under the session's workflow
> directory). OBSERVED = read from the repo/docs by a mapper this run, cited `path:line`;
> RULING = a design choice this plan makes where canon is silent, to be validated by the
> S4 tests and the Codex loop.

### 0. Ground rules binding this slice

- Route handlers are transports: they call `runVerification` only and can never re-derive
  or alter a verdict (W5:62-67). Classification is payload-derived via the shared function,
  never recomputed per-transport (render.ts:55-57).
- Canon endpoints: `POST /api/v1/verify` (ENGINEERING_SPEC:853), `GET /api/v1/reports/:hash`
  (:856). Envelope `{requestId, generatedAt, payload, reportHash}` (:868-877);
  requestId/generatedAt are delivery metadata, excluded from the hash (:846, :879).
- Providers/URLs are structurally uncallable: `VerificationSelector` is
  `{sourceMode, at, chainIds}` and `VerificationInputs` manifest+recording bytes only
  (request.ts:24-33); `DeploymentConfig` is never caller input (engine.ts:41-44;
  THREAT_MODEL:126 — the canonical allowlist statement).
- vitest resolves no `@/` alias (vitest.config.ts:3-9 has no `resolve.alias`; tsconfig
  paths are not read) — every file under `app/api/v1/**` uses RELATIVE imports, as
  `bin/aegis.ts:10-15` does. `vitest.config.ts` is NOT in `allowed_paths`; do not touch it.
- The hygiene tooth already scans `app/**` (repo-source-hygiene.test.ts SOURCE_DIRS
  includes "app") — new files must be LF/control-char clean. Verify at G1 whether the C18
  claim-language scan covers `app/api/v1/**`; extend it if not.
- Do not model anything on the M0 routes (health/preflight/replay) beyond their export
  SHAPE; zod `.strict()` at the edge is the one established app-layer pattern to keep
  (preflight/route.ts:5-33; zod 3.25.76 already a dependency).
- Do not stamp W5 mid-slice (W5:196).

### 1. Transport encoding — the load-bearing ruling

Manifest and recording documents arrive as **base64 strings of the raw bytes** inside the
JSON body — NOT as embedded JSON objects. Two independent OBSERVED reasons:

1. R-003's `findDuplicateJsonKey` runs on decoded TEXT before parse at both byte
   boundaries (adapter.ts:109-114; trust.ts:236-259). Embedding documents as JSON objects
   lets the platform's JSON parse last-wins duplicates before the guard ever sees them —
   silently reopening the closed hazard.
2. `duplicate_recording` vs `ambiguous_head_provenance` (the B13 trap) and `requestHash`
   are decided by BYTE identity (request.ts:116-135); parse-then-restringify destroys it.

Base64 (not JSON-string embedding) also keeps the `invalid_utf8` typed rejection reachable
(adapter.ts:105-107). The zod schema validates the OUTER body only and never parses the
embedded documents (they decode straight to `Uint8Array`). RULING: the outer body text
also goes through `findDuplicateJsonKey` → 400 `duplicate_json_key` (R-003 spirit, cheap).

### 2. POST /api/v1/verify contract

Body (zod strict; unknown keys → 400):

```jsonc
{
  "manifest": "<base64>",                    // -> inputs.manifestBytes
  "recordings": [{"role": "heads",           // "heads" | "identity"
                   "bytes": "<base64>"}],
  "chainIds": [1, 10],
  "at": "finalized",                         // passed VERBATIM; the ENGINE refuses others
  "evaluationTime": "2026-07-24T00:00:00Z",  // determinism is an explicit input
  "profile": "reference",                    // only value at M1 -> referenceDeployment
  "trustPolicy": { "trustPolicyId": "...", "approvedHashes": ["..."] }  // optional
}
```

Flow mirrors `bin/aegis.ts` phases minus the filesystem (bin/aegis.ts:29-185): read bytes →
size limits (§5) → outer dup-key guard → JSON.parse → zod strict → base64 decode (typed
`invalid_base64` + path on failure) → CLI-style pre-validation of each recording via
`loadRecordingBytes` with the result DISCARDED (corruption is caller input → 400; the
engine re-earns the WeakSet brand from raw bytes itself; bin/aegis.ts:105-126) →
`referenceDeployment(manifestBytes, {evaluationTime, trustPolicy})` → `runVerification` →
envelope.

### 3. HTTP status mapping (RULING — canon has no status table)

Canon specifies only: completed `unknown`/`stale`/`conflict` are COMPLETED reports, and 503
is reserved for inability to construct any envelope (ENGINEERING_SPEC:881; engine.ts:84).
Derived mapping, pinned by tests:

| outcome | status |
|---|---|
| completed envelope — exit-class 0/2/3 AND payload-derived 4 (trust `invalid`) | **200** |
| caller-input rejection before a run completes: body shape, limits, base64, outer dup-key, `RequestError`, pre-validation `ChainError` | **400** + `{requestId, generatedAt, error: {code, path?}}` |
| `SurfaceError` / any other throw (no envelope) | **503** + same error body |
| GET malformed hash (fails `SHA256_STRICT`, canonical.ts:437) | **400** `invalid_report_hash` |
| GET well-formed hash not retained | **404** `report_not_found` |

HTTP status is a DELIVERY channel; verdict classification lives in the payload and is
derived by the shared `exitCodeForPayload` — a 200 carrying `policyTrust.state:"invalid"`
is honest because the envelope completed, and machine consumers classify from the payload
exactly as the CLI/CI do (render.ts:55-71). Error codes are contract
(ENGINEERING_SPEC:803-810); error bodies reuse the landed `code`+`path` idiom, never raw
zod issues.

### 4. Envelope + serialization

- Report envelope body = `jcsSerialize({requestId, generatedAt, payload, reportHash})`.
  JCS determinism makes the payload subtree byte-identical to the CLI's
  `jcsSerialize({payload, reportHash})` core, so S7 asserts the shared artifact without
  re-serialization tricks (render.ts:2-4, 73-75; W5:419-423). NEVER reuse `renderJson` for
  the API body (different shape); requestId/generatedAt never enter the hash.
- `requestId` = `crypto.randomUUID()`; `generatedAt` = `new Date().toISOString()` at
  delivery time. On GET replays delivery metadata is REGENERATED per delivery — the reading
  consistent with ENGINEERING_SPEC:879.
- Error bodies via `Response.json` (pure delivery, nothing identity-bearing).
- ETag on report deliveries = `"<reportHash>"` (strong; precedent health route).
  Cache-control **no-store at M1** (RULING): the per-isolate store must not be laundered
  into a permalink by intermediary caches; caching revisits at M2 with the durable
  permalink (ROADMAP:127).

### 5. Size/shape limits (deferred from S2 — RULING, numbers pinned as constants)

ENGINEERING_SPEC:883 names limit CLASSES but canon contains no numeric values anywhere
(verified this recon). M1 has no calldata/Safe-batch/log-range/simulation inputs — those
limits arrive with their features. What exists at M1 is bounded here, constants in the
shared api module, each with a typed code + path:

- total body ≤ 16 MiB → `request_too_large`
- manifest ≤ 1 MiB → `manifest_too_large`
- per-recording ≤ 8 MiB → `recording_too_large`
- recordings ≤ 8 → `too_many_recordings`
- chainIds ≤ 16 → `too_many_chain_ids` (validity/dedup stays the engine's job)
- trustPolicy.approvedHashes ≤ 64 → `too_many_approved_hashes`

Total-body checked on `arrayBuffer().byteLength` BEFORE decode/parse (cheap DoS guard,
THREAT_MODEL:76/:127). Boundary-exact behavior pinned (limit passes, limit+1 rejects).

### 6. The store + GET /api/v1/reports/[hash]

- OBSERVED: zero storage bindings exist (dist/server/wrangler.json: empty
  durable_objects/kv/r2/d1; vite.config.ts bindings fed by .openai/hosting.json
  `{d1:null, r2:null}`); adding one edits files outside `allowed_paths` AND is a
  new-architecture owner decision. Canon requires no GET durability at M1: the durable
  permalink is M2 (ROADMAP:127), the append-only store M3 (ENGINEERING_SPEC:842-844).
- RULING: in-memory per-isolate content-addressed `Map` in the shared api module, keyed by
  `reportHash`, holding the frozen payload. Honest semantics documented in code:
  per-isolate, non-durable, empty after redeploy; dev (single isolate) will LOOK durable.
- GET contract: `app/api/v1/reports/[hash]/route.ts` (vinext parses `[seg]`,
  route-pattern.js:3-7); handler awaits `params` (vinext's thenable satisfies the Next 16
  async form); malformed hash → 400 BEFORE any lookup; miss → 404 whose language says the
  report is NOT CURRENTLY RETAINED — never that it does not exist (claim-strength
  discipline); hit → 200 envelope with fresh delivery metadata.
- `aegis reproduce` does NOT land in S4 (RULING): the store retains payloads, not request
  inputs, so the stored-input contract (W5:110-113) is unsatisfiable at M1 — `reproduce`
  stays unadvertised per W5:426-427, and the S6 drawer must not present the GET as a
  permalink.

### 7. File layout

- `lib/aegis/surfaces/api.ts` — framework-free shared core: limit constants, base64 decode
  with typed errors, the guard chain, envelope builder, status mapping, the store. Shared
  so S5/S7 and any future edge classify identically (the `exitCodeForPayload` precedent,
  render.ts:55-57).
- `app/api/v1/verify/route.ts` — thin adapter: `export async function POST(request)`.
- `app/api/v1/reports/[hash]/route.ts` — thin adapter:
  `export async function GET(request, {params})`.
- Route files use RELATIVE imports only (`../../../../../lib/...`); no `@/`.
- In-process tests construct `new Request("http://aegis.test/api/v1/...", {method, body})`
  and call the exported handlers directly; GET tests pass
  `{params: Promise.resolve({hash})}` (in-process calls bypass vinext dispatch, so the
  auto-405 and thenable wrapping are not exercised).

### 8. TDD test matrix (new file tests/api.test.ts; each observed RED first)

**E. POST envelope + matrix**

1. E1 happy path — shipped fixtures base64'd → 200; body is `jcsSerialize` bytes; envelope
   has exactly the 4 keys; payload + reportHash equal the facade's direct output.
2. E2 S7 forward hook — `jcsSerialize({payload, reportHash})` recomposed from the API
   response equals the CLI's `renderJson` bytes for identical inputs.
3. E3 delivery metadata — two identical POSTs → identical payload + reportHash, DIFFERENT
   requestIds (both UUID-shaped); generatedAt ISO-UTC; neither field affects the hash.
4. E4 outer-body rejections (each a typed 400) — unknown key (strict), missing manifest,
   invalid base64 (+path), bad role, outer duplicate key (R-003 tooth), malformed JSON.
5. E5 engine RequestError → 400 with the engine's own code + path (`at: "latest"` →
   `unsupported_at_selector` — the API passes verbatim and does not pre-judge, the CLI
   rule).
6. E6 corrupt recording (byte-tamper, `integrity_mismatch`) → 400 (pre-validation mirror
   of B11; caller input, the engine never sees it).
7. E7 the B13 trap inherited — byte-identical duplicate heads → 400 `duplicate_recording`;
   content-equal byte-different heads → 503 `ambiguous_head_provenance`.
8. E8 completed-report honesty — unknown-verdict payload → 200 (never an error status);
   trust-invalid manifest → 200 with `policyTrust.state "invalid"` inside the payload.
9. E9 limits — each limit's boundary pinned (limit passes, limit+1 → its typed 400).
10. E10 SSRF structural — body with provider/url keys → 400 unknown-key naming the path;
    profile other than `"reference"` → 400.
11. E11 honest trust mode — `trustPolicy` overrides self-approval (untrusted → 200,
    payload untrusted, reasonCodes present — mirror B10).

**F. GET + store**

12. F1 POST-then-GET same isolate — 200, byte-identical payload core, FRESH delivery
    metadata, etag = reportHash, cache-control no-store.
13. F2 well-formed unknown hash → 404 `report_not_found`; "not retained" language pinned,
    "does not exist" absent.
14. F3 malformed hash → 400 `invalid_report_hash` with NO store lookup.
15. F4 content-addressing — re-POST same inputs → same hash, one retrievable entry; the
    stored payload is frozen.

**G. Teeth**

16. G1 claim-language scan covers `app/api/v1/**` (extend C18's file set if it does not;
    negative-test with a real inserted violation, then remove it).
17. G2 method surface — verify route exports POST only, reports route GET only (structural;
    vinext auto-405s at dispatch, which in-process tests bypass).

(D20-style stderr diagnostics have no API channel and the envelope is spec-fixed at 4
fields — deliberately NOT extended. OBSERVED constraint, ENGINEERING_SPEC:868-877.)

### 9. Sequencing

1. E1–E3 RED → minimal `api.ts` + verify route GREEN (envelope + happy path only).
2. E4–E8 one at a time (guard chain + status mapping earn their rows).
3. E9–E11 (limits, SSRF-structural, trust modes).
4. F1–F4 (store + GET route).
5. G1–G2 teeth; then npm test, tsc, lint, doctor, selftest all green; CRLF sweep
   ([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]]); commit. The Codex convergence loop
   comes after S7, as chartered.

## S5 plan (inline recon, 2026-07-26)

> S5 is an order of magnitude smaller than S3/S4 — the recon was done inline (charter
> S5 bullet W5:167-168; ENGINEERING_SPEC:899-907; render.ts:55-57 names the CI adapter as
> the second consumer of `exitCodeForPayload`; the S7 gate requires a distinct "CI adapter
> entry" path, W5:91-94). RULING markers as before.

### Design

- `lib/aegis/surfaces/ci.ts` exports ONE entry, `runCiVerification(inputs, selector,
  deployment): Promise<CiRun>` where `CiRun = { exitCode, reportHash, canonicalBody,
  summaryLines }`. It calls `runVerification` (the facade, never an evaluator), derives
  `exitCode` via the SHARED `exitCodeForPayload` (render.ts:55-57 — two transports cannot
  classify one payload differently), and `canonicalBody` via the SHARED `renderJson` (the
  S7 byte-identity artifact).
- Thrown-path mapping mirrors the CLI verbatim (RULING, same as the API's):
  `RequestError` → exitCode 4, `SurfaceError`/other → 5, returned as a `CiRun` with
  `reportHash: null`, `canonicalBody: null`, and an `error: {code, path?}` summary line —
  CI is a transport; a throw is an operational failure, never a verdict.
- `summaryLines` (RULING — canon specifies no CI format): deterministic projection of the
  payload ONLY (ENGINEERING_SPEC:879), stable `key=value` lines through the render `esc()`
  convention: `exit`, `reportHash`, `trust` (state + reasonCodes), `boundaries` count,
  per-state verification counts named individually (`verifications.pass=…`,
  `.fail=…`, `.unknown=…`, `.stale=…`, `.conflict=…` — never collapsed into one aggregate
  word, THREAT_MODEL:98), `limitations` count. No timestamps, no clock.
- The documented workflow snippet lands in EV-W5 at stamp time (it cites the built CLI,
  which exists since S3) — not a code deliverable of this slice.

### Tests (tests/ci.test.ts, red-first)

- H1: entry parity — `runCiVerification` over shipped fixtures returns `exitCode` 3 (the
  honest shipped reality), `reportHash` equal to the facade's direct output, and
  `canonicalBody` byte-identical to `renderJson(run)` (the S7 forward hook).
- H2: summary determinism + shape — two runs byte-identical; per-state counts present and
  individually named; trust line carries reasonCodes; no aggregation word.
- H3: thrown rows — `at: "latest"` → 4 with `error=unsupported_at_selector` line;
  ambiguous double-heads → 5 (the B13 trap's SurfaceError half).
- H4: CLI/CI cross-transport parity — same inputs through `main(argv)` (temp files) and
  `runCiVerification` (bytes) yield equal exit codes and equal canonical bytes.
- H5 (tooth): claim-language scan extended to `ci.ts`; summary output itself scanned for
  the banned tokens.

## S6 plan (recon-derived, 2026-07-29)

> Three read-only mappers (ui-stack / drawer-canon / test-reality, workflow
> `wf_2dc69dd5-5ad`); every load-bearing claim below carries the mapper's citation.
> RULING markers as before.

### 0. Ground rules binding this slice

- The drawer's server-side loader is the FOURTH S7 entry path (W5:91-94). It is a
  transport only — no evaluation, no re-wording of verdicts, ever (W5:53-54).
- **M0 quarantine.** Never import `lib/aegis/types.ts` (M0 vocabulary, W5:745-747). The
  existing `EvidenceDrawer` inside `components/aegis-dashboard.tsx:815-889` is typed on M0
  `InvariantResult` — a CSS/layout precedent only, never a model. No `/api/health`-style
  client fetches (W5:748-749).
- **vitest reality (OBSERVED, test-reality §1).** `vitest.config.ts`: `environment: "node"`,
  `include: tests/**/*.test.ts` only, NO `resolve.alias`, no plugins. Therefore: anything a
  test imports uses relative paths; tests contain no JSX syntax (drive components with
  `React.createElement`); the drawer `.tsx` must be **sync and props-fed** because
  `react-dom/server` `renderToStaticMarkup` cannot render async components. No repo test
  has ever imported a `.tsx` module — the import path is a SPIKE, proven red/green, with a
  documented lint-only fallback.
- `vitest.config.ts` and `next.config.ts` are outside `allowed_paths` — untouchable.

### 1. The diagnostics ruling (the S6-bullet tension, settled)

The S6 bullet demands downgrades AND "payload-derived fields only" (W5:169-170), but
downgrade records exist only in `run.diagnostics`, which must never enter the hashed
payload (W5:131-133). `engine.ts:67-68` explicitly licenses "an evidence drawer and a CLI
renderer" to read diagnostics, and the CLI already renders them under that license
(render.ts:101-111; the D21 contract, tests/cli.test.ts:636-645). **RULING:** the drawer
display model = hashed-payload projections + the licensed diagnostics records
(downgrades/applicability), display-only; `reportHash` and `canonicalBody` remain
payload-only, so the hash is untouched — the exact argument that admitted D21 on the CLI.
"Payload-derived fields only" means *no semantic field originates outside the canonical
run* (ENGINEERING_SPEC:879), not a diagnostics ban the engine's own license contradicts.

### 2. Loader design (`lib/aegis/surfaces/drawer.ts`)

- ONE entry mirroring the CI adapter (ci.ts:52-56): `loadEvidenceDrawer(inputs, selector,
  deployment): Promise<DrawerRun>`, `DrawerRun = { reportHash, canonicalBody,
  classification, model }`. `canonicalBody` = SHARED `renderJson` (the S7 byte artifact,
  reused not rebuilt); `classification` = SHARED `exitCodeForPayload` (third consumer —
  transports cannot classify one payload differently, render.ts:55-58).
- **Thrown path (RULING):** the loader does NOT catch — `RequestError`/`SurfaceError`
  propagate. Unlike CI there is no step consuming exit classes as data; a throw is an
  operational failure surfacing as an error, never a verdict and never a null-state model
  (W5:83-84). The S7 gate needs success-path parity only.
- `DrawerModel` is a pure projection ordered **frame before results** (PRODUCT_SPEC:213-220,
  :351; the detached-screenshot hazard, render.ts:85-87): header (manifest identity —
  `manifestVersion` verbatim, `"unknown"` stays `"unknown"` per W5:725-727; `manifestHash`;
  `sourceMode` with recorded labeling, W5:85-86) → trust (state + reasonCodes, W5:73-75) →
  boundaries with per-boundary licensed downgrade records (requested/used/depth/reasonCode)
  → coverage → verifications (canonical state words VERBATIM, render.ts:56-70; statement;
  per-verification limitations whole) → evidence refs (id, kind, provenanceClass,
  providerId, method, rawResultHash, capturedAt, boundary) → limitations whole, never
  summarized (render.ts:119-126 precedent).
- `PayloadView` (render.ts:8-38) omits `evidence` and `sourceMode` — extend the view
  additively; never reach into the raw payload untyped.
- **capturedAt honesty:** head evidence `capturedAt` is bundle-level — the model labels it
  as bundle capture and never implies per-call head timestamps (W5:728-730,
  [[INS-84853447-d1bb-4095-bfd6-9cc0fbaafabc]]).
- **No aggregate roll-up anywhere:** `unknown`/`stale`/`conflict` never collapse into one
  count or word (THREAT_MODEL:98); any counts shown are named individually (the S5 idiom).

### 3. Component + page design

- `components/report-drawer.tsx`: sync, props-fed (`{ model }`), **relative imports**,
  zero logic beyond presence checks and array maps; payload strings rendered as React text
  nodes only — no `dangerouslySetInnerHTML` (a lint-able property; THREAT_MODEL:125's
  escaping clause is satisfied by React auto-escaping — `esc()` stays a terminal concern).
  Reuses the existing `drawer-*`/`panel`/`status` class vocabulary from `app/globals.css`
  (visual precedent only).
- `app/reports/page.tsx`: async server component labeled as the reference scenario;
  acquires fixture bytes via vite `?raw` imports (build-time bundling — the Workers runtime
  has no `fs`; `.gitattributes` marks `data/** -text` so raw-import bytes are repo-exact).
  **Parse-then-restringify is forbidden** — it destroys [[R-003]] and `requestHash` byte
  identity. `?raw` under vinext is UNVERIFIED — proven by the recorded manual smoke, never
  assumed. Fixture acquisition stays in the page, OUTSIDE the tested surface; the loader
  takes bytes like every other transport (brand re-earned in-process).
- **Friendly labels declined (RULING).** PRODUCT_SPEC:333 permits "Holding"-style labels;
  the M1 drawer shows canonical state words directly — nothing to de-map, less to lint.
- **CSP gap (flagged, not absorbed):** THREAT_MODEL:125 also demands a strict CSP; the app
  sets none and `next.config.ts` is outside `allowed_paths`. Owner triage item:
  [[IDEA-5bb4ace0-d67b-4d91-ab8e-d458526b38a9]]. S6 lands the escaping clause only.

### 4. Teeth

- **Trust-language lint extension (the W5:106-107 acceptance line):**
  `tests/aegis-engine.test.ts:142-149` becomes a loop over a file SET — the dashboard plus
  `lib/aegis/surfaces/drawer.ts`, `components/report-drawer.tsx`, `app/reports/page.tsx`.
  Claim-token regex per file; positive assertions stay per-file (the dashboard keeps its
  M0-casing `REFERENCE_SCENARIO` + "not a protocol safety score"; the new files assert the
  canonical `reference_scenario` casing, profiles.ts:40, and the claim-ceiling wording of
  render.ts:127-130).
- `tests/repo-source-hygiene.test.ts` already walks `app` + `components` — new `.tsx` files
  are auto-covered for control chars/CRLF; no edit needed.

### 5. TDD matrix (tests/drawer.test.ts, red-first)

- I1: entry parity — `loadEvidenceDrawer` over shipped fixture bytes: `classification` 3
  (the honest shipped reality), `reportHash` equal to the facade's direct output,
  `canonicalBody` byte-identical to `renderJson(run)`.
- I2: model honesty — frame-before-results field order; `manifestVersion` `"unknown"`
  verbatim on an untrusted manifest; recorded labeling present; trust state + reasonCodes;
  limitations passed through whole; canonical state words verbatim (no re-wording, no
  friendly mapping).
- I3: the D21 contract on the drawer — inline `sealedBundle` finality-downgrade scenario:
  downgrade records (requested/used/depth/reasonCode) present in the model when a downgrade
  occurred, absent otherwise; `reportHash` equal to the facade's for the same inputs
  (diagnostics never perturb the hash).
- I4: evidence refs — providerId/kind/rawResultHash/capturedAt projected; head `capturedAt`
  carried as bundle-level capture (never per-call); `sourceMode: "recorded"` surfaced.
- I5: thrown path — `at: "latest"` REJECTS (RequestError propagates, no model);
  re-encoded double heads REJECTS (SurfaceError) — `expect(...).rejects`, both.
- I6 (SPIKE): component render — `React.createElement(ReportDrawer, { model })` +
  `renderToStaticMarkup`: boundary markup precedes verdict markup; limitation text present;
  downgrade line present. UNVERIFIED-no-precedent for `.tsx` import under this vitest
  config: if resolution/transform fails, drop to lint-only and record the boundary in
  EV-W5 — the slice's honesty does not depend on it.
- I7 (tooth): claim-token scan (negative-tested regex, the H5 idiom) over `drawer.ts` +
  `report-drawer.tsx` + `page.tsx` sources AND the I6 markup (or the model's text fields
  when I6 dropped); plus the aegis-engine lint extension of §4.

### 6. Verification boundary (verbatim into EV-W5)

Provable under this config: the loader exhaustively (every displayed field's derivation,
S7 hash parity, shared classification); markup text and ordering IF the I6 spike lands;
all language teeth. NOT provable: visual layout, CSS, theming, interactivity/hydration,
actual rendering inside the vinext/Workers runtime — structural (no browser runner;
adding one edits `vitest.config.ts`, out of scope). EV-W5 must state the drawer is
verified at loader + markup-text level and **unverified in a browser** beyond one recorded
manual smoke (`npm run dev`), mirroring S3's built-artifact treatment (W5:384-385).

### 7. Sequencing

1. I1 RED → `drawer.ts` loader skeleton + minimal model → GREEN.
2. I2 → I3 → I4 (model fields land incrementally, each red first).
3. I5 (thrown path).
4. I6 spike (fallback documented if red for structural reasons) → I7 + the §4 lint
   extension.
5. `report-drawer.tsx` + `app/reports/page.tsx` wiring; recorded manual smoke; tsc + lint +
   full suite; commit per slice discipline.

### 8. As-built notes (2026-07-29 execution — deviations and findings, all verified)

- **The I6 spike LANDED.** `.tsx` imports, transforms, and `renderToStaticMarkup`-renders
  under this vitest config (automatic JSX runtime via the repo tsconfig). The lint-only
  fallback was not needed. I5 and the thrown-path RULING were born green and
  **mutation-verified** (a swallowing catch fails exactly I5).
- **I7 output scan runs over a NEUTRAL synthetic model, not the reference payload.** The
  canonical `recorded_inputs` limitation text itself contains "live" in negation ("not
  live production telemetry") and renders verbatim by contract — re-wording it would be
  the real violation. The scan therefore isolates transport-authored text (every optional
  branch populated with neutral tokens). Both lint branches bite-proven with planted
  violations, reverted byte-identical.
- **§4 positive assertions as-built:** the dashboard keeps its M0-casing pair; the PAGE
  carries `reference_scenario` + "not a protocol safety score"; loader and component get
  negative scans only (they hardcode no honesty prose — they render payload values). The
  render.ts claim-ceiling line is unreachable at M1 (no pass-capable fixtures) and was
  not forced into drawer sources.
- **`app/raw-imports.d.ts` added** (ambient `*?raw` module type; tsconfig `types` is
  restricted, no vite/client).
- **Tailwind source pin was REQUIRED** (`app/globals.css`: `@import "tailwindcss"
  source(none)` + `@source "./"` + `@source "../components"`). Tailwind 4's
  auto-detection walks the whole repo; its CSS-escape decoder throws
  `RangeError: Invalid code point` on repo content at dev-server start, the rsc worker
  build dies, and the dev server serves a STALE cached bundle — new routes 404 while old
  ones work. Pitfall inside the pitfall: `kill` on the npm wrapper does not kill the
  vinext child, so a zombie server keeps answering the port and masks fixes — kill the
  port's PID and confirm the listener count is zero before trusting a smoke result.
- **Recorded manual smoke (vinext dev, 2026-07-29):** `GET /reports` → 200; page carries
  "Evidence report — reference_scenario", the full chain-10 downgrade record
  (`finality_tag_unsupported`), "not a protocol safety score", and report hash
  `sha256:7631ec734edda601e96442bc9f7ce83e55dc5675335e8541efe2e0348478bf42` — **equal to
  the in-process facade's hash over the same fixtures**, proving `?raw` bytes are
  repo-exact through the dev pipeline (the drawer leg of S7, previewed over the wire).
  Boundary: verified under `vinext dev` only — the production Workers build is NOT
  exercised by any test (S6 plan §6); RSC inserts `<!-- -->` between adjacent text nodes,
  so exact-string greps over served HTML must tolerate comment markers.

## S7 plan (inline recon, 2026-07-30)

> S7 composes what S3–S6 already pinned pairwise (H4 CLI/CI, I1 drawer/facade, E1
> API/facade) into the single mechanical gate the charter names (W5:91-94), plus the
> documented-command re-derivation (W5:110-112, PRODUCT_SPEC:303). `aegis reproduce`
> stays OUT per the S4 §6 ruling (the store retains payloads, not request inputs) and
> unadvertised (C16 pins that). Inline recon: cli.test.ts `run()`/REFERENCE_ARGS,
> api.test.ts `post()`/`referenceBody()`, and the ci/drawer direct-call idioms are the
> composition pieces; no new surface code is expected — S7 is a gate, not a feature.

### Tests (tests/byte-identity.test.ts, series J)

- J1 — THE GATE: one reference request through all four entry paths (CLI `main(argv)`
  `--json`, `handleVerify(Request)` via the route's POST, `runCiVerification`,
  `loadEvidenceDrawer`) plus the facade directly. Four `reportHash` values equal each
  other and the facade's; payload BYTES identical everywhere: CLI stdout ===
  `renderJson(run) + "\n"` === CI/drawer `canonicalBody + "\n"`, and
  `jcsSerialize({payload, reportHash})` of the API envelope === `renderJson(run)`
  (delivery metadata excluded from identity, ENGINEERING_SPEC:846/:879).
- J2 — the documented command re-derives: the human render's full-flag `reproduce:` line,
  tokenized and fed back through `main(argv)` with `--json`, yields a byte-identical
  envelope and the same hash. (EV-W5 records the printed hash at stamp time.)
- J3 — repeat determinism at the gate: a second full pass is byte-identical on CLI/CI/
  drawer bodies (injected clock); the API envelope's payload bytes are stable while
  `requestId`/`generatedAt` legitimately differ.
- Born-green expectation, mutation plan: J1 composes pinned pairs, so it will be born
  green — verify the gate BITES by (a) a drawer `canonicalBody` rebuilt via
  `JSON.stringify` → J1 dies, and (b) a reproduce line dropped determinism flag → J2
  dies. Revert byte-identical.

## Handoff

- next: **S0–S7 ALL DONE (438/438, tsc + lint clean) — W5 is code-complete.** S7 landed
  `tests/byte-identity.test.ts` J1–J3: the four-path gate (equal hashes AND identical
  canonical bytes, API delivery metadata excluded via `jcsSerialize` re-serialization),
  the reproduce line executed mechanically back through `main(argv)` (byte-identical
  envelope), repeat determinism; both planned mutation bites verified (drawer stringify →
  J1+I1 die; dropped `--evaluation-time` from the reproduce builder → J2 dies).
  **Now the Codex convergence gate (D-b4ab3c69): review dispatched over the full W5
  surface stack. Persist each verdict verbatim → disposition → scoped re-verification →
  repeat until converged. Only then EV-W5 (documented command + recorded hash + workflow
  snippet + drawer smoke) and the stamp — an owner-visible action. Green local tests are
  necessary, never sufficient. Do NOT stamp before convergence.**
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
