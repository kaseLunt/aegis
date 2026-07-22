// W3 provider quorum/conflict semantics (ENGINEERING_SPEC §Provider quorum and conflicts).
// Pure evaluator: adapters perform I/O and construct observations; nothing here reads the
// network or a clock. The provisional-contradiction alert for a single provider
// contradicting expected policy lives at the expected-vs-observed comparison layer (W4) —
// this module only decides whether independent observations constitute one truth.
export class ChainError extends Error {
  constructor(
    public readonly code: string,
    public readonly path: string,
    detail?: string,
  ) {
    super(`${code} at ${path}${detail ? ` -- ${detail}` : ""}`);
    this.name = "ChainError";
  }
}

export interface ProviderObservation {
  providerId: string;
  // Codex W3 review P0#1: independence is enforced, not assumed — the reviewed
  // administrative domain travels WITH the observation, and agreement requires
  // minAgreeing DISTINCT domains, so aliases of one endpoint can never self-corroborate.
  administrativeDomain?: string;
  status: "ok" | "timeout" | "malformed";
  block?: { chainId: number; number: string; hash: string };
  rawResultHash?: string;
  decodedValueHash?: string;
}

export interface QuorumPolicy {
  policyId: string;
  requiredProviders: string[];
  minAgreeing: number;
}

export interface QuorumResult {
  outcome: "agreement" | "conflict" | "unknown";
  reasonCodes: string[];
  agreeingProviders: string[];
  missingProviders: string[];
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const sortedSet = (values: Iterable<string>): string[] => [...new Set(values)].sort(cmp);

const bad = (code: string, path: string, detail?: string): never => {
  throw new ChainError(code, path, detail);
};

// An ok-status observation missing its block pin or raw-result hash is a malformed
// provider response: missing evidence, never a value (spec).
const isCompleteOk = (o: ProviderObservation): boolean =>
  o.status === "ok" &&
  typeof o.administrativeDomain === "string" && o.administrativeDomain.length > 0 &&
  o.block !== undefined &&
  typeof o.block.hash === "string" && o.block.hash.length > 0 &&
  typeof o.block.number === "string" && o.block.number.length > 0 &&
  typeof o.rawResultHash === "string" && o.rawResultHash.length > 0;

export function evaluateQuorum(
  observations: readonly ProviderObservation[],
  policy: QuorumPolicy,
): QuorumResult {
  // Spec floor: every critical conclusion needs >=2 administratively independent
  // providers. A policy below the floor is invalid, not a weaker quorum.
  if (!Number.isInteger(policy.minAgreeing) || policy.minAgreeing < 2) {
    bad("invalid_quorum_policy", "/policy/minAgreeing", String(policy.minAgreeing));
  }
  if (new Set(policy.requiredProviders).size !== policy.requiredProviders.length) {
    bad("invalid_quorum_policy", "/policy/requiredProviders", "duplicate entries");
  }
  const seen = new Set<string>();
  for (const o of observations) {
    if (seen.has(o.providerId)) {
      bad("duplicate_provider_observation", "/observations", o.providerId);
    }
    seen.add(o.providerId);
  }

  const oks = observations.filter(isCompleteOk);
  const missing = sortedSet(
    observations.filter((o) => !isCompleteOk(o)).map((o) => o.providerId),
  );

  // Observations are comparable only at one pinned block on one chain — block selection
  // runs first and pins it. Mixed inputs are a caller defect, not a provider outcome.
  const chainIds = new Set(oks.map((o) => o.block!.chainId));
  if (chainIds.size > 1) {
    bad("cross_chain_observations", "/observations", [...chainIds].join(","));
  }
  const numbers = new Set(oks.map((o) => o.block!.number));
  if (numbers.size > 1) {
    bad("block_number_mismatch", "/observations", [...numbers].join(","));
  }

  // Same block number, differing block hashes: chain-level disagreement (spec: conflict).
  const blockHashes = new Set(oks.map((o) => o.block!.hash));
  if (blockHashes.size > 1) {
    return {
      outcome: "conflict",
      reasonCodes: ["block_hash_mismatch"],
      agreeingProviders: [],
      missingProviders: missing,
    };
  }

  // Same block, differing canonicalized raw results. Decoded-value match with a raw
  // mismatch is retained as separate evidence and reviewed by policy (spec) — neither
  // agreement nor automatic conflict. Any other raw disagreement conflicts (fail closed;
  // agreement requires matching raws regardless of which provider disagrees).
  const rawHashes = new Set(oks.map((o) => o.rawResultHash!));
  if (rawHashes.size > 1) {
    const decoded = new Set(oks.map((o) => o.decodedValueHash));
    const decodedMatch = !decoded.has(undefined) && decoded.size === 1;
    return {
      outcome: decodedMatch ? "unknown" : "conflict",
      reasonCodes: [decodedMatch ? "raw_result_mismatch_decoded_match" : "raw_result_mismatch"],
      agreeingProviders: [],
      missingProviders: missing,
    };
  }

  // One (block hash, raw result) group. Agreement still requires the quorum count and
  // every required provider's evidence; a missing required response is missing evidence,
  // so the outcome is unknown (insufficient), never a conclusion.
  const agreeing = sortedSet(oks.map((o) => o.providerId));
  const reasonCodes: string[] = [];
  if (agreeing.length < policy.minAgreeing) reasonCodes.push("insufficient_provider_responses");
  if (policy.requiredProviders.some((p) => !agreeing.includes(p))) {
    reasonCodes.push("required_provider_missing");
  }
  const domains = new Set(oks.map((o) => o.administrativeDomain));
  if (agreeing.length >= policy.minAgreeing && domains.size < policy.minAgreeing) {
    reasonCodes.push("administrative_domain_overlap");
  }
  if (reasonCodes.length > 0) {
    return {
      outcome: "unknown",
      reasonCodes: sortedSet(reasonCodes),
      agreeingProviders: agreeing,
      missingProviders: missing,
    };
  }
  return { outcome: "agreement", reasonCodes: [], agreeingProviders: agreeing, missingProviders: missing };
}
