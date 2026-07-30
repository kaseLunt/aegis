# Recorded provider fixtures

Reference-scenario RPC recordings for tests and demos — sourceMode `recorded`, provenance
class `reference_scenario`. These are **not** live capture: block numbers and top-level
hashes for ETH 25577369 / OP 154496611 reuse the recorded reference identities from
`data/manifests/etherfi-reference-v1.json`; parent hashes, timestamps, and non-head
blocks are illustrative reference values unless a file explicitly cites block-hash-bound
provenance. A live recording pipeline (real raw responses, real capture times) arrives
with the provider probe step (WR3 legend: declared capability cells are promoted only
after a probe with recorded raw responses).

Format: one bundle per scenario; each response carries the canonical result plus
`rawResponseSha256` = sha256 over the JCS bytes of `result` — verified at load
(`loadRecordingBytes`), so a tampered recording fails closed with `integrity_mismatch`.

Byte note (INS-001): files are stored LF (`data/**` is `-text`), read in BINARY mode, and
decoded strictly in memory; content identity never touches platform text handling.

## Scenario corpus — declared outcomes (W6)

Every scenario fixture is DERIVED from a committed spec by the authoring recipes in
`tests/corpus-recipes.ts`; `tests/corpus.test.ts` re-derives each fixture and
byte-compares (conformance), then pins the declared outcome on all four surfaces with one
report hash (parity). Expected values in scenario manifests are CO-AUTHORED with the
recorded reads they verify — legal only because the artifacts are sourceMode `recorded`,
provenance class `reference_scenario`; nothing here claims independent expected-observed
provenance, and nothing here is live capture. Trust in the documented commands is the
reference profile's visible self-approval — never a canonical production claim.

| Scenario | Manifest | Recordings | Declared outcome | Exit |
|---|---|---|---|---|
| missing-evidence | `manifests/reference-code-identity.json` | `reference-eth-op-heads.json` + `reference-identity-reads.json` | all `unknown` (declared targets have no recorded reads) | 3 |
| pass | `manifests/scenario-pass.json` | same reference recordings | `pass`, `pass` (matched pair over the covered proxy) | 0 |
| mismatch | `manifests/scenario-mismatch.json` | same reference recordings | `pass`, `fail` (wrong expected runtime hash; fail outranks the sibling pass) | 2 |

Documented command per row (swap the manifest path; the missing-evidence row is the
EV-W5 documented command verbatim):

```text
node dist/cli/aegis.js verify --manifest data/manifests/<manifest> \
  --heads data/recordings/reference-eth-op-heads.json \
  --identity data/recordings/reference-identity-reads.json \
  --chain 1 --chain 10 --at finalized \
  --evaluation-time 2026-07-24T00:00:00Z --profile reference
```

Remaining M1 scenarios (stale, provider-conflict, ABI-mismatch, not_applicable, reorg)
land in W6-S2/S3 with rows added here as they ship.
