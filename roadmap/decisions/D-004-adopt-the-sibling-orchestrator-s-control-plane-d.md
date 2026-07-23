---
id: D-004
type: decision
title: "Adopt the sibling orchestrator's control-plane directive, right-sized for Aegis"
status: accepted
date: 2026-07-21
approved_by: klunt (2026-07-21, session ratification)
supersedes: []
updated: 2026-07-21
---

# D-004 — Adopt the orchestrator directive, right-sized

## Context
A sibling project (byte-reproducible simulation substrate) proved a control-plane discipline
across many sessions. Its orchestrator issued a 9-rule portable core with an explicit
non-adoption list. Aegis needs the survive-many-sessions core, not certification-grade rigor —
the product's own milestone gates (docs/ROADMAP.md) carry the heavyweight guarantees where wrong
claims are expensive.

## Decision — disposition per rule

| # | Rule | Disposition here |
|---|------|------------------|
| 1 | Store intent; derive status | **Adopted, adapted:** doctor *validates* the ROADMAP ladder Status column against work-item frontmatter (drift = commit-blocked) rather than generating the table. Revisit generation if the table grows past ~15 rows. Evidence *levels* remain banned from hand-writing everywhere (existing doctor rule). |
| 2 | WIP=1 + handoff (next / read_first / hazards) | **Adopted:** `## Handoff` section required on the active work item, doctor-enforced, written at every transition. |
| 3 | Typed capture, one command | **Adopted:** `roadmap/tools/new.py <idea\|insight\|decision\|risk> "title"`. Archive keeps zero authority (existing). |
| 4 | Teeth habit | **Adopted as standing rule.** Product-side teeth already exist as culture: docs/THREAT_MODEL.md's adversarial-test list and the negative-fixture requirements are the product teeth registry. Process-side teeth land in doctor/hooks. Negative-test at landing, always. |
| 5 | High-signal doctor | **Adopted:** new checks ship as deterministic errors or not at all; periodic noise burn-down at phase reviews. |
| 6 | Plans as executable documents | **Adopted as process only.** Binding census, tool-enumerated lists at execution, grep-confirmed changelog claims, single review-state section — applied manually to any multi-file plan. **Census tooling deferred** until plans routinely move more than a handful of files. |
| 7 | Verify by re-running; independent re-derivation | **Adopted:** canonical commands in work items are executed at authoring; evidence cites real runs. Independent re-derivation is mandatory at milestone exit gates (M-gates), optional below that. Unrequested additions carry the same burden. |
| 8 | Fail closed, scoped commit authority | **Adopted:** scope gate (roadmap/tools/scope_gate.py, pre-commit) restricts staged files to the active item's `allowed_paths` + `roadmap/**` (capture never blocked). Agents halt loudly; `AEGIS_SCOPE_OVERRIDE=1` and `--no-verify` are human-owner-only. |
| 9 | Connective-tissue class | **Adopted:** .gitattributes pins LF + `-text` fixtures ([[INS-001]]); doctor reports tracked-vs-found state and reconfigures console encoding. New members of the class get mechanical homes as they bite (rule 4). |

## Explicitly NOT adopted (per the directive's own boundary)
Byte-exact golden pinning, hash-frozen contracts, identity closures, citation gates, re-pin
waves — as *process*. Where byte-exactness matters in this project it is a **product
requirement with product tests** (M1 canonical reports: "same inputs → byte-identical
reports"), enforced by the engineering-spec gates, not by control-plane ceremony. If live
verdicts ever depend on control-plane artifacts themselves, revisit.

## Consequences
- The ladder caught 6 hand-set drifted cells on the check's first run — the class is real here.
- Executors gain a hard boundary: capture is always possible, scope violations are loud stops.
- Process cost stays proportional: two doctor checks, one hook, one 70-line helper; no new
  ceremony on the write path for ideas/insights.
