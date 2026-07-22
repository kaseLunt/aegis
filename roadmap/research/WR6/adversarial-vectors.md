# WR6 adversarial vectors: canonical report spine

Status: specification-derived research corpus  
Lane: WR6  
Retrieved: 2026-07-21

> Provenance note (orchestrator): authored by a Codex agent (cross-vendor independence,
> INS-002) in a read-only runtime; returned as text and materialized verbatim by the
> orchestrator on 2026-07-22. Codex session: 019f884c-2051-79b3-9e13-a436396820a1.

## Scope and independence

This corpus was derived without reading implementation code, implementation tests, W1 work products, `lib/`, `components/`, `app/`, or `tests/`.

Only these sources were read:

| Source | Repository URL | Retrieved | SHA-256 of source file |
| --- | --- | --- | --- |
| Engineering specification | `repo:docs/ENGINEERING_SPEC.md` | 2026-07-21 | `AEAF2C713FF1B6B923F959A30132B7C0AE7F49EB091833CA20767F3356DF8F60` |
| Threat model | `repo:docs/THREAT_MODEL.md` | 2026-07-21 | `11D814E99954CB10676CAE3A012F068E8DE3AD7219EC8673FC97B1EE09EA8132` |
| WR6 charter | `repo:roadmap/work/WR6-research-lane.md` | 2026-07-21 | `EB5C3AEB097CA7AE779C2BB9B0245A89BA794B0474C0552968603DE1517ADB0B` |

The vectors are research rationale and deterministic test expectations. Their synthetic hashes, addresses, blocks, providers, and policy identifiers are not deployment evidence.

## Corpus conventions

Golden JSON files contain pre-canonicalization `AssurancePayload` inputs. Their adjacent `.expected.md` files contain:

- the normalized payload's exact RFC 8785/JCS UTF-8 byte sequence;
- no BOM and no trailing LF in that byte sequence;
- the byte count;
- the expected SHA-256 digest.

Patch vectors name a golden base and apply `operations` sequentially. Paths use JSON Pointer syntax. `add`, `replace`, and `remove` have their ordinary JSON Patch meanings; no JSON Patch library is required to understand the fixture.

The `typedRejection.specType` values are WR6 corpus-facing error classes. The specifications mandate rejection but do not define implementation error names. An implementation may map its native typed error to the corpus-facing class while preserving the specified phase and path.

## Vector index

| ID | File | Class | Expected result |
| --- | --- | --- | --- |
| G-01 | `vectors/golden-01-minimal.json` | Golden hash | `9f87dc8827d3cb97794534a37d20f35fb7b70c1ce9afb3a3343a897a0567d5fe` |
| G-02 | `vectors/golden-02-set-normalization.json` | Golden hash | `74fdfe4e55842cc19f2811b78095a8e7587c944ce9b2dff4808cfa3c10763e66` |
| G-03 | `vectors/golden-03-semantic-order-a.json` | Golden hash | `28bd1f91ba8703b11fb2287b8860a5c1ce43df94daa8adf379c332966fa8c165` |
| O-01 | `vectors/ordering-set-like-shuffle.json` | Determinism | Same bytes and hash as G-02 |
| O-02 | `vectors/ordering-semantic-order-b.json` | Semantic ordering | Different hash: `ad6caa2492a279823bc43389522615d3a05791f7f66b83c55d1c5b7a0c6c45cd` |
| M-01 | `vectors/malformed-duplicate-set-member.json` | Malformed | `duplicate_set_member` rejection |
| M-02 | `vectors/malformed-decimal-leading-zero.json` | Malformed | `noncanonical_unsigned_decimal` rejection |
| M-03 | `vectors/malformed-decimal-plus-sign.json` | Malformed | `noncanonical_unsigned_decimal` rejection |
| M-04 | `vectors/malformed-uppercase-hex.json` | Malformed | `noncanonical_hex` rejection |
| M-05 | `vectors/malformed-dangling-evidence-role-id.json` | Malformed | `dangling_evidence_role_id` rejection |
| M-06 | `vectors/malformed-missing-mandatory-field.json` | Malformed | `missing_mandatory_field` rejection |
| S-01 | `vectors/semantic-provider-block-conflict.json` | Semantics | `conflict` |
| S-02 | `vectors/semantic-provider-value-conflict.json` | Semantics | `conflict` |
| S-03 | `vectors/semantic-stale-evidence.json` | Semantics | `stale`, never `pass` |
| S-04 | `vectors/semantic-missing-evidence.json` | Semantics | `unknown`, never `pass` |
| S-05 | `vectors/semantic-unilateral-contradiction.json` | Semantics | `unknown` plus provisional alert; never critical `fail` |
| S-06 | `vectors/semantic-reorg-superseded.json` | Semantics | Old artifact superseded and retained; derived cache invalidated |
| S-07 | `vectors/semantic-identity-mismatch.json` | Semantics | Refuse ABI selection/decoding; dependent verification `unknown` |
| S-08 | `vectors/semantic-untrusted-policy.json` | Semantics | Policy-dependent verification `unknown`; observed fact may remain available |

## Hand derivation of golden vectors

### Common JCS object-key order

RFC 8785 sorts object member names lexicographically by UTF-16 code units. All fixture keys are ASCII, so ordinary ASCII lexicographic order gives the same result.

The top-level key order for all three payloads is:

1. `coverage`
2. `engineVersion`
3. `evaluationTime`
4. `evidence`
5. `facts`
6. `limitations`
7. `manifestHash`
8. `manifestVersion`
9. `observationBoundaries`
10. `policyRefs`
11. `policyTrust`
12. `requestHash`
13. `schemaVersion`
14. `sourceMode`
15. `verifications`

Nested orders used repeatedly are:

- `coverage`: `excluded`, `supported`, `unsupported`
- `policyTrust`: `evidence`, `manifestHash`, `reasonCodes`, `state`, `trustPolicyId`
- source-snapshot boundary: `kind`, `snapshot`
- snapshot: `contentHash`, `retrievedAt`, `sourceId`, `uri`
- evidence without optional fields: `boundary`, `capturedAt`, `id`, `kind`, `provenanceClass`, `rawResultHash`, `sourceMode`
- execution boundary: `block`, `kind`
- block: `chainId`, `finality`, `hash`, `number`, `parentHash`, `timestamp`

No whitespace is inserted by JCS.

### G-01: minimal typed spine

1. The payload includes every mandatory `AssurancePayload` field.
2. It contains one content-addressed source-snapshot boundary and one manifest evidence item so the mandatory policy-trust evidence field is not represented by invented null values.
3. Every array has zero or one element, so domain array normalization does not change element order.
4. All object keys are emitted in the common JCS order above.
5. The resulting ASCII-only UTF-8 serialization is 1,973 bytes.
6. SHA-256 over those exact bytes is `9f87dc8827d3cb97794534a37d20f35fb7b70c1ce9afb3a3343a897a0567d5fe`.

### G-02: domain normalization before JCS

The input deliberately uses noncanonical set/enumeration order:

- `coverage.supported`: `["zeta","alpha"]` becomes `["alpha","zeta"]`.
- `policyTrust.reasonCodes`: `["z_reason","a_reason"]` becomes `["a_reason","z_reason"]`.
- top-level evidence has IDs `sha256:66...` then `sha256:22...`; it becomes `sha256:22...` then `sha256:66...`.
- observation boundaries are source snapshot then execution block; kind-plus-identity ordering places `execution_block` before `source_snapshot`.

The execution block uses:

- JSON number `1` for `chainId`, as declared by `BlockRef`;
- minimal unsigned decimal string `"2"` for the block number;
- lowercase `0xaa`, `0xbb`, `0xab`, and `0x00` hex encodings;
- decimal string `"7"` for the decoded quantity.

After domain normalization, JCS sorts every object's keys. The resulting serialization is 2,870 bytes. SHA-256 is `74fdfe4e55842cc19f2811b78095a8e7587c944ce9b2dff4808cfa3c10763e66`.

### G-03: semantic-order preservation

G-03 uses the same boundary, set normalization, evidence-ID sorting, and JCS rules as G-02.

Its `decodedResult.safeBatch` is semantic-order data:

1. `{"index":"0","to":"0xaa","value":"0"}`
2. `{"index":"1","to":"0xbb","value":"1"}`

The array is retained in this order. It is not sorted by address, value, or serialized object bytes. The explicit indices and values are minimal unsigned decimal strings, and the addresses are lowercase hex.

Within each batch item, JCS emits keys as `index`, `to`, `value`.

The resulting serialization is 2,908 bytes. SHA-256 is `28bd1f91ba8703b11fb2287b8860a5c1ce43df94daa8adf379c332966fa8c165`.

### O-01: shuffled set-like inputs

O-01 changes only the input order of `coverage.supported` and `policyTrust.reasonCodes`. Domain normalization returns both to the same normalized arrays as G-02. Therefore the exact bytes and hash must equal G-02.

### O-02: reversed semantic sequence

O-02 uses the same two semantic calls but gives the opposite semantic order and rewrites the explicit indices to remain consistent with their positions:

1. `{"index":"0","to":"0xbb","value":"1"}`
2. `{"index":"1","to":"0xaa","value":"0"}`

The normalizer must not sort this array back to G-03 order. Its exact normalized serialization is 2,908 bytes and hashes to `ad6caa2492a279823bc43389522615d3a05791f7f66b83c55d1c5b7a0c6c45cd`, which differs from G-03.

## Specification-clause map

| Clause ID | Exact source clause | Tested by |
| --- | --- | --- |
| E-CDT-DECIMAL | `ENGINEERING_SPEC.md` § Canonical domain types: "Token quantities, block numbers, slots, counts, and currency values are serialized as decimal strings." | G-02, G-03, M-02, M-03 |
| E-CDT-ROLES | `ENGINEERING_SPEC.md` § Canonical domain types: "Expected, actual, and derivation evidence roles are explicit ID lists; schema validation rejects missing IDs and observed evidence masquerading as expected policy." | M-05 |
| E-CDT-MANDATORY | `ENGINEERING_SPEC.md` § Canonical domain types: `EvidenceRef.rawResultHash`, `boundary`, `capturedAt`, `id`, `kind`, `provenanceClass`, and `sourceMode` are non-optional. | M-06 |
| E-CAN-JCS | `ENGINEERING_SPEC.md` § Canonicalization and hashing: "Use RFC 8785 JSON Canonicalization Scheme … after domain normalization. JCS sorts object keys." | G-01, G-02, G-03 |
| E-CAN-EVIDENCE | Same section: "evidence sorts by evidence ID." | G-02, G-03 |
| E-CAN-BOUNDARY | Same section: "observation boundaries sort by kind plus chain/network/source identity and boundary number/root/hash." | G-02, G-03 |
| E-CAN-SETS | Same section: "set-like address, role, DVN, reason-code, limitation, coverage, and causal-edge arrays use documented stable keys after hex/address normalization." | G-02, O-01 |
| E-CAN-DUPLICATE | Same section: "duplicates in set-like arrays are rejected unless the schema explicitly models multiplicity." | M-01 |
| E-CAN-SCALARS | Same section: "integers use minimal unsigned decimal strings and hex bytes use normalized lowercase `0x` encoding." | G-02, G-03, M-02, M-03, M-04 |
| E-CAN-SEMANTIC | Same section: "arrays with semantic order, including Safe batches, transaction prefixes, event tapes, and traces, retain order and include an explicit sequence/index field rather than being sorted." | G-03, O-02 |
| E-CAN-HASH | Same section: "`reportHash = sha256(JCS(normalizedAssurancePayload))`." | G-01, G-02, G-03, O-01, O-02 |
| E-QUORUM-BLOCK | `ENGINEERING_SPEC.md` § Provider quorum and conflicts: "A block-number match with a hash mismatch is a conflict." | S-01 |
| E-QUORUM-DISAGREE | Same section: "Required-provider disagreement yields `conflict`." | S-01, S-02 |
| E-QUORUM-MISSING | Same section: "Provider timeout or malformed response is missing evidence, not a zero value" and "Insufficient responses yield `unknown`." | S-04, S-05 |
| E-QUORUM-UNILATERAL | Same section: "A single provider contradicting policy without quorum produces `unknown` with a provisional-contradiction alert; it cannot produce a canonical `fail`." | S-05 |
| E-STALE | `ENGINEERING_SPEC.md` § Invariant engine: "Stale evidence cannot produce `pass`." | S-03 |
| E-IDENTITY | `ENGINEERING_SPEC.md` § Deployment code identity: an ABI is selected "only after the terminal runtime hash matches"; unknown code identity prevents dependent semantic reads. | S-07 |
| E-POLICY-TRUST | `ENGINEERING_SPEC.md` § Manifest trust root: an untrusted custom manifest forces policy-dependent verifications to `unknown`; observed neutral facts may remain available; it cannot replace the default live report. | S-08 |
| E-REORG | `ENGINEERING_SPEC.md` § Storage and caching: "A block-hash change invalidates derived cache entries and marks prior observations orphaned." | S-06 |
| E-TEST | `ENGINEERING_SPEC.md` § Tests: randomized set order is deterministic; semantic batch order remains significant; duplicate sets and noncanonical numeric/hex encodings are rejected; missing evidence cannot improve a result; stale evidence cannot pass; disagreement produces conflict; ABI/code-hash mismatch prevents decoding. | O-01, O-02, M-01–M-04, S-01–S-07 |
| T-RESULT | `THREAT_MODEL.md` § Result semantics: `unknown`, `stale`, and `conflict` definitions; untrusted policy forces policy-dependent verification to `unknown`. | S-01–S-05, S-08 |
| T-REORG | `THREAT_MODEL.md` threat table, Reorganization: key caches by block hash, recheck canonicality, preserve and supersede reorged artifacts. | S-06 |
| T-IDENTITY | `THREAT_MODEL.md` threat table, Proxy or ABI mismatch: resolve implementation/runtime identity before selecting a code-hash-scoped ABI. | S-07 |
| T-ADV-1–4 | `THREAT_MODEL.md` § Required adversarial tests, items 1–4. | S-01–S-06 |
| T-ADV-8/18 | Same section, items 8 and 18. | S-07 |
| T-ADV-29 | Same section, item 29. | S-05 |
| T-ADV-30 | Same section, item 30. | S-08 |
| T-ADV-31 | Same section, item 31. | G-01–G-03, O-01, O-02 |

## SPEC-QUESTION items

### SPEC-QUESTION-01: rejection taxonomy

The specs require typed schema/canonicalization rejection behavior but define no error union, stable error codes, path representation, or precedence when multiple defects exist. This corpus proposes `specType` values without claiming they are canonical implementation names.

### SPEC-QUESTION-02: normalize uppercase hex or reject it

Canonicalization says hex is normalized to lowercase, while the Tests section says noncanonical numeric/hex encodings are rejected. M-04 follows the stronger explicit test requirement and expects rejection. The spec should say whether lowercase conversion is allowed only inside trusted adapters or whether every external uppercase encoding is invalid.

### SPEC-QUESTION-03: "integers" versus declared numeric fields

The canonicalization rule says integers use minimal unsigned decimal strings, but `BlockRef.chainId` and `BoundaryFreshness.ageSeconds` are declared as JSON numbers. The domain prose specifically assigns decimal strings to token quantities, block numbers, slots, counts, and currency values. Goldens preserve `chainId: 1` according to the declared type and use strings for block numbers and quantities. The intended treatment of `ageSeconds` and future integer-valued JSON numbers needs clarification.

### SPEC-QUESTION-04: byte lengths for hex identities

Template-literal types require only an `0x` prefix and do not specify byte lengths for block hashes, roots, addresses, or calldata. The goldens use deliberately short lowercase hex to remain hand-auditable. If the actual schema requires 20-byte addresses or 32-byte hashes, those constraints should be canonical domain clauses.

### SPEC-QUESTION-05: SHA-256 string validation

`sha256:${string}` does not normatively require exactly 64 lowercase hexadecimal characters, although all corpus hash identifiers use that form. The schema should define length, alphabet, and case.

### SPEC-QUESTION-06: semantic-array schema

The spec names Safe batches, transaction prefixes, event tapes, and traces but provides no canonical interfaces, field name for the sequence/index, index type, starting value, contiguity rule, or duplicate-index rule. G-03 uses `decodedResult.safeBatch` with zero-based minimal decimal-string `index` fields.

### SPEC-QUESTION-07: normalization inside `unknown`

`decodedResult`, verification `expected`/`actual`, and fact `value` are typed `unknown`. The spec does not state how the domain normalizer discovers address, integer, set-like, or semantic-order fields inside these values. G-03 assumes the Safe-batch schema is known to the relevant adapter and that JCS otherwise preserves its array order.

### SPEC-QUESTION-08: stable keys for set-like arrays

Stable keys are not defined for limitations, coverage strings, reason codes, addresses, roles, DVNs, or causal edges. This corpus sorts scalar string sets lexicographically after normalization and avoids multi-element limitation objects. Stable composite keys should be enumerated.

### SPEC-QUESTION-09: policyRefs and evidence-role list ordering

No normalization rule is specified for `policyRefs`, `expectedEvidenceIds`, `actualEvidenceIds`, `derivationInputIds`, `inputEvidenceIds`, or freshness assessments. It is unclear which are sets and which preserve evaluator order.

### SPEC-QUESTION-10: scope of "evidence sorts by evidence ID"

The rule does not explicitly say whether it applies only to top-level `AssurancePayload.evidence` or also to `policyTrust.evidence`, `Verification.evidence`, and `EvidenceFact.evidence`. The goldens apply it wherever an array contains `EvidenceRef` values.

### SPEC-QUESTION-11: evidence-role referential scope

The specs require role IDs and reject missing IDs, but do not state whether an ID must resolve inside the enclosing verification's `evidence`, the top-level payload `evidence`, or both. M-05 uses an ID absent from every scope, so its rejection does not depend on this ambiguity.

### SPEC-QUESTION-12: minimum array cardinalities

The interfaces require fields but do not define minimum lengths for policy references, observation boundaries, evidence, policy-trust evidence, verifications, facts, or coverage sets. G-01 includes one boundary and one policy-trust evidence object but no verification/fact.

### SPEC-QUESTION-13: reportHash external representation

The equation defines SHA-256 over bytes, but no `reportHash` type says whether API/storage values are bare lowercase hex or `sha256:<hex>`. Expected files state the bare digest and the prefixed content-address form.

### SPEC-QUESTION-14: provisional-alert schema

Provider quorum semantics require a provisional-contradiction alert but provide no canonical alert type, location, severity, hashing rule, or reason code. S-05 uses a corpus-facing `provisional_contradiction` expectation.

### SPEC-QUESTION-15: supersession representation

Reorg controls require preserving and superseding old artifacts, but `AssurancePayload` has no lineage or supersession fields. S-06 models this as artifact-store lifecycle state outside the verification-state union.

### SPEC-QUESTION-16: identity-mismatch verification state

The specs clearly require refusal to select an ABI or decode when terminal runtime identity does not match. They do not unambiguously assign `fail` versus `unknown` to the identity predicate itself. S-07 therefore fixes the required observable consequences and assigns `unknown` only to dependent semantic verification.

### SPEC-QUESTION-17: canonicalized raw-result comparison

Provider agreement depends on "canonicalized raw results," but the byte/string normalization for JSON-RPC results, error objects, return bytes, and transport encodings is not specified. S-01 and S-02 use already-canonical synthetic result strings.

### SPEC-QUESTION-18: boundary sort comparison

Boundary ordering includes decimal-string block numbers and slots, but the spec does not say whether their stable-key comparison is numeric or lexical. The golden vectors avoid two same-identity boundaries whose order would expose that ambiguity.

## SPEC-QUESTION triage (integrator, 2026-07-22)

Normative answers live in docs/ENGINEERING_SPEC.md §Canonicalization clarifications (v1.2).
Map: SQ-01 -> clarification 1 (typed rejection codes). SQ-02 -> 2 (reject at boundary;
adapters normalize upstream; M-04 stands). SQ-03 -> 3 (chainId/ageSeconds stay JSON numbers;
goldens stand). SQ-04 -> layer split (schema enforces byte lengths; goldens exercise
normalization+JCS+hash layer). SQ-05 -> schema: 64 lowercase hex. SQ-06 -> 4 (index field
contract). SQ-07 -> 5 (registered shapes only). SQ-08/09/10 -> 6 (stable keys enumerated;
role-ID lists are sets; EvidenceRef rule everywhere). SQ-11 -> 8 (resolve against top-level
evidence). SQ-12 -> 9 (>=1 boundary). SQ-13 -> 10 (sha256:<hex> form). SQ-16 -> 11
(identity predicate fails; dependents unknown). SQ-18 -> 7 (numeric via length-then-lex).
Deferred: SQ-14, SQ-17 (W3), SQ-15 (M3). All 20 golden/ordering/malformed vectors remain
valid under these answers; no vector was adjusted.
