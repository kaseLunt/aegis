# External audit #2 — Codex audit of the control plane itself (2026-07-22)

Owner-commissioned; delivered via owner. Every actionable claim was independently
verified against the repo before disposition (selftest run, scope_diff run, code read,
git state inspected). Verdict at audit time: control plane materially better but RED.

## Dispositions

| Audit finding | Verified | Disposition |
|---|---|---|
| Selftest 1/29 failing: `A:active-requires-achieved-deps` depends on live W1 being unachieved; W1 achieving made the mutation vacuous → W0E stale-green while 4 CI runs red | ✓ reproduced | FIXED — mutation now fabricates a fully synthetic dependency pair (WTESTDEP committed + WTEST2 depending on it); class rule recorded: fabrications never reference live work-item IDs. 30/30 selftests. |
| W0E claims duplicate-effective-path rejection; `doctor.py` declared `effective_paths = {}` and never used it | ✓ dead code | FIXED — doctor now computes each active lane's effective paths (claim-narrowed else task-declared) and errors on cross-agent overlap (`dir/**` subtree domains + exact-path terminator). Negative-tested by new `A:lane-path-overlap-rejected` mutation with fully synthetic tasks+claims. |
| Next push guaranteed red: committed claim task changed W2→W3 without `AEGIS-OWNER-APPROVED` in the range | ✓ scope_diff FAIL locally | OWNER-GATED — marker is an owner-approval attestation; queued in STATUS Blockers. The transition itself was the designed lifecycle (W2 achieved → claim released → W3 opened); what's missing is the audit-trail marker. |
| CI runs scope review after selftest, so scope review skipped in all red runs | ✓ workflow read | OWNER-GATED — .github/** is W0E surface (outside W3 allowed_paths) and CI/CD edits are confirm-first; fix (`if: ${{ !cancelled() }}` on scope-review steps) queued with the marker commit. |
| Untracked orphaned archive claim (claim transition/archival not atomic) | ✓ | Archive file committed now (durable); atomicity itself → R-005 item 5. |
| STATUS said 🟢 while selftest + 4 remote runs red | ✓ | FIXED — STATUS Health 🔴 with reasons until required checks pass; owner items in Blockers. |
| Author name "Review Test" on 25 commits (audit tool's own config accident; email always correct; config since restored by auditor) | ✓ 25/5 split | OWNER-GATED — rewrite needs force-push + roadmap SHA-reference updates (e.g. f7e6dbd cited in review docs). Recommendation: do not rewrite; name-only defect, identity (email) correct throughout. |
| scope_diff breadth, doctor/gate state-source mismatch, lease/base_commit semantics, worktree/atomicity, deliverable tracking, capture-ID race, doc conflicts, W0C/R-002 disagreement | ✓ spot-checked | DEFERRED with trigger — R-005 (bounded by single-writer model; items 1/2/5 are prerequisites for any second concurrent writer lane). |
| Branch protection absent | ✓ | OWNER action (R-001 residual, now urgent since CI is load-bearing) — in Blockers. |

## Praise-side claims (accepted without re-verification)
Lane isolation fixes real; WR outputs honest; W1/W2 evidence substantial; W3 genuinely
TDD (test-first observed). No action.

## Class lessons
- A gate's selftest must own ALL of its fixture state — any dependence on live roadmap
  objects makes the gate rot silently when the live state legitimately changes.
- "Declared but unenforced" checks are worse than absent ones: W0E's evidence cited a
  check that never ran. A claim in a work item's evidence is only as good as a
  negative test that proves the check fires.
