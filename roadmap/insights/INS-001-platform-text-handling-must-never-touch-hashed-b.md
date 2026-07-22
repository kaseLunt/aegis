---
id: INS-001
type: insight
title: Platform text handling must never touch hashed bytes (CRLF class)
status: active
informs: [W1, H0]
review_when: phase:P1:entry
updated: 2026-07-21
---

# INS-001 — Platform text handling must never touch hashed bytes

Observed on this Windows checkout: every `git add` emitted "LF will be replaced by CRLF"
warnings — the index stored LF but working trees would materialize CRLF. Harmless for
markdown; **fatal for Aegis's core contract**, where `reportHash = sha256(JCS(payload))` and
recorded fixtures must reproduce byte-identically on a clean clone (docs/ENGINEERING_SPEC.md
§Canonicalization, §Tests).

The sibling project's orchestrator names this the connective-tissue class: core logic rarely
fails; line endings vs sealed hashes, stale working copy vs committed bytes, one unpinned
input — these do.

## Standing consequences (mechanical homes, not vigilance)
- `.gitattributes`: `* text=auto eol=lf`; `data/**` and `examples/**` are `-text` (no
  translation of evidence bytes, ever). Committed c97c274.
- **W1 design input:** canonicalization/hashing must operate on UTF-8 bytes produced *in
  memory* — never on strings round-tripped through the filesystem; fixture readers read
  binary, not text mode. Property tests should include a CRLF-injected fixture to prove the
  pipeline is translation-immune.
- Doctor/console: cp1252 consoles crash on emoji in validated content; tools reconfigure
  stdout/stderr to UTF-8 (landed in doctor.py, scope_gate.py, new.py).
