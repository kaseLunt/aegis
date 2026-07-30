---
id: INS-3a35d8b4-c436-448a-9008-4a06c7a52431
type: insight
title: "vinext dev failure mode: Tailwind-4 repo-wide auto-scan RangeError silently serves a stale worker bundle -- new routes 404 while old ones work"
status: candidate
informs: ["W5"]
review_when: date:2026-08-13
updated: 2026-07-30
---

# INS-3a35d8b4-c436-448a-9008-4a06c7a52431 — vinext dev failure mode: Tailwind-4 repo-wide auto-scan RangeError silently serves a stale worker bundle -- new routes 404 while old ones work

**Context.** W5 S6 smoke (2026-07-29): `GET /reports` 404'd on a freshly created
`app/reports/page.tsx` while `/` served 200 — even with a MINIMAL probe page. Root cause
chain, verified by bisection: (1) Tailwind 4's source auto-detection scans the whole
non-gitignored repo for class/variable candidates; its CSS-escape decoder threw
`RangeError: Invalid code point 12233612` (`String.fromCodePoint` > 0x10FFFF) while
compiling `app/globals.css`; (2) the rsc worker build died at
`getWorkerEntryExportTypes`; (3) the vinext dev server then served a STALE cached worker
bundle — old routes answered normally, new routes 404'd with a fully-rendered app 404
page, and nothing in the 404 response hinted at a build failure.

**Second pitfall stacked on top:** killing the `npm run dev` wrapper PID does NOT kill
the vinext child; a zombie listener keeps answering the port across "restarts", so fixes
appear not to work. Two zombies had accumulated (ports 3000/3001) before this was
noticed. Kill by port PID (`netstat -ano` → `taskkill //F //PID`) and assert the
listener count is ZERO before trusting any smoke result.

**Fix landed (80a8b47).** `app/globals.css`: `@import "tailwindcss" source(none)` +
`@source "./"` + `@source "../components"` — pin the candidate scan to the UI sources.
This is also the structurally right config: scanning research markdown and tool logs for
CSS candidates is wrong regardless of the crash.

**Consequence.** (1) Any repo with prose/log content + Tailwind 4 auto-scan is one weird
byte away from this failure mode — pin `@source` explicitly in every such project.
(2) A dev-server smoke that returns 404 for a new route proves NOTHING about the route
until the build log is checked for compile errors AND the port is confirmed to belong to
the fresh server instance. (3) The exact offending byte sequence was never identified
(no literal `\baab8c` exists in the tree); the class fix (source pinning) removes the
entire exposure, which is why the hunt was abandoned — record the class, not the
instance.
