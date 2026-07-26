# Codex confirmation review — wave-1 corrections (review-ms26cg2y)

2026-07-26, pinned 895a8d8, base 5b88eaa. Session 019f9fd7-38ed-79e3-9033-739072a79ea6.
Verdict: needs-attention -- 6/9 original findings CLOSED, 3 OPEN.

CLOSED: Endpoint census; custody claim strength; GUID->channel-tuple join (provisional,
verified against LayerZero EndpointV2 events/PacketV1Codec/GUID libs, gated on G12 pinning);
8->1 retraction + eight-row ledger (internally PASS at research grade; source response not
archived for independent replay); R1 isolation relabel; quorum two-branch semantics.

OPEN (the round-3 work, with fixes named by the reviewer):
1. [high] blueprint G-01: the first_observation_baseline fallback is UNENFORCED -- trust.ts
   has no such typed class; expectedRuntimeCodeHash remains mandatory and evaluates as the
   normal identity predicate, so an observation-seeded hash still reaches pass/fail and ABI
   selection. Fix: remove the fallback from manifest-grade G-01; identity stays unknown and
   ABI-dependent cells stay blocked when build provenance is unavailable; a drift-only
   baseline needs a canonical typed schema + tests proving it cannot authorize ABI selection.
2. [high] wr4 supersession: SupersessionRecord defines neither affectedArtifacts in its
   schema nor a content-hash/normalization; a bare hash test proves neither chronology nor
   no-backdating. Fix: complete the schema, domain-separated canonical bytes + content hash,
   anchor in an append-only/approved register, and split the tests (immutability /
   in-payload mutation / anchored-record tamper rejection / ordering).
3. [high] wr4 Candidate 5: the temporal disqualifier cites reference-code-identity.json's
   chainId-1 window against an Optimism block; checkApplicability only applies same-chain
   bounds. Fix: reframe as "no reviewed chain-10 route-manifest window exists"; keep C5
   conditional until a historical OP window is authored.

Per-document verdicts: blueprint PROMOTABLE-WITH-CORRECTIONS; custody-chain PROMOTABLE;
wr4 NOT-PROMOTABLE; wr5 PROMOTABLE. All four remain research inputs only; INFERRED/probe
material stays quarantined from manifest-grade use.
