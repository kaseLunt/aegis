---
id: D-b6eb77f1-c87b-40f2-99f8-df2c1411c9a5
type: decision
title: "Codex is the senior cross-vendor reviewer for load-bearing work"
status: superseded
superseded_by: D-b4ab3c69-c110-4d78-bc4c-f9a332489db4
approved_by: klunt (2026-07-22, senior-reviewer directive)
date: 2026-07-23
supersedes: []
updated: 2026-07-23
---

# D-b6eb77f1-c87b-40f2-99f8-df2c1411c9a5 — Codex is the senior cross-vendor reviewer for load-bearing work

Owner directive (2026-07-22): use Codex as the senior reviewer anywhere the work
warrants it. This ratifies and broadens [[INS-002]] (route adversarial and clean-room
verification to a second model family) from a set of specific roles into a standing
default: for load-bearing work, a Codex cross-vendor pass is the senior review, not an
optional extra.

## Scope — work that warrants a Codex senior review
- Any spine/engine change that other capabilities depend on (W1–W5 and successors);
- security- or trust-sensitive logic (manifest trust root, quorum/independence, evidence
  integrity, the control plane itself);
- adversarial verification and clean-room reproduction (INS-002 roles);
- milestone/phase exit gates and anything that changes a canonical result or its schema;
- a finding or fix whose correctness is not obvious from a single reading.
Trivial, mechanical, or already-independently-verified changes do not require it.

## How to run it (standing practice)
- Route through the `codex-reviewer` agent (dispatch + poll to completion); review BEFORE
  the achieved stamp so there is no re-attestation churn (the W2→W3 lesson).
- Frame briefs as correctness / specification-conformance review, not attack/exploit
  language — the provider moderation layer false-positives on security-evasion vocabulary
  ([[INS-004]], [[INS-006]]). On a terminal moderation block, fall back to a fresh
  same-vendor reviewer rather than retrying verbatim.
- Every confirmed finding is reproduced as a failing test first, then fixed (repo TDD
  discipline); dispositions are recorded under roadmap/reviews/.

## Consequence
Codex senior review is a definition-of-done input for load-bearing work items, alongside
the doctor/selftest/product gates. Its absence on such an item is a gap to close, not a
default-acceptable state.
