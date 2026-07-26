# Codex adversarial review — research wave 1 (verbatim)

Review `review-ms25esga-ume702`, 2026-07-26, pinned at `b911582`, base `00fe8eb`.
Session 019f9fbf-4344-7f11-9f78-aa594207bed2. Gates promotion of the four wave-1 drafts.

**Overall: needs-attention. Per-document:** route-manifest **PROMOTABLE-WITH-CORRECTIONS**
(address/EID/DVN/confirmation/rate-limit/delay values spot-checked CLEAN); evidence-custody
**NOT-PROMOTABLE** (CUSTODY-SOUND unsupported); rewind-selection **NOT-PROMOTABLE**
(causal-edge, supersession, candidate rulings unsafe); rehearse-selection **NOT-PROMOTABLE**
(R1/R2 remain leads; MultiSendCallOnly and Tenderly findings CONFIRMED; the 8→1 accusation
and the isolation proof do not hold).

## Findings

- **[P1] Identity-target census omits two Endpoint deployments** (blueprint.md:24). "Six
  identity-bearing contracts" but the set is eight chain-scoped targets; S2 never enumerates
  the two EndpointV2 target records; line 202 repeats "all six". `trust.ts:32-39,177-186`
  requires per-target chain-specific address + runtime hash; `ENGINEERING_SPEC.md:631`
  requires endpoint identity. Fix: correct the count; add explicit ETH + OP EndpointV2 rows,
  each with its own G-01 gap.
- **[P1] G-01 closing recipe crosses the expected/observed role boundary** (blueprint.md:164).
  Letting an observed-side lane's `eth_getCode` hash seed the expected value is the
  circular-verification class the document itself forbids; separation between people does not
  create independent acquisition provenance. Fix: expected runtime hashes derive reproducibly
  from independently reviewed pinned build artifacts; the observed lane separately hashes
  block-pinned bytes without supplying the expected value.
- **[P1] "CUSTODY-SOUND" exceeds what the pipeline supports** (custody-chain.md:100). Any
  editor can recompute self-hashes and `runVerification` unconditionally emits "Evaluated
  from reviewed recorded fixtures" (`engine.ts:250-251`) with no approved-digest binding;
  reports are also emitted for untrusted/invalid manifests (`engine.ts:177-210,262-278`).
  Fix: verdict becomes BROKEN-AT for the current "reviewed fixture" assertion; describe
  inputs as internally self-consistent recorded bytes; condition manifest language on
  `policyTrust.state`.
- **[P1] GUID-only causal-edge design does not match LayerZero destination events**
  (wr4-ruling.md:120). `PacketVerified(Origin, receiver, payloadHash)` and
  `PacketDelivered(Origin, receiver)` carry no GUID; the join must run over source encoded
  packet ↔ destination `Origin`/receiver/nonce/payloadHash with GUID recomputation as
  validation; "only" is unsupported; pin the upstream commit.
- **[P1] Supersession cannot preserve a report hash while adding a limitation**
  (wr4-ruling.md:176). Limitations are inside the hashed payload (`canonical.ts:568,652-659`).
  Fix: external additive supersession record, or a new report with a new hash superseding the
  original; test both identities.
- **[P1] Candidate 5 disqualified by an assertion the sibling blueprint defines**
  (wr4-ruling.md:56). Blueprint S7 defines `proxyAdmin + proxyAdminOwner`; WR2:67 supplies
  the relationship. Fix: withdraw that disqualifier; reassess Candidate 5 against planned S7,
  keeping the archive/ABI/historical-applicability blockers separate.
- **[P1] The 8→1 accusation is not faithful to WR5's text** (wr5-ruling.md:17-19). WR5 says
  the result "includes" nonce 714 and discloses the SecurityUpgrade-shaped executions at
  :434-443 with reasons for setting them aside. Fix: state the fresh probe returned eight;
  provide an eight-row disposition ledger; characterize WR5's defect as insufficient
  per-result accounting, not a claimed count.
- **[P1] R1's "clean isolation" relies on the method the same document proves unsound**
  (wr5-ruling.md:80 vs :122,:133). `ENGINEERING_SPEC.md:703-706` requires trace/state-diff
  or checkpoint + no-later-write proof. Fix: relabel R1 isolation `unknown`; gate selection
  conditional on storage/trace-level proof.
- **[P2] Custody audit misstates raw-result disagreement semantics** (custody-chain.md:36).
  `quorum.ts:115-124`: raw hashes differ + decoded values agree → `unknown` with
  `raw_result_mismatch_decoded_match`; only other raw disagreements → `conflict`. Fix: exact
  two-branch behavior, cite `quorum.ts:111-124`.

## Next steps (from the review, verbatim in substance)

Correct the census and G-01; downgrade the custody verdict and claim language; redesign W6
supersession linkage; rework the WR4 LayerZero join and Candidate 5 disposition; replace the
WR5 headline with a complete eight-result ledger and prove R1 isolation at storage/trace
level; keep all four documents draft until corrections receive another adversarial pass.
