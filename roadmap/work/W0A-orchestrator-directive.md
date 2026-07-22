---
id: W0A
type: work
title: Adopt the sibling orchestrator's control-plane directive, right-sized for Aegis
phase: P0
status: achieved
evidence_target: "Correct"
priority: 1
depends_on: [W0]
blocked_by: []
informs: [H0]
allowed_paths:
  - roadmap/**
  - .githooks/**
  - .claude/**
  - CLAUDE.md
  - AGENTS.md
  - .gitattributes
invalidated_by:
  - roadmap/tools/**
  - .githooks/**
  - roadmap/work/W0A-orchestrator-directive.md
review_when: phase:P1:entry
updated: 2026-07-21
evidence_fingerprint: sha256:df556b7b697798b9
---

# W0A — Adopt the orchestrator directive (right-sized)

**Why this advances the vision:** the directive's portable core (derive status, handoffs,
teeth, fail-closed executors, connective-tissue homes) is exactly what lets an agent swarm
survive many sessions without drift — VISION's "AI-assisted engineering maturity" goal.

## Hypothesis / objective
Adopt directive rules 1–9 as standing rules with mechanical enforcement where cheap
(doctor checks, scope gate, .gitattributes, capture command), process-only where tooling
would outweigh value (plan census, independent re-derivation cadence). Record adaptations
and explicit non-adoptions in D-004.

## Acceptance (evidence target: Correct)
- Correct: doctor enforces ladder-copy consistency + active-item handoff, each negative-tested;
  pre-commit scope gate blocks out-of-scope staged files, negative-tested; capture command
  creates valid typed objects; RULES.md + CLAUDE.md/AGENTS.md carry the standing rules;
  D-004 records adopt/adapt/reject rationale.

## Non-goals
- Census tooling, byte-exact golden pinning, hash-frozen contracts, identity closures,
  citation gates, re-pin waves (see D-004 — product gates carry byte-exactness instead).

## Canonical commands
```bash
python roadmap/tools/doctor.py
python roadmap/tools/new.py idea "title here"
```

## Handoff
- next: COMPLETE (commit daa9d8a). Follow-on: open P1 and activate W1 (owner call).
- read_first: roadmap/RULES.md §13–20, roadmap/tools/{doctor,scope_gate,new}.py,
  roadmap/decisions/D-004-*.md.
- hazards: doctor objs tuples are 3-ary (rel, fm, text) — unpack sites must match;
  tools reconfigure stdout/stderr to UTF-8 (cp1252 consoles) — keep that;
  scope gate must always allow roadmap/** or capture becomes impossible mid-task.

## Evidence
- 2026-07-21: ladder-consistency check caught 6 real hand-set cells on first run
  (organic negative test); handoff + emoji-crash fixes verified by doctor re-run.
- 2026-07-21: handoff check mutation-tested (renamed heading / missing key / thin body all
  FAIL, restore passes) after first mutation exposed substring laxity — check tightened.
- 2026-07-21: scope gate: in-scope exit 0, out-of-scope exit 1 with root-cause report,
  override exit 0; ran live on commit daa9d8a.
- 2026-07-21: new.py produced D-004 and INS-001 with valid frontmatter (doctor green).
