---
id: R-003
type: risk
title: Duplicate-aware raw JSON parsing needed before untrusted bytes enter (report + manifest loaders)
status: closed
informs: []
review_when: date:2026-08-05
updated: 2026-07-25
---

# R-003 — Duplicate-aware raw JSON parsing needed before untrusted bytes enter (report + manifest loaders)

## Risk (from Codex spine review, finding 7)
`JSON.parse('{"a":1,"a":2}')` collapses to `{a:2}` BEFORE Aegis sees it, so a duplicate-key
document and its collapsed form receive identical canonical bytes/hash. RFC 8785 §3.1
requires I-JSON input with no duplicate names. Aegis's report and manifest loaders currently
use ordinary `JSON.parse`.

## Bounding
- Not yet reachable: every current input is a repository-authored fixture we control; no
  untrusted bytes are parsed yet.
- Becomes live at the untrusted-bytes boundary: the report/manifest byte loaders and the
  HTTP API request parser (W3/W5). Fix = a duplicate-aware strict parser at that boundary,
  emitting a typed canonicalization error; not a fix inside the pure canonical core.

## CLOSED 2026-07-25 at 3e70cf2 (W5 slice S2)
The deferral condition recorded here — "until this boundary accepts untrusted bytes (W3/W5 API
surface)" — was met by [[D-6bedc848-2a42-411a-a65b-d623f7418121]], which has the W5 report API
accept caller-supplied manifest bytes. Both byte boundaries now reject duplicate keys BEFORE
parsing: `loadManifestBytes` (ManifestError `duplicate_json_key`) and `loadRecordingBytes`
(ChainError `duplicate_json_key`).

`findDuplicateJsonKey` scans the TEXT, because `JSON.parse` cannot help — by the time a reviver
runs the duplicate has already collapsed. It lives in `report/canonical.ts` beside
`jcsSerialize` and `assertJsonDomain` so JSON discipline stays in one module; that placement
cost a fourth receipt (W1) over a standalone module, taken deliberately.

Correctness details that a naive scanner gets wrong, each pinned by a test: duplicate detection
is scoped PER OBJECT (the same key in sibling objects is legal JSON and stays legal); a colon
inside a string VALUE is not a key separator; escaped quotes inside keys are decoded before
comparison. Placed ahead of the parse so the defect reports as itself — checked afterwards, a
tampered manifest surfaced as `integrity_mismatch`, which is true but tells the wrong story.

Negative-tested at landing: neutralising the guard at both call sites kills exactly the two
boundary tests and nothing else. 384/384. Receipts EV-W1-R3, EV-W2-R3, EV-W3-R5, EV-W4-R3.

owner: klunt · review_when: phase:P1:exit
