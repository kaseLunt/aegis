---
id: EV-W0D-R8
type: evidence
title: W0D re-attested at the two-tier renewal matcher (Codex round-5 disposition)
status: superseded
superseded_by: EV-W0D-R9
work: W0D
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - python roadmap/tools/claim.py list
observed_at: 2026-07-26T01:45:57Z
tested_commit: 6d25d4ee17590ff4aecd60967ec4f2f40ad45ad3
contract_fingerprint: sha256:43801eb64c910d49944012e008fa2a7fe4e70669d62f7b44de8aa187d95613ab
input_fingerprint: sha256:96b61d242b797f21a1e61e0ae54c629af09fdc3dcce5e24836d6a82c108db857
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0D-R7]
updated: 2026-07-26
---

# EV-W0D-R8 — W0D verification receipt (re-attested)

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

Pure INPUT re-basis this time -- the charter-note pointer fix is prose, not contract, and the fingerprints agree (contract byte-identical to R7's post-re-basis value). The R7 scope-reduction record stands.

`contract_fingerprint` is byte-identical to EV-W0D-R7's. Only `input_fingerprint` moved.
