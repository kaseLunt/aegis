<!-- EDR fix-site scout report — 2026-07-26. Persisted verbatim by the orchestrator from the
scout lane's final report. Read-only reconnaissance of NomicFoundation/edr at
c66cd68aaa3cd7a5af1968a2933fe7bc5db9f809 (all cited files byte-identical to the
@nomicfoundation/edr@0.14.2 tag, 375a4552 — verified by git diff). Companion to
edr-upstream-issue-draft.md (issue #1578) and spike-s6-s7.md. HEADLINES: rejection site
located (mem_pool/src/lib.rs:493-499 + data.rs:1648-1662 under automining); the receipt half
of our issue's ask is ALREADY implemented upstream (the spike's 0x0 was an artifact of its
own workaround); EDR's block_replay test path bypasses the mempool and asserts full header
equality — the mempool is the sole blocker; minimal fix S-M via an IsDeposit marker trait
following the existing IsEip4844 precedent, robust fix L (sourceHash-keyed, op-geth-style).
Follow-up comment DRAFT at the end — awaiting owner go/no-go before posting. -->

# EDR fix-site scout — issue #1578 follow-up reconnaissance

## (a) Pinned SHA + nearest release tag

| | |
|---|---|
| **Scouted SHA (default branch `main` head)** | `c66cd68aaa3cd7a5af1968a2933fe7bc5db9f809` (2026-07-24, "test(solx-parity-sweep)… (#1572)") |
| **Nearest 0.14.x tag** | `@nomicfoundation/edr@0.14.2` → `375a455277e60040cc023d1a666a80b17ef7f142` — the exact version in the issue |
| Also present | `@nomicfoundation/edr@0.14.0` → `fcef9c46`, `@nomicfoundation/edr@0.14.1` → `b68e9664` |

**Every file cited below is byte-identical between the `0.14.2` tag and the scouted HEAD.** Verified with `git diff --name-only @nomicfoundation/edr@0.14.2 c66cd68a -- crates/mem_pool crates/edr_provider crates/edr_op crates/block crates/edr_transaction crates/test/block_replay` (77 files changed repo-wide; the only changed files in those crates are `block/header/src/lib.rs`, `block/header/src/overrides.rs`, `block/storage/src/reservable.rs`, `edr_op/src/spec.rs`, `edr_provider/src/data/call.rs`, `edr_provider/src/requests/eth/blocks.rs`, `edr_provider/src/test_utils.rs`, and four `edr_provider/tests/` files — none cited by line number, except `block/header/src/lib.rs` where flagged). So line numbers are valid at **both** 0.14.2 and current main.

Clone note: `git clone` needs `core.longpaths true` + sparse-checkout on Windows (a `hardhat-tests/…/nested-arrays-as-public-parameter` path exceeds MAX_PATH).

## (b) Flow trace: `eth_sendRawTransaction` → the rejection (all OBSERVED)

| # | Hop | file:line |
|---|---|---|
| 1 | napi `Provider::handle_request` | `crates/edr_napi/src/provider.rs:159` |
| 2 | `SyncProvider::handle_request` | `crates/edr_napi_core/src/provider.rs:30` |
| 3 | `Provider::handle_request` | `crates/edr_provider/src/provider.rs:158` |
| 4 | `handle_single_request` | `crates/edr_provider/src/provider.rs:194` |
| 5 | `MethodInvocation::SendRawTransaction` dispatch arm | `crates/edr_provider/src/provider.rs:331-334` |
| 6 | `handle_send_raw_transaction_request` | `crates/edr_provider/src/requests/eth/transactions.rs:184` |
| 6a | RLP decode — where `0x7e` vs `0x7d` discriminates | `…/transactions.rs:200-207` → `crates/edr_op/src/transaction/pooled.rs:76` → `crates/edr_op/src/transaction/signed.rs:39-57` |
| 6b | `validate_send_raw_transaction_request` (chainId / EIP-3860 / hardfork — **no nonce check**) | `…/transactions.rs:209`, fn at `:325` |
| 6c | `send_raw_transaction_and_log` | `…/transactions.rs:217`, fn at `:278` |
| 7 | `ProviderData::send_transaction` | `crates/edr_provider/src/data.rs:2532` |
| 7a | EIP-4844 type-specific bypass branch (**the existing precedent for this kind of special-case**) | `crates/edr_provider/src/data.rs:2537-2564` |
| 7b | if automining → `validate_auto_mine_transaction` → **second nonce check** | `crates/edr_provider/src/data.rs:2566-2575`, fn at `:1642`, check at `:1648-1662` |
| 8 | `add_pending_transaction` | `crates/edr_provider/src/data.rs:2577-2583`, fn at `:1291` |
| 9 | `self.mem_pool.add_transaction(&*state, transaction)` | `crates/edr_provider/src/data.rs:1299` |
| **10** | **`MemPool::add_transaction` — the rejection** | **`crates/mem_pool/src/lib.rs:493-499`** (fn at `:459`) |
| 10a | The error variant + literal format string | `crates/mem_pool/src/lib.rs:132-141` (message at `:134`) |
| 11 | Mapped to JSON-RPC `-32000` | `crates/edr_provider/src/error.rs:257-259` (variant), `:528` → `INVALID_INPUT` at `:39` |

The error string is EDR's own — **not** in revm/op-revm.

The rejecting code:
```rust
// crates/mem_pool/src/lib.rs:493-499
let sender = state.basic(*transaction.caller())?.unwrap_or_default();
if transaction.nonce() < sender.nonce {
    return Err(MemPoolAddTransactionError::NonceTooLow {
        transaction_nonce: transaction.nonce(),
        sender_nonce: sender.nonce,
    });
}
```
and the value it reads:
```rust
// crates/edr_op/src/transaction/signed/deposit.rs:95-100
fn nonce(&self) -> u64 {
    // Before Regolith: the nonce is always 0
    // With Regolith: the nonce is set to the depositNonce attribute of the
    // corresponding transaction receipt.
    0
}
```
The in-tree comment already documents that this `0` is a placeholder, not a real nonce.

Note the second site: with automining **on** (Hardhat's default) the request never reaches the mempool — it fails earlier at `data.rs:1648` with `AutoMineNonceTooLow` ("Nonce too low. Expected nonce to be … Note that transactions can't be queued when automining.", `crates/edr_provider/src/error.rs:166-172`). The reported message is the mempool variant, consistent with automining off.

## (c) Fix-shape analysis

### The good news: the receipt half is already correct — OBSERVED

```rust
// crates/edr_op/src/receipt/execution.rs:106-115
fn new_receipt_builder<StateT: State>(pre_execution_state: StateT, transaction: &OpSignedTransaction)
    -> Result<Self, StateT::Error> {
    let deposit_nonce = pre_execution_state
        .basic(transaction.caller())?
        .map_or(0, |account| account.nonce);
    Ok(Self { deposit_nonce })
}
```
used at `crates/edr_op/src/receipt/execution.rs:128-140`, gated on `transaction_type() == OpTransactionType::Deposit`, with `deposit_receipt_version: Some(1)` post-Canyon. **The issue's "record the depositor's current nonce at execution" ask is already implemented.** The spike saw `depositNonce 0x0` only because its workaround forced the account nonce to 0. Remove the admission barrier and the correct value falls out with no receipt-side change.

### Stronger corroboration: EDR's own block-builder path already reproduces canonical OP receipts roots — OBSERVED (code), INFERRED (currently green)

- `crates/test/block_replay/src/lib.rs:225-227` feeds canonical transactions **directly into `builder.add_transaction(...)`, bypassing the mempool entirely**.
- `crates/test/block_replay/src/lib.rs:377-385` asserts full execution-receipt equality (for deposits that includes `deposit_nonce`, per `crates/edr_op/src/receipt/execution/deposit.rs:10-28`).
- `crates/test/block_replay/src/lib.rs:388` — `assert_eq!(replay_header, mined_header)`, full `BlockHeader` equality including `receipts_root` and `state_root` (field list at `crates/block/header/src/lib.rs:35-75` **at HEAD**; that file did change since 0.14.2, so treat those line numbers as HEAD-only).
- Instantiated for OP mainnet at `crates/edr_op/tests/integration/full_block.rs:11-82` — Regolith `105_235_064`, Canyon, Ecotone `121_874_088`, Granite, Holocene `130_423_412`/`+1`, Isthmus+1, Jovian. All contain an index-0 L1-attributes deposit at real forked state where the depositor's nonce is far from zero.
- CI runs `--all-features` (includes `test-remote`, `crates/edr_op/Cargo.toml:66-67`) with `ALCHEMY_URL` — `.github/workflows/edr-ci.yml:127-128` and `:212`.

INFERRED: those tests currently pass (not run here — they need remote RPC). If so, execution + receipt building are already canonical for deposits at nonzero account nonce, and **the mempool is the only thing standing between EDR and byte-exact OP block replay over JSON-RPC.**

### The discriminant is available — but not where the check runs — OBSERVED

Available in `edr_op`: `OpSignedTransaction::Deposit(Deposit)` (`crates/edr_op/src/transaction/signed.rs:36`); `OpTransactionType::Deposit = 0x7E` (`crates/edr_op/src/transaction.rs:29-30`, `crates/edr_op/src/transaction/signed/deposit.rs:51`); `OpTxTrait::source_hash()` returns `Some` only for deposits (`crates/edr_op/src/transaction/signed.rs:191-196`).

**Not** available at the check site: `MemPool<SignedTransactionT: ExecutableTransaction>` (`crates/mem_pool/src/lib.rs:206`) is chain-agnostic, and `crates/mem_pool/Cargo.toml` depends only on `edr_chain_spec`, `edr_primitives`, `edr_state_api`, `edr_transaction`, `indexmap`, `thiserror`. A case-insensitive `grep deposit` over `crates/edr_provider`, `crates/mem_pool`, `crates/block` returns **zero** `.rs` hits — that whole layer is deposit-unaware.

Established precedent for exactly this: the marker traits `IsEip155` / `IsEip4844` / `IsLegacy` / `IsSupported` at `crates/edr_transaction/src/lib.rs:196-219` (impls for OP at `crates/edr_op/src/transaction/signed.rs:151-170`), consumed by generic provider code at `crates/edr_provider/src/data.rs:2537`. `edr_mem_pool` **already depends on `edr_transaction`**, so a sibling `IsDeposit` trait is in scope at the check site with no new dependency edge. — INFERRED (design), OBSERVED (the deps and precedent).

### Honest complications — this is more than one guard clause

All OBSERVED code; the consequences are INFERRED.

1. **Second admission site.** `crates/edr_provider/src/data.rs:1648-1662` needs the same predicate, or the fix works only with automining off.
2. **Replacement detection collides.** `crates/mem_pool/src/lib.rs:538-556` treats same-`(sender, nonce)` as a replacement. Two deposits from one sender in a block both carry nonce `0` → the second silently replaces the first, and `validate_replacement_transaction` (`:658-690`) waves it through because both gas prices are `0` (`min_new_fee(0) == 0`, `:692-701`).
3. **`update()` silently evicts queued deposits.** `is_valid_tx` (`crates/mem_pool/src/lib.rs:374-383`) requires `nonce() >= sender.nonce`; the consecutive-nonce invariant at `:403-415` would shunt a deposit to the future queue. `update()` runs after **every** mined block (`crates/edr_provider/src/data.rs:1480-1482`) and on `hardhat_setBalance` / `hardhat_setNonce` (`:1026`, `:1184`). For the narrow replay flow (automine off → submit N → mine once) no `update()` intervenes, so a guard alone does unblock it — but the state is fragile by construction.
4. **Pending/future partition happens to work.** `crates/mem_pool/src/lib.rs:510-520`: nonce `0` is never `> next_nonce`, so a deposit lands in *pending*. Correct by accident.
5. **Mine ordering.** Deposits hardcode `gas_price() == 0` (`crates/edr_op/src/transaction/signed/deposit.rs:77-81`). Under `MineOrdering::Priority` the comparator (`crates/block/miner/src/lib.rs:623-641`) sorts by effective miner fee → a deposit sorts **last**, whereas OP consensus requires deposits first. `MineOrdering::Fifo` (`:269`, `:616-621`) preserves submission order. Also `crates/block/miner/src/lib.rs:280-283` drops the caller entirely if `min_gas_price > 0`.
6. **Pending-nonce reporting.** `account_next_nonce` (`crates/mem_pool/src/lib.rs:636-649`) reads `last_pending_nonce`, so while a deposit sits pending, `eth_getTransactionCount(depositor, "pending")` reports `1`. Cosmetic, but a symptom of the same mismatch.
7. **Test fixture is L1-only.** `MemPoolTestFixture` is hardcoded to `MemPool<L1SignedTransaction>` (`crates/test/mem_pool/src/lib.rs:13-18`); an OP mempool unit test needs it made generic or a sibling fixture.

**Assessment:** a guard at `crates/mem_pool/src/lib.rs:494` + `crates/edr_provider/src/data.rs:1648` is a genuine, small fix that unblocks the canonical-replay use case in its normal shape (≤1 deposit per sender per block, submitted then mined). The architecturally clean version — keying deposits by `sourceHash` and keeping them out of the nonce-ordered queues, the way op-geth keeps deposits out of the txpool and injects them from payload attributes — is a larger refactor of `MemPool`'s internals. Both are defensible; that's the maintainers' call.

### Repo conventions — OBSERVED

- `CONTRIBUTING.md` is 8 lines and covers only the small-PR/airdrop-farming policy. No style or process guide.
- **Every PR needs a changeset** or a `no changeset needed` label — `.github/workflows/check-changeset-added.yml:1-40`; `.changeset/` holds the pending ones.
- No `CODEOWNERS`, no PR template.
- Existing deposit-touching tests: `crates/edr_op/tests/integration/rpc.rs:48` (`block_with_deposit_transaction`), `:101` (`deposit_transaction_and_receipt_regolith`, carrying `// TODO: https://github.com/NomicFoundation/edr/issues/1112`), `crates/edr_op/src/transaction/signed/deposit.rs:164-189` (deposit tx-hash unit test), `crates/edr_op/src/receipt/execution.rs:275` and `crates/edr_op/src/rpc/receipt.rs:221` (`deposit_nonce: 0x1234` round-trip fixtures). **No test anywhere submits a deposit through `eth_sendRawTransaction`.**
- Execution engine: `op-revm` 19.0.0 / `revm` 38.0.0 (`Cargo.toml:217`, `Cargo.lock:6108-6110`, `:6983-6985`), `OpEvm` built at `crates/edr_op/src/spec.rs:157` and `:206`.

## (d) DRAFT follow-up comment for issue #1578 — AWAITING OWNER GO/NO-GO

> **Follow-up: I read the source to try to locate the check, in case it's useful.**
>
> I traced this at `c66cd68aaa3cd7a5af1968a2933fe7bc5db9f809` (current `main`). I also checked that every file below is byte-identical between that commit and the `@nomicfoundation/edr@0.14.2` tag (`375a455277e60040cc023d1a666a80b17ef7f142`), so the line numbers should apply to the release I tested as well. You know the architecture far better than I do, so please treat all of this as a report rather than a diagnosis.
>
> **Where the message comes from.** The string is EDR's own, not revm's: `MemPoolAddTransactionError::NonceTooLow` at `crates/mem_pool/src/lib.rs:132-141`, raised in `MemPool::add_transaction` at `crates/mem_pool/src/lib.rs:493-499`, surfaced as `-32000` via `crates/edr_provider/src/error.rs:528`.
>
> **How a deposit reaches it.** `provider.rs:331-334` → `requests/eth/transactions.rs:184` (`handle_send_raw_transaction_request`) → `data.rs:2532` (`send_transaction`) → `data.rs:1291` (`add_pending_transaction`) → `data.rs:1299` → the check. `validate_send_raw_transaction_request` (`transactions.rs:325`) doesn't check nonces, so the mempool is the first nonce gate. Note there's a second one at `data.rs:1648-1662` (`validate_auto_mine_transaction`) that fires first when automining is on — I hit the mempool one because my harness mines manually.
>
> The value being compared is the deposit's hardcoded placeholder at `crates/edr_op/src/transaction/signed/deposit.rs:95-100`, whose own comment notes it isn't a real nonce.
>
> **The half I got wrong in the original report.** I asked for `depositNonce` to record the depositor's nonce at execution — that's already implemented, at `crates/edr_op/src/receipt/execution.rs:106-115`, reading `pre_execution_state.basic(caller).nonce`. I only saw `0x0` because my workaround forced the account's nonce to `0`. So no receipt-side change appears to be needed at all.
>
> What made this click: `crates/test/block_replay/src/lib.rs:225-227` feeds canonical transactions straight into `builder.add_transaction(...)`, skipping the mempool, and then asserts full header equality (including `receiptsRoot`) at `:388` plus full execution-receipt equality at `:377-385`. `crates/edr_op/tests/integration/full_block.rs` runs that over OP mainnet blocks from Regolith through Jovian, all of which have an index-0 deposit at nonzero depositor nonce. If those are green, the execution and receipt paths are already canonical and the mempool is the only thing in the way of the JSON-RPC path.
>
> **The shape a fix might take.** `MemPool` is generic over `ExecutableTransaction` and `edr_mem_pool` doesn't depend on `edr_op`, so there's no deposit discriminant in scope at `lib.rs:494` today. It does already depend on `edr_transaction`, where `IsEip4844` / `IsLegacy` / `IsSupported` live (`crates/edr_transaction/src/lib.rs:196-219`) — and `data.rs:2537` already uses exactly that pattern to special-case blob transactions in generic provider code. A sibling predicate consulted at `mem_pool/src/lib.rs:494` and `data.rs:1648` would follow the existing grain.
>
> **Where I think it's more than a guard clause, in case it matters for scoping.** A few other places in the same file assume nonce ordering:
> - `lib.rs:538-556` — replacement detection keys on `(sender, nonce)`. Two deposits from one sender both read nonce `0`, so the second looks like a replacement, and `validate_replacement_transaction` (`:658-690`) passes trivially since both gas prices are `0`.
> - `lib.rs:374-383` + `:403-415` — `update()` drops anything with `nonce < sender.nonce`, and `update()` runs after every mined block (`data.rs:1480-1482`) and on `hardhat_setBalance`/`setNonce` (`data.rs:1026`, `:1184`). A queued-but-unmined deposit wouldn't survive. In the submit-then-mine-once flow no `update()` intervenes, so a guard would work there, but it's load-bearing on timing.
> - `crates/block/miner/src/lib.rs:623-641` — under `MineOrdering::Priority` a deposit's zero effective fee sorts it last, while OP wants deposits first. `Fifo` preserves submission order.
>
> So the minimal version looks small and would unblock canonical replay in its normal shape; the fully robust version probably means keying deposits by `sourceHash` and keeping them out of the nonce-ordered queues entirely, closer to how op-geth keeps deposits out of the txpool. I don't have a view on which you'd prefer.
>
> If the minimal direction is acceptable, I'm happy to submit a PR — guard plus a mempool unit test and an `eth_sendRawTransaction` deposit-admission test under `crates/edr_op/tests/integration/`, with a changeset. (`crates/test/mem_pool/src/lib.rs:13-18` is currently hardcoded to `L1SignedTransaction`, so that fixture would need to be generic or get an OP sibling.) And equally happy to leave it with you if the deeper restructuring is the right call — just let me know either way.

## (e) PR complexity estimate

**S–M.** The guard itself is ~10 lines across two call sites; the cost is threading a chain-agnostic deposit predicate (new trait in `edr_transaction` + impls for every `SignedTransaction` type + generic bounds on `MemPool::add_transaction` and `ProviderData::send_transaction`) and making the L1-hardcoded `MemPoolTestFixture` generic. **Main risk:** the guard alone leaves three latent nonce-ordering assumptions in `MemPool` (same-sender deposit replacement, `update()` eviction, priority-ordering) — so maintainers may reasonably want the larger `sourceHash`-keyed restructuring instead, which would turn this into an L.
