---
id: IDEA-94b7ef88-ff14-487d-9b92-6a1336e7d5df
type: idea
title: "P4-M4 chartering checklist -- spike-derived preconditions, assets, and tripwires"
status: inbox
informs: []
review_when: date:2026-08-09
updated: 2026-07-26
---

# IDEA-94b7ef88-ff14-487d-9b92-6a1336e7d5df — P4/M4 chartering checklist — spike-derived preconditions, assets, and tripwires

**Purpose: the anti-residual object.** Everything the 2026-07-26 spike/research day produced
that P4/M4 chartering MUST sweep, in one place with pointers. Whoever writes the P4 work
items checks every line; nothing below may be rediscovered mid-build.

## Preconditions to design in (not retrofit)

1. **blockTag runtime guard** — EthereumJS pinning is type-level only; the wrapper must
   assert bigint and negative-test with the literal `'latest'` fixture. [[INS-4668c697]]
2. **EdrContext is a process-global singleton** — multi-chain CLI needs process isolation by
   design. spike-s6-s7.md §1.1 / S6-G3.
3. **KZG backend decision** — any post-Dencun full-block self-proof needs a KZG dependency;
   put it on the P4 dependency review agenda (extends [[D-74472e1d]]'s dependency list).
   S7-G1.
4. **OP hardfork names** — `edr.OpHardfork` enum is `{}` at runtime; use the exported string
   constants; `opHardforkFromString` is exact-PascalCase. spike §1.1.
5. **`AccountOverride.storage` non-functional in EDR 0.14.2** (upstream #911) — storage
   overrides can be neither applied nor disclosed. S6-G2.
6. **OP posture:** M4 gate case is **L1-only** ([[INS-e14fbbbc]]); the OP waiver
   (per-receipt equality + named depositNonce divergence) exists, is priced, and is
   UNEXERCISED — owner-only, never a default.

## Assets to land in the repo (small work item at P4 prep or W6)

7. **S6 gate harness** — the receipts-root deriver + its two negative tests + the catch-22
   probes become a fixture-driven repo test so "new EDR release → re-run gate" is one
   command. Scripts archived at
   `C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\spike\`
   (s6-*.mjs, receipts-root.mjs, deposit-envelope.mjs, encode-txs.mjs).
8. **S7 measurement harness + pinned-state bundle** — proxy2.mjs, s7-*.mjs, and the
   912-response `s7-cache/` (5.8 MiB) from the same archive path; the bundle doubles as the
   prototype for [[IDEA-17416aa7]] (state-carrying rehearsal artifacts).
9. **G-01/G-02 evidence** — derivation-input-record.md, patch-immutables.js,
   vendor-derive.js, ledger.jsonl + raw/ (127 acquisitions), keccak.py + decode.py (with the
   negative-tested truncation guards) — same archive root. The M2 evidence-custody design
   (S4 store) decides their durable committed home; until then the archive path is the only
   copy — do not let it be deleted.

## Tripwires and watches

10. **EDR upstream issue #1578** (filed 2026-07-26): any EDR release referencing it →
    re-run the S6 gate before any OP claim strengthens. If silent ~1 month AND OP rehearsal
    has become important → revisit writing the PR ourselves (scout results will already be
    in roadmap/research/rehearse-selection/ by then).
11. **Numerics-from-executed-code rule** ([[INS-035ae3e4]] broadened after strikes 4-5) —
    binding on every P4 deliverable.

## Owner decision queued (money, small)

12. **Funded archive provider pair** (WR3 pair 1: Alchemy + QuickNode) — hard blocker for
    reproducible timing (S7-G3) and for OP pre-window dual-provider completeness (g02-04
    GAP-1); prerequisite plumbing for the M2 observed-side lane. Needs owner accounts/keys.

## Promotion path

Phase review dismembers this checklist into the P4 charters (and the W6 charter where
noted); each line is either scheduled or explicitly declined with reason. The idea closes
only when every line has a disposition.
