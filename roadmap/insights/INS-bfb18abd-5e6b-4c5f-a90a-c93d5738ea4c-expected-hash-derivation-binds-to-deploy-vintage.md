---
id: INS-bfb18abd-5e6b-4c5f-a90a-c93d5738ea4c
type: insight
title: "Expected-hash derivation binds to deploy-vintage trees, never the policy-pin commit; anti-fitting rule"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-bfb18abd-5e6b-4c5f-a90a-c93d5738ea4c — Expected-hash derivation binds to deploy-vintage trees, never the policy-pin commit; anti-fitting rule

**Context.** G-01 build-derivation lane
(`roadmap/research/route-manifest/g01-build-derivation.md`, route-cartographer 2026-07-26).
The blueprint's G-01 recipe said "compile the pinned source @ e30c859c" — but the dossier
PROVED (27-line source diff, T2) and made probable (evm paris→shanghai flip, dependency
drift LZ 2.1.27→2.3.44, `bytecode_hash='none'` postdating deployment by ~7 weeks, T1) that
the policy-pin commit is the wrong build input for the *deployed* implementations. A build
from the pinned tree would produce an expected hash that CANNOT match honest reality —
manufacturing a guaranteed false alarm and training operators to distrust the tool.

**The class.** A repo commit pinned for *policy authority* (addresses, intended config) and
the tree a contract was *built from* are different objects that happen to live in one
history. Deployed bytecode binds to the deploy-vintage tree: its exact dependency lockfile,
its compiler settings **at that date**, its metadata mode (ipfs CBOR embeds keccaks of every
source byte including node_modules). Any expected-hash recipe phrased as "compile the
pinned commit" silently assumes the two coincide; they usually don't.

**The rule.** (1) Expected-hash derivation runs on the deploy-vintage tree, located by
repo-history evidence only (address-introduction commits, in-repo deploy scripts/testimony)
— never by reading the chain (D-006 / circular-verification). The policy-pin commit CITES
the vintage tree in the manifest's provenance block. (2) **Anti-fitting rule:** the
candidate tree and every derivation input are committed to the derivation record BEFORE the
engine compares expected to observed. A mismatch is a reviewable finding; re-deriving from a
different commit is a documented revision with rationale — never a silent retry-until-match,
which is observation-seeded expected-state wearing a lab coat.

**Teeth.** The manifest's provenance block for each identity target must carry
`derivationTree` (commit SHA) + `derivationRecord` (content hash) fields, and the M2 review
ritual checks that the record predates the first expected-vs-observed comparison. Blueprint
G-01 recipe amendment pending from the originating persona (dossier §7).
