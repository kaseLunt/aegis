---
id: D-b4ab3c69-c110-4d78-bc4c-f9a332489db4
type: decision
title: "Codex approval gates complex work — review must converge before any approval"
status: accepted
approved_by: klunt (2026-07-23, hardening directive)
date: 2026-07-23
supersedes: [D-b6eb77f1-c87b-40f2-99f8-df2c1411c9a5]
updated: 2026-07-23
---

# D-b4ab3c69 — Codex approval gates complex work — review must converge before any approval

Owner directive (2026-07-23): "complex work should never be approved until codex
approves." This supersedes and HARDENS the senior-reviewer decision: a Codex review
happening is no longer sufficient — complex work may not be approved until the review
loop has CONVERGED to an approving verdict.

## The hardened rule

For work in scope (below), none of the following may happen until Codex reports no open
findings at the current HEAD (all findings CLOSED/CONFIRMED, or an explicit ship-ready
verdict):
- the achieved stamp / evidence receipt minting for the work item;
- a phase or milestone exit that depends on it;
- presenting the work to the owner as done.

Convergence means iterating: full review → TDD disposition of every finding → SCOPED
re-verification of the closures → repeat until a pass returns clean. A DECLINED
disposition is valid only with recorded rationale that a subsequent Codex pass assessed
as sound. Local green tests are necessary but never sufficient — the W4 case study
below is the standing proof.

## Scope (unchanged from the superseded decision)
- Any spine/engine change other capabilities depend on (W1–W5 and successors);
- security- or trust-sensitive logic (manifest trust root, quorum/independence,
  evidence integrity, the control plane itself);
- milestone/phase exit gates and anything changing a canonical result or its schema;
- a finding or fix whose correctness is not obvious from a single reading.
Trivial, mechanical, or already-independently-verified changes remain exempt.

## Standing practice (carried forward, plus convergence)
- Route through the codex-reviewer agent (dispatch + poll); frame briefs as
  correctness / specification-conformance review, never security-evasion vocabulary
  ([[INS-004]], INS-2e302d28); on a terminal moderation block, fall back to a fresh
  same-vendor reviewer.
- Every confirmed finding is reproduced as a failing test first, then fixed;
  dispositions live under roadmap/reviews/.
- The owner may explicitly waive convergence for a named item, recorded in the work
  file — silence is never a waiver.

## Why (W4 case study, 2026-07-23)
The first Codex pass found 4 P0 + 5 P1 against a 297/297-green suite (including a path
to a false pass and ABI selection on an unapproved upgrade). The scoped verification
pass then found four MORE high residuals in the fixes themselves (orphaned-block
canonicality, transcript forgery, pass-despite-unassessed-freshness, format-only
manifest binding). Convergence took three passes. Under the superseded rule, W4 could
have been stamped after pass one's dispositions; under this rule it cannot.

## Consequence
Codex convergence is a hard gate in the definition of done for complex work, alongside
doctor/selftest/product gates. An item awaiting convergence is "in review", never
"done pending review".
