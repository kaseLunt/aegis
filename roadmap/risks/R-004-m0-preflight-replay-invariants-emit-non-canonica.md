---
id: R-004
type: risk
title: M0 preflight/replay/invariants emit non-canonical AGS- reportHash; migrate to sha256 canonical identity at W5
status: open
informs: []
review_when: date:2026-08-05
updated: 2026-07-22
---

# R-004 — M0 preflight/replay/invariants emit non-canonical AGS- reportHash; migrate to sha256 canonical identity at W5

## Risk (from Codex spine review, finding 8)
M0 preflight/replay/invariants label `AGS-${stableHash(payload)}` as `reportHash` and
`reportId` truncates to 12 hex. Spec requires authoritative report identity to be
`sha256:<64 lowercase hex>`. The hash PRIMITIVE was already fixed in W1 (sha256 over JCS),
but these M0 call sites still emit the AGS- shape and never run the canonical assurance
payload through strict `validateReport`.

## Bounding
- These are M0 prototype surfaces, not the real engine. Migrating them to canonical
  report identity is W5 scope (one engine renders all surfaces: CLI/API/CI/web).
- Interim mislabel-prevention: bare-digest helpers should be named so they cannot be
  mistaken for report identities (cheap; do at W5 entry, not mid-W2).

owner: klunt · review_when: phase:P2:entry
