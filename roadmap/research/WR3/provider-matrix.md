# WR3 — Provider and archive feasibility matrix

Status: research rationale (SOURCE_REGISTER class: "Official documentation or blog" unless
noted). Nothing in this file is deployment evidence. Every capability cell is a *declared*
capability with a test method; Aegis promotes a cell to trusted configuration only after a
live probe with recorded raw responses. No credentials or API keys appear in this file or
this lane.

Retrieval date for all provenance below: **2026-07-21** (single research session).
Chains in scope: **Ethereum mainnet (chainId 1)** and **OP Mainnet (chainId 10)**.

Legend for matrix cells:

| Mark | Meaning |
| --- | --- |
| D | Declared in the provider's own docs/pricing (provenance row cited) |
| D- | Declared with a restriction or contradiction noted in the cell |
| I | Inferred from underlying client software or ecosystem norms; provider does not document it |
| U | Undocumented / could not be established from public docs; probe required before any reliance |
| N | Declared *not* available (on the referenced tier) |

Every cell, including D cells, has a probe defined in "Test methods". D only raises the
prior; it never substitutes for the probe.

---

## 1. Providers surveyed

Core candidates: Alchemy, Infura (MetaMask Developer / Consensys), QuickNode, Ankr, dRPC,
LlamaRPC (LlamaNodes), PublicNode (Allnodes), Chainstack, Tenderly. Added as strong
candidates: Blockdaemon (institutional, own fleet), Grove (Pocket Network gateway).

Considered but not assessed in depth (time-boxed; none looked likely to change the quorum
recommendation): BlockPi, GetBlock, NOWNodes, 1RPC (Automata relay over third-party
providers — same aggregator objection as dRPC), Cloudflare Ethereum gateway (no OP
support, minimal API surface).

---

## 2. Capability matrix — Ethereum mainnet

| Provider | `finalized`/`safe` tags | EIP-1898 block-hash reads | Archive depth | trace/debug | Historical fork / simulation | Free tier (verifier-relevant) |
| --- | --- | --- | --- | --- | --- | --- |
| Alchemy | I (standard geth-lineage tags; not re-verified on Alchemy's own eth_call page this session) | D — docs show `{"blockHash": ...}` object for `eth_call` [P-A3] | D — archive access included, billed in CU; free-tier page carves out "archival data beyond 30M CU" [P-A1] | D- — Trace API (`trace_*`) ETH mainnet + Sepolia only, PAYG/Enterprise tier; Debug API (`debug_trace*`) requires Growth/Enterprise per one page, "included in PAYG" per pricing page — docs disagree, probe the actual tier gate [P-A2][P-A4][P-A1] | D — `debug_traceCall` at historical blocks; `alchemy_simulateExecution`; state overrides U | D — 30M CU/month, 500 CU/s (~25 rps); trace/debug excluded from free [P-A1] |
| Infura (Consensys) | D — eth_call block param documented as `latest/earliest/pending/safe/finalized` on the same doc family (verified on Polygon/Base pages; ETH page returned 404 to our fetcher) [P-I4] | U on own docs; third-party (ethers.js maintainers) state Infura supports EIP-1898 — probe required [P-E2] | D — archive included on all tiers including free [P-I1] | D — `trace_*` documented for Ethereum, "open beta, paying customers"; debug/trace from Developer ($50/mo) tier [P-I1][P-I5] | U — no fork service; `debug_traceCall`/`trace_call` at historical blocks presumed with archive, probe | D — 3M credits/day, 500 credits/s free [P-I1] |
| QuickNode | D — eth_call doc: tags `safe`/`finalized` supported on Ethereum [P-Q2] | U — not on eth_call doc page; probe | D — "archive data" included on all tiers including free [P-Q1] | D — Trace & Debug included on all *paid* tiers (Build $49+); not on free [P-Q1] | U — no fork service; historical `debug_traceCall` presumed with archive, probe | D — 10M API credits/month, 15 rps free [P-Q1] |
| Ankr | U — not documented; probe | U — not documented; probe | D — archive data on free/freemium and premium [P-K1] | D- — debug/trace **Premium only** (PAYG) [P-K1] | U — no fork service | D — freemium ~1,800 req/min, 200M API credits/month; no debug/trace [P-K1] |
| dRPC | U per terminal operator — aggregator; tag semantics can differ per backend node; probe for cross-request consistency | U — same aggregator caveat | D — archive supported on the network; per-request backend varies [P-D2] | D- — trace/debug **disabled on free tier**; paid only [P-D1] | U | D — 210M CU/30 days; ~2,100 CU/s burst, 120k CU/min/IP typical; trace/debug/filter methods disabled [P-D1] |
| LlamaRPC (LlamaNodes) | U — docs unreachable this session (403/404) | U | U | U | U | Public endpoint `eth.llamarpc.com` live; limits undocumented/unreachable [P-L1][P-L2] |
| PublicNode (Allnodes) | I — geth-lineage backends; probe | U | U — Allnodes sells archive hosting; whether the free PublicNode ETH endpoint serves deep state is not documented; probe [P-N2] | U — very unlikely on free public endpoint; probe | N (none advertised) | D — free, keyless, "no rate limits" marketing claim; no SLA, no contract [P-N1][P-N2] |
| Chainstack | I — geth-lineage; probe | U — not documented; probe | D- — **no archive on free Developer tier**; archive from Growth ($49/mo), archive request = 2 RU [P-C1] | D- — debug & trace from Growth tier; not on free [P-C1][P-C2] | U — no fork service | D — 3M RU/month, 25 rps free; no archive, no debug/trace [P-C1] |
| Tenderly | I — probe | U — probe | D — "full archive data on every supported network" [P-T2] | D — debug/trace (40 TU/req) plus proprietary `tenderly_traceTransaction` decoded traces [P-T3][P-T4] | D — best in class: `tenderly_simulateTransaction`, `tenderly_simulateBundle`, Virtual TestNets fork at chosen (incl. historical) block, state overrides [P-T1][P-T2] | N — **Node RPC excluded from free plan**; paid/custom pricing only [P-T3][P-T5] |
| Grove (Pocket gateway) | U per terminal operator — decentralized supply; probe consistency | U — same caveat | U — "archival" chain variants exist on Pocket; per-endpoint, probe | U | N | D (conflicting numbers) — sources this session show "1M relays/day free" and "Always Free 30 rps"; older sources show 100k/day; treat as unresolved [P-G1] |
| Blockdaemon | U — probe | U — probe | U — archive per protocol not confirmed in fetched pages; probe | U — per-protocol; probe | U | D — free API key for testing; Starter 65M CU/month at 100 rps (paid) [P-B1] |

## 3. Capability matrix — OP Mainnet (chainId 10)

OP-specific baseline (applies to every provider):

- `finalized`/`safe` on OP are derived from L1: an L2 block is `safe` once its batch data
  is on L1, `finalized` once that L1 block is finalized (~20–30 min) [P-O1]. A provider's
  OP `finalized` head must lag its `unsafe` head accordingly — this is itself a probe.
- Pre-Bedrock history (blocks before 105,235,063, 2023-06) cannot be executed by modern
  op-geth; stateful calls (`eth_call`, `debug_trace*`) against pre-Bedrock blocks require
  the provider to run/route to legacy `l2geth` [P-O2]. Archive depth on OP therefore has
  **two** cells in practice: post-Bedrock depth and pre-Bedrock depth. Aegis's ether.fi
  scope is post-Bedrock-era contracts, so pre-Bedrock is a documentation item, not a
  requirement.
- The `trace_*` (Parity/OpenEthereum-style) namespace is generally absent from op-geth;
  it exists only where a provider runs op-erigon or a translation layer. `debug_trace*`
  is the portable namespace on OP.

| Provider | `finalized`/`safe` tags | EIP-1898 | Archive (post-Bedrock) | trace/debug | Fork / simulation | Free tier |
| --- | --- | --- | --- | --- | --- | --- |
| Alchemy | I — probe (OP supported as a chain [P-A1]) | I — same doc family as ETH; probe | I — archive billed in CU; probe depth | D- — `debug_traceCall` declared multi-chain incl. Optimism [P-A4]; `trace_*` **not** available (ETH-only) [P-A2] | D — `debug_traceCall` historical; `alchemy_simulateExecution` U on OP; probe | Same 30M CU/month pool |
| Infura | I — probe | U — probe | U — archive-on-all-tiers claim is generic; probe OP depth [P-I1] | U — OP debug/trace not documented (Linea/Mantle are; Optimism page not confirmed this session) [P-I5]; probe | U | Same 3M credits/day pool |
| QuickNode | **D- — QuickNode's own eth_call doc says `safe`/`finalized` are supported only on Ethereum, Gnosis, Arbitrum, Arbitrum Nova, Avalanche — i.e. NOT declared for Optimism** [P-Q2]. High-priority probe; if true, confirmation-depth fallback policy applies (ENGINEERING_SPEC "Block selection") | U — probe | D — "archive access enabled and no pruning" on OP [P-Q3] | D — `debug_traceTransaction`, `debug_traceBlock*` AND `trace_block`/`trace_*` documented for Optimism (implies op-erigon-class backend) [P-Q3] | U | Same 10M credits/month pool |
| Ankr | U | U | D — premium archive on OP [P-K1] | D- — Premium only [P-K1] | U | Same freemium pool |
| dRPC | U + consistency risk | U | D (network-level) [P-D2] | D- — paid only [P-D1] | U | Same 210M CU pool |
| LlamaRPC | U — OP endpoint existence unconfirmed this session | U | U | U | U | U |
| PublicNode | I — probe | U | U | U | N | Free, keyless [P-N1] |
| Chainstack | I — probe | U | D- — Growth+ via Global Elastic Nodes with archive [P-C2][P-C3] | D- — Growth+; debug & trace on OP explicitly documented [P-C2] | U | Free tier lacks archive/trace |
| Tenderly | I — probe | U | D — full archive, OP Mainnet endpoint documented [P-T2][P-T6] | D — 40 TU debug/trace; `tenderly_traceTransaction` decoded [P-T3][P-T6] | D — Virtual TestNets fork OP Mainnet at chosen block [P-T1] | N — paid only [P-T3] |
| Grove | U | U | U | U | N | Unresolved free-tier numbers [P-G1] |
| Blockdaemon | U | U | U — OP is a supported protocol [P-B2]; depth probe | U | U | Free test key [P-B1] |

---

## 4. Administrative independence analysis

Aegis's quorum rule (ENGINEERING_SPEC "Provider quorum and conflicts"; THREAT_MODEL
"Provider equivocation" row) needs *administrative* independence: different organizations
operating different node fleets, such that one compromised or defective operator cannot
produce matching wrong answers on both sides of the quorum. Brand ≠ infrastructure. Three
distinct failure-couplings matter:

### 4.1 Ownership and operating model

| Provider | Owner / operator | Operating model |
| --- | --- | --- |
| Alchemy | Alchemy Insights, Inc. (US, independent) | Own node fleet behind proprietary "Supernode" layer; widely reported to be substantially AWS-hosted (impacted in AWS us-east-1 outage 2025-10-20) [P-X1] |
| Infura | Consensys Software Inc. ("MetaMask Developer" brand) | Own primary fleet **plus DIN federation**: opt-in/managed failover routes requests to partner operators [P-I2][P-I3] |
| QuickNode | QuickNode, Inc. (US, independent) | Own platform across 5+ cloud and bare-metal providers, 14+ regions, multi-client [P-Q4] |
| Ankr | Ankr (independent) | Hybrid: own globally distributed bare-metal fleet **plus** third-party node providers under a DePIN/staking revenue-share (named partners include Tencent, IoTeX) [P-K2][P-K3] |
| dRPC | Built by the p2p.org (P2P Staking) team | Pure aggregator/router (Dproxy gateway, Dshackle at providers) over 50+ *independent third-party* node operators; terminal operator varies per request [P-D3][P-D4] |
| LlamaRPC | Llama Corp (LlamaNodes) | Open-source `web3-proxy` load balancer; backend fleet composition undocumented; commercial docs unreachable this session [P-L2] |
| PublicNode | Allnodes (US, founded 2017; LA/NYC) | Free public-good endpoints on Allnodes' own hosting platform; no SLA, no contract [P-N1][P-N2] |
| Chainstack | Chainstack Pte. Ltd. (Singapore, independent) | Own managed platform (Global Elastic Nodes) across multiple clouds; **is a DIN partner** [P-C3][P-I2] |
| Tenderly | Tenderly (independent) | Fully proprietary own infrastructure, multi-region EU/US, custom execution/trace engine [P-T1][P-T2] |
| Grove | Grove Inc. (formerly Pocket Network Inc.) | Gateway over the Pocket Network decentralized node supply; terminal operator varies per request; **also a DIN partner** [P-G2][P-I2] |
| Blockdaemon | Blockdaemon Inc. (US, institutional) | Own managed institutional fleet ("250k+ nodes launched") [P-B1][P-B2] |

### 4.2 Coupling cluster 1 — the DIN federation

Consensys' Decentralized Infrastructure Network federates Infura with ~18+ partner
operators including **Microsoft, Tencent Cloud, Chainstack, Grove, Pokt, Rivet, Bloq,
Everstake, Gateway.fm** and others [P-I2]. Failover protection is live on Ethereum
mainnet (and Polygon), with Optimism on the announced expansion path [P-I3]. Consequence:
a request sent to Infura may be *served by Chainstack's or Grove's infrastructure*
during failover.

Rule derived: **never pair Infura with Chainstack, Grove/Pocket, or any DIN partner** for
quorum. An Infura+Chainstack quorum can silently collapse into a single administrative
domain exactly when it matters (during an Infura incident — the moment quorum exists for).

### 4.3 Coupling cluster 2 — aggregators cannot be a quorum member of known identity

dRPC and Grove route each request to whichever third-party operator scores best at that
moment [P-D4][P-G2]. Two consequences for Aegis:

1. The administrative identity of the answering operator is unknown per request, so
   "administratively independent from provider X" cannot be established — the terminal
   operator might *be* X or share its upstream.
2. Load-balanced heterogeneous backends can disagree with themselves across consecutive
   requests (different heads, different finalized views), which the spec treats as
   conflict/missing evidence, degrading availability of the quorum.

Aggregators remain useful as *canaries/tie-break signals* (a third opinion whose
disagreement triggers investigation) but must not fill one of the two independent slots.
Ankr sits partway: it has its own bare-metal fleet but also shares serving with partner
operators [P-K2][P-K3]; treat Ankr as acceptable-with-caveat (see pair 2) and fingerprint
responses (`web3_clientVersion`, error shapes) to detect backend drift.

### 4.4 Coupling cluster 3 — shared cloud (correlated availability, weak integrity coupling)

The 2025-10-20 AWS us-east-1 outage (~15 h) degraded RPC access across Base, Arbitrum,
Optimism, Polygon, Linea, Scroll frontends, with coverage attributing the RPC failures to
AWS-hosted infrastructure at providers including Infura and Alchemy [P-X1][P-X2].
Shared-cloud coupling mostly threatens *availability* (both quorum members down
together → `unknown`, per spec) rather than *integrity* (matching wrong answers), but a
common cloud control plane is also a shared-integrity surface in the limit. Preference:
pair a cloud-heavy provider with a multi-cloud/bare-metal one (QuickNode, Ankr metal,
Tenderly, Blockdaemon).

Also noted: Tencent Cloud appears both as a DIN partner [P-I2] and an Ankr serving partner
[P-K2] — a residual overlap between clusters 1 and 2 that the Infura+Ankr pair below must
carry as a documented caveat.

### 4.5 Non-candidates for quorum slots

- **LlamaRPC**: capability and limits pages unreachable (403/404) this session; backend
  fleet opaque; no SLA. Fails the "who actually operates this" test today. [P-L1][P-L2]
- **PublicNode**: genuinely independent operator (Allnodes), but keyless free service
  with no contract, undocumented archive on the free endpoints, and marketing-grade
  "unlimited" claims. Good third-opinion canary; not a quorum member for critical
  conclusions.

---

## 5. Recommended administratively-independent quorum pairs

Requirement recap (spec): every critical `pass`/`fail` needs matching block-hash-pinned
evidence from ≥2 administratively independent providers; conflicts yield `conflict`;
insufficient responses yield `unknown`.

### Pair 1 (primary, both chains): **Alchemy + QuickNode**

- Distinct companies, distinct fleets, neither is an aggregator, neither is in DIN.
- Complementary hosting postures: Alchemy AWS-concentrated vs QuickNode multi-cloud +
  bare metal across 5+ infrastructure vendors [P-Q4][P-X1] — reduces correlated outage.
- Both declare archive on both chains; both declare debug tracing on OP (Alchemy
  `debug_traceCall` [P-A4]; QuickNode debug + even `trace_*` on OP [P-Q3]).
- Watch item: QuickNode's declared *absence* of `finalized`/`safe` tags on OP [P-Q2]. If
  the probe confirms it, OP block selection on the QuickNode side uses the spec's
  confirmation-depth fallback, or selects blocks by number+hash cross-checked against
  Alchemy's finalized head (the report must expose the finality downgrade per spec).
- Cost floor for trace-bearing verification: Alchemy trace/debug excluded from free tier
  [P-A1]; QuickNode trace/debug requires Build $49/mo [P-Q1].

### Pair 2 (secondary/fallback, both chains): **Infura (MetaMask Developer) + Ankr (Premium for trace)**

- Consensys-operated primary fleet vs Ankr's own bare-metal DePIN network — different
  companies, different fleets, neither a member of the other's federation.
- Caveats to carry in config and diagnostics:
  - Infura DIN failover can route to third parties [P-I2][P-I3]; if account settings
    expose failover control, pin it off for quorum traffic; regardless, Aegis's raw
    response hashing + `web3_clientVersion` fingerprinting must watch for backend swaps.
  - Tencent overlap between DIN and Ankr partners [P-I2][P-K2]: treat simultaneous
    identical anomalies from this pair as `conflict`, not confirmation.
  - Ankr free tier has no debug/trace [P-K1]; premium is PAYG ($0.10/1M credits, ~200
    credits per EVM request) [P-K1].
- Pair 2 is fully disjoint from pair 1 → four distinct administrative domains total,
  allowing rotation and cross-pair conflict investigation.

### Institutional alternative (if budget allows): **Blockdaemon + Tenderly**

Both operate wholly-owned infrastructure, no aggregation, no DIN membership, contractual
SLAs [P-B1][P-T1]. Tenderly is paid-only for Node RPC [P-T3]. Capability cells on OP
(Blockdaemon trace/archive) are U and need probes before adoption.

### Simulation specialist (not a quorum slot): **Tenderly**

For WR3's "historical fork/simulation" axis, Tenderly is the only surveyed provider with
a declared first-class historical-fork product (Virtual TestNets, simulate/bundle APIs,
decoded traces) on both chains [P-T1][P-T2][P-T6]. Recommend using it as the simulation
engine with results cross-checked against raw `debug_traceCall` on a quorum member —
simulation output is derived evidence, never a substitute for the two-provider quorum on
state reads.

### Do-not-pair list (from §4)

- Infura × Chainstack (DIN)
- Infura × Grove/Pocket (DIN)
- Any pair containing dRPC, Grove, or 1RPC as a *quorum member* (aggregator opacity)
- PublicNode × anything for critical conclusions (no contract; canary only)

---

## 6. Test methods (per matrix column)

All probes: record canonical JSON-RPC request, provider identifier, chain ID, capture
time, raw response bytes, SHA-256 of raw response — matching the spec's evidence record.
Probes must run against keyed endpoints created for testing; keys live in local env
config, never in the repo. Expected values below are *structural* expectations (error vs
result shape), not live-RPC-derived policy values, per WR3 non-goals.

### 6.1 `finalized` / `safe` tag support

1. `eth_getBlockByNumber ["finalized", false]` → expect a block object; record
   number/hash/timestamp.
2. Repeat at 12 s cadence for ≥3 L1 epochs: finalized number must be monotonically
   non-decreasing and must never exceed `latest`.
3. Cross-provider skew: same probe against both pair members; skew beyond ~2 epochs (ETH)
   flags a lagging provider (THREAT_MODEL "Provider lag").
4. OP-specific: `finalized` timestamp must lag the provider's `unsafe`/`latest` head by
   roughly L1 finalization time (~20–30 min under normal conditions [P-O1]); compare the
   OP finalized block's L1 origin against L1 finalized head from the L1 pair.
5. Failure mode to catch: aggregators answering `finalized` from different backends —
   run 10 consecutive calls; any non-monotonic regression is disqualifying for tag-based
   selection on that provider.

### 6.2 EIP-1898 block-hash-qualified reads

1. Take hash `H` of (finalized − 64) block from 6.1.
2. `eth_call [{to, data}, {"blockHash": H}]` → expect same raw result as
   `eth_call [{to, data}, "0x<number>"]` for the same block.
3. `{"blockHash": H, "requireCanonical": true}` → expect success on canonical H.
4. Negative probe: a syntactically valid but nonexistent hash → expect a JSON-RPC error
   (per EIP-1898 semantics, header-not-found class), **not** an empty/zero result — this
   distinguishes real EIP-1898 handling from a gateway silently coercing to `latest`
   (THREAT_MODEL "Partial RPC failure": zero-substitution is the hazard).
5. Repeat for `eth_getBalance`, `eth_getStorageAt`, `eth_getCode`, `eth_getLogs`
   (`blockHash` filter field).
6. Run on both chains; on OP also with a post-Bedrock historical hash.

### 6.3 Archive depth

1. ETH mainnet: `eth_getBalance [<known-genesis-funded address>, "0x1"]` and an
   `eth_call` of a long-deployed contract view at a multi-year-old block. Non-archive
   backends return "missing trie node"/"state not available" class errors beyond ~128
   blocks; archive returns values.
2. Bisection: if deep state fails, binary-search block height to find the provider's
   actual state horizon; record it (capability = depth, not boolean).
3. OP mainnet, post-Bedrock: `eth_call` at a 2023–2024 post-Bedrock block.
4. OP mainnet, pre-Bedrock (documentation only for Aegis scope): `eth_call` at a
   pre-105,235,063 block — success requires legacy l2geth routing [P-O2]; record
   supported/unsupported.
5. Free-tier check: run the same probe on the free tier — some providers gate archive by
   tier (Chainstack: declared no archive on free [P-C1]).

### 6.4 trace/debug APIs

1. `debug_traceTransaction [<old tx hash>, {"tracer": "callTracer"}]` on a transaction
   ≥1 year old (exercises archive + trace together).
2. `debug_traceCall [{...}, "0x<historical block>", {"tracer": "callTracer"}]` —
   historical re-execution capability, the primitive Aegis needs for fork-style checks.
3. ETH only: `trace_block ["0x<number>"]` (Parity namespace).
4. OP: same debug probes post-Bedrock; additionally `trace_block` on QuickNode to verify
   its documented OP `trace_*` support [P-Q3]; expect method-not-found on op-geth-only
   providers.
5. Record tier gating: run once on free key, once on paid key; a 4xx/credit error on free
   with success on paid confirms the declared gate (Alchemy [P-A1], QuickNode [P-Q1],
   Ankr [P-K1], Chainstack [P-C1], dRPC [P-D1]).

### 6.5 Historical fork / simulation

1. State-override read: `eth_call [{...}, "0x<historical>", {<address>: {"balance"/"stateDiff": ...}}]`
   (geth 3-arg form) → distinguishes providers exposing override-capable execution.
2. `debug_traceCall` with overrides at a historical block (same shape, tracer config).
3. Tenderly: `tenderly_simulateTransaction` at a chosen historical block on ETH and OP;
   `tenderly_traceTransaction` for decoded traces [P-T1][P-T6]; Virtual TestNet fork at a
   pinned historical block, then read a known slot and compare against a quorum member's
   `eth_getStorageAt` at the same block (simulation cross-check discipline, §5).
4. Alchemy: `alchemy_simulateExecution` availability per chain/tier.
5. Every simulation result used in a report must carry the underlying block hash it forked
   from, so it stays within the spec's block-pinning rule.

### 6.6 Free/paid tier limits (scheduled-verifier budget)

1. Unit audit: pull each provider's method-cost table (CU/credits/RU/TU per method) and
   pin it with URL + retrieval date; these tables were *not* all captured this session —
   open question O5.
2. Budget formula: `daily_units = runs_per_day × calls_per_run × unit_cost(method mix)`.
   Compare against: Alchemy 30M CU/mo [P-A1]; Infura 3M credits/day [P-I1]; QuickNode 10M
   credits/mo [P-Q1]; Ankr 200M credits/mo freemium [P-K1]; Chainstack 3M RU/mo [P-C1];
   dRPC 210M CU/mo [P-D1]. Worked example (placeholder unit costs, to be replaced by the
   pinned tables): a verifier running every 15 min with ~200 reads/run ≈ 19.2k calls/day;
   at ~20–80 units/call this is 0.4M–1.5M units/day — inside Infura's free daily budget
   only at the low end, and a monthly 11.5M–46M units, which exceeds QuickNode's and
   possibly Alchemy's free pools. Conclusion held loosely until O5 closes: free tiers
   plausibly cover a low-cadence non-trace verifier on pair 2; pair 1 with trace needs
   the ~$49/mo tiers.
3. Throughput probe: sustained 1–5 rps for 10 min on free keys; record 429s and
   rate-limit headers; scheduled verifier must stay below the *documented* free-tier rps
   (Alchemy ~25 rps [P-A1], QuickNode 15 rps [P-Q1], Chainstack 25 rps [P-C1], Ankr
   ~30 rps [P-K1]).

### 6.7 Administrative-independence probes (verify §4 empirically)

1. `web3_clientVersion` on every endpoint, repeated over days: reveals client lineage and
   build fingerprints; a change mid-stream on a "single-operator" provider indicates
   backend swap or failover (key check for Infura DIN and Ankr hybrid serving).
2. DNS → IP → ASN mapping (`dig` + RDAP/whois) and TLS certificate chain per endpoint;
   note that CDN fronting (e.g., Cloudflare) masks origin — record the limitation rather
   than over-concluding.
3. Error-shape fingerprinting: send an intentionally malformed request; gateway software
   produces distinctive error JSON (helps detect two brands fronting one stack).
4. Correlated-incident watch: log per-provider availability during any public cloud
   incident; simultaneous identical failure of a chosen pair is evidence against its
   independence (the 2025-10-20 AWS event is the calibration example [P-X1][P-X2]).
5. Quorum drill: identical `eth_call` at the same `blockHash` to both pair members;
   compare SHA-256 of canonicalized raw results — this is the production conflict path
   exercised end-to-end.

---

## 7. Provenance register

All retrieved 2026-07-21. Source class per SOURCE_REGISTER: official docs/blog (research
rationale only) unless marked third-party. Mutable pages — quotes above reflect the
retrieval date; production promotion requires re-retrieval + content hash.

| ID | Claim(s) supported | Source |
| --- | --- | --- |
| P-A1 | Alchemy free tier 30M CU/mo, 500 CU/s; trace/debug excluded from free; PAYG $0.45/M CU; chains incl. Ethereum, Optimism | https://www.alchemy.com/pricing |
| P-A2 | Alchemy Trace API: Ethereum mainnet + Sepolia only; PAYG/Enterprise tier required | https://www.alchemy.com/docs/reference/trace-api-quickstart |
| P-A3 | Alchemy eth_call documents EIP-1898 `{"blockHash": ...}` object | https://alchemyapi.gitbook.io/alchemy/apis/ethereum/eth-call (legacy docs host; re-verify on current docs) |
| P-A4 | Alchemy Debug API: Growth/Enterprise gate; `debug_traceCall` multi-chain incl. Optimism | https://docs.alchemy.com/alchemy/enhanced-apis/debug-api ; https://alchemy.com/docs/node/debug-api/debug-api-endpoints/debug-trace-call |
| P-I1 | Infura free 3M credits/day, 500 credits/s; Developer $50/15M/day; archive all tiers; debug/trace from Developer tier | https://www.infura.io/pricing |
| P-I2 | DIN partner federation: Microsoft, Tencent Cloud, Chainstack, Grove, Pokt, Rivet, Bloq, Everstake, Gateway.fm et al. | https://consensys.io/blog/infura-partners-with-microsoft-chainstack-to-build-DIN ; https://www.infura.io/blog/post/meet-the-decentralized-infrastructure-network-partners-microsoft-chainstack-and-15-more |
| P-I3 | DIN failover live on Ethereum+Polygon; Optimism on expansion path; requests move to vetted partner when Infura nodes fail | https://blockworks.com/news/infura-decentralized-infrastructure-network ; https://www.coindesk.com/tech/2023/11/15/ethereum-platform-infuras-step-toward-decentralization-includes-microsoft-tencent |
| P-I4 | MetaMask Developer eth_call block param includes `safe`/`finalized` (Polygon/Base reference pages; ETH page not fetchable this session) | https://docs.metamask.io/services/reference/polygon-pos/json-rpc-methods/eth_call/ |
| P-I5 | Infura trace API open beta for paying customers; `trace_transaction` documented (Ethereum); debug pages exist for Linea/Mantle | https://docs.metamask.io/services/how-to/trace-transactions/ ; https://docs.metamask.io/services/reference/ethereum/json-rpc-methods/trace-methods/trace_transaction/ |
| P-Q1 | QuickNode free 10M credits/mo, 15 rps; archive on all tiers incl. free; Trace & Debug on paid tiers (Build $49+) | https://www.quicknode.com/pricing |
| P-Q2 | QuickNode eth_call: `safe`/`finalized` "only supported on Ethereum, Gnosis, Arbitrum, Arbitrum Nova and Avalanche C-chain" (Optimism absent) | https://www.quicknode.com/docs/ethereum/eth_call |
| P-Q3 | QuickNode OP Mainnet: archive "no pruning"; `debug_traceTransaction`, `debug_traceBlock*`, `trace_block` documented for Optimism | https://www.quicknode.com/docs/optimism/api-overview ; https://www.quicknode.com/docs/optimism/debug_traceTransaction ; https://www.quicknode.com/docs/optimism/trace_block |
| P-Q4 | QuickNode multi-cloud + bare metal, 5+ infrastructure vendors, 14+ regions, multi-client | https://www.quicknode.com/blog/quicknode-web3-blockchain-infrastructure-platform (and forum note: https://forum.quicknode.com/t/is-the-underlying-rpc-infrastructure/397) |
| P-K1 | Ankr plans: public/freemium ~1800 req/min, 200M credits/mo, archive incl., no debug/trace; Premium PAYG $0.10/1M credits, ~200 credits/EVM request, ~1.5k rps, debug+trace incl.; ETH & OP same benefits | https://www.ankr.com/docs/rpc-service/service-plans/ |
| P-K2 | Ankr hybrid model: own bare-metal + partner providers (Tencent, IoTeX, Mind Heart Soul); 30+ regions | https://www.ankr.com/blog/ankr-leads-the-pack-in-rpc-api-services/ |
| P-K3 | Ankr decentralization: bare-metal in independent colo DCs; node-provider staking/KYC; revenue share with independent providers | https://www.ankr.com/blog/ankr-RPC-performance-advantage-global-bare-metal-node-infrastructure/ ; https://blockworks.co/news/ankr-moves-to-decentralize-node-infrastructure-with-staking |
| P-D1 | dRPC free plan (eff. 2025-06-01): 210M CU/30d, ~2100 CUPS burst, 120k CU/min/IP (min 50.4k), 5 keys, trace/debug/filter disabled on free | https://drpc.org/blog/upcoming-changes-to-drpcs-free-plan-effective-june-1-2025/ ; https://drpc.org/docs/howitworks/ratelimiting |
| P-D2 | dRPC network: 50+ independent operators, intelligent routing (region/health/head/method), 7 geo clusters | https://chainstack.com/drpc-provider-overview/ (third-party competitor overview — corroborate) ; https://drpc.org/blog/10-best-rpc-node-providers/ |
| P-D3 | dRPC built by the P2P (p2p.org / P2P Staking) team | https://www.quicknode.com/builders-guide/tools/drpc-by-p2p-staking (third-party listing) |
| P-D4 | dRPC routing architecture: Dproxy gateway + Dshackle per provider; best-node selection per request | https://chainstack.com/drpc-provider-overview/ (third-party; confirm against dRPC docs before promotion) |
| P-L1 | eth.llamarpc.com live and monitored as of retrieval | https://llamarpc.com/es/eth ; https://github.com/eabz/llamanodes-monitoring/blob/main/config.yaml (third-party monitor config) |
| P-L2 | LlamaNodes runs open-source web3-proxy LB; premium/docs pages returned 403/404 to fetcher on 2026-07-21 | https://github.com/llamanodes/web3-proxy ; attempted: https://llamanodes.com/premium , https://llamarpc.com/eth |
| P-N1 | PublicNode: free keyless endpoints, 79 chains incl. ETH+OP, MEV protection, operated with Allnodes branding | https://www.publicnode.com/ |
| P-N2 | Allnodes: founded 2017, LA/NYC, non-custodial hosting incl. archive node services; PublicNode launch | https://blog.allnodes.com/we-are-thrilled-to-release-publicnode-45e76ef8b33e ; https://www.allnodes.com/ |
| P-C1 | Chainstack Developer free: 3M RU/mo, 25 rps, no archive, no debug/trace; Growth $49: 20M RU, 250 rps, archive+debug/trace; archive request = 2 RU | https://chainstack.com/pricing/ |
| P-C2 | Chainstack debug & trace on Optimism via global nodes with debug/trace enabled | https://docs.chainstack.com/docs/debug-and-trace-apis |
| P-C3 | Chainstack Global Elastic Nodes: archive + debug/trace, geo-load-balanced | https://chainstack.com/archive-requests-debug-trace-global-elastic-nodes/ |
| P-T1 | Tenderly Node: tenderly_simulateTransaction/simulateBundle/estimateGas; multi-regional own infrastructure (EU/US); 80+ networks | https://docs.tenderly.co/node (node overview) |
| P-T2 | Tenderly full archive on every supported network; Virtual TestNets fork mainnet/override state/replay history | https://tenderly.co/node-rpc ; https://tenderly.co/pricing |
| P-T3 | Tenderly Node RPC excluded from free plan; TU costs: read 1, compute 4, write 20, debug/trace 40, adv. compute 400 | https://docs.tenderly.co/node/pricing |
| P-T4 | tenderly_traceTransaction decoded trace method | https://docs.tenderly.co/node (method list) |
| P-T5 | Tenderly pricing now custom/scoped ("no tiers", contact sales) | https://tenderly.co/pricing |
| P-T6 | Tenderly OP Mainnet Node endpoint (chain 10, optimism-mainnet.gateway.tenderly.co) | https://docs.tenderly.co/node/rpc-reference/optimism-mainnet |
| P-G1 | Grove/Pocket free-tier figures conflict across sources: "1M relays/day", "Always Free 30 rps", historical 100k/day; $1/M promo → $5/M standard | https://pocket.network/save-on-rpc-path/ ; https://www.dwellir.com/blog/rpc-providers-without-compute-units (third-party) — unresolved, see O4 |
| P-G2 | Grove = rebranded Pocket Network Inc.; gateway over Pocket decentralized node supply | https://medium.com/decentralized-infrastructure/pocket-network-inc-rebrands-to-grove-858e1880ca4a |
| P-B1 | Blockdaemon: free test API key; Starter 65M CU/mo @100 rps; Growth 365M CU/mo @200 rps; institutional posture | https://www.blockdaemon.com/api/pricing ; https://docs.blockdaemon.com/reference/rpc-api-overview |
| P-B2 | Blockdaemon supports Ethereum and Optimism among 80+ protocols; 250k+ nodes launched claim | https://www.blockdaemon.com/protocols/optimism ; https://www.blockdaemon.com/api/overview |
| P-O1 | OP tx statuses: unsafe/safe/finalized definitions; finality inherited from Ethereum; ~20–30 min to finalized | https://docs.optimism.io/app-developers/transactions/statuses ; https://docs.optimism.io/op-stack/transactions/transaction-finality |
| P-O2 | Pre-Bedrock blocks not executable by modern nodes; historical execution routed to legacy l2geth | https://docs.optimism.io/node-operators/tutorials/run-node-from-source |
| P-E1 | EIP-1898 spec: blockHash/blockNumber mutually exclusive; requireCanonical semantics | https://eips.ethereum.org/EIPS/eip-1898 |
| P-E2 | Third-party statement that "most JSON-RPC relays such as Infura and Alchemy support EIP-1898" | https://github.com/ethers-io/ethers.js/discussions/3799 (community; probe required) |
| P-X1 | 2025-10-20 AWS us-east-1 outage (~15 h, DynamoDB DNS root cause); RPC/API failures across L2 frontends attributed to AWS-hosted providers incl. Infura, Alchemy | https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025 ; https://thedefiant.io/news/infrastructure/consensys-infura-expands-din-to-eigenlayer |
| P-X2 | Post-outage analyses of blockchain RPC concentration on AWS (third-party, directional only) | https://medium.com/@Grace_Nelo/infrastructure-stress-test-5329d45c131f |

Third-party sources (P-D2, P-D3, P-D4, P-E2, P-G1, P-L1, P-X2) are discovery-grade only;
each claim they carry is flagged for corroboration against the operator's own material or
a live probe before any promotion.

## 8. Open questions

- **O1 — QuickNode OP finality tags.** Docs declare `safe`/`finalized` unsupported on
  Optimism [P-Q2] while OP nodes natively expose them. Probe 6.1 on a QuickNode OP
  endpoint decides whether pair 1 needs the confirmation-depth fallback on OP.
- **O2 — EIP-1898 across gateways.** Only Alchemy documents it [P-A3]. For every other
  provider the capability is inferred from client software; the negative probe (6.2.4,
  silent-coercion detection) is the critical one and has to run per provider per chain.
- **O3 — Infura DIN failover control.** Can an account disable failover / detect via
  response metadata when a request was served by a DIN partner? Not established from
  public docs; affects how much weight pair 2's independence caveat carries.
- **O4 — Grove free-tier truth.** Conflicting relays/day figures [P-G1]; resolve from the
  Grove portal directly if Grove is ever considered (currently canary-only anyway).
- **O5 — Method-cost tables.** Per-method CU/credit/RU/TU tables for Alchemy, Infura,
  QuickNode, Ankr, Chainstack, dRPC were not pinned this session; required to finish the
  scheduled-verifier budget (6.6) with real numbers.
- **O6 — Alchemy tier gate discrepancy.** Pricing page says PAYG includes Debug+Trace;
  an older docs page says Growth/Enterprise for Debug API [P-A1][P-A4]. Resolve against
  current account tiering before costing pair 1.
- **O7 — PublicNode archive on free endpoints.** Allnodes sells archive hosting, but
  whether ethereum/optimism PublicNode endpoints serve deep state is undocumented; probe
  6.3 decides its usefulness as a canary for archive reads.
- **O8 — Blockdaemon OP archive/trace depth.** Supported-protocol pages confirm OP but
  not archive depth or debug/trace availability; required before the institutional
  alternative pair is viable.
