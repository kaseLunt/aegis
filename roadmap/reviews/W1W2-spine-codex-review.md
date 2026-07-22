# W1/W2 spine review (Codex, cross-vendor, INS-002)

Reviewer: Codex · task-mrwfh9m5-z7gm7w · session 019f8b21 · 2026-07-22 · read-only, tree clean @ c610791
Framing: correctness/determinism/RFC-8785 conformance (reframed after INS-004 moderation block).
Verdict: **not correctness-ready** — 3 P0, 5 P1. All verified real by the integrator.

## Disposition

| # | Sev | Finding | Verified | Disposition |
|---|-----|---------|----------|-------------|
| 1 | P0 | `evaluateTrust` trusts caller-supplied `contentHash`; forged/mutated/prototype-only `LoadedManifest` → trusted | yes | FIX NOW — evaluateTrust re-derives hash from validated content; loaded content frozen; plain-object required |
| 2 | P0 | `canonicalBytes`/`reportHash` call structural, not strict `validateReport`; strict layer never wired to production | yes | FIX NOW — production entry points run strict validateReport; abbreviated WR6 vectors use explicit `*Structural` test entry points |
| 3 | P0 | `loadManifest` under-validates (formats, decimals, validity structure, embedded hash not required); `cmpDecimal` precondition unmet → missed expiry on `"0009"` | yes | FIX NOW — complete manifest schema; require+verify embedded hash; normalize before compare |
| 4 | P1 | set-like arrays sorted but duplicates not rejected; semantic `index` not validated; `str()` coercion masks chainId 1 vs "1" | yes | FIX NOW (duplicates + semantic index + typed stable keys); adapter-shape registry for address/role/DVN arrays DEFERRED (no such domain arrays exist in v1) |
| 5 | P1 | `manifestContentHash` skips domain normalization → `chainIds:[1,10]` vs `[10,1]` differ | yes | FIX NOW — normalizeManifest before hashing |
| 6 | P1 | lone surrogates pass `JSON.stringify` (RFC 8785 §3.2.2.2 requires error) | yes | FIX NOW — surrogate scan in JSON-domain guard |
| 7 | P1 | non-JSON values (undefined/Date/Map/toJSON/cycles) collide; duplicate raw keys collapse pre-parse | yes | SPLIT — exotic-value rejection FIX NOW (assertJsonDomain); duplicate-aware raw parsing DEFERRED to the untrusted-bytes boundary (W3/API; all current inputs are our own fixtures) — tracked R-003 |
| 8 | P1 | M0 preflight/replay/invariants still emit `AGS-<hash>` as `reportHash`, not `sha256:<64hex>` | yes | DEFER to W5 (one-engine/all-surfaces migration); cheap mislabel-prevention rename tracked, not done here — R-004 |

Clean dimensions Codex confirmed: JCS number forms, UTF-16 key ordering (no localeCompare), valid-string escaping, evidence sorting/dedup, implemented set sorts, the trust-decision branch given a genuine immutable input, SHA-256 usage, embedded-hash exclusion, valid-window comparisons.

## Note on W1 "achieved"
W1's acceptance suite passed but its coverage had the holes above; achieved reflected
evidence-as-of-commit, not timeless correctness — exactly what the evidence ladder warns of.
Fixes land under the active W2 lane (shared spine, fable-main single owner); W1 + W2 are
re-attested at a new fingerprint after the expanded suite passes.
