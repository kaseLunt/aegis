---
id: IDEA-5bb4ace0-d67b-4d91-ab8e-d458526b38a9
type: idea
title: "web surface sets no Content-Security-Policy (THREAT_MODEL:125 gap; next.config.ts outside W5 scope)"
status: inbox
informs: []
review_when: date:2026-08-13
updated: 2026-07-30
---

# IDEA-5bb4ace0-d67b-4d91-ab8e-d458526b38a9 — web surface sets no Content-Security-Policy (THREAT_MODEL:125 gap; next.config.ts outside W5 scope)

**Context.** THREAT_MODEL.md:125 (untrusted rendered data) requires: "Treat all chain and
provider strings as untrusted; escape output; apply a strict content security policy."
S6 recon (2026-07-29, three-mapper workflow) observed the app sets NO CSP anywhere:
`next.config.ts:3-5` is an empty config, no `headers()` in the repo, no middleware, no
`Content-Security-Policy` string match repo-wide.

**Why not fixed in S6/W5.** `next.config.ts` is NOT in W5 `allowed_paths` (lib/**, tests/**,
app/**, bin/**, components/**, package.json, vite.cli.config.ts) — adding response headers
via config or middleware would be silent scope expansion. S6 satisfies the *escaping* clause
of :125 (React text-node rendering only, no `dangerouslySetInnerHTML` — lint-held); the
*CSP* clause stays open.

**Consequence / ask.** Owner triage: amend an item's `allowed_paths` to cover
`next.config.ts` (or rule where CSP belongs in the vinext/Workers pipeline — the worker
serves every response, so a header layer exists) and land a strict CSP before any public
deployment of the web surface. Until then the gap is a disclosed limitation of the M1 web
surface, not a silent one.

**Triage (2026-07-30, owner delegated "best judgement"):** DEFERRED to pre-deployment —
fold into the M2 web-surface work item, whose charter should include `next.config.ts` (or
the worker header layer) in `allowed_paths` at authoring time. Rationale: the M1 surface
is not publicly deployed; the escaping clause of THREAT_MODEL:125 is landed and lint-held;
a CSP belongs with the deployment-shaped work where it can be smoke-tested against the
real Workers pipeline rather than only in dev. Tripwire: any public deployment of the web
surface BEFORE that item exists re-opens this as a blocker, not an idea.
