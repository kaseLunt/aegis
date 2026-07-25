---
id: R-f4c78054-c6fa-4a34-80ea-16b94b323664
type: risk
title: "Bundle selftest capture:parallel-uuid-ids is occasionally flaky (parallel UUID timing)"
status: closed
informs: [W0F]
review_when: date:2026-08-06
updated: 2026-07-25
---

# R-f4c78054-c6fa-4a34-80ea-16b94b323664 — Bundle selftest capture:parallel-uuid-ids is occasionally flaky (parallel UUID timing)

The upgraded bundle's mutation selftest includes `capture:parallel-uuid-ids`, which
exercises new.py generating unique ids under parallel invocation. It failed once during
W0F close-out and passed on the next four consecutive runs, so it is intermittently
flaky (likely a timing/collision sensitivity in the parallel-capture harness rather than
a real defect in id generation).

## Bounding
- Not a control-plane correctness gap: the doctor and the other 40+ selftests are stable;
  the flaky case is a test-harness timing issue, not a governance hole.
- Becomes urgent if CI's advisory-runtime-selftest job flakes and masks a real failure.
  Watch for it; if it recurs in CI, make the parallel-capture test deterministic (seed or
  serialize the id draw) — this is bundle-owned code, so the fix is an upstream report or
  a documented local patch under W0F's tool scope.
- 2026-07-23 recurrence log: now 5+ sightings in one session (full-selftest run during the
  historical-receipt fix; W4 slice-3 pre-push gate; and the W4 pass-9→10 STATUS push —
  blocked one push, passed on the immediate retry). Failure text each time: `capture: FAIL
  -- capture target: destination escapes repository root` from one of ten parallel new.py
  invocations — points at a path-resolution race on Windows, not id collision. Flake rate
  is high enough to sting: fix it BUNDLED WITH THE NEXT roadmap/tools/** change so the six
  tool receipts' re-attestation is paid once (see INS-58ac6162 for the recipe). Standing
  operational rule until then: a red on this one check is retried ONCE; a second
  consecutive red is treated as real and halts.

## Root cause identified (2026-07-24, W5 S0/S1 boundary)
The "parallel UUID timing" framing in the title is WRONG and has misdirected every reader
since. The recurrence log's own failure text is the answer: `capture: FAIL -- capture target:
destination escapes repository root`, emitted by `safe_worktree_path` in
`roadmap/tools/_control_plane.py`. This is a **path-resolution race under concurrency on
Windows**; `new.py` id generation is not implicated at all. Fix the path resolution and correct
this record's title at the same time.

Scheduled: [[W0G]] bundles this with the worktree eol/control-char snapshot fix
([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]] item 4), because any `roadmap/tools/**` change
invalidates SEVEN work-item receipt bases (W0, W0A, W0B, W0C, W0D, W0E, W0F) on an owner-gated
protected surface — so the re-attestation is paid once, deliberately, as this record already
instructed. Standing retry-once operational rule stays in force until W0G lands.

## ESCALATION 2026-07-25: the retry-once rule is no longer sufficient
Two CONSECUTIVE reds on `git push` immediately after the W0G triage commit — the standing
"retry once" rule was applied exactly as written and did not clear it. Per that same rule a
second consecutive red is treated as real, so the push HALTED and was not bypassed.

Evidence gathered at the halt:
- Failure is byte-identical to every prior sighting: `capture: FAIL -- capture target:
  destination escapes repository root`, from `safe_worktree_path`.
- It is NON-DESTRUCTIVE: the harness cleans up after itself (`git status` clean, no stray
  `roadmap/ideas/IDEA-*-same-title.md` left behind), so a failed run leaves no residue.
- The doctor is green (0 errors) and the product suite is 374/374 at the same tree, so nothing
  else corroborates a real defect.
- **Platform-bound:** the same `Advisory candidate selftest` is a REQUIRED CI check and it
  passed on the Linux runner for this exact tree (run 30138208996). The race is Windows-local.
  Consequence for the owner's decision: bypassing the LOCAL pre-push hook does not skip the
  check — CI re-runs it authoritatively on a platform where the race does not occur, which is
  precisely the "hooks nudge, CI gates" split in SYSTEM.md.

This fires the escalation trigger already written into the Bounding section above ("becomes
urgent if ... flakes and masks a real failure"): it is now blocking pushes outright, not merely
stinging. [[W0G]] was filed as `candidate` for after W5 on the assumption that the retry-once
rule covered the gap; that assumption is now falsified and the sequencing should be revisited.

### Flake rate observed at the escalation (useful for reproduction)
The THIRD push attempt passed, with no bypass used at any point. So in that window the local
Windows failure rate was roughly two in three, and the gate is not deterministic in either
direction. Two consequences: (a) W0G's reproduction loop should hit the failure within a few
iterations rather than needing a long soak; (b) a single green local selftest is NOT evidence
the race is fixed — W0G's acceptance must run the case enough times to bound the rate, which is
why its acceptance says "run the case enough times to bound the flake, not once".
For the record, the halt was honoured: after the second consecutive red the push was stopped and
investigated rather than retried blindly, and the attempt that finally succeeded carried new
commits (the escalation record and the W0G diagnosis), not a bare re-run.

## CLOSED 2026-07-25 — root cause fixed at 36a35ef
Not a UUID race and not a test-harness quirk: `safe_worktree_path` proved containment with
`Path.resolve()` + `relative_to`, a FILESYSTEM round-trip establishing a property that was
already structural. On Windows under concurrent I/O `resolve()` can transiently disagree with
itself, so the guard failed closed with "destination escapes repository root" — a robustness
check that had become an intermittent liveness failure.

Fix: containment is now `os.path.normcase`/`normpath` string comparison (no filesystem access,
cannot race). That is only sound because the same change closed the one escape `resolve()` was
genuinely catching — `normalize_repo_path` rejected a LEADING drive but never re-checked split
segments, so `roadmap/C:/x` passed, and on Windows `Path(root) / "C:"` DISCARDS the root. That
segment is now rejected at the boundary. The selftest case for it FAILED against the old code,
so the hole was real and this closure is a net security improvement, not just a de-flake.

Evidence: 10 consecutive full selftest runs, zero failures (soak truncated at a 10-minute tool
limit). The pre-fix rate blocked 4 of ~7 push attempts that day, at which rate 10 clean runs in
a row has probability ~0.4%. Teeth: `primitive:drive-qualified-segment-rejected` (negative-tested
— it fails against the pre-fix code) and `primitive:containment-holds-without-filesystem-resolve`.
Receipts EV-W0A-R3, EV-W0B-R3, EV-W0D-R3, EV-W0E-R3, EV-W0F-R3 re-attest the affected items.

Two hypotheses were tested and DISCARDED first, recorded so nobody re-walks them: 8.3 short-path
expansion, and something specific to the parallel-capture harness (20/20 clean in isolation).
The standing retry-once operational rule is retired with this closure.

owner: klunt · review_when: date:2026-08-06
