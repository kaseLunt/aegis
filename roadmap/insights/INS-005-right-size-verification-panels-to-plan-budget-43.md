---
id: INS-005
type: insight
title: Right-size verification panels to plan budget - 43-agent swarm burned session cap mid-verify
status: active
informs: [D-006]
review_when: date:2026-08-05
updated: 2026-07-22
---

# INS-005 — Right-size verification panels to plan budget

W2's adversarial review ran 4 finder lenses x 3-skeptic verification per finding = 43
agents (~2M tokens). It found real defects (P1 fail-open, P2 environment gap), but 27 of
36 verifier agents died on the session usage cap mid-run, leaving 8 candidate findings
UNVERIFIED yet labeled "refuted" (empty refutation arrays — an artifact of the
majority-refute rule when all votes error out). Cost: the owner's entire plan window.

## Standing consequences
- Panel outputs must distinguish "refuted by votes" from "no votes arrived" — an empty
  refutations array is NOT a refutation. Any future workflow script must fail loudly
  (or re-queue) when a finding's verifier quorum never formed.
- Scale review panels to findings, not lenses: run finders first, triage severity, then
  verify only P0-P2 candidates with panels; P3s get one inline check by the orchestrator.
- Inline verification by the main session (which already holds full code context) is
  often cheaper AND stronger than fresh-context skeptics for repo-local claims; reserve
  swarms for claims needing independent blind reproduction.
- Verifier agents MUST clean up scratch files; W2's panel left 3 behind in tests/ (one
  probe would have executed under `npm test`). A doctor rule or .gitignore pattern for
  `tests/scratch-*`/`tests/_*` would catch the class mechanically.
