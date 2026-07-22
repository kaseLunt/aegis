---
id: IDEA-002
type: idea
title: policyTrust.manifestHash domain separation for invalid blocks (raw-bytes digest vs content hash)
status: inbox
informs: [R-003]
review_when: date:2026-08-05
updated: 2026-07-22
---

# IDEA-002 — policyTrust.manifestHash domain separation for invalid blocks (raw-bytes digest vs content hash)

From the W2 adversarial review (finding raised, then refuted 3-0 as a defect but flagged
by the refuters as a spec-evolution note): an INVALID policyTrust block anchors
`manifestHash` to sha256 of the rejected raw bytes (`policyTrustFromBytes`), while
trusted/untrusted blocks carry the manifest CONTENT hash. The two domains can coincide
byte-identically exactly when the rejected bytes are the JCS serialization of an approved
manifest's content-hash preimage. No conformant consumer can conflate them today (state
travels in the same block; invalid runs are rejected before evaluation; the cache key in
THREAT_MODEL is composite), so this is NOT a W2 defect — but when the W3/W5 untrusted-bytes
boundary and any evidence caching land, a spec clarification of invalid-case manifestHash
semantics (or an explicit domain-separated field) would remove the ambiguity class.
ENGINEERING_SPEC types the field `sha256:${string}` unconditionally, so any change is a
docs/-canon question for the owner, not an implementation patch.
