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
