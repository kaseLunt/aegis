---
id: EV-W0-R6
type: evidence
title: W0 re-attested at the two-tier renewal matcher (Codex round-5 disposition)
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-26T01:45:57Z
tested_commit: 6d25d4ee17590ff4aecd60967ec4f2f40ad45ad3
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:99f683cb06eb3a3f6d1a866cac9bddfce428400110211299e33a56665465caba
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R5]
updated: 2026-07-26
---

# EV-W0-R6 — W0 verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-5 review. Round 5 confirmed the round-4 strike-span
fix and the W0D contract re-basis, then found the residue: the semantic renewal matcher ran
only on NARRATIVE surfaces (so natural phrasing would pass in AGENTS.md while failing in
STATUS.md), and passive phrasing ("Active claims must be renewed before committing.") bypassed
both matchers. `RETIRED_RENEWAL_RE` now gains a passive pattern and runs on BOTH tiers --
standing surfaces with NO strike exemption (pure-instruction files carry no historical
narrative), narrative with the per-match exemption. Three new selftest cases, each observed
RED against the round-4 guard using Codex's own bypass examples (standing-active in AGENTS.md,
standing-passive in CLAUDE.md, narrative-passive in STATUS.md); all six prior cases stayed
green; nine instructional cases total. A [low] finding was also fixed: W0D's charter note had
called superseded EV-W0D-R6 "the current attestation" -- it now points at the item's
`evidence_receipts` frontmatter, which cannot rot on supersession.

Codex round-5 could again not run selftest in its sandbox (no writable temp directory,
disclosed in its report); the selftest evidence here is local runs at `tested_commit`.

W0's basis moved through `doctor.py` (its narrow `invalidated_by`). Additive only; the unified matcher ran with ZERO hits on the live repo at `tested_commit`.

`contract_fingerprint` is byte-identical to EV-W0-R5's. Only `input_fingerprint` moved.
