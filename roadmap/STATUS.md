---
active_phase: P1
active_task: W2
updated: 2026-07-21
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track

## Current task (WIP = 1 per agent, [[D-006]])
**W2 — manifest model + trust root** — fable-main (serial writer). Codex adversarial
review of the W1 spine running in background (INS-002). W1 ACHIEVED (59 tests, golden
byte-agreement).
Lanes: WR1/WR2/WR3/WR6 closed. WR4 + WR5 delivered, critiqued (Codex), dispositions
applied; both open with round-2 scopes, deferred to M3/M4 planning (several EXTEND items
need real archive/trace providers). Timelock delay three-way adjudicated: 259,200s; the
16,200s truncation recurred in WR5 and was caught by the critic cross-check.
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
1. W2 slices; W3 (providers/quorum) after or interleaved; W1 Codex review disposition when it lands.
2. Manifest-owner open items: live rate-limit value (3k vs 10k weETH/4h), executor pin,
   historical setPeer tx. WR4/WR5 round 2 at M3/M4 planning.
3. R-001 residual (owner, low urgency): enable branch protection requiring the "Control plane"
   check once PR flow starts mattering.

## Blockers
- W0C (parked): GitHub repo deletion needs owner auth — run
  `gh auth refresh -h github.com -s delete_repo` or delete kaseLunt/aegis via web; agent
  then recreates, pushes, verifies, and closes W0C.

## Queued / awaiting decision
- Route research blockers (`docs/SOURCE_REGISTER.md` §Hiring-ready route research blockers) —
  needed before P2 can produce live verdicts; can start during P1 as research capture.
