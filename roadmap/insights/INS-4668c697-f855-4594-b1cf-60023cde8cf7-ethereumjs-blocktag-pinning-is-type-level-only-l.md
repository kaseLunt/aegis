---
id: INS-4668c697-f855-4594-b1cf-60023cde8cf7
type: insight
title: "EthereumJS blockTag pinning is type-level only — 'latest' silently becomes malformed 0xlatest"
status: candidate
informs: []
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-4668c697-f855-4594-b1cf-60023cde8cf7 — EthereumJS blockTag pinning is type-level only — 'latest' silently becomes malformed 0xlatest

**Context.** S7 budget spike (`roadmap/research/rehearse-selection/spike-s6-s7.md` §2.6,
rehearsal-master 2026-07-26). The wave-1 wr5 ruling's CANON claim — "RPCStateManager accepts
blockTag as a block number or 'earliest' only … pinning is structural, not a discipline you
can forget" — is **refuted at runtime** in v10.1.2. OBSERVED: `blockTag: 'latest'` is
ACCEPTED at construction and silently becomes the malformed tag `'0xlatest'`
(`rpcStateManager.js:36` routes non-'earliest' values through `bigIntToHex`, and
`String.prototype.toString(16)` ignores its argument). Failure surfaces at *query* time as a
confusing provider error (`-32601 "invalid hex string"`), not at construction.

**The class.** A safety property enforced only by a TypeScript signature is not enforced:
any value arriving via JSON, config files, CLI args, or an `any`-typed path defeats it
silently. "Structural pinning" claims must be verified at *runtime* against the installed
package, not read off the type declarations — the same lesson as the OpHardfork enum that is
`{}` at runtime (spike §1.1).

**Teeth (P4, binding on the rehearsal engine wrapper).** Aegis's EthereumJS binding must
assert `typeof blockTag === "bigint"` (and reject `'latest'`/`'pending'`/string forms) at
its own boundary, negative-tested red-first with the literal `'latest'` fixture — the test
fails if the wrapper ever forwards a non-bigint to RPCStateManager. This is a concrete
addition to wr5's S3 zero-override proof.
