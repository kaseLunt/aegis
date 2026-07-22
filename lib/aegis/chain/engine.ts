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
}

export interface EstablishedBoundary {
  status: "pinned";
  boundary: { kind: "execution_block"; block: PinnedBlock };
  downgrades: FinalityDowngrade[];
  quorum: QuorumResult;
  observations: ProviderObservation[];
}

export interface UnresolvedBoundary {
  status: "unresolved";
  quorum: QuorumResult;
  downgrades: FinalityDowngrade[];
  observations: ProviderObservation[];
}

const cmpString = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const rawHashOf = (block: PinnedBlock): string => {
  const consensusContent: Record<string, unknown> = { ...block };
  delete consensusContent.finality; // request-derived annotation, not response content
  return `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(consensusContent), "utf-8")).digest("hex")}`;
};

// Adapter failure is missing evidence, never a value (spec): an absent recording maps to
// an unresponsive provider; any other typed adapter failure is a malformed response.
const missingObservation = (providerId: string, e: unknown): ProviderObservation => ({
  providerId,
  status: e instanceof ChainError && e.code === "recording_missing" ? "timeout" : "malformed",
});

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
  const proposals: Proposal[] = [];
  const failed: ProviderObservation[] = [];
  const downgrades: FinalityDowngrade[] = [];

  await Promise.all(adapters.map(async (adapter) => {
    try {
      const head = await adapter.getFinalizedHead(chainId);
      if (head !== null) {
        const s = selectFinalizedBoundary(head);
        proposals.push({ adapter, block: s.boundary.block, downgrade: null });
        return;
      }
      const latest = await adapter.getLatestHead(chainId);
      const target = confirmationDepthTarget(latest.number, policy.confirmationDepth);
      const pinned = await adapter.getBlockByNumber(chainId, target);
      const s = selectConfirmationDepthBoundary(latest, pinned, { confirmationDepth: policy.confirmationDepth });
      proposals.push({ adapter, block: s.boundary.block, downgrade: s.downgrade });
    } catch (e) {
      if (!(e instanceof ChainError)) throw e;
      failed.push(missingObservation(adapter.providerId, e));
    }
  }));

  for (const p of proposals) {
    if (p.downgrade) downgrades.push(p.downgrade);
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
          : await p.adapter.getBlockByNumber(chainId, common);
        commonBlocks.push({ providerId: p.adapter.providerId, block });
        observations.push({
          providerId: p.adapter.providerId,
          status: "ok",
          block: { chainId, number: common, hash: block.hash },
          rawResultHash: rawHashOf(block),
        });
      } catch (e) {
        if (!(e instanceof ChainError)) throw e;
        observations.push(missingObservation(p.adapter.providerId, e));
      }
    }));
  }

  observations.sort((a, b) => cmpString(a.providerId, b.providerId));
  downgrades.sort((a, b) => cmpString(JSON.stringify(a), JSON.stringify(b)));
  commonBlocks = commonBlocks.sort((a, b) => cmpString(a.providerId, b.providerId));

  const quorum = evaluateQuorum(observations, policy.quorum);
  if (quorum.outcome !== "agreement") {
    return { status: "unresolved", quorum, downgrades, observations };
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
  };
}
