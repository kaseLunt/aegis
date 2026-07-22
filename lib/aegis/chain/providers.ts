// W3 provider registry — DECLARED capabilities only (WR3 provider-matrix legend: a
// declared cell raises the prior, it never substitutes for the probe; nothing here is
// trusted configuration until a live probe with recorded raw responses promotes it).
// No secrets: configs carry env-var NAMES, never key material.
export type DeclaredCapability = "declared" | "declared_absent" | "unknown";

export interface ChainCapabilities {
  finalizedTag: DeclaredCapability;
}

export interface ProviderConfig {
  providerId: string;
  administrativeDomain: string;
  keyEnvVar: string;
  chains: Record<number, ChainCapabilities>;
}

// WR3 §5 pair 1 (primary, both chains): distinct companies, distinct fleets, neither an
// aggregator, neither in DIN. QuickNode declares NO finalized/safe tags on OP [P-Q2] —
// that chain uses the confirmation-depth fallback with an exposed downgrade.
export const PROVIDERS: Record<"alchemy" | "quicknode", ProviderConfig> = {
  alchemy: {
    providerId: "alchemy",
    administrativeDomain: "Alchemy Insights, Inc.",
    keyEnvVar: "ALCHEMY_API_KEY",
    chains: {
      1: { finalizedTag: "declared" },
      10: { finalizedTag: "declared" },
    },
  },
  quicknode: {
    providerId: "quicknode",
    administrativeDomain: "QuickNode, Inc.",
    keyEnvVar: "QUICKNODE_API_TOKEN",
    chains: {
      1: { finalizedTag: "declared" },
      10: { finalizedTag: "declared_absent" },
    },
  },
};

export const QUORUM_PAIR_1 = ["alchemy", "quicknode"] as const;
