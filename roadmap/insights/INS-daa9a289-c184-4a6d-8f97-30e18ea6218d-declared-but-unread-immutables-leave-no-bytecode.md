---
id: INS-daa9a289-c184-4a6d-8f97-30e18ea6218d
type: insight
title: "Declared-but-unread immutables leave no bytecode trace — identical cross-chain expected hashes are legitimate"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-daa9a289-c184-4a6d-8f97-30e18ea6218d — Declared-but-unread immutables leave no bytecode trace — identical cross-chain expected hashes are legitimate

**Context.** G-01 derivation execution
(`roadmap/research/route-manifest/g01-derivation-execution.md` R1/F1, route-cartographer
2026-07-26). SendUln302 declares `localEid` as an immutable (`MessageLibBase.sol:8`), and
the dossier predicted the L1 and OP instances would therefore carry different runtime
bytes. Execution disproved it: the compiler emits `immutableReferences` sites **only for
immutables the runtime code actually reads**, and SendUln302's runtime never reads
`localEid` — zero sites. So the L1 (30101) and OP (30111) SendUln302 deployments share
**one** expected runtime hash (`sha256:281e2b77…`), while ReceiveUln302 — which does read
it — genuinely differs per chain.

**The class.** Two traps, opposite directions:
1. **Do not "fix" legitimate hash equality.** A future manifest author seeing two
   chain-scoped targets with identical expected hashes may assume a copy-paste error and
   "correct" one — manufacturing a false mismatch. Chain-scoped target records stay
   separate (identity is per-chain address+boundary); expected-hash equality between them
   is a fact of the bytecode, not a defect.
2. **Do not trust declaration-level immutable inventories.** A source-level immutable
   census (what the dossier did) predicts variation the bytecode may not carry. The
   authoritative inventory is the compiler's `immutableReferences` for the exact build —
   which is also why the execution's fail-closed guard (abort on provided-but-unreferenced
   values, then per-target disposition) caught this instead of silently patching nothing.

**Teeth.** The derivation tooling's rule stands: a provided immutable value with zero
reference sites is a per-target REPORTED disposition, never a silent no-op — and any future
manifest-lint that flags duplicate expected hashes across targets must whitelist
derivation-proven equality by citing the derivation record.
