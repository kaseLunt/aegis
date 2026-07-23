# W4 Codex senior review — findings and dispositions

Review run 2026-07-23 against a66837e (Codex session 019f8d60-130c-75a3-b98a-e4fd8ac09b06),
per the ratified senior-reviewer decision. Verdict: 4 P0 + 5 P1 + test-quality gaps;
not ready for the achieved stamp. Both ERC constants and the exact EIP-1167 pattern
decode were independently confirmed correct.

Discipline: every confirmed finding is reproduced as a failing test first, then fixed
(tests/w4-codex-fixes.test.ts unless noted).

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | P0 | Identity reads not bound to the pinned block hash; observe stamps `pinned.hash` onto observations (fabricated binding); reorg at same number can pass citing the wrong block | ACCEPTED — reads re-keyed by block hash (EIP-1898 request form `{blockHash}` in the recording canon); adapters take the pin, the envelope/key binds the hash, live adapters must use EIP-1898 (WR3-confirmed support) |
| 2 | P0 | `target.identityStrategy` never compared to `observed.identity.strategy`; resolved identity with zero reads passes | ACCEPTED — typed `strategy_mismatch` + `missing_observation_evidence` caller defects |
| 3 | P0 | `selectAbi` gated only on registry membership, not the manifest expectation | ACCEPTED — selection now requires the observed terminal hash to EQUAL `expectedRuntimeCodeHash` (spec: "selects an ABI only after the terminal runtime hash matches"); refusals: `manifest_mismatch`, `missing_expectation` |
| 4 | P0 | Length-only `hasCode` lets non-hex agreed code resolve through intermediate steps; malformed terminal/storage data escapes as exceptions; beacon decode accepts nonzero ABI padding | ACCEPTED — strict hex on every code read (typed `malformed_code_hex`); observe maps data-malformation errors to typed unknown with reads retained; beacon word decode requires zero-padded ABI `address` |
| 5 | P1 | Provider conflict collapsed into `observation_unresolved`; comparison has no `conflict` state | ACCEPTED — `ObservationUnavailable` carries `observation_conflict` vs `observation_unresolved`; comparison maps conflict to the canonical `conflict` state (never pass) |
| 6 | P1 | Beacon strategy skips the ERC-1967 rule that the logic slot must be empty before the beacon applies | ACCEPTED — beacon walk reads the implementation slot first; populated slot is typed `logic_slot_populated` (ambiguous identity, never resolved through the beacon) |
| 7 | P1 | Freshness `not_applicable` misused for an unassessed applicable predicate; manifest-side evidence optional | ACCEPTED — aggregate becomes `unknown` (assessed-never is not inapplicable); `manifestEvidenceId` is now required (typed `invalid_context`) so every verification carries expected-side provenance |
| 8 | P1 | Evidence refs insufficient to audit: slot omitted, response `capturedAt` replaced by caller context, `sourceMode` caller-labelable, no decoded value | ACCEPTED — storage reads carry the slot as `calldata`; `capturedAt` + `sourceMode` now travel from the adapter response (recorded envelope) through the observation into the ref; `decodedResult` carries the agreed value |
| 9 | P1 | Indirection path lost on unresolved reads and for `custom`; compare discards the structured path | ACCEPTED for resolution: `ObservationUnavailable` is caught inside resolve.ts at each read site, so unknown results retain the path walked so far; `custom` retains its root step. DECLINED for report composition: `Verification` is a spec-fixed canonical type — embedding a nonstandard `path` field would drift the schema; the retained path lives on the identity result and surfaces in reports as W5 composition scope (e.g. an EvidenceFact), recorded in the W4 handoff |
| T1 | P1 | No negative tests for the above classes | ACCEPTED — every fix lands with its failing test in tests/w4-codex-fixes.test.ts |
| T2 | P2 | Slot tests derive fixtures from the exported constants (self-referential) | ACCEPTED — literal ERC-1967 hex values asserted |
| T3 | P2 | Byte-mutation property covers only direct terminal code; conditional property can skip its assertion | ACCEPTED (narrow) — mutation coverage extended to intermediate reads via the malformed-data tests; full per-strategy property sweep deferred to the W5 composition suite |
| T4 | P2 | EIP-1167 rejection covers one wrong-length case, not same-length mutations | ACCEPTED — same-length prefix/suffix mutation tests added |

Non-finding notes: the reviewer confirmed quorum fan-out, administrative-domain
independence, non-agreed-value exclusion, independent expectation IDs, and
drift-requiring-review wording as correct. The reviewer's environment could not spawn
vitest (`spawn EPERM`); the 277/277 baseline is attested by EV-W3-R2 and re-verified at
disposition landing.

## Disposition landing (2026-07-23)

All ACCEPTED rows implemented TDD in one pass: 20 new tests in
tests/w4-codex-fixes.test.ts (each written RED against the pre-fix contracts), the
slice-1/2/3 suites re-contracted where the review changed semantics (malformed observed
data, conflict reason codes, EIP-1898 read keys, 3-argument ABI selection, required
manifest evidence), and the reference recording resealed under the hash-keyed canon.
Full suite 297/297; lint clean. Mechanical changes: resolve.ts restructured around
path-retaining walks (DerivationHalt/ObservationUnavailable), adapter reads keyed by
`{blockHash}`, ProviderObservation carries response provenance, compare.ts binds
strategy + requires manifest evidence + emits `conflict`, selectAbi requires
observed == expected == registered.
