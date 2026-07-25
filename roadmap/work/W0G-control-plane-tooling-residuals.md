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
updated: 2026-07-25
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
### 2a-bis. Reproduction attempts 2026-07-25 — findings that narrow it sharply
Two probes were run (standalone scripts, deleted after; the real repo was never modified):

**Finding 1 — the 8.3 short-path theory is DISPROVEN.** `tempfile.gettempdir()` here is
`C:\Users\kasel\AppData\Local\Temp` with no `~` short-name component, `Path(td).resolve()`
equals `td`, and `resolve(strict=False)` on a NON-existent deep child agrees with the resolved
root. So short-name expansion is not the mechanism.

**Finding 2 — it does NOT reproduce in isolation: 20/20 clean.** Building the synthetic repo
with `selftest.build_candidate` and running the 8 parallel `new.py` invocations twenty times in
a fresh temp dir produced zero failures. The flake therefore depends on the FULL selftest run
context (many prior phases, thousands of files created under one temp root), not on the
parallel capture alone. That is consistent with transient filesystem interference — a Windows
`_getfinalpathname` failing under concurrent I/O or a scanner touching the tree, which sends
`Path.resolve()` down its fallback branch — rather than anything wrong with the path arithmetic.

**Finding 3 — you CANNOT instrument the tools inside the synthetic repo.** Patching
`repo/roadmap/tools/_control_plane.py` in the candidate makes it a modified PROTECTED surface,
so `scope_diff` correctly demands owner approval and the unrelated case
`owner:routine-capture-needs-no-owner-token` fails instead. The gate is right; the probe was
wrong. Next attempt should instrument WITHOUT touching repo files — e.g. a `sitecustomize.py`
on `PYTHONPATH` that wraps `pathlib.Path.resolve` to log arguments and results, since
`sitecustomize` is imported before the target script and needs no file in the repo.

**Candidate fix, independent of the transient trigger.** The final
`resolved.relative_to(root)` is a FILESYSTEM round-trip used to prove a property that is
already structural: `current` is literally `root / parts`, `normalize_repo_path` rejects `""`,
`.` and `..`, and the loop rejects a symlink or junction at every component. A check that can
fail spuriously under I/O pressure has turned a robustness guard into a liveness bug. Replace it
with pure string containment (`os.path.normcase` + `os.path.normpath`, no filesystem access) —
BUT first make `normalize_repo_path` reject absolute or drive-qualified segments, because
`Path("C:/a") / "C:"` yields `Path("C:")`: `/` with an absolute right-hand side REPLACES the
root, and catching that is the one thing the `resolve()` currently earns its keep for. With that
rejection in place, string containment is exact and race-free, and no security property is lost.

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

## Status 2026-07-25 — defect 2 SHIPPED, defect 1 still open

**Defect 2 (the R-006 race) is FIXED at 36a35ef** and its risk is closed. Reproduction was
never achieved; the fix came from reading the code instead, and is trigger-independent:
containment is now string math rather than a filesystem round-trip, which is sound only
because the same change closed the drive-qualified-segment escape that `resolve()` was
genuinely catching. Two selftest cases, the first negative-tested against the pre-fix code.
Evidence: 10 consecutive clean full selftest runs. Receipts EV-W0A-R3, EV-W0B-R3, EV-W0D-R3,
EV-W0E-R3, EV-W0F-R3.

**Correction to this item's own cost estimate:** it claimed SEVEN receipts. The real number was
FIVE — W0 and W0C carry no live `recorded` receipt on this basis (W0C is now archived outright).
The estimate came from counting work items that *list* `roadmap/tools/**` rather than asking
which have a live receipt to invalidate. Same error class as the W2/W4 miscount earlier: count
what is actually bound, not what is nominally in scope.

**Process irregularity, recorded rather than hidden:** this landed under the W5 claim, whose
`allowed_paths` do NOT include `roadmap/tools/**`. It was authorized by the owner running
`git commit --no-verify` on a prepared commit, which skips the scope gate. That is the
documented owner bypass and the reason was sound (the flake was blocking pushes), but the tidy
route would have been to park W5 and activate W0G first. Noted so the pattern is not copied
casually.

**Defect 1 (worktree eol/control-char snapshot reading) remains OPEN** and is now the whole of
W0G's remaining scope. Doing it later means paying a second receipt round — accepted knowingly,
because bundling it into the same change would have meant editing fingerprint computation while
the receipts were mid-flight, and a wrong fingerprint rule is far worse than a second
re-attestation. The interim mitigations stand: `tests/repo-source-hygiene.test.ts` covers
source trees, and the manual LF/control-byte check before any stamp
([[INS-5931d8f8-d494-4cb5-b147-c7fd9e6ffaab]]).

