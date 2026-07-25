---
id: W0G
type: work
title: Control-plane tooling residuals — worktree eol/control-char snapshot + R-006 capture race
phase: P1
status: candidate
evidence_target: "Correct + Robust"
priority: 3
depends_on: [W0F]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/tools/**
deliverables:
  - roadmap/tools/_control_plane.py
  - roadmap/tools/selftest.py
evidence_receipts: []
invalidated_by:
  - roadmap/tools/**
review_when: phase:P1:exit
updated: 2026-07-24
---

# W0G — Control-plane tooling residuals

**Why this is its own item and not an inline fix:** measured at the W5 S0/S1 boundary, ANY
change under `roadmap/tools/**` invalidates the receipt bases of **seven** work items — W0,
W0A, W0B, W0C, W0D, W0E, W0F (six achieved, one committed) — because each lists
`roadmap/tools/**` in `invalidated_by`. `roadmap/tools/**` is also an owner-gated protected
surface. So the change costs a protected-surface acknowledgement plus a seven-receipt
re-attestation chain, and [[R-f4c78054-c6fa-4a34-80ea-16b94b323664]] explicitly says to bundle
the fixes so that cost is **paid once, deliberately**. Squeezing it into a product slice would
either pay it twice or leave a protected-surface change half-landed.

## Objective

Land both known tooling defects in one change, with selftest cases for each, then re-attest the
seven affected receipts in a single chain.

### 1. Worktree snapshots read raw bytes instead of git-normalized bytes
`Snapshot.read_bytes` (`roadmap/tools/_control_plane.py`, worktree branch) returns
`target.read_bytes()` — raw filesystem bytes. `snapshot_fingerprint` hashes those, while a
receipt's basis was minted from git BLOBS (LF). A CRLF worktree file therefore fingerprints
differently from its own committed blob even when `git diff` is empty, which is what broke the
W4 stamp ([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]], item 4 of its Consequence list).
Fix direction: for the worktree source only, apply git's own text rule — consult
`git check-attr text -- <path>`, and when the path is text (and contains no NUL) normalize
CRLF to LF before hashing. Index/commit sources already come from blobs and must be left
untouched. Do NOT blanket-normalize: `.gitattributes` is `* text=auto eol=lf`, so genuinely
binary content must keep its bytes.
Consider also rejecting raw control characters in text files, per that insight's addendum — the
product-side tooth (`tests/repo-source-hygiene.test.ts`) only covers `lib/ app/ tests/
components/`, not `roadmap/**` or `data/**`.

### 2a. Code-level hypothesis for the R-006 race (2026-07-25, unverified — reproduce first)
`safe_worktree_path` (`_control_plane.py`) ends with:
```python
root = Path(repo).resolve()
current = root
for part in normalized.split("/"):
    current = current / part          # inherits root's already-resolved form
    ...
resolved = current.resolve(strict=False)
resolved.relative_to(root)            # <-- raises => "destination escapes repository root"
```
The only way `relative_to` can fail here is if `resolved` and `root` disagree on the SAME
prefix, since `current` is built from `root`. On Windows `Path.resolve()` takes different code
paths depending on whether the path EXISTS (it can query the filesystem to expand 8.3 short
names and reparse points) versus not (string normalization only). The selftest runs inside
`tempfile.TemporaryDirectory()`, i.e. under `%TEMP%`, which on Windows is frequently an 8.3
short path — and ten parallel `new.py` invocations mean the target file and its parent
directory flicker in and out of existence WHILE `resolve()` runs. A call that observes a
partially-existing prefix can normalize differently from one that does not, which is exactly a
result that varies run to run on one platform only.
**Do not fix on this hypothesis alone.** Reproduce first: loop the parallel-capture case until
it fails, then print `repo`, `root`, `current`, `resolved` at the failure. Candidate fix shape
once confirmed: compare using `os.path.normcase` on both sides, and/or avoid re-resolving a
path already built from a resolved root (the containment property is structural — `current` is
`root / parts` with traversal already rejected by `normalize_repo_path`, so the final
`resolve()` may be redundant for containment and only needed for the symlink check, which the
loop above already performs per-component).

### 2b. R-006 is a Windows path-resolution race, NOT a UUID collision
The risk title says "parallel UUID timing", but the recurrence log records the actual failure
text every time: `capture: FAIL -- capture target: destination escapes repository root`, from
one of ten parallel `new.py` invocations. That message comes from `safe_worktree_path`
(`_control_plane.py`), so the defect is path resolution under concurrency on Windows — id
generation is fine. Fix the resolution (and update the risk's title//framing, which currently
misdirects the reader). 5+ sightings in one session; it has blocked pushes.

## Acceptance (refine at kickoff)

- Correct: a CRLF worktree checkout of a text file fingerprints identically to its LF blob; a
  binary file's fingerprint is unchanged; ten parallel `new.py` invocations succeed repeatedly
  (run the case enough times to bound the flake, not once).
- Robust: a selftest case per defect, each **negative-tested** at landing — revert the fix and
  watch that exact case go red, per the standing teeth habit.
- Bundle divergence recorded: `roadmap/tools/**` is upstream bundle code
  ([[INS-006]]/[[INS-d9a72207-1aa9-48fb-a0f3-ed6838c96233]]), so both patches must be written
  up for the next bundle sync rather than silently forked.

## Non-goals

- The authoritative-enforcement wiring ([[D-007]]/[[R-005]]) — that needs owner-side hosting
  configuration, not code.

## Canonical commands

```text
python roadmap/tools/doctor.py
python roadmap/tools/selftest.py
```

## Handoff

- next: CANDIDATE — **sequencing revised 2026-07-25: do this FIRST, before W5 S2.** The
  original "after W5" recommendation assumed the retry-once rule covered the flake. It does
  not: two consecutive reds blocked a push that same hour
  ([[R-f4c78054-c6fa-4a34-80ea-16b94b323664]] escalation section). Left unfixed, every
  remaining W5 push is a coin flip that halts an agent and interrupts the owner, which costs
  more in aggregate than the seven-receipt chain does once.
  Start by REPRODUCING the race (§2a) — do not fix on hypothesis. Kickoff must confirm the
  seven-item list is still exactly W0..W0F.
- read_first: [[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]] (both the CRLF body and the
  control-character addendum); [[R-f4c78054-c6fa-4a34-80ea-16b94b323664]] recurrence log;
  [[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]] (the re-attestation recipe, and the precedent
  where six W0-family receipts were re-attested at once).
- hazards: this is a PROTECTED surface — expect a doctor-red mid-chain commit needing owner
  authorization, exactly as W5 S0 did. Do not start it without budget for the full chain; a
  half-landed protected-tools change leaves the doctor red for everyone.

## Evidence

No attained evidence yet.
