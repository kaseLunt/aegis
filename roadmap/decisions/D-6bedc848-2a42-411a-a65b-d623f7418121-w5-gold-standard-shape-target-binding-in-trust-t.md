---
id: D-6bedc848-2a42-411a-a65b-d623f7418121
type: decision
title: "W5 gold-standard shape: target binding in trust.ts, custom manifests accepted with R-003 closed, CLI as built artifact, M1 fixtures split to W6"
status: accepted
approved_by: klunt (2026-07-24, W5 kickoff — W6 split chosen; remaining three delegated with "gold standard, no shortcuts")
date: 2026-07-24
supersedes: []
updated: 2026-07-24
---

# D-6bedc848-2a42-411a-a65b-d623f7418121 — W5 gold-standard shape: target binding in trust.ts, custom manifests accepted with R-003 closed, CLI as built artifact, M1 fixtures split to W6

## Context
W5 (one engine, four surfaces) kickoff. A four-agent read-only mapping pass over the
W1–W4 spine (run wf_c29e08ca-2a8) established the decisive structural fact: **there is no
packaged pass-to-report composer.** The W1+W2+W3(+W4) composition exists only inside
`tests/engine.test.ts` and `tests/identity-compare.test.ts`. Every one of the four M1
surfaces is that same pipeline behind a different transport, so W5's centrepiece is ONE
engine facade the surfaces delegate to, not four wirings.

Four shape questions were put to the owner. The owner chose the W6 split and delegated the
other three with the standing instruction: *gold standard, no shortcuts.*

## Decision

**1. The manifest→target binding lands in `lib/aegis/manifest/trust.ts` (structural, not asserted).**
Today `compareIdentityTarget`'s `IdentityTarget` is 100% caller-supplied; the only callers
are tests, and even the e2e test hand-passes the same literal it spliced into the manifest.
Nothing binds the compared target to the trusted manifest.
`policyTrustFromBytes` already calls `loadManifestBytes` and matches the recomputed content
hash against `approvedHashes` — then DISCARDS the `LoadedManifest`. W5 adds a sibling
(`trustedManifestFromBytes`) that returns both the `PolicyTrustBlock` and, when
`state === 'trusted'`, the loaded manifest whose recomputed hash IS `block.manifestHash`.
Targets are read from THAT object.
Rejected alternative: extract targets in a W5-owned surfaces module gated by an explicit
`loaded.contentHash === block.manifestHash` assertion. It avoids W4 receipt churn but makes
the security property rest on an assertion a future edit can drop, instead of on
construction. [[R-b4e2e152-96dc-4238-b76b-c16336e93dbd]] §3 prescribes the module "that
establishes policy trust" — canon already points at trust.ts. Gold standard = structural.

**2. The report API accepts caller-supplied manifest bytes, and [[R-003]] closes in W5.**
The M1 exit gate requires that "a caller-selected self-consistent manifest cannot replace
the canonical live policy; custom manifests are visibly noncanonical and cannot create a
production pass/fail." That gate is only convincingly demonstrated when the API actually
accepts one and refuses to let it produce a production verdict. Accepting untrusted bytes is
exactly the trigger `trust.ts` documented for the deferred duplicate-aware parser ("until
this boundary accepts untrusted bytes (W3/W5 API surface)"): `JSON.parse` silently collapses
duplicate JSON keys last-wins, so two readers can disagree about what was hashed. W5 closes
R-003 with a duplicate-rejecting strict parse at BOTH byte boundaries
(`loadManifestBytes`, `loadRecordingBytes`), plus request size/shape limits at the API edge.
Rejected alternative: deployment-manifest-only API, R-003 stays deferred — cheaper, but it
demonstrates the exit-gate line by avoiding it.

**3. The CLI ships as a built artifact: vite SSR build + `node:util parseArgs`, no new dependency.**
`lib/` uses extensionless relative imports, so plain Node ESM cannot resolve the spine; the
repo is `noEmit` with `moduleResolution: bundler` and has no `bin` field and no arg parser.
The CLI gets its own `vite.cli.config.ts` (deliberately NOT the vinext/Cloudflare-Workers
config) building `bin/aegis.ts` to a single-file Node ESM entry, argv parsed with the
built-in `node:util parseArgs`, exposed via `bin` + npm scripts. A single-file bundle also
guarantees one spine module instance per process, which the WeakSet brands require
([[INS-a6fc2796-f247-41fc-80a9-a5be3c72e616]] addendum 3).
Rejected alternative: add `tsx` (owner was open to new dependencies) — better iteration DX,
but it makes a shippable CLI depend on a dev-time TS runner. Rejected: rewriting lib/'s
import specifiers to be Node-resolvable — large mechanical churn against the repo's
bundler convention.

**4. The M1 scenario-fixture matrix splits out as W6; W5 does not claim to close M1.**
M1's deliverables list recorded success, mismatch, missing-evidence, stale-provider,
provider-conflict, ABI-mismatch, and reorg fixtures. Only success-path bundles ship
(`reference-eth-op-heads.json`, `reference-identity-reads.json`); every other scenario exists
only as an inline construction inside tests. W5 covers negative paths in tests with the
`sealedBundle` idiom and attests four-surface identity over the reviewed success fixtures;
W6 ships the reviewable fixture corpus plus reorg supersession, and **M1 closes at W6.**
STATUS's prior "W5 closes M1" was optimistic and is corrected.

## Consequence
- Decisions 1 and 2 both modify `lib/aegis/manifest/**` (and 2 also `lib/aegis/chain/**`),
  which are in W4's `invalidated_by`. EV-W4 therefore auto-invalidates — correct, honest
  behavior, not a defect. W4 is re-attested via the documented recipe
  ([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]): mint `EV-W4-R2` with `tested_commit` = the
  commit carrying the change and supersede EV-W4 **in the same commit**. One re-attestation
  covers both changes if they land together or in that chain.
- W5's `allowed_paths` must be amended at activation beyond `lib/**, tests/**, app/**` to
  include `bin/**`, `components/**`, `package.json`, and `vite.cli.config.ts`.
  `.github/workflows/**` is deliberately EXCLUDED: the CI adapter ships as library code plus
  a documented workflow snippet, so W5 never touches CI machinery ([[D-007]]/[[R-005]] work).
- Surfaces are transports, never evaluators: no surface may re-derive a verdict, and the
  four-surface byte-identity test is the mechanical guard.
- R-003 moves from deferred to closing-in-W5; R-b4e2e152 §3 moves from deferred to
  closing-in-W5. §1 (bundle-digest anchoring) and §2 (live endpoint identity) stay deferred
  and must not be implied as closed by any W5 claim.
