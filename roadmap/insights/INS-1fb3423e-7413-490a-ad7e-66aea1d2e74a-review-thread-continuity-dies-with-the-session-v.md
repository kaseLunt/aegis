---
id: INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a
type: insight
title: "review-thread continuity dies with the session -- verbatim-persisted verdicts are the resume mechanism"
status: candidate
informs: ["D-b4ab3c69-c110-4d78-bc4c-f9a332489db4"]
review_when: date:2026-08-10
updated: 2026-07-30
---

# INS-1fb3423e-7413-490a-ad7e-66aea1d2e74a — review-thread continuity dies with the session -- verbatim-persisted verdicts are the resume mechanism

**Context.** Mid-way through the G35 convergence loop (2026-07-26/27), a usage-limit stop
plus `/login` reset the Claude session. The Codex companion's job registry is scoped to
the current session id, and the three prior job records (initial halt, round-1 verdict,
round-2 verdict on thread `019fa193-bbd6…`) vanished from its state directory between the
last successful read (~04:32Z) and the round-3 dispatch (~04:52Z). `--resume-last`
deliberately fails closed on an empty session-scoped registry, so the round-3 dispatch
failed in ~4 s with "No previous Codex task thread was found for this repository."

**Evidence.** Failed job `task-ms2r3nwo-tbohl2` (state dir
`…\codex-openai-codex\state\aegis-63ff1ebea97d2e74\jobs\`); the dispatching agent
verified on disk that only `broker.json`/`state.json` survived, grepped the companion
script for prune logic (none — deletion was external), and halted per mandate instead of
spoofing a registry file, shelling around the wrapper, or silently substituting a fresh
session for a requested continuation.

**Consequence.** Cross-session review-thread continuity CANNOT be a load-bearing
assumption in any convergence loop. The working mitigation, validated here: persist every
verdict VERBATIM into the repo the moment it lands (`g35-codex-verdict.md` carried both
rounds), so a fresh reviewer re-arms from the written record with zero context loss —
for checklist-style re-verification rounds, fresh eyes over a written verdict are equal
or stronger evidence than thread memory. Binding habits: (1) verdict-persistence happens
BEFORE the next dispatch, never batched; (2) a resume failure is a fail-closed halt plus
coordinator decision, never an agent-improvised workaround; (3) briefs for later rounds
must cite the persisted verdict file as the context source so they survive session
resets by construction.

**Addendum (2026-07-30, multi-lane hazard).** `--resume-last` resolves to the
chronologically NEWEST job in the workspace+session, not a semantically named thread.
With multiple review subjects interleaved (G35 / W5 / G-08), a W5 round-2 resume attached
to the G-08 round-2 thread (`task-ms78y0ko-u30gej`, cancelled before any output surfaced,
re-dispatched fresh). Binding habit (4): `--resume-last` is safe ONLY when no other review
thread has been dispatched in the workspace+session since the one being resumed; in any
interleaved-lane pattern, go straight to a fresh dispatch against the persisted verdict
file — which habit (3) already guarantees is sufficient context.
