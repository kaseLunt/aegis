# Expected result: G-02

Byte encoding: UTF-8, no BOM  
Trailing LF in canonical bytes: no  
Byte length: `2870`  
SHA-256 digest: `74fdfe4e55842cc19f2811b78095a8e7587c944ce9b2dff4808cfa3c10763e66`  
Content-address form: `sha256:74fdfe4e55842cc19f2811b78095a8e7587c944ce9b2dff4808cfa3c10763e66`

Normalization before JCS:

- evidence IDs: `22...`, then `66...`
- boundaries: `execution_block`, then `source_snapshot`
- reason codes: `a_reason`, then `z_reason`
- supported coverage: `alpha`, then `zeta`

Exact JCS bytes:

```text
{"coverage":{"excluded":["beta"],"supported":["alpha","zeta"],"unsupported":["omega"]},"engineVersion":"1","evaluationTime":"2026-07-21T00:00:02Z","evidence":[{"boundary":{"kind":"source_snapshot","snapshot":{"contentHash":"sha256:4444444444444444444444444444444444444444444444444444444444444444","retrievedAt":"2026-07-21T00:00:00Z","sourceId":"manifest-registry","uri":"urn:aegis:test:manifest-registry"}},"capturedAt":"2026-07-21T00:00:00Z","id":"sha256:2222222222222222222222222222222222222222222222222222222222222222","kind":"manifest","provenanceClass":"declared_configuration","rawResultHash":"sha256:5555555555555555555555555555555555555555555555555555555555555555","sourceMode":"recorded"},{"address":"0xab","boundary":{"block":{"chainId":1,"finality":"finalized","hash":"0xaa","number":"2","parentHash":"0xbb","timestamp":"2026-07-21T00:00:00Z"},"kind":"execution_block"},"calldata":"0x00","capturedAt":"2026-07-21T00:00:01Z","decodedResult":{"amount":"7"},"id":"sha256:6666666666666666666666666666666666666666666666666666666666666666","kind":"rpc_call","method":"eth_call","provenanceClass":"observed_public_state","providerId":"provider-a","rawResultHash":"sha256:7777777777777777777777777777777777777777777777777777777777777777","sourceMode":"recorded"}],"facts":[],"limitations":[],"manifestHash":"sha256:0000000000000000000000000000000000000000000000000000000000000000","manifestVersion":"1","observationBoundaries":[{"block":{"chainId":1,"finality":"finalized","hash":"0xaa","number":"2","parentHash":"0xbb","timestamp":"2026-07-21T00:00:00Z"},"kind":"execution_block"},{"kind":"source_snapshot","snapshot":{"contentHash":"sha256:4444444444444444444444444444444444444444444444444444444444444444","retrievedAt":"2026-07-21T00:00:00Z","sourceId":"manifest-registry","uri":"urn:aegis:test:manifest-registry"}}],"policyRefs":[{"contentHash":"sha256:8888888888888888888888888888888888888888888888888888888888888888","id":"pq-1","kind":"provider_quorum","version":"1"}],"policyTrust":{"evidence":[{"boundary":{"kind":"source_snapshot","snapshot":{"contentHash":"sha256:4444444444444444444444444444444444444444444444444444444444444444","retrievedAt":"2026-07-21T00:00:00Z","sourceId":"manifest-registry","uri":"urn:aegis:test:manifest-registry"}},"capturedAt":"2026-07-21T00:00:00Z","id":"sha256:2222222222222222222222222222222222222222222222222222222222222222","kind":"manifest","provenanceClass":"declared_configuration","rawResultHash":"sha256:5555555555555555555555555555555555555555555555555555555555555555","sourceMode":"recorded"}],"manifestHash":"sha256:0000000000000000000000000000000000000000000000000000000000000000","reasonCodes":["a_reason","z_reason"],"state":"untrusted","trustPolicyId":"tp-1"},"requestHash":"sha256:1111111111111111111111111111111111111111111111111111111111111111","schemaVersion":"1","sourceMode":"recorded","verifications":[]}
```
