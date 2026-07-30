---
id: EV-W5
type: evidence
title: W5 one engine, four surfaces — verified at Codex convergence (S0–S7 complete)
status: recorded
work: W5
result: pass
commands:
  - npm test
observed_at: 2026-07-30T09:06:05Z
tested_commit: ba9160e4f173b46457853fd3f87992e4fb8685d4
contract_fingerprint: sha256:9a82a480cf00b78ddda29b1e6e6aa95032187334fe8193368ce65171f800ecf6
input_fingerprint: sha256:0d9e7e100c9579263af6620e4da3c555b983be1e8df4d87fc336446c325a80f9
environment: node 22.20.0, vitest 4.1.10, local win32-x64
updated: 2026-07-30
---

# EV-W5 — W5 verification receipt

Honest run of the canonical command at `tested_commit`: `npm test` → **452/452 pass**
(31 files), `tsc --noEmit` clean, eslint 0 errors.

## What W5 attests

One engine (`runVerification`) behind four transports — CLI `main(argv)`, the report API
(`POST /api/v1/verify` + content-addressed GET), the CI adapter (`runCiVerification`), and
the web evidence drawer (`loadEvidenceDrawer` + `app/reports` page) — with:

- **The M1 gate, mechanically** (tests/byte-identity.test.ts J1): one request through all
  four entry paths yields four `reportHash` values equal to each other and to the facade's
  direct output, with identical canonical payload BYTES everywhere (API delivery metadata
  excluded from identity and proven excluded by re-serialization).
- **The one-engine guard as a tooth** (J4): no surface source may even NAME
  `establishBoundary`/`observeIdentity`/`compareIdentityTarget`; negative-tested with a
  planted import.
- **The documented reproduce command, executed mechanically** (J2): the human render's
  full-flag `reproduce:` line, tokenized and re-run through `main(argv)`, re-derives a
  byte-identical envelope.
- **Codex convergence** ([[D-b4ab3c69-c110-4d78-bc4c-f9a332489db4]]): the adversarial loop
  converged GATE-PASSES at round 3 (7 findings → 1 → 0), verdicts and dispositions
  persisted verbatim in `roadmap/research/codex-review-w5.md`. The round-1 findings
  included two engine-semantics defects (applicability not gating targets; fabricated
  freshness) that green local tests alone could not catch — both fixed red-first with
  pass-capable scenarios (K4/J5: state `stale`, exit 3, API 200, four-surface parity).

## The documented single command (M1 exit-gate demonstration)

```text
npm run build:cli
node dist/cli/aegis.js verify \
  --manifest data/manifests/reference-code-identity.json \
  --heads data/recordings/reference-eth-op-heads.json \
  --identity data/recordings/reference-identity-reads.json \
  --chain 1 --chain 10 --at finalized \
  --evaluation-time 2026-07-24T00:00:00Z --profile reference --json
```

Observed at `tested_commit`: exit **3** (the honest shipped reality — all verdicts
`unknown` by construction; W6's constraint), envelope keys exactly `payload, reportHash`,
and

```text
reportHash: sha256:976ebf080c390eb212ecaad8ff255a5c548e725457f047b28111198cfb1734f0
```

The BUILT artifact's stdout was `cmp`-verified byte-identical to the in-process facade's
`renderJson` at the same commit (re-verified after the convergence-round edits to
`bin/aegis.ts`).

## CI workflow snippet (S5's documented artifact — library-only; CI machinery is D-007/R-005)

```yaml
- run: npm ci && npm run build:cli
- run: |
    node dist/cli/aegis.js verify \
      --manifest data/manifests/reference-code-identity.json \
      --heads data/recordings/reference-eth-op-heads.json \
      --identity data/recordings/reference-identity-reads.json \
      --chain 1 --chain 10 --at finalized \
      --evaluation-time 2026-07-24T00:00:00Z --profile reference --json
  # exit 0 clean / 2 blocking fail / 3 unknown-stale-conflict / 4 caller input / 5 engine failure
  # (in-process: runCiVerification returns the same classes as data with a deterministic
  # key=value summary; tests/ci.test.ts H1-H5)
```

## Web drawer smoke (recorded, S6 §8)

`vinext dev` `GET /reports` → 200; the served page carried the reference_scenario label,
the full chain-10 downgrade record, the claim-ceiling disclaimer, and a report hash equal
to the in-process facade's hash over the same `?raw`-bundled fixture bytes (recorded
pre-convergence at `80a8b47` as `sha256:7631ec73…bf42`; the convergence corrections
changed the payload, so the CURRENT reference hash is the one above — the equality
property, not the historical value, is the claim).

## Disclosed boundaries (nothing here claims past them)

- The drawer is verified at loader + rendered-markup level and by the recorded dev smoke;
  it is NOT verified in a browser or in the production Workers build (no browser runner;
  `vitest.config.ts` is outside W5 scope). S6 plan §6.
- The fp-reference freshness window (7 days) is a DECLARED reference-profile constant —
  ruled legitimate for the fixture profile by the round-2 review, and it must never be
  promoted as an independently reviewed production policy.
- Verdicts over shipped fixtures are all `unknown` by construction; a `pass` requires the
  W6 matched corpus. `aegis reproduce sha256:<hash>` (stored-input form) does NOT exist at
  M1 and is unadvertised (S4 §6 ruling; C16 pins it).
- The CSP clause of THREAT_MODEL:125 remains an owner triage item
  ([[IDEA-5bb4ace0-d67b-4d91-ab8e-d458526b38a9]]); S6 landed the escaping clause only.
- The frontmatter deliverables ledger still lists the S0–S3-era five files: completing it
  to the full surface set is a verification-contract change the scope gate correctly
  refused without owner acknowledgement — queued as an owner item; this receipt's
  fingerprints are over the committed (original) contract.
