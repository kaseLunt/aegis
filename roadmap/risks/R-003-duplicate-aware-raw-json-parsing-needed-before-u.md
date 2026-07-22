---
id: R-003
type: risk
title: Duplicate-aware raw JSON parsing needed before untrusted bytes enter (report + manifest loaders)
status: open
informs: []
review_when: date:2026-08-05
updated: 2026-07-22
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

owner: klunt · review_when: phase:P1:exit
