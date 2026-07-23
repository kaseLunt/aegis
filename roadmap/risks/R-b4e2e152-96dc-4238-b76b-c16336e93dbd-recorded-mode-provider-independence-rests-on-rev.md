---
id: R-b4e2e152-96dc-4238-b76b-c16336e93dbd
type: risk
title: "recorded-mode provider independence rests on reviewed fixtures — bundle-digest anchoring + live endpoint identity deferred"
status: open
informs: [W4, W5]
review_when: phase:P1:exit
updated: 2026-07-23
---

# R-b4e2e152-96dc-4238-b76b-c16336e93dbd — recorded-mode provider independence rests on reviewed fixtures — bundle-digest anchoring + live endpoint identity deferred

## Context
The W4 Codex review (pass 6) flagged that identity independence — the requirement of ≥2
administratively distinct providers — can be defeated by a caller who supplies two
adapter configs that both back one real backend, or a forged recording bundle whose
second provider's responses duplicate the first's. The identity evaluator enforces
distinctness of the REVIEWED administrative domain (evaluateQuorum, W3 P0#1) and now
also binds each read's value to its raw hash and refuses hand-built observations
(pass-6 fixes), but it cannot detect a dishonest fixture/config — that is upstream of it.

## Bounding
- In scope for W4 and CLOSED: value↔hash binding, observation immutability (deep freeze),
  provenance brand, pin binding. These stop a CALLER of the comparator from forging a
  pass from honest inputs.
- OUT of scope for the identity evaluator: whether the recording bundle and ProviderConfig
  set honestly represent independent providers. This is the same trust boundary the whole
  recorded-evidence model rests on (a reviewed fixture is assumed honestly reviewed; W2's
  approved-hash trust root assumes an honestly curated list). W4's evidence claims only
  recorded-scenario identity over the reviewed reference fixtures — accurate.

## Mechanical closures (deferred, tracked here)
1. Recording bundle-digest anchoring: bind every response in a bundle to one reviewed
   bundle digest so a second provider's responses cannot be a relabeled copy without
   detection. Explicitly deferred in the W3 handoff (recordingId bundle-digest anchoring).
2. Live endpoint/client-identity binding: when live adapters land (WR3 probe step — a W4
   non-goal), independence must bind to the backing endpoint identity, not just the
   config label. Owner-reviewed provider matrix (WR3 §5 pairs) is the current control.

## Consequence / owner decision
- No M1 claim overstates this: recorded identity over reviewed fixtures is what is
  attested. Surfacing this to the owner so the deferred anchoring is a conscious P2/M2
  decision, not an unnoticed gap.
- W5 must not present recorded-mode independence as live-provider independence.
- Revisit at P1 exit / when live adapters are scheduled.
