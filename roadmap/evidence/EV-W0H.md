---
id: EV-W0H
type: evidence
title: W0H verification — lease expiry retired, Codex-converged over eleven rounds
status: recorded
work: W0H
result: pass
commands:
  - python roadmap/tools/doctor.py
  - python roadmap/tools/selftest.py
  - npm test
observed_at: 2026-07-26T07:36:12Z
tested_commit: 3bffc19884f075dc46b9209d4b564ba998eba4e1
contract_fingerprint: sha256:f6434797f37f01e6f74b5855dd04b6cb39db0cd6e45d516c32145ce2e3e7894b
input_fingerprint: sha256:e09d203112f6029549a0b82731875916a105787fea12a1a58ddee826064d9f23
environment: python 3.13.7 (win32-x64), node 22.20.0, vitest 4.1.10, local win32-x64
supersedes: []
updated: 2026-07-26
---

# EV-W0H — W0H verification receipt

Honest re-run of the canonical commands at `tested_commit`: `doctor.py` -> **OK, 0 errors** ·
`selftest.py` -> **OK, 0 failing** · `npm test` -> **384/384** (`tsc --noEmit` exit 0).

## What this receipt attests

**The claim-lease clock is gone** ([[D-9646fc3c-2c19-4ff2-99e6-f9fa8408725c]]): `lease_expires`
is neither written nor validated for new claims; `renew`, `--hours`, `MAX_LEASE_HOURS`,
`check_expiry`, `Authority.expired`, `validate_live_head`, and both `--check-live-lease(s)`
CLI flags no longer exist; seven CI flag call sites removed. Claims remain full task/scope
bindings: `allowed_paths` + `scope_hash` containment, branch/worktree binding,
`rebind --owner-reviewed`, WIP=1, and the `active -> released|failed|abandoned` lifecycle are
unchanged, with `release --status abandoned` as the explicit abandonment recovery. Historical
claim records keep their inert `lease_expires` fields — retirement in an append-only ledger
stops writes rather than rewriting closed records.

**Timestamp validation survived the removal** (`validate_claim_timestamps`): strict UTC form,
`issued_at <= updated_at`, and not-in-the-future are each pinned by an orthogonal fixture with
independent mutation evidence — including the documented proof that `issued > now` is
unreachable as a sole cause and is retained as defence in depth.

**The instructional-integrity guard** keeps retired mechanics out of executor-facing text,
with a two-tier design converged over the review loop: standing surfaces (CLAUDE.md,
AGENTS.md, RULES.md, SYSTEM.md, VISION.md) carry unbounded either-order claim/renew
co-occurrence over adjacent-block windows with no exemptions — complete by construction for
the renewal vocabulary; narrative surfaces (STATUS, ROADMAP, work/, insights/, risks/, ideas/)
carry prescriptive-form matching over logical paragraphs with per-match strike exemption,
covering exactly the session-protocol reading list plus every live capture directory;
historical directories are records by construction. Seventeen red-first selftest cases pin the
classes: exact literal, slash command lists, per-line strike shielding, natural/passive/
obligation phrasing, tier asymmetry, line-wrap camouflage, split-block constructions,
unbounded-gap constructions, and mandated-surface coverage.

## Codex convergence record ([[D-b4ab3c69]])

Eleven scoped rounds, findings narrowing monotonically, terminal verdict **approve /
converged-clean** (session 019f9d62-459b-7743-9f07-bf8b1aad2ce5, pinned at `tested_commit`):

| Round | Finding | Disposition |
|---|---|---|
| 1 | P1 executor docs still described leases; P2 timestamp-test teeth | fixed `fc85b52` / `d17dfd7` |
| 2 | D-007 lease clauses unreconciled | INS-fe09afdb reconciliation, ruled adequate r3 |
| 3 | referenced incident record still prescribed `renew` | struck + guard v1 `17a7d53` |
| 4 | slash-list bypass; per-line strike shielding | guard v2 `b61369b` (W0D contract re-basis) |
| 5 | standing/narrative tier asymmetry; passive forms | two-tier matchers `6d25d4e` |
| 6 | obligation forms | per-tier split, proximity standing `76ce0da` |
| 7 | line-wrap camouflage | paragraph-logical scanning `a293352` |
| 8 | colon-list split blocks | adjacent-pair windows `77ffe9d` |
| 9 | bounded-gap hole | unbounded co-occurrence `caaac45` |
| 10 | ROADMAP.md unscanned (mandated reading) | scan-set completeness criterion `6e24f05` |
| 11 | — | **converged-clean, no material findings, SHIP** |

Each disposition round re-attested every invalidated receipt (48 supersessions across 8
chains, every contract/input fingerprint independently reproduced by the round-7 and round-10
audits). Documented residue, accepted under the cooperating-executor threat model: narrative
phrasings outside the enumerated prescriptive forms (standing-backstopped, review-covered,
owner-waiver path); standing directives split across 3+ blocks; vocabulary avoidance.

Recorded honestly: Codex's sandbox could not run `selftest.py` in rounds 4-11 (no writable
temp directory, disclosed each round); selftest evidence throughout is local runs, and rounds
verified the selftest fixtures by direct source inspection and direct matcher execution
against production code instead.
