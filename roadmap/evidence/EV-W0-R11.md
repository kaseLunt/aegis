---
id: EV-W0-R11
type: evidence
title: W0 re-attested at full session-protocol scan coverage (Codex round-10 disposition)
status: recorded
work: W0
result: pass
commands:
  - python roadmap/tools/doctor.py
observed_at: 2026-07-26T07:36:12Z
tested_commit: 6e24f0598f810e147f47efe98b682c5c53a6ea45
contract_fingerprint: sha256:96ae6b6797356da4bbd9740b0d03219d80b6e45db9ddf13370d78978dced37d0
input_fingerprint: sha256:a4b8988d8da043744228da879755d4401b1c69eace815eea24a3c4b2647b0a06
environment: python 3.13.7 (win32-x64), git 2.x, local
supersedes: [EV-W0-R10]
updated: 2026-07-26
---

# EV-W0-R11 — W0 verification receipt (re-attested)

Honest re-run of the canonical commands at `tested_commit`: `selftest.py` -> **OK, 0
failing**; `doctor.py` -> **OK, 0 errors** once this receipt set is complete
([[INS-58ac6162-b9e8-4e35-b3a0-f7c824fbed94]]).

This round dispositions the Codex round-10 review, which closed the round-9 finding with
full verification (unbounded co-occurrence matches at gap 62, all prior fixtures reject,
history passes, standing files show zero renew stems, all six receipt chains recomputed
exactly) and found the loop's deepest defect at 0.99 confidence: roadmap/ROADMAP.md --
session-protocol-MANDATED reading -- was in NEITHER scan tier, so a directive rejected in
AGENTS.md was silently accepted in the execution ladder. ROADMAP.md now joins the narrative
set (narrative, not standing: future work-item rows may legitimately describe D-007
allocator-lease machinery in their titles). The scan set's completeness criterion is now
articulable rather than enumerative: exactly the session-protocol reading list plus every
live capture directory, with historical directories records-by-construction. One red-first
case with Codex's exact planted directive brings the instructional family to seventeen, all
green. The round-10 verdict was retrieved directly from the completed job state file after
the reviewer agent's poll loop broke; it is quoted from the structured output.

W0's basis moved through `doctor.py` (ROADMAP.md added to the narrative set). Additive; zero live hits.

`contract_fingerprint` is byte-identical to EV-W0-R10's. Only `input_fingerprint` moved.
