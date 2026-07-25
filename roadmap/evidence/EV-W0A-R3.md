---
id: EV-W0A-R3
type: evidence
title: W0A verification re-attested at the R-006 path-containment fix
status: superseded
superseded_by: EV-W0A-R4
work: W0A
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-25T02:35:56Z
tested_commit: 36a35ef34f09e4bab5a159ad83b9bea4ecd6bb2f
contract_fingerprint: sha256:e28793b93d049331cf902bac646d8073443c9d3f2ac20ad9ed405542f7d1a93d
input_fingerprint: sha256:93f7714bbe1ecb3e59d36cfb00f5dd653e349e4059902bee44a4e9a43f90b857
environment: python 3.13 (win32-x64), git 2.x, local
supersedes: [EV-W0A-R2]
updated: 2026-07-25
---

# EV-W0A-R3 — W0A verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0 failing**
(43+ mutation cases, including the two added by this change), and `doctor.py` -> **OK, 0 errors**
once this receipt set is complete. The doctor's only complaint beforehand was the staleness that
this receipt set itself resolves, which is the self-referential step the re-attestation recipe
exists to walk ([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0A's basis moved because `roadmap/tools/**` is in its `invalidated_by` and the R-006 fix
changed `_control_plane.py` and `selftest.py`. W0A attests ladder-drift and handoff doctor checks, the pre-commit scope gate, one-command capture; none of that behaviour
changed. What changed is strictly narrower and strictly safer:

- `normalize_repo_path` now rejects a **drive-qualified segment** (`roadmap/C:/x`). It
  previously rejected only a LEADING drive, and on Windows `Path(root) / "C:"` discards the
  root — so this closes a containment escape at the boundary instead of catching it downstream.
  The new selftest case `primitive:drive-qualified-segment-rejected` FAILED against the old
  code, so the hole was real, not theoretical.
- `safe_worktree_path` proves containment with `os.path.normcase`/`normpath` string comparison
  instead of `Path.resolve()` + `relative_to`. The property is structural (`current` IS
  `root / parts`, with traversal, empty segments, drive segments and symlinked components all
  rejected), so the filesystem round-trip added no safety — only a race. Pinned by
  `primitive:containment-holds-without-filesystem-resolve`, which asserts both directions.

`contract_fingerprint` is unchanged from EV-W0A-R2: W0A's declared contract did not move.
Only `input_fingerprint` did, which is what an input re-basis should look like.

Net effect on this item's own guarantees: the gates W0A installed now also fail closed on a
drive-qualified segment, and stop failing OPEN-ended-ly on a filesystem race that had begun
blocking pushes ([[R-f4c78054-c6fa-4a34-80ea-16b94b323664]]).
