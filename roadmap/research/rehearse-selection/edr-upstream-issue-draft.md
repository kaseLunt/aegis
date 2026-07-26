# DRAFT — upstream issue for NomicFoundation/edr (owner posts or approves posting)

Status: DRAFT for owner review. Repro facts from spike-s6-s7.md §1 (all OBSERVED on EDR
0.14.2, win32-x64, node 22.20.0). Post to: https://github.com/NomicFoundation/edr/issues

---

**Title:** OP deposit transactions (type 0x7E) are rejected by mempool nonce validation, making canonical block replay impossible

## Summary

When forking an OP-stack chain, `eth_sendRawTransaction` applies ordinary mempool nonce
validation to type-`0x7E` deposit transactions. Per the OP-stack spec, deposit transactions
carry **no nonce field** (they are identified by `sourceHash`), so the envelope's nonce
reads as `0` and any depositor account with a nonzero nonce rejects the deposit with
`"Transaction nonce too low"`. Because the receipt's `depositNonce` field — which is part of
the OP receipts-root preimage — records the depositor account nonce at execution, admission
and receipt fidelity are mutually exclusive: no configuration of the public API can replay a
canonical OP block (after the first) and reproduce its `receiptsRoot`.

Spec reference: https://specs.optimism.io/protocol/deposits.html — "deposit transactions do
not include a nonce; they are identified by sourceHash."

## Reproduction (EDR 0.14.2, `@nomicfoundation/edr-win32-x64-msvc`, node v22.20.0)

Target: OP Mainnet block `133508663` (hash `0xec31e350828a195c0e6450150dbfbfc086235e310ebd1c12cc1b96ff7a34eedc`),
whose index-0 deposit is the L1-attributes transaction
(`0x2a46841e31d63f4d9010a0f45812de5f431be967719388daa14048a91e75246c`,
`from 0xdeaddead…dead0001`, canonical receipt `depositNonce 0x1af6bc1` = 28273601).

1. Create a provider via `opProviderFactory` forked at parent block `133508662`.
2. Submit the canonical deposit envelope (byte-exact; `keccak256(envelope)` equals the
   canonical tx hash) via `eth_sendRawTransaction`.
3. Observed: `{"code":-32000,"message":"Transaction nonce too low. Expected nonce to be at
   least 28273601 but got 0."}`

That this is nonce validation (not a type/parse failure) is discriminated by:
- `0x7e` + malformed payload → `-32602 "input too short"` (deposit parser engaged);
- `0x7d` + same payload → `-32602 "Invalid transaction type 125."`.

The two available workarounds each fail one side of the bind:
- **genesisState `AccountOverride.nonce = 0` for the depositor** → deposit is ACCEPTED and
  executes correctly (canonical tx hash, status, gas), but the receipt records
  `depositNonce 0x0` ≠ canonical `0x1af6bc1` → receipts root diverges.
- **AccountOverride.nonce = 28273601 (canonical)** → submission rejected as above.
- `hardhat_setNonce` refuses to decrease a nonce, so it cannot bridge the two.

With the single override (depositor nonce → 0), a full 35-transaction replay of the block
reproduces `gasUsed`, `baseFeePerGas`, timestamp, and 34/35 receipts exactly — the sole
divergence is the deposit receipt's `depositNonce`, which is consensus-load-bearing for the
OP receipts root (verified with an independent `0x7e || rlp([status, cumulativeGas, bloom,
logs, depositNonce, depositReceiptVersion])` trie deriver that reproduces the canonical root
from canonical receipts, and reproduces EDR's reported root from EDR's receipts).

## Expected behavior

Deposit transactions should bypass mempool nonce admission (they have no nonce field to
validate), and the receipt's `depositNonce` should record the depositor account's current
nonce at execution — matching op-geth/op-reth behavior — so that replaying a canonical OP
block reproduces its canonical `receiptsRoot`.

## Environment

- `@nomicfoundation/edr` 0.14.2 (`@nomicfoundation/edr-win32-x64-msvc`)
- node v22.20.0, win32 x64
- Fork source: `https://mainnet.optimism.io`

Additional minor observations from the same session, reported for completeness (can split
into separate issues if preferred):
- `edr.OpHardfork` is declared as an enum in `index.d.ts` but is `{}` at runtime; the
  string constants (e.g. `edr.HOLOCENE`) are the only working source, and
  `opHardforkFromString` accepts exact PascalCase only.
- `AccountOverride.storage` is declared but non-functional (tracked as #911).

Context: found while evaluating EDR as the OP replay engine for an open-source verification
tool; full spike write-up (methodology, self-proofs, negative tests):
https://github.com/kaseLunt/aegis/blob/main/roadmap/research/rehearse-selection/spike-s6-s7.md

---

# END DRAFT
