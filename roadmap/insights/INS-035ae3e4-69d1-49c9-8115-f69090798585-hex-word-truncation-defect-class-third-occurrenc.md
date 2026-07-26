---
id: INS-035ae3e4-69d1-49c9-8115-f69090798585
type: insight
title: "Hex/word truncation defect class — third occurrence — needs full-word-decoder teeth"
status: candidate
informs: ["W6"]
review_when: date:2026-08-09
updated: 2026-07-26
---

# INS-035ae3e4-69d1-49c9-8115-f69090798585 — Hex/word truncation defect class — third occurrence — needs full-word-decoder teeth

**Context.** Three independent strikes of the same class — a hex value read or spliced at less
than its full width, producing a wrong-but-plausible number:
1. **Timelock delay** `0x3f480` misread (correct decode: 259 200 s) — corrected in WR5's own
   disposition (wr5-ruling.md:150).
2. **Candidate A `confirmations`**: WR5 reads 32 where WR1:1381 records 64 from the same
   artifact — a contested expected value that was *not* dispositioned until the wave-1
   correction round (wr5-ruling.md:136,150 — "third hex-misread in the corpus").
3. **Control-plane sibling:** the W0B receipt-mint script carried a contract fingerprint
   truncated to 59 hex chars by a copy-paste splice — caught only by a pre-run re-read;
   mitigated since with `assert len(...) == 71` in every mint script.

**Consequence / the rule.** No numeric or identity value decoded from calldata, storage, or a
fingerprint may be produced by eye or by substring. Every decode must consume the **full
32-byte word** (or full digest width) through a decoder, and every hand-carried hash must be
length-asserted at the point of use.

**Addendum (S6/S7 spikes, 2026-07-26 — strikes 4 and 5).** The rehearsal-master's spike
self-reported two further occurrences: hand-converted block-number hex `0x7f51ab7` (=
133503671, 4,992 blocks off the target 133508663) and `0x151014a` (= 22085962, not
22099914) — both caught only because fetch scripts computed values programmatically, and
all downstream evidence from the bad probes was discarded. The rule is hereby BROADENED per
the spike's recommendation: **any block number, calldata word, or numeric literal appearing
in a deliverable must be produced by executed code, never by hand** — hand hex conversion
is empirically the single most reliable source of error in this corpus.

**Teeth (to land with the first calldata-decoding surface, P4/W6).** A decoder test suite that
includes a **truncated-literal fixture**: a fixture whose value is a truncation of the real
word, which the full-word decoder MUST reject or decode differently, so the test fails if
anyone reintroduces substring decoding. Recommended by the rehearsal-master ruling
(wr5-ruling.md:150); complements the existing mint-script length asserts.
