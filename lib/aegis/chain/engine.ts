// W3 engine pass — adapters → block selection → provider quorum, per chain. Pure over
// adapter results: no clock, no network; adapters own all I/O.
//
// Boundary establishment (mixed-mode rule): every provider proposes a pin — its
// finalized head, or its confirmation-depth target when the finalized tag is declared
// absent. The engine pins the conservative MINIMUM of the proposals and re-fetches every
// other provider AT that number, so quorum always compares observations of one block.
// Any fallback on the chain downgrades the boundary finality to "confirmations" with the
// downgrade record exposed (spec: expose any finality downgrade).
//
// Raw comparison domain: `finality` is request-derived annotation (the tag WE asked
// for), not response content — it is stripped before hashing so a tag difference can
// never fake or mask a raw-result disagreement. Recorded mode recomputes the raw hash
// from the canonical block; a LIVE adapter must thread its captured raw-response hash
// through instead (probe-step work, see W3 handoff).
import { createHash } from "node:crypto";
import { jcsSerialize } from "../report/canonical";
import type { ChainAdapter } from "./adapter";
import { ChainError, type ProviderObservation, type QuorumPolicy, type QuorumResult, evaluateQuorum } from "./quorum";
import {
  type FinalityDowngrade,
  type PinnedBlock,
  confirmationDepthTarget,
  selectConfirmationDepthBoundary,
  selectFinalizedBoundary,
} from "./selection";

export interface BoundaryPolicy {
  quorum: QuorumPolicy;
  confirmationDepth: string;
  // Codex W3 review P1#5: the conservative-minimum rule needs a leash — a single stale
  // provider must not drag the pin arbitrarily far back while presenting as agreement.
  maxHeadLagBlocks: string;
}

export interface ProposalDiagnostic {
  providerId: string;
  number: string;
  timestamp: string;
}

export interface EstablishedBoundary {
  status: "pinned";
  boundary: { kind: "execution_block"; block: PinnedBlock };
  downgrades: FinalityDowngrade[];
  quorum: QuorumResult;
  observations: ProviderObservation[];
  proposals: ProposalDiagnostic[];
}

export interface UnresolvedBoundary {
  status: "unresolved";
  quorum: QuorumResult;
  downgrades: FinalityDowngrade[];
  observations: ProviderObservation[];
  proposals: ProposalDiagnostic[];
}

const cmpString = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;

const rawHashOf = (block: PinnedBlock): string => {
  const consensusContent: Record<string, unknown> = { ...block };
  delete consensusContent.finality; // request-derived annotation, not response content
  return `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(consensusContent), "utf-8")).digest("hex")}`;
};

// Codex W3 review P1#4: ANY adapter failure is missing evidence — a live transport's
// native errors must never crash the engine or lose the other providers' diagnostics.
const missingObservation = (adapter: ChainAdapter, e: unknown): ProviderObservation => ({
  providerId: adapter.providerId,
  administrativeDomain: adapter.administrativeDomain,
  status: e instanceof ChainError && e.code === "recording_missing" ? "timeout" : "malformed",
});

// Codex W3 review P0#2: every returned block is validated against the request before it
// can influence anything — observations are built from RETURNED, validated metadata,
// never from substituted request values.
function ensureReturned(block: PinnedBlock, chainId: number, expectedNumber?: string): PinnedBlock {
  if (block.chainId !== chainId) {
    throw new ChainError("cross_chain_observations", "/adapter/block/chainId",
      `requested chain ${chainId}, provider returned ${String(block.chainId)}`);
  }
  if (expectedNumber !== undefined && block.number !== expectedNumber) {
    throw new ChainError("block_number_mismatch", "/adapter/block/number",
      `requested ${expectedNumber}, provider returned ${String(block.number)}`);
  }
  return block;
}

interface Proposal {
  adapter: ChainAdapter;
  block: PinnedBlock;
  downgrade: FinalityDowngrade | null;
}

export async function establishBoundary(
  adapters: readonly ChainAdapter[],
  chainId: number,
  policy: BoundaryPolicy,
): Promise<EstablishedBoundary | UnresolvedBoundary> {
  if (typeof policy.maxHeadLagBlocks !== "string" || !DECIMAL_RE.test(policy.maxHeadLagBlocks)) {
    throw new ChainError("invalid_boundary_policy", "/policy/maxHeadLagBlocks", String(policy.maxHeadLagBlocks));
  }
  const proposals: Proposal[] = [];
  const failed: ProviderObservation[] = [];
  const downgrades: FinalityDowngrade[] = [];

  await Promise.all(adapters.map(async (adapter) => {
    try {
      const head = await adapter.getFinalizedHead(chainId);
      if (head !== null) {
        const s = selectFinalizedBoundary(ensureReturned(head, chainId));
        proposals.push({ adapter, block: s.boundary.block, downgrade: null });
        return;
      }
      const latest = ensureReturned(await adapter.getLatestHead(chainId), chainId);
      const target = confirmationDepthTarget(latest.number, policy.confirmationDepth);
      const pinned = ensureReturned(await adapter.getBlockByNumber(chainId, target), chainId, target);
      const s = selectConfirmationDepthBoundary(latest, pinned, { confirmationDepth: policy.confirmationDepth });
      proposals.push({ adapter, block: s.boundary.block, downgrade: s.downgrade });
    } catch (e) {
      failed.push(missingObservation(adapter, e));
    }
  }));

  for (const p of proposals) {
    if (p.downgrade) downgrades.push(p.downgrade);
  }
  const proposalDiagnostics: ProposalDiagnostic[] = proposals
    .map((p) => ({ providerId: p.adapter.providerId, number: p.block.number, timestamp: p.block.timestamp }))
    .sort((a, b) => cmpString(a.providerId, b.providerId));
  downgrades.sort((a, b) => cmpString(JSON.stringify(a), JSON.stringify(b)));

  // Divergence leash (P1#5): if the spread between proposals exceeds policy, the chain
  // is stale/unresolved — hashes agreeing at an ancient block is not recency.
  if (proposals.length > 0) {
    const numbers = proposals.map((p) => BigInt(p.block.number));
    const lag = numbers.reduce((a, b) => (a > b ? a : b)) - numbers.reduce((a, b) => (a < b ? a : b));
    if (lag > BigInt(policy.maxHeadLagBlocks)) {
      const observations = [...failed].sort((a, b) => cmpString(a.providerId, b.providerId));
      return {
        status: "unresolved",
        quorum: {
          outcome: "unknown",
          reasonCodes: ["head_divergence_exceeded"],
          agreeingProviders: [],
          missingProviders: observations.map((o) => o.providerId),
        },
        downgrades,
        observations,
        proposals: proposalDiagnostics,
      };
    }
  }

  // Conservative common pin: the lowest proposal. Everyone else re-observes AT it.
  const observations: ProviderObservation[] = [...failed];
  let commonBlocks: Array<{ providerId: string; block: PinnedBlock }> = [];
  if (proposals.length > 0) {
    const common = proposals
      .map((p) => p.block.number)
      .reduce((a, b) => (b.length < a.length || (b.length === a.length && b < a) ? b : a));
    await Promise.all(proposals.map(async (p) => {
      try {
        const block = p.block.number === common
          ? p.block
          : ensureReturned(await p.adapter.getBlockByNumber(chainId, common), chainId, common);
        commonBlocks.push({ providerId: p.adapter.providerId, block });
        observations.push({
          providerId: p.adapter.providerId,
          administrativeDomain: p.adapter.administrativeDomain,
          status: "ok",
          block: { chainId: block.chainId, number: block.number, hash: block.hash },
          rawResultHash: rawHashOf(block),
        });
      } catch (e) {
        observations.push(missingObservation(p.adapter, e));
      }
    }));
  }

  observations.sort((a, b) => cmpString(a.providerId, b.providerId));
  commonBlocks = commonBlocks.sort((a, b) => cmpString(a.providerId, b.providerId));

  const quorum = evaluateQuorum(observations, policy.quorum);
  if (quorum.outcome !== "agreement") {
    return { status: "unresolved", quorum, downgrades, observations, proposals: proposalDiagnostics };
  }

  // The agreed content is identical across the agreeing set (matching consensus-content
  // hashes); pick deterministically and label finality at the chain's weakest level.
  const agreed = commonBlocks.find((c) => quorum.agreeingProviders.includes(c.providerId))!;
  const finality = downgrades.length > 0 ? "confirmations" : "finalized";
  return {
    status: "pinned",
    boundary: { kind: "execution_block", block: { ...agreed.block, finality } },
    downgrades,
    quorum,
    observations,
    proposals: proposalDiagnostics,
  };
}
