---
id: W6
type: work
title: M1 recorded scenario fixture corpus + reorg supersession
phase: P1
status: active
evidence_target: "Correct + Robust"
priority: 2
depends_on: [W5]
blocked_by: []
informs: [H0]
allowed_paths:
  - data/**
  - lib/**
  - tests/**
deliverables:
  - data/recordings/README.md
evidence_receipts: []
invalidated_by:
  - lib/aegis/**
  - data/**
review_when: phase:P1:exit
updated: 2026-07-30
---

# W6 — M1 recorded scenario fixture corpus + reorg supersession

**Why this advances the vision:** M1's deliverable list requires recorded success,
mismatch, missing-evidence, stale-provider, provider-conflict, ABI-mismatch, and reorg
fixtures, plus block-hash-keyed caches, canonicality checks, and reorg supersession
(docs/ROADMAP.md M1). Only the success path ships today. **W6 is what closes M1**, not W5
([[D-6bedc848-2a42-411a-a65b-d623f7418121]] §4).

## Objective

Ship the reviewable recorded-scenario corpus as data (not as inline test constructions), and
implement reorg supersession over block-hash-keyed evidence, so a reviewer can reproduce each
non-success outcome from a documented command against a sealed fixture.

## Context — why this is a separate item

Every non-success scenario currently exists ONLY as an inline construction inside tests
(`sealedBundle` in `tests/engine.test.ts`, plus `tests/recorded-adapter.test.ts`,
`tests/codex-w3-fixes.test.ts`, `tests/identity-*.test.ts`, `tests/w4-codex-fixes.test.ts`).
That is sufficient to prove the engine fails closed — which is W5's robustness burden — but
it is NOT a corpus a reviewer can point a surface at. Splitting keeps W5 shippable and keeps
W5's evidence claim honest (four-surface identity over the reviewed success fixtures).

## Hard constraint discovered in W5 S1 (2026-07-24)

**No shipped fixture can currently produce a `pass`, and a "success" bundle alone will not fix
it.** Three facts found while wiring identity verifications:
1. `data/manifests/reference-code-identity.json` declares targets at `0xcccc…` (chain 1,
   eip1967) and `0xeeee…` (chain 10, direct), while
   `data/recordings/reference-identity-reads.json` records reads for `0xa1a1…`/`0xb2b2…` on
   chain 1 only. **No declared target has recorded evidence**, so every expectation lands
   `unknown` — honest, but not a demonstration.
2. The manifest's `expectedRuntimeCodeHash` values are placeholders (`sha256:3333…`,
   `sha256:4444…`). No code bytes hash to those, so a `pass` is unreachable by construction.
3. Therefore a success fixture is a **matched PAIR**: the recording's `eth_getCode` result and
   the manifest's `expectedRuntimeCodeHash` must be authored together, with the expected hash
   computed as sha256 over the recorded code BYTES (never over a hex string — W4 hazard), and
   the manifest's embedded `contentHash` recomputed afterwards. Same for `expectedImplementation`
   versus the recorded EIP-1967 slot word.

This is why W5 proves its non-success paths with inline `sealedBundle` constructions instead: a
reviewable success corpus needs authored manifest/recording pairs, which is W6's job. W5's
evidence claim is scoped accordingly.

## Acceptance

*(Refined at kickoff 2026-07-30, owner-reviewed activation; supersedes the candidate
placeholder. W5's facade, exit matrix, and four-surface parity gate are the fixed
substrate — W6 authors DATA against them, never new verdict logic.)*

### Correct
- **One sealed fixture set per M1 scenario** — success (`pass`), mismatch (`fail`),
  missing-evidence (`unknown`), stale-provider (`stale`), provider-conflict (`conflict`),
  ABI-mismatch, and reorg — each a manifest/recording pairing under `data/**`, each
  envelope-verified by `loadRecordingBytes`, and each producing EXACTLY its intended
  canonical verdict and exit/status class through the unmodified W5 facade.
- **The success pair follows the matched-pair recipe** (this charter's hard constraint):
  `expectedRuntimeCodeHash` computed as sha256 over the recorded code BYTES (never a hex
  string), `expectedImplementation` matching the recorded EIP-1967 slot word, and the
  manifest's embedded `contentHash` resealed afterwards.
- **The stale scenario is honest to the declared policy:** it crosses the fp-reference
  window by capture timestamps, and never presents that declared reference constant as a
  reviewed production policy (W5 round-2 Codex cap, carried verbatim).
- **Reorg is supersession, never replacement:** a reorged block's evidence is superseded
  with the supersession visible; orphaned observations are MARKED, never deleted.
- **Per-scenario documented reproduction:** each fixture has a documented single command
  whose printed verdict/exit matches the corpus's declared outcome table.

### Robust
- **Four-surface parity per scenario:** each fixture driven through the J1 gate idiom
  (CLI/API/CI/drawer) yields one hash and the same classification — the corpus cannot
  green on one transport and diverge on another.
- **Caches keyed by content, never height:** (provider policy, manifest hash, chain id,
  BLOCK HASH, request hash, evaluator version); a block-hash change invalidates derived
  entries; property tests over supersession ordering.
- **Honesty teeth extend to the corpus:** README caveats (illustrative vs recorded) extend
  to every new bundle; no fixture fabricates protocol history — adversarial bundles are
  labeled as authored adversarial constructions.
- **W5 re-attestation is planned, not accidental:** the first commit touching `data/**`
  carries EV-W5-R2 in the same commit (W5's `invalidated_by` covers `data/**`), per
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]].

Then the Codex convergence gate ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]) before any
achieved stamp — verdicts persisted verbatim, corrections dispositioned, re-verified until
GATE-PASSES.

## Non-goals

- Live capture pipeline / provider probes (WR3 probe step).
- Bundle-digest anchoring and live endpoint-identity binding
  ([[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §1–2) unless promoted separately.

## Canonical commands

```text
npm test
```

## W6 plan (recon-derived, 2026-07-30)

> Three read-only mappers (fixture-reality / canon / code-home, workflow `wf_82be436b-223`);
> every load-bearing claim carries the mapper's citation. RULING markers as in W5's plans.

### 0. Ground rules binding this item

- The W5 facade, exit matrix, and four-surface gate are FIXED substrate — W6 authors data
  and ONE new pure evaluator; no surface change, no classifier change.
- Seal discipline everywhere (fixture-reality §2): after any mutation recompute
  `rawResponseSha256 = sha256(JCS(result))` THEN `envelopeSha256 = sha256(JCS(response
  minus envelopeSha256))`; manifests recompute embedded `contentHash`
  (`manifestContentHash`, normalization-aware). Expected hashes over recorded code BYTES,
  never hex strings.
- Recording roles stay closed (`"heads" | "identity"`, request.ts:18) and ONE heads bundle
  per run (`ambiguous_head_provenance`) — every scenario fits the two-role shape (RULING
  §3 makes reorg fit).
- `data/**` is LF `-text`, read binary; corpus docs carry the README's
  illustrative-vs-recorded caveats extended verbatim to every new bundle.

### 1. Receipt-impact ruling (the recon's biggest catch)

New files under `data/recordings/**` invalidate **EV-W3 + EV-W4 + EV-W5 simultaneously**
(W3/W4 both list `data/recordings/**`; W5 lists `data/**` — code-home §5). The charter's
"first data/** commit carries EV-W5-R2" undercounted. RULING:
- Fixtures STAY in `data/recordings/` (the charter deliverable + README acceptance;
  a dodge directory would be a silent workaround).
- **Batch discipline:** all `data/**` landings ride in as FEW pushes as possible; each
  push-head commit mints + stamps the full re-attestation set it owes (EV-W3-Rn,
  EV-W4-Rn, EV-W5-Rn) in the same commit, per [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]
  (CI validates push heads; doctor-RED middle commits are CI-safe).
- The supersession evaluator lands in a NEW directory `lib/aegis/evidence/` — outside
  W1–W4 bases, inside only W5's `lib/aegis/**` (code-home §5 placement lever).
  `lib/aegis/report/**` and `lib/aegis/manifest/**` are NOT touched (EV-W1/EV-W2 stay).

### 2. Corpus design (slices W6-S1/S2)

- **Authored-not-mysterious (RULING):** every fixture pair is derived from a committed
  spec by a deterministic authoring helper (`tests/corpus-recipes.ts`, non-test module);
  a conformance test re-derives each on-disk fixture from its spec and byte-compares —
  fixtures can never drift from their disclosed recipe. The helper productizes the
  existing recipes: `sealedBundle` (engine.test.ts:39-49), `sealBundle` from ReadSpecs
  (w4-codex-fixes.test.ts:100-126), `sealedManifestBytes` (cli.test.ts:113-119),
  `COVERED_PROXY_TARGET` (cli.test.ts:99-111), F2b capturedAt re-seal.
- **EIGHT scenarios** (the seven chartered + `not_applicable` closing canon GAP-1,
  ES:1024): success/pass-0; mismatch/fail-2 (two-provider agreeing evidence per M9 —
  a single-provider mismatch may only claim unknown); missing-evidence/unknown-3 (the
  shipped reference trio ALREADY IS this fixture — needs only its outcome-table row);
  stale-3 (capturedAt past fp-reference's declared 604800s window, cap language carried);
  provider-conflict-3 (RULING per canon GAP-3: same-block VALUE disagreement, ES:400 —
  the B7 shape; head hash-mismatch conflict belongs to the reorg row); ABI-mismatch
  (RULING: demonstrated at the registry layer — the fixture's mismatched runtime hash
  makes `selectAbi` refuse, pinning "identity blocks semantic decoding" (ROADMAP:106,
  ES:837-840); facade-level ABI wiring is NOT M1 work — no decoding-dependent
  verification exists in the facade (fixture-reality §4), and inventing one would be new
  scope. Disclosed in the outcome table as unit-layer.); `not_applicable`-3 (window/
  environment inapplicability — the W5 F1 machinery over an on-disk pair); reorg (→ §3).
- **Outcome table as data:** `data/recordings/README.md` gains a per-scenario table —
  fixture files, documented single command, declared verdict + exit/status class — and
  each row is pinned by a J5-idiom four-surface parity test (byte-identity.test.ts:203-293
  is the template): one hash, identical bytes, declared classification, per scenario.
- **Honesty-teeth renegotiation (RULING, explicit not silent):** B4 (cli.test.ts:85-87)
  and J1's exit-3 pins scope to the REFERENCE trio, whose all-unknown reality is
  unchanged; their assertion text narrows from "no shipped fixture may produce a pass" to
  "the reference set produces no pass; scenario-corpus outcomes are declared and pinned
  by the corpus conformance tests." Both READMEs updated in the same slice.

### 3. Reorg supersession design (slice W6-S3)

- **Home (RULING = recon Option A):** new pure evaluator `lib/aegis/evidence/supersede.ts`
  (quorum.ts idiom: pure, typed errors, no I/O), called ONLY by `runVerification`. The J4
  one-engine guard's forbidden-token list EXTENDS with the new evaluator's name,
  negative-tested — the tooth grows with the engine.
- **Input shape (RULING — no new recording role):** identity reads at two different
  `blockHash` params legally coexist in one bundle (duplicate key is
  (chainId, method, params, providerId)). The reorg fixture = heads pinning canonical
  H2@N + identity evidence bound to orphaned H1@N. The evaluator compares evidence
  boundary bindings against the established boundary per chain.
- **Representation (RULING — zero `canonical.ts` edits):** strict validation enforces
  presence + known-field formats and admits optional extra evidence fields; boundary
  duplicate-keys include the block HASH, so an orphaned boundary and its canonical
  replacement at the same (chainId, number) legally coexist in one report (code-home §3).
  Supersession is therefore REPORT-VISIBLE: superseded evidence carries an optional
  `supersededBy` ref, the orphaned boundary stays present and marked, a
  `reorg_superseded` limitation names it, and dependent verdicts stay honest (orphaned
  evidence can never support pass — it is missing evidence for the canonical boundary).
  Marked, never deleted; superseded, never replaced. Bundle-level metadata is NOT used
  for supersession (it is type-checked but unhashed — named hazard, code-home §3).
- **Caches ruling (M4 honesty):** no persistent derived cache exists to key (code-home
  §1). M1's "block-hash-keyed caches" lands as: (a) the proven EIP-1898
  `requireCanonical` read keying; (b) supersession invalidation over derived evidence;
  (c) property tests that nothing keys critical evidence by number alone where a hash
  exists — with the head tag/number-keyed path documented as the quorum-mitigated
  exception (hash compared at the pinned number, conflict on divergence). No cache is
  invented to satisfy a word.
- Property tests: supersession ordering (one property per mutator, the
  manifest-properties idiom), hash-flip on supersession-visible fields, J1-style parity
  for the reorg fixture.

### 4. Sequencing

1. **W6-S1** — authoring helper + conformance harness + the success/mismatch pairs
   (mechanics already proven by B5/B6); FIRST `data/**` push head carries EV-W3/W4/W5
   re-attestations + the B4/J1/README renegotiation in the same batch.
2. **W6-S2** — remaining non-reorg scenarios + outcome table + per-scenario parity tests.
3. **W6-S3** — supersession evaluator red-first, facade wiring, J4 extension, reorg
   fixture, property tests.
4. The Codex convergence loop (D-b4ab3c69) before any achieved stamp.

## Handoff

- next: **Recon DONE, "W6 plan" synthesized above (2026-07-30). Start W6-S1** in plan §4
  order: the authoring helper + conformance harness red-first, then the success/mismatch
  pairs. The first `data/**` PUSH HEAD carries EV-W3-Rn + EV-W4-Rn + EV-W5-Rn minted and
  stamped in the same commit (plan §1 — the charter's original EV-W5-only note
  undercounted; W3/W4 both list `data/recordings/**`). The B4/J1/README honesty-teeth
  renegotiation rides in that same batch (plan §2). Cache/canonicality stays in W6.
- read_first: docs/ROADMAP.md M1 deliverables + exit gate; `data/recordings/README.md`
  (illustrative-vs-recorded caveats); `tests/engine.test.ts` `sealedBundle()` — the recipe
  for building a bundle whose per-response `rawResponseSha256` and `envelopeSha256` are
  recomputed after mutation; [[D-6bedc848-2a42-411a-a65b-d623f7418121]].
- hazards: a fixture is only evidence of what it honestly records — authoring adversarial
  bundles must not drift into fabricating protocol history; the README's existing
  illustrative-value caveats must extend to every new bundle. W6 touching `data/**` will
  invalidate W5's receipt (W5's `invalidated_by` includes `data/**`) — plan the W5
  re-attestation in the same commit, per
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]].

## Evidence

No attained evidence yet.
