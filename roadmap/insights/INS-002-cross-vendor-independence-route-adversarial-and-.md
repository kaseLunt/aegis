---
id: INS-002
type: insight
title: Cross-vendor independence: route adversarial and clean-room verification roles to Codex agents
status: accepted
informs: [H0]
review_when: date:2026-08-04
updated: 2026-07-21
---

# INS-002 — Cross-vendor independence: route adversarial and clean-room verification roles to Codex agents

Owner directive (2026-07-21): use Codex agents where appropriate; usage headroom is ample.

Where "appropriate" means (D-006 review roles + independence rule):
- adversarial vector authoring blind to implementation (WR6 runs on Codex);
- clean-room hash reproduction from spec alone;
- adversarial mutation testing and W1+ code review (second model family = the reviewer
  cannot share the implementer's blind spots);
- threat-model attack passes.

Standing status (owner directive, ratified in the Codex-senior-reviewer decision): this cross-vendor routing is now the DEFAULT senior review for load-bearing work, not an optional role — see that decision for scope and how-to.

NOT for: single-owner spine implementation (W1, canonical semantics) — one owner, one
implementation; Codex reviews it, never co-writes it.
