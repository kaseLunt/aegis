---
id: W0F
type: work
title: Migrate to upgraded control-plane bundle (receipts, snapshot coherence, writer_mode)
phase: P1
status: active
evidence_target: "Correct + Robust"
priority: 1
depends_on: []
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - AGENTS.md
  - CLAUDE.md
  - .githooks/**
  - .gitattributes
  - .gitignore
  - .control-plane/**
deliverables:
  - roadmap/tools/_control_plane.py
  - .control-plane/receipt.json
evidence_receipts: []
invalidated_by:
  - roadmap/tools/**
review_when: phase:P1:exit
updated: 2026-07-22
---

# W0F — Migrate to the upgraded control-plane bundle

**Why this advances the vision:** the upgraded bundle mechanically closes most of R-005
(snapshot-coherent validation, real lease/base_commit ancestry, claim_id/generation
fencing) and is the foundation D-007's concurrency machinery expects. Owner-approved
2026-07-22 (IDEA-003 promotion; sequencing: before W4 so W4 starts on the new grammar).

## Hypothesis / objective
Adopt the bundle IN FULL per IDEA-003's inventory: replace the six managed tools + add
the shared runtime; convert the full object corpus to the new grammar (section headers,
deliverables, evidence_receipts, claim_id, status vocabularies, STATUS
writer_mode/project_state, new fingerprint format); author HONEST evidence receipts for
all achieved items (re-run canonical commands for W-items; WR lanes' receipts are their
committed research deliverables); regenerate the AGENTS.md managed block preserving
project-owned text; obtain a clean installer receipt; port repo-specific policy that the
bundle does not know (pre-commit identity allowlist R-002, pre-push selftest gate, CI
workflow charter from 9e4d0d8). Historical AEGIS-OWNER-APPROVED markers remain valid
history; the bundle's server-side approval protocol applies forward.

## Acceptance
- Correct: `manage.py plan` reports zero conflicts and a clean receipt exists; NEW
  doctor green on the real corpus (all 88 reconciliation errors resolved, no
  suppressions); NEW selftest suite green; product suite untouched and green; CI green
  remotely with the migrated workflow.
- Robust: the migration lands as one atomic flip commit (old plane valid before, new
  plane valid after — no half-migrated intermediate commit); every achieved item's
  receipt cites a re-run or the committed deliverable it attests; repo-specific policy
  ports are negative-tested where the old plane had teeth (identity allowlist, selftest
  gate).

## Non-goals
- Editing VISION/SYSTEM/RULES (owner-only surfaces; doc alignment with the new system is
  a separate owner pass).
- Activating concurrent-writer mode (D-007 machinery phase; writer_mode stays serial).
- Rewriting historical commit-message markers or re-litigating ratified decisions
  (D-001/D-002 seed collision is resolved by omitting the bundle seeds, not renaming
  our history).

## Canonical commands
```bash
python roadmap/tools/doctor.py
python roadmap/tools/selftest.py
npm test
```

## Handoff
- next: (1) swap tools to exact bundle versions + _control_plane.py; (2) convert corpus
  (11 work headers/deliverables/receipts, 7 claim_ids, 6 status-vocab fixes, 3 updated
  fields, 2 quoting fixes, STATUS writer_mode+project_state, invalidated_by self-path
  additions); (3) author receipts under roadmap/evidence/ (re-run npm test / selftest
  for W-items; WR receipts = committed deliverable paths); (4) re-stamp all fingerprints
  with the new algorithm; (5) managed blocks (.gitattributes/.gitignore markers, AGENTS
  block regen); (6) installer apply for the receipt, seeds omitted; (7) port hooks (keep
  identity allowlist + pre-push selftest alongside/inside bundle adapters); (8) one flip
  commit, new doctor+selftest green pre-commit/pre-push, CI green post-push.
- read_first: roadmap/ideas/IDEA-003 (full reconciliation, 88-error class table);
  C:\Users\kasel\.claude\skills\control-plane SKILL.md + templates; roadmap/reviews/
  control-plane-codex-audit-2026-07-22.md (what our hardening protects — nothing may
  regress).
- hazards: the OLD doctor runs at pre-commit until the flip — the corpus must convert
  and flip in ONE commit or intermediate commits fail one plane or the other; the OLD
  fingerprint format is validated by the old doctor, so fingerprints migrate only inside
  the flip commit; installer seeds D-001/D-002 would duplicate existing ids — omit them;
  AGENTS.md project-owned text outside the managed block must survive byte-for-byte.

## Evidence
- (none yet)
