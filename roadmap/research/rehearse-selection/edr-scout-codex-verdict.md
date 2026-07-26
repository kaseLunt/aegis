# Codex adversarial verification of `edr-fix-site-scout.md` — VERDICT

- **Job:** `task-ms2f3tlg-shftyz` (codex-reviewer lane, dispatched 2026-07-26 ~16:15, completed 23:36:03Z, ~19m runtime)
- **Workspace:** sparse EDR clone pinned at `c66cd68aaa3cd7a5af1968a2933fe7bc5db9f809`, with the
  `@nomicfoundation/edr@0.14.2` tag (`375a455277e60040cc023d1a666a80b17ef7f142`) available for
  byte-identity diffing, at `C:\Users\kasel\AppData\Local\Temp\edr-verify-20260726161239b\edr`.
- **Scope:** every claim in `edr-fix-site-scout.md`, with the §d draft comment as the posting
  gate. The proposed one-line issue-BODY edit was NOT in the dispatched brief — see §4.
- **Verdict: NEEDS-CORRECTIONS.** Corrections applied to the scout doc (supersede-in-place)
  and a corrected §d′ comment produced in the same commit as this file.

Codex's summary, verbatim:

> The central diagnosis is sound: a decoded OP deposit reaches the generic nonce accessor as
> `0`, and the mempool compares that placeholder against the depositor's real account nonce.
> Receipt construction already derives `depositNonce` from pre-execution state.
>
> The draft is not safe to post unchanged, chiefly because it overstates the minimal fix and
> calls the mempool the sole blocker. Automine fee validation, miner priority
> arithmetic/order, and balance validation remain material blockers.

## 1. Per-claim disposition (verbatim table from Codex)

| Claim group | Verdict | Finding |
|---|---|---|
| Error variant, message, and rejection | **CONFIRMED** | `NonceTooLow` and its exact string are at `mem_pool/src/lib.rs:132-141`; `add_transaction` starts at 459 and rejects at 493-499. The provider maps it through `error.rs:257-259/:528` to `-32000` from line 39. |
| Raw-transaction flow hops | **CONFIRMED** | All cited HEAD hops through N-API/provider, `handle_send_raw_transaction_request`, decoding, validation, `send_transaction`, `add_pending_transaction`, and the mempool are correct. `validate_send_raw_transaction_request` does not check nonce. |
| Cross-tag `edr_napi/provider.rs:159` citation | **REFUTED** | Correct at HEAD, but the corresponding function is at line 109 in the tag because that file changed. This citation is outside §d. |
| Deposit placeholder and generic accessor | **CONFIRMED** | Deposit `nonce()` returns `0` at `signed/deposit.rs:95-100`. Crucially, `OpSignedTransaction::nonce()` delegates its Deposit arm to that method at `signed.rs:286-295`, so the mempool really reads the placeholder zero. Pooled conversion preserves the Deposit variant. |
| Automine nonce gate | **CONFIRMED** | `validate_auto_mine_transaction` rejects the placeholder at `data.rs:1648-1662` before the mempool when automine is enabled. |
| "Guard the two nonce checks" is sufficient | **REFUTED** | After the nonce check, automine performs generic fee checks at `data.rs:1664-1692`. Deposits expose `max_fee_per_gas = 0`, so `:1675-1681` rejects them whenever the next base fee is positive. Bypassing only line 1648 is insufficient. |
| Receipt-side `deposit_nonce` | **CONFIRMED** | `receipt/execution.rs:106-115` reads the caller nonce from pre-execution state; `:128-140` assigns it to a Deposit receipt and sets `deposit_receipt_version = Some(1)` from Canyon onward. |
| Receipt timing/canonical value | **CONFIRMED** | The receipt builder is created from current state before execution in `edr_chain_l1/src/block.rs:393-409`; previous transactions are committed before the next builder is created. Thus, once a deposit genuinely executes without the nonce-zero state workaround, the receipt receives the real pre-execution depositor nonce. No receipt-side fix appears necessary. |
| Block replay bypasses MemPool | **CONFIRMED** | `test/block_replay/src/lib.rs:225-227` sends transactions directly to `builder.add_transaction`. That crate does not use `MemPool`. |
| Replay equality checks | **CONFIRMED, with correction** | Full header equality is an ordinary `assert_eq!` at line 388. Execution-receipt equality at 377-385 is `debug_assert_eq!`, so "asserts" should be "debug-asserts" for that part. |
| Listed OP replay fixtures | **CONFIRMED** | The cited tests and block numbers are present: 105235064, 115235064, 121874088, 125235823, 130423412/413, 135513415/416, 135603813, 137620147, and 144546703. |
| Those fixtures are green and all have nonzero depositor nonce | **UNVERIFIABLE** | The workspace contains block numbers, not cached transaction/receipt data, and the tests require remote RPC. The protocol supports the index-0 L1-attributes-deposit statement, but the individual sender nonces — especially "far from zero" — cannot be established here. |
| Marker-trait precedent | **CONFIRMED, citation needs correction** | The generic traits exist at `edr_transaction/src/lib.rs:196-219`. However, `data.rs:2537` calls `is_eip4844()` on the transaction type; the directly consumed OP implementation is `edr_op/src/transaction/type.rs:33-37`, not the signed-transaction implementations at `signed.rs:151-170`. |
| MemPool dependency conclusion | **CONFIRMED, wording inaccurate** | MemPool already depends on `edr_transaction` and not `edr_op`, so an `IsDeposit` sibling would add no dependency edge. But the report's "depends only on …" list omits the optional `tracing` dependency at `Cargo.toml:13`. |
| Zero deposit awareness in generic layers | **CONFIRMED** | There are zero case-insensitive `deposit` hits in `.rs` files under `crates/edr_provider`, `crates/mem_pool`, and `crates/block`. |
| Replacement collision | **CONFIRMED** | Replacement lookup keys on caller and nonce at `mem_pool/lib.rs:538-556`. Two same-sender deposits both report nonce zero. Validation at 658-690 accepts zero-for-zero replacement because both the max-fee and priority-fee thresholds remain zero; `min_new_fee` is at 692-701. |
| `update()` eviction | **CONFIRMED** | `is_valid_tx` at 374-383 removes a zero-nonce deposit once the sender nonce is nonzero. The consecutive-nonce logic at 403-415 also assumes ordinary nonce queues. Provider update calls at `data.rs:1026/:1184/:1480-1482` are correctly cited. |
| Priority mining "sorts it last" | **REFUTED** | The underlying problem is real, but the stated consequence is inaccurate. `effective_miner_fee` computes `0 - base_fee` at `miner/lib.rs:611-612`: with positive base fee this can overflow/panic in checked builds. In wrapping builds the effective fee becomes zero, ranking behind positive-fee transactions but not necessarily absolutely last; ties use `order_id`. |
| FIFO and minimum gas price | **CONFIRMED** | FIFO preserves `order_id` at 269 and 616-621. Lines 280-283 remove the entire caller when the transaction's zero gas price is below `min_gas_price`. |
| Pending/future classification | **CONFIRMED** | At 510-520, nonce zero cannot exceed `next_nonce`, so the deposit enters pending. |
| Pending nonce reporting | **CONFIRMED** | `account_next_nonce` at 636-649 returns the last pending nonce plus one, yielding `1`. The complete RPC path is `provider/data.rs:2270-2297`, especially 2281-2283, through `data.rs:813-818`. |
| L1-only mempool fixture | **CONFIRMED** | `test/mem_pool/src/lib.rs:13-18` hardcodes `MemPool<L1SignedTransaction>`. |
| Additional funds/mint issue | **CONFIRMED; omitted from report** | MemPool checks generic `upfront_cost` at 501-507. That cost includes transaction value but not a deposit's `mint`. Consequently, some valid value-bearing deposits can still be rejected for insufficient prestate balance even after the nonce guard. The index-0 L1 attributes deposit is normally zero-value, but the proposed raw-deposit path is broader. |
| Repository conventions | **MIXED** | `CONTRIBUTING.md` is eight lines; no CODEOWNERS or PR template was found. "Every PR needs a changeset" is too broad: the workflow applies to covered PRs targeting `main`, with release/label exceptions. |
| Deposit-test citations | **CONFIRMED** | Every listed test citation is valid. The list is not exhaustive, so introduce it as "Examples include." |
| No raw-deposit submission test | **CONFIRMED** | A full-tree `git grep` at HEAD, including sparse-excluded paths through Git objects, found no test combining a deposit with `eth_sendRawTransaction`/`SendRawTransaction`. |
| op-revm/revm versions | **CONFIRMED** | `op-revm 19.0.0` and `revm 38.0.0` are correct. Cargo.lock line positions differ at the tag because the lockfile is not byte-identical. |
| §d byte-identity statement | **CONFIRMED** | Every source file actually cited in §d is byte-identical between the tag commit and HEAD. |
| Report-wide byte-identity statement | **REFUTED** | Cited files that changed include `.github/workflows/edr-ci.yml`, `Cargo.lock`, `crates/block/header/src/lib.rs`, `crates/edr_napi/src/provider.rs`, and `crates/edr_op/src/spec.rs`. The report correctly flags the header, but incorrectly says no other line-cited file changed; `edr_op/src/spec.rs` is cited, and N-API/Cargo.lock line positions shifted. |
| "Closer to op-geth" claim | **UNVERIFIABLE from workspace** | It is externally corroborated: op-geth explicitly excludes deposit transactions from ordinary txpool validation, while OP derivation supplies deposits through payload attributes with `noTxPool=true`. See op-geth `core/txpool/validation.go` and the OP derivation specification (`noTxPool=true`). |

## 2. Exact corrections required before posting §d (verbatim from Codex)

> 1. Remove "current `main`" unless it is reverified immediately before posting. Say only "I
>    traced this at commit `c66cd68…`."
>
> 2. Replace the replay conclusion at §d line 146 with wording like:
>
>    > The replay helper bypasses the mempool, ordinarily asserts full header equality, and
>    > debug-asserts execution-receipt equality. The checked-in fixtures cover the listed OP
>    > block numbers, but their remote pass status and individual deposit sender nonces are
>    > not established by this checkout. If those tests pass, they corroborate the
>    > execution/receipt path; they do not show that the mempool is the only remaining
>    > JSON-RPC-path issue.
>
> 3. Delete "all of which have … nonzero depositor nonce" unless verified from actual block
>    data. Do not use "far from zero."
>
> 4. Correct the marker precedent:
>
>    > `data.rs:2537` uses the generic `IsEip4844` pattern; the relevant OP transaction-type
>    > implementation is `crates/edr_op/src/transaction/type.rs:33-37`.
>
> 5. Add that bypassing `data.rs:1648` alone does not fix automine: `data.rs:1664-1692`,
>    particularly 1675-1681, still rejects a zero-fee deposit.
>
> 6. Replace "a deposit's zero effective fee sorts it last" with:
>
>    > Priority ordering is also unsafe for deposits: `effective_miner_fee` subtracts the
>    > positive base fee from the deposit's zero max fee at `miner/src/lib.rs:611-612`, which
>    > may overflow in checked builds; otherwise the resulting zero fee ranks behind
>    > positive-fee transactions. FIFO preserves submission order.
>
> 7. Remove the assertion that the minimal two-guard change "would unblock canonical replay
>    in its normal shape." A defensible replacement is:
>
>    > A nonce guard is only a partial fix. A narrow automine-off replay may work if the
>    > deposit is zero-value or sufficiently funded, there is at most one per sender, no
>    > `update()` intervenes, `min_gas_price` is zero, and mining preserves canonical
>    > ordering. A general fix must also address automine fee validation, mint-aware funds
>    > validation, replacement/update semantics, and miner ordering.
>
> 8. In the report body, add optional `tracing` to the MemPool dependency list, qualify the
>    changeset rule to covered PRs targeting `main`, and change "Existing deposit-touching
>    tests" to "Examples of deposit-touching tests."

Codex's closing line, verbatim: *"The draft's central evidence is valuable, but the 'sole
blocker' and 'small guard unblocks replay' conclusions are materially overclaimed. No files
were modified during this review."*

## 3. New findings Codex surfaced beyond the brief

- **Mint/value validation gap (omitted from the original report):** `MemPool` checks generic
  `upfront_cost` at `mem_pool/src/lib.rs:501-507`, which includes transaction `value` but
  **not** a deposit's `mint`. Even after a nonce-guard fix, legitimately-funded value-bearing
  deposits can be wrongly rejected on the general raw-deposit path (the index-0
  L1-attributes deposit is normally zero-value, so canonical replay of that specific tx is
  unaffected).
- **Overflow/panic risk, not just misordering:** `effective_miner_fee`'s `0 - base_fee` at
  `crates/block/miner/src/lib.rs:611-612` can overflow/panic in checked-arithmetic builds.
- **Report-wide byte-identity claim refuted** (the §d-only claim holds): tag-vs-HEAD also
  touches `.github/workflows/edr-ci.yml`, `Cargo.lock`, `crates/edr_napi/src/provider.rs`,
  and `crates/edr_op/src/spec.rs` (cited in the report body).
- **op-geth analogy externally corroborated** (op-geth excludes deposits from txpool
  validation; OP derivation supplies deposits via payload attributes with `noTxPool=true`).

## 4. NOT covered: the issue-BODY edit

The dispatched brief covered only the scout report and its §d draft comment. **Codex did not
evaluate the proposed one-line issue-BODY edit** (refining #1578's Expected-behavior clause
to reflect that the receipt-half is already implemented upstream). That edit needs either a
separate quick verification or an explicit owner judgment before `gh issue edit`.

## 5. Consequences for Aegis (INFERRED, for P4/M4 chartering)

- The upstream minimal fix is **larger than the scout's S–M estimate**: nonce guards alone
  are a partial fix; a defensible PR must also handle automine fee validation, and a robust
  one adds mint-aware funds validation, replacement/update semantics, and miner ordering.
  §e of the scout doc re-estimated accordingly.
- The M4 L1-only gate posture ([[INS-e14fbbbc]]) is **unchanged** — none of this weakens the
  L1 path; it strengthens the case that the OP waiver stays unexercised until upstream moves.
- Tripwire in [[IDEA-94b7ef88]] line 10 stands: any EDR release referencing #1578 → re-run
  the S6 gate before any OP claim strengthens.
