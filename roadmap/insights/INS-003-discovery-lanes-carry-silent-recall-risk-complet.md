---
id: INS-003
type: insight
title: Discovery lanes carry silent-recall risk: completeness critic before close
status: accepted
informs: [H0]
review_when: date:2026-08-05
updated: 2026-07-22
---

# INS-003 — Discovery lanes carry silent-recall risk: completeness critic before close

Owner concern (2026-07-22): a mid-tier lane model can miss insights that never even reach
review — the report looks complete, and nothing flags what isn't in it.

Classification:
- **Closed-world lanes** (enumeration against a known field list, e.g. WR1's manifest
  fields): omissions are structurally loud (empty/unknown rows), and the product itself
  backstops them (live decoding turns missing expected values into visible `unknown`
  coverage). Mid-tier models fine.
- **Open-world discovery lanes** (candidate hunting, e.g. WR4/WR5; unprompted cross-cutting
  catches like WR2's ABI-epoch mismatch): silent-miss risk is real and review of the
  deliverable cannot catch it.

Standing practice: before closing a discovery-shaped lane, run a **completeness-critic
pass** — an independent agent (different model/vendor when possible, per [[INS-002]]) given
only the charter, asked "what candidates, search angles, or hazards did this deliverable
miss?" Diff, not redo. Findings either extend the deliverable or are recorded as accepted
gaps in its Unknown section.
