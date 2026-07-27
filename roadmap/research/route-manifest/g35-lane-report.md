# GAP-3/5/1 control-plane evidence lane — PAUSED report (verbatim capture)

- **Lane:** chain-historian (opus), dispatched 2026-07-26; **PAUSED by owner 2026-07-26 late
  (usage credits) — resume when the limit resets.**
- **Status:** three chartered gaps ANSWERED (two fully closed, one with a single hardening
  leg open); two bonus closures; the full dossier + wave-3 blueprint patch are NOT yet
  written — this verbatim pause report is the interim record.
- **Evidence:** scratch dir archived at
  `C:\Users\kasel\aegis-evidence-archive\2026-07-26-scratchpad\g35\` (31 MB, 65 entries:
  acquisition ledger, sweep logs, decoders + negative tests, raw JSON logs). Agent
  transcript: task `a3a7f356a4fc892be`.
- **Caution (D-006 / claim strength):** everything below is the lane's own report,
  dual-provider where stated but NOT yet independently reviewed and NOT folded into the
  blueprint. Manifest-grade use requires the wave-3 patch pass + review. The two REFUTED
  blueprint claims are flagged inline in no other document yet — the wave-2 blueprint is now
  known-stale on those rows until patched.

## The lane's pause report, verbatim

> ## Answered and closed
>
> **GAP-3 — timelock roles.** Complete `RoleGranted`/`RoleRevoked`/`RoleAdminChanged`
> history enumerated, block 0 → head, both timelocks. ETH dual-provider agreement True
> (9 events); OP dual-provider agreement True (11 events), including repair of 11
> rate-limited chunks. Headline: **the OP controller Safe's PROPOSER/EXECUTOR/CANCELLER
> roles were revoked three days ago** (OP blk 154619344, 2026-07-23) and granted to a new
> Safe `0x7a00657a…` — the blueprint's "presumed proposer/executor = controller Safe" is
> true on ETH, **refuted on OP**. `EXECUTOR_ROLE` is **not** open on either timelock (zero
> `address(0)` grants).
>
> **GAP-5 — delegate provenance.** Source refutes the task's premise:
> `OAppCoreUpgradeable.setDelegate` emits **nothing**; the event is
> `DelegateSet(address,address)` on the **Endpoint**, both args non-indexed. Incumbent
> delegate on **both** chains is now the **timelock itself** — so the blueprint's
> "delegate-gated path NOT proven timelocked, zero latency" is refuted. ETH side
> dual-provider; OP side awaiting the second-provider sweep now running.
>
> **GAP-1 — OP pre-window second source.** Full 2,966-chunk sweep on
> `mainnet.optimism.io`, **0 errors**, artifact `44600465c259a78b…`. **Agreement: True**,
> 18/18 events exact on (direction, blockNumber, blockHash, txHash, logIndex, data). OP
> pre-window is now dual-provider.
>
> **Bonus, same control-plane family:** G-06 closed (L1 proxy admin owned by
> `0x9f26d4C9…` since deployment, never changed) and G-07 closed with a supersession the
> blueprint does not have — **minDelay is 864,000 s (10 days) since ETH blk 24982415**,
> not the "≤259,200 s bound".
>
> ## Still in flight (two background jobs)
>
> 1. `oplabs2_delegate` — OP Labs second-provider `DelegateSet` sweep, ~200/3,384 chunks
>    when last checked, ~17 min remaining. Closes the last single-provider leg (OP
>    delegate history).
> 2. `step_invariance` — re-runs the ETH `DelegateSet` sweep at 100k steps instead of
>    250k, to prove the 6,368-event set is not a provider result-cap artifact.
>
> Both are hardening, not load-bearing for the three answers. If you want me to stop now,
> I can write the dossier with those two legs marked as open and the claim strength stated
> accordingly.
>
> ## Discipline state
>
> 108 acquisitions ledgered with effective URL + raw-body sha256; keccak self-test re-run
> at the top of every derivation script; 11 decoder guards negative-tested with 0 leaks;
> end-of-lane reorg recheck on 12 pinned block hashes, re-read cross-provider,
> **0 mismatches**; no explorer used; no head read of any manifest-verified value.

## Resume checklist (when credits reset)

1. SendMessage the same agent (`a3a7f356a4fc892be`) — context intact. Its two background
   sweeps were killed with the pause; both must be **re-run, not trusted** (`oplabs2_delegate`
   from its chunk ledger; `step_invariance` from scratch).
2. Have it write the full dossier to research grade: per-gap evidence tables, artifact
   sha256s, acquisition-ledger references, explicit claim strength per row, the two open
   legs marked open if still unfinished.
3. Then the **wave-3 blueprint patch pass**: fold GAP-3/5/1 + G-06/G-07 into the S7
   control-plane rows, supersede the refuted "presumed proposer/executor = controller Safe
   (OP)" and "delegate-gated path zero-latency" claims, supersede the minDelay bound with
   864,000 s, and re-pose G-08 on the new Safe `0x7a00657a…` (who controls it? signer set?
   threshold?) — that Safe is now a first-class control-plane unknown.
4. Independent review (Codex or second lane) before any of it feeds manifest-grade rows.
