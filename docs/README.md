# Aegis Documentation

This directory is the canonical design record for Aegis. It separates the finished product contract from the current implementation so a fast prototype cannot be mistaken for completed assurance infrastructure.

## Reading order

1. [Project selection decision](PROJECT_SELECTION.md) - the evaluated alternatives, why Aegis remains the core project, and why the first release absorbs the crosschain-monitor concept.
2. [Product specification](PRODUCT_SPEC.md) - who Aegis serves, the Record/Rehearse/Rewind workflows, data labels, UX principles, non-goals, and product acceptance criteria.
3. [Threat model](THREAT_MODEL.md) - what Aegis protects, what can make it wrong, result semantics, forbidden inferences, privacy boundaries, and adversarial tests.
4. [Engineering specification](ENGINEERING_SPEC.md) - target architecture, schemas, finality and provider policy, invariant engine, APIs, CLI, storage, testing, and the first vertical slice.
5. [Source and provenance register](SOURCE_REGISTER.md) - official research references, their allowed evidentiary use, claim-to-source mapping, and live-claim research backlog.
6. [Delivery roadmap](ROADMAP.md) - the difference between the current prototype and the finished system, staged deliverables, and objective exit gates.
7. [Interview brief](INTERVIEW_BRIEF.md) - how to explain and demonstrate the work honestly, including AI-assisted engineering ownership.

## Authority when documents disagree

- The **threat model** wins for the strength and limits of any claim.
- The **engineering specification** wins for machine behavior, schemas, and service boundaries.
- The **product specification** wins for users, workflows, language, and interaction design.
- The **project selection decision** wins for initial positioning and scope priority, but cannot weaken the product, engineering, or threat-model contracts.
- The **roadmap** wins for current implementation status and sequencing.
- The **source register** records research inputs but never overrides block-hash-bound evidence or an active reviewed manifest.
- The **interview brief** is explanatory only and cannot expand product or engineering claims.

## Current status

The current application is milestone 0: a polished deterministic prototype built with recorded fixtures plus limited live chain-head context. The target system is not complete until the roadmap's final definition of done passes.

That distinction is deliberate. The prototype proves the interaction model and some core engineering patterns. The remaining work proves that real production evidence survives provider failure, reorgs, proxy changes, incomplete history, and skeptical review.

The next hiring-ready artifact is the live Ethereum and OP route slice. Additional prototype-only surfaces are explicitly deferred.

## Change rule

A material new feature should update the relevant specification, threat-model boundary, and roadmap gate in the same change as the implementation. No UI label may make a stronger claim than the canonical result schema and its evidence allow.
