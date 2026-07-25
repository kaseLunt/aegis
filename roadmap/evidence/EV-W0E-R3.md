---
id: EV-W0E-R3
type: evidence
title: W0E verification re-attested at the R-006 path-containment fix
status: superseded
superseded_by: EV-W0E-R4
work: W0E
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
observed_at: 2026-07-25T02:35:56Z
tested_commit: 36a35ef34f09e4bab5a159ad83b9bea4ecd6bb2f
contract_fingerprint: sha256:716684b2eeb35083e9a1cb59ed4134387333121bdc36f5ac19cfbe9ea19d189c
input_fingerprint: sha256:7d9ec3e566d692701ec68d021ad10f14583e2f07f1db6ca42f190e758efd2a67
environment: python 3.13 (win32-x64), git 2.x, local
supersedes: [EV-W0E-R2]
updated: 2026-07-25
---

# EV-W0E-R3 — W0E verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0 failing**
(43+ mutation cases, including the two added by this change), and `doctor.py` -> **OK, 0 errors**
once this receipt set is complete. The doctor's only complaint beforehand was the staleness that
this receipt set itself resolves, which is the self-referential step the re-attestation recipe
exists to walk ([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

W0E's basis moved because `roadmap/tools/**` is in its `invalidated_by` and the R-006 fix
changed `_control_plane.py` and `selftest.py`. W0E attests the cooperative-gate closures from the second external review; none of that behaviour
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

`contract_fingerprint` is unchanged from EV-W0E-R2: W0E's declared contract did not move.
Only `input_fingerprint` did, which is what an input re-basis should look like.

Net effect on this item's own guarantees: the gates W0E installed now also fail closed on a
drive-qualified segment, and stop failing OPEN-ended-ly on a filesystem race that had begun
blocking pushes ([[R-f4c78054-c6fa-4a34-80ea-16b94b323664]]).
