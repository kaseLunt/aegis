# Manifest fixtures

Reference-scenario manifests for tests and demos. These are **not** promoted live policy:
provenance class `reference_scenario`, never `declared_configuration` for a canonical live
verdict. Promotion into a trusted live manifest is a separate reviewed step gated by the
`docs/SOURCE_REGISTER.md` promotion checklist and the deployment-configured approved-hash
trust root (`lib/aegis/manifest/trust.ts`).

A fixture's addresses, hashes, and expected values are illustrative unless a file explicitly
cites block-hash-bound provenance. WR1's route research (`roadmap/research/WR1/`) is discovery
input for *authoring* a real route manifest; it does not make a fixture canonical.

Byte note (INS-001): these files are content-addressed. They are stored LF and read in binary
mode; `manifestContentHash` hashes the JCS bytes with the embedded `contentHash` field excluded.

## Scenario manifests (W6)

`scenario-*.json` are DERIVED artifacts: each is produced from its committed spec in
`tests/corpus-recipes.ts` (targets swapped into the reference manifest, `contentHash`
resealed, JCS + LF) and byte-pinned by `tests/corpus.test.ts`. Their expected values are
co-authored with the recorded reads they verify — a disclosed `reference_scenario`
construction, never independent expected-side provenance and never promoted live policy.
The per-scenario outcome table lives in `data/recordings/README.md`.
