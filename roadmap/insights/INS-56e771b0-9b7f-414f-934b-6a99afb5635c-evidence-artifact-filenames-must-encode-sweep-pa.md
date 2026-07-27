---
id: INS-56e771b0-9b7f-414f-934b-6a99afb5635c
type: insight
title: "evidence artifact filenames must encode sweep parameters or content digest"
status: candidate
informs: ["W6"]
review_when: date:2026-08-10
updated: 2026-07-27
---

# INS-56e771b0-9b7f-414f-934b-6a99afb5635c — evidence artifact filenames must encode sweep parameters or content digest

**Context.** The G35 evidence lane (chain-historian, 2026-07-26) wrote sweep artifacts to
parameter-independent filenames (`raw/gap5_delegateset_ETH_{mevblocker,tenderly}.bin`). Two
runs of the same sweep at different step sizes (1M then 250k) wrote the SAME path, so the
later run silently overwrote the earlier exhibit. Self-disclosed in the dossier
([[g35-dossier.md]] §9.2) rather than cleaned up.

**Evidence.** The acquisition ledger (`ledger.jsonl`, archived at
`aegis-evidence-archive/2026-07-26-scratchpad/g35/`) still carries both rows with their
digests; the on-disk bytes hash to only ONE of them. The ledger's integrity is what made the
loss detectable — a lane without per-acquisition digests would never have noticed.

**Consequence.** A content-addressed ledger detects exhibit loss but cannot prevent it.
Binding rule for every future evidence lane, and a design input for the M2 evidence-custody
store (S4) and W6 fixture corpus: artifact filenames must encode the sweep parameters or
(better) the content digest, so a re-run can never overwrite an exhibit — collisions become
either identical-content no-ops or new files. Write-once semantics (fail on existing path)
are an acceptable stricter alternative.
