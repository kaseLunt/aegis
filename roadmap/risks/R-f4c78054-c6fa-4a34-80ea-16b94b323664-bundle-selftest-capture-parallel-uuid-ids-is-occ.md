---
id: R-f4c78054-c6fa-4a34-80ea-16b94b323664
type: risk
title: "Bundle selftest capture:parallel-uuid-ids is occasionally flaky (parallel UUID timing)"
status: open
informs: [W0F]
review_when: date:2026-08-06
updated: 2026-07-23
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

owner: klunt · review_when: date:2026-08-06
