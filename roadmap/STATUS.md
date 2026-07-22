---
active_phase: P1
active_task: W3
updated: 2026-07-22
---

# STATUS — where we are right now

> Updated on transitions (start / scope change / finish), enforced at CI/PR. One current task.
> Full rules: `SYSTEM.md` · `RULES.md`.

**Active phase:** P1 — M1 canonical evidence spine (P0→P1 review: owner ratification 2026-07-21)
**Health:** 🟢 on track

## Current task (WIP = 1 per agent, [[D-006]])
**W3 — finalized-block selection + quorum/conflict semantics + RPC adapters** — fable-main
(serial writer). Slice 1 (pure quorum evaluator) in progress. Codex conformance review of
the W2 delta (f7e6dbd) running in background — disposition on landing.
Lanes: WR1/WR2/WR3/WR6 closed. WR4 + WR5 delivered, critiqued (Codex), dispositions
applied; both open with round-2 scopes, deferred to M3/M4 planning (several EXTEND items
need real archive/trace providers). W0C parked pending owner action (Blockers).

## Recently completed
- **W2 — manifest model + trust root** ACHIEVED: schema + content addressing + approved-hash
  trust root + loadManifestBytes + sealed reference fixture + policyTrustFromBytes report
  wiring; adversarial-review round 2 (4 lenses, 3-skeptic panels) dispositioned — P1
  boundary fail-open + P2 environment applicability fixed TDD, RangeError depth escape
  killed at root (assertJsonDomain cap), set-member dedup, test-quality gaps closed.
  144/144 tests, lint clean. See work file evidence + [[IDEA-002]], [[INS-005]].
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
1. W3 slices 2–3 (block selection; adapter interface + recorded fixtures + provider configs).
2. Codex W2-delta review disposition when it lands; W4 after W2+W3.
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
