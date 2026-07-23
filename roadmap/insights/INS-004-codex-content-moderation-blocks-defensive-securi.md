---
id: INS-004
type: insight
title: Codex content-moderation blocks defensive security-review vocabulary (false positive)
status: accepted
informs: [H0]
review_when: date:2026-08-05
updated: 2026-07-22
---

# INS-004 — Codex content-moderation blocks defensive security-review vocabulary (false positive)

The W1 spine adversarial review (INS-002 cross-vendor lane) failed terminally on the second
dispatch: Codex read the spec + code cleanly for ~8 minutes, then the PROVIDER moderation
layer returned "flagged for possible cybersecurity risk" and killed the turn precisely as it
was composing findings on hash-collision / prototype-pollution / validation-bypass. Not a
sandbox wedge (process alive, log growing); a false-positive offensive-security classifier
firing on defensive-review vocabulary about the author's OWN code.

## Consequence for the verification lane
Codex is unreliable for reviews framed in attack vocabulary, even when the work is
legitimate defensive review. Mitigations, cheapest first:
1. Reframe the brief as correctness/determinism/RFC-8785-conformance review (the task IS
   equally a correctness review) — drop "adversarial/attack/exploit/collision" framing.
2. Fall back to a fresh general-purpose Claude agent: independent of the IMPLEMENTER's
   context (hasn't seen the reasoning), so most independence value survives even though it
   is same-vendor. Not as strong as cross-vendor, but not self-review.
3. Owner enables Trusted Access for Cyber (external, ChatGPT-side) to authorize Codex for
   security work.
4. Integrator self-review — weakest; loses independence entirely.

The (1)-then-(2) ladder is the standing default for load-bearing review going forward; a
terminal moderation block is not retried verbatim.
