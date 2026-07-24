---
id: INS-f3f74c16-f56e-46b1-85bd-55464e4183ce
type: insight
title: "Serena symbolic tools resolve in the main session but FileNotFoundError in workflow subagents -- dispatch cost"
status: candidate
informs: [W5]
review_when: date:2026-08-07
updated: 2026-07-24
---

# INS-f3f74c16-f56e-46b1-85bd-55464e4183ce — Serena symbolic tools resolve in the main session but FileNotFoundError in workflow subagents -- dispatch cost

## Context
The W5 kickoff dispatched a four-agent `Workflow` fan-out to map the W1–W4 engine surface,
using `agentType: 'serena-coder'` and a prompt that explicitly instructed loading Serena
via ToolSearch and preferring symbolic navigation over whole-file reads.

## Evidence (2026-07-24, run wf_c29e08ca-2a8)
- THREE of the four agents independently reported, unprompted, that Serena resolved
  nothing: "the language server reported FileNotFoundError for every lib/ path in this
  repo", "the active Serena project root does not contain lib/", "its index currently
  resolves NO files (FileNotFoundError on existing paths, find_symbol returns empty)".
  All three fell back to `Read` and said so in their hazard notes.
- In the SAME session, immediately after, the main session called
  `find_symbol("establishBoundary", relative_path="lib/aegis/chain/engine.ts")` and it
  resolved correctly (body_location 97–203). So the failure is not `.serena/project.yml`
  (`project_name: aegis`, `languages: [typescript]` — correct) and not the repo contents;
  it is the subagent context's project activation/root.
- Cost of the silent fallback: 335,681 subagent tokens / 121 tool calls for a read-only
  map of ~20 files. The `serena-coder` agent type's whole purpose is to carry the
  prefer-Serena instruction into subagents; it carried the instruction but not a working
  index, so it degraded to the built-in-tool behavior it exists to prevent — at full-file
  read cost.

## Consequence
1. In THIS repo, do not assume symbolic navigation inside subagents/workflow `agent()`
   calls. Either (a) verify Serena resolves from the main session and do symbol-level work
   inline, or (b) budget subagent fan-outs at whole-file-read cost and scope their file
   lists tightly (name the exact files, as this run did — that is why it still converged).
2. `.serena/` is currently UNTRACKED (`?? .serena/`) — a per-machine config, so subagents
   in a fresh worktree/cwd have no activated project at all. This is the likely root cause
   and also means the config is not shared. Committing `.serena/project.yml` is a candidate
   fix; verifying whether workflow agents inherit the session cwd is the diagnostic.
3. Do not silently trust a subagent's "I used the right tools" — the three hazard notes
   only surfaced because the schema had a `hazards` field. Ask fan-out agents to report
   tool-level degradation explicitly; it is the difference between a 335k-token map and an
   80k-token one.
