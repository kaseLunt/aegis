---
active_phase: P1
active_task: W1
updated: 2026-07-21
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track

## Current task (WIP = 1 per agent, [[D-006]])
**W1 — canonical report core** — fable-main, single owner (critical path).
Lanes: WR2/WR3/WR6 DELIVERED + closed (authority map, provider matrix, adversarial corpus
with 18 SPEC-QUESTIONs for W1). WR1/WR4/WR5 relaunched after usage-limit deaths.
W0C parked pending owner action (Blockers).

## Recently completed
- **W0B — control-plane hardening per external review** (commit 6bf2c03): staged-index scope
  gate, fail-closed states, protected files, evidence fingerprints, decision ratification,
  14/14 gate selftests; public GitHub remote + green CI — see [[D-005]], [[R-001]].
- **W0A — orchestrator directive adopted, right-sized** (commit daa9d8a): ladder-drift +
  handoff doctor checks, pre-commit scope gate, one-command capture, standing rules §13–20 —
  see [[D-004]], [[INS-001]].
- **W0 — control plane stood up** (commit 3d01b6c): cockpit, doctor, git+CI gates, session
  protocol in CLAUDE.md/AGENTS.md — see [[D-001]], [[D-003]].
- Doc canon in place: `docs/` (product spec, threat model, engineering spec, roadmap M0–M10,
  source register, interview brief) — authority hierarchy in `docs/README.md`.

## Next up
1. W1 first slice: triage WR6 SPEC-QUESTIONs into spec clarifications, then canonical types
   + JSON Schema + JCS + reportHash with the golden vectors as acceptance targets.
2. Review WR1/WR4/WR5 deliverables when their relaunched agents land.
3. R-001 residual (owner, low urgency): enable branch protection requiring the "Control plane"
   check once PR flow starts mattering.

## Blockers
- W0C (parked): GitHub repo deletion needs owner auth — run
  `gh auth refresh -h github.com -s delete_repo` or delete kaseLunt/aegis via web; agent
  then recreates, pushes, verifies, and closes W0C.

## Queued / awaiting decision
- Route research blockers (`docs/SOURCE_REGISTER.md` §Hiring-ready route research blockers) —
  needed before P2 can produce live verdicts; can start during P1 as research capture.
