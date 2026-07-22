# Aegis Source and Provenance Register

Status: research baseline, not a live manifest
Reviewed: 2026-07-21

## Purpose

This register records why Aegis chose its initial ether.fi assertions and where implementation research should begin. It is not evidence that production currently matches any documented configuration.

A source can explain architecture, state intended policy, provide code, or describe an incident. Only block-hash-bound chain observations can establish what a supported deployment exposed at a particular time. Production manifests pin exact commits, content hashes, chain IDs, addresses, and applicability windows rather than depending on mutable links in this file.

## Source classes

| Class | Appropriate use | Cannot establish by itself |
| --- | --- | --- |
| Block-hash-bound public state | Observed implementation, roles, peers, libraries, DVNs, parameters, balances, logs, and transaction effects | Human intent, offchain state, source-code equivalence without bytecode verification |
| Pinned source and deployment repository | ABI/code candidates, deployment declarations, invariant implementation, manifest expectations | That a declared address or commit is the currently canonical production state |
| Audit or formal review | Predicate rationale, reviewed code scope, assumptions, known limitations | Live deployment identity or absence of later changes |
| Official documentation or blog | Product intent, claimed hardening, incident narrative, discovery of relevant controls | Current contract configuration or independently verified incident facts |
| Upstream protocol specification | Correct mechanics for proxies, RPC block selection, messaging, and canonicalization | ether.fi-specific deployment values |
| Deterministic fixture | Repeatable tests and demonstrations | Current production state |

## Ether.fi primary references

| Reference | Use in Aegis | Required production treatment |
| --- | --- | --- |
| [Safe Staking, From Doctrine to Code](https://www.ether.fi/blog/safe-staking-from-doctrine-to-code) | Discovery and rationale for withdrawal, wrapper backing, exchange-rate, rebase, oracle quorum, role, and circuit-breaker assertions | Translate each statement into a narrow predicate; bind it to reviewed deployed code and independently observed state |
| [weETH Bridge Security Hardening](https://www.ether.fi/blog/weeth-bridge-security-hardening) | Discovery and declared intent for pinned send/receive libraries, required DVNs, pairwise rate limits, and residual bridge risk | Treat as declared policy only; decode every directed route at an identified block before reporting a live result |
| [ether.fi core smart contracts](https://github.com/etherfi-protocol/smart-contracts) | Core source, audits, tests, deployment material, and ABI candidates | Pin full commit SHA; bind ABI to runtime code hash; record the exact release-to-deployment mapping |
| [2026 Q2 Certora security-upgrade review](https://github.com/etherfi-protocol/smart-contracts/blob/master/audits/2026.06.28%20-%20Certora%20-%2026Q2%20Security%20Upgrade.pdf) | Reviewed invariant definitions, assumptions, and code scope | Verify the audited commit and determine whether the observed implementation corresponds to that scope |
| [weETH crosschain contracts](https://github.com/etherfi-protocol/weETH-cross-chain) | OFT source, deployment discovery, transaction parsing, audits, and ABI candidates | Pin commit and confirm each address, implementation, peer, library, DVN configuration, and route status onchain |
| [Cash v3 contracts](https://github.com/etherfi-protocol/cash-v3) | Current Cash architecture, source, tests, deployments, and ABI candidates | Prefer this repository for current Cash research; pin a reviewed commit and compare its deployment declarations with OP state |
| [Archived Cash contracts](https://github.com/etherfi-protocol/cash-contracts) | Historical Cash architecture and migration context | Never assume an archived deployment or dependency graph represents current Cash v3 |

The bridge-hardening article describes a Kelp DAO incident as the motivating event and explicitly says ether.fi systems were not directly compromised. Aegis therefore labels any prose-derived replay a `documented_scenario`; it must not present the event as an ether.fi exploit unless independent evidence supports a different, precisely scoped claim.

## Upstream technical references

| Reference | Design decision supported |
| --- | --- |
| [EIP-1967 proxy storage slots](https://eips.ethereum.org/EIPS/eip-1967) | Resolve declared proxy indirection before choosing an implementation-scoped ABI |
| [EIP-1898 block-hash RPC parameters](https://eips.ethereum.org/EIPS/eip-1898) | Prefer block-hash-qualified reads and require canonical state where providers support it |
| [LayerZero OApp technical reference](https://docs.layerzero.network/v2/concepts/technical-reference/oapp-reference) | Model directional peers, delegates, libraries, configuration, and message flow |
| [LayerZero integration checklist](https://docs.layerzero.network/v2/tools/integration-checklist) | Verify explicit per-pathway libraries and recognize default-library fallback |
| [LayerZero DVN and executor configuration](https://docs.layerzero.network/v2/developers/evm/configuration/dvn-executor-config) | Decode required/optional DVNs, thresholds, confirmations, and send/receive compatibility |
| [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html) | Generate stable canonical report bytes before hashing |

Upstream documentation is versioned externally and can change. Tests pin the relevant behavior or fixtures; a production release records retrieval date and content hash when a mutable specification materially affects decoding.

## Claim-to-source map

| Assertion family | Expected-policy input | Observed input | Important limitation |
| --- | --- | --- | --- |
| Deployment code identity | Reviewed release manifest, source commit, expected implementation and runtime code hash | Proxy slot or beacon plus runtime bytecode at one block hash | Matching code identity is not a safety proof |
| weETH local backing | Reviewed deployed invariant and exact accounting semantics | Required token supply/share reads at one block hash | Local wrapper-share backing is not whole-protocol solvency or reserves proof |
| Withdrawal escrow | Reviewed deployed accounting paths and units | Escrow balance plus matching locked-withdrawal accounting at one block hash | Public execution-layer state may not capture every beacon or operational exposure |
| Oracle and rebase controls | Reviewed code, audit scope, deployment constants or policy manifest | Quorum members, thresholds, relevant state, and supported transaction traces | A responding oracle is not proof of economic truth |
| Governance and roles | Reviewed role/timelock policy and deployment manifest | Role membership, implementation, delay, queued action, and executor reads | Authorization is not proof of sound intent |
| Directed bridge route | Reviewed route manifest plus LayerZero mechanics | Peer, endpoint, send/receive library, config, DVNs, threshold, pause, and rate limits in each direction | Deployed endpoints do not prove an active or symmetric route |
| Cash wiring and risk | Pinned Cash v3 deployment declarations and reviewed policy | OP code identity, dependency pointers, roles, oracle config, collateral parameters, and selected account state | Public contracts cannot establish offchain card or settlement health |
| Incident replay | Immutable logs/transactions plus explicitly labeled official narrative | Block-hash-bound events and transactions | Narrative-derived timing or causality remains documented, not observed |
| Counterfactual outcome | Versioned model and explicit policy inputs | Immutable incident-bundle hash | Model output is not historical fact or proof an exploit would have been prevented |

## Manifest promotion checklist

A research reference can enter an active expected-state manifest only after:

1. the source is pinned by full commit SHA or content hash;
2. the relevant environment, chain ID, address, and validity range are explicit;
3. proxy and implementation relationships are independently resolved;
4. runtime bytecode is hashed and bound to the ABI used for decoding;
5. discrepancies between repositories, documents, audits, and chain state remain visible;
6. an engineer reviews the predicate wording and its exclusions;
7. passing, failing, missing-evidence, and boundary fixtures exist;
8. the manifest change receives recorded review rather than being generated from observed production state.

## Research backlog before live claims

- Pin the full current release commits rather than abbreviated prototype references.
- Map each audited core invariant to the exact deployed implementation and ABI epoch.
- Identify official governance, Safe, timelock, guardian, and revocation addresses from independent sources.
- Build the Ethereum/OP directed-route manifest: EIDs, peers, endpoint contracts, libraries, DVNs, thresholds, confirmations, pause controls, and rate limits.
- Resolve Cash v3 OP proxy topology and dependency graph; record any disagreement with older GitBook or archived deployment material.
- Confirm provider independence and archive capability rather than treating different commercial labels as independent infrastructure.
- Record a real governance or configuration change suitable for the first Rewind bundle.
- Select a real, non-sensitive Safe transaction suitable for the first Rehearse acceptance test.

Until this backlog is complete, repository fixtures remain recorded demonstrations and every surface must say so.
