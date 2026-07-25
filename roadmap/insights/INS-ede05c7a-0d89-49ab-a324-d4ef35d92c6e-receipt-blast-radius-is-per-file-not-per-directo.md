---
id: INS-ede05c7a-0d89-49ab-a324-d4ef35d92c6e
type: insight
title: "Receipt blast radius is per-FILE, not per-directory — derive it by running the doctor"
status: candidate
informs: [W0G, W0H, W5, W6]
review_when: date:2026-08-08
updated: 2026-07-25
---

# INS-ede05c7a — Receipt blast radius is per-FILE, not per-directory

## Context

Three times in one session, the number of evidence receipts a change would invalidate was
predicted wrong, each time by a different route:

| Occasion | Predicted | Actual | Why the prediction failed |
|---|---|---|---|
| W5 S0 (`manifest/trust.ts`) | W4 only | W2 **and** W4 | `trust.ts` is W2's own *deliverable*, not merely something W4 lists |
| W0G defect 2 (`roadmap/tools/`) | 7 | 5 | Counted items that *list* the path, not items holding a **live `recorded`** receipt |
| W0H (`roadmap/tools/`) | 5 | **6** | Reused W0G's corrected number for a change touching a *different file set* |

The third failure is the instructive one, because the "5" was itself a correction — carefully
derived, written down, and **correct in its original context**. Reusing it felt like learning
from the record. It wasn't.

## Evidence

`invalidated_by` entries are per-path, and they are not all globs:

```yaml
# W0 — narrow, two specific paths
invalidated_by:
  - roadmap/tools/doctor.py
  - .githooks/**

# W0A / W0B / W0D / W0E / W0F — the whole directory
invalidated_by:
  - roadmap/tools/**
```

So two changes both truthfully described as *"a change under `roadmap/tools/**`"* have different
blast radii:

- **W0G defect 2** touched `_control_plane.py` + `selftest.py` -> misses W0's narrow list -> **5**.
- **W0H** also edits `doctor.py` -> hits W0's narrow list -> **6**.

"Under `roadmap/tools/**`" is a statement about the *directory*. The invalidation set is a
function of the exact **file list**.

## Consequence

**Do not predict the set. Derive it.** Make the edit in the working tree, then run both:

```text
python roadmap/tools/doctor.py                   # names every invalidated receipt
python roadmap/tools/doctor.py --snapshot HEAD   # proves the COMMITTED state is still clean
```

The doctor already computes this exactly from `contract_fingerprint` + `input_fingerprint`. It
costs one command and cannot be wrong about its own rule, whereas the estimate has now been wrong
three times out of three. This is [[D-004]]'s *verify by re-running, not re-reading* applied to
planning: a **cost estimate deserves a real run too**.

The `--snapshot HEAD` half matters as much as the first. It separates "my uncommitted edits
invalidated these" from "these were already stale" — exactly the ambiguity that makes a mid-chain
doctor-red commit hard to reason about safely.

### Corollaries

- Each stale receipt is reported **twice** per doctor run, so halve the error count before quoting
  a receipt count. W0H showed `12 error(s)` for 6 receipts.
- A work item with a *narrow* `invalidated_by` is cheaper to invalidate than one with a glob.
  Narrowing a basis at authoring time is a real cost-reduction lever, not just bookkeeping.
- When a prior note states a count, treat it as scoped to the change it described. Carry forward
  the **method**, never the number.

## Where the wrong number still stands, and why it was left there

[[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]]'s Consequences section says **five** (W0A, W0B, W0D,
W0E, W0F). The real figure for that change is **six** — it also invalidates W0. That text is NOT
being corrected, and the reason is itself worth recording: the scope gate refused the edit with

```text
immutable lifecycle record may only transition to superseded
```

An `accepted` decision is immutable. The owner ratified that document *with* that number in it,
so editing it after approval would change what was approved — which is exactly what
`approved_by:` is supposed to make impossible. Superseding an entire decision to fix an
arithmetic error in a cost estimate is disproportionate, so the correction lives here and in
[[W0H]]'s hazards instead.

**Read the pairing as:** the decision records what was approved; the work item and this insight
record what turned out to be true. When they disagree on a derived figure, the derived figure
here is the one to trust — and better still, re-derive it with a doctor run.
