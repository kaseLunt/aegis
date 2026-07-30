// Deployment profiles for the transport surfaces (W5 S3+). At M1 exactly one profile exists:
// "reference", reproducing the instantiation the engine tests pin (tests/surfaces-engine.test.ts).
// Hosted in code because W5's scope has no data/** — and because a profile IS code: it must
// move in lockstep with DeploymentConfig's shape under tsc.
import { PROVIDERS } from "../chain/providers";
import { manifestContentHash, type ManifestTrustPolicy } from "../manifest/trust";
import type { DeploymentConfig } from "./engine";
import { parseStrictInstant, RequestError } from "./request";

export interface ReferenceProfileOptions {
  readonly evaluationTime: string;
  readonly trustPolicy?: ManifestTrustPolicy;
}

// Without an explicit trust policy the reference profile approves the supplied manifest's own
// recomputed content hash. That is SELF-APPROVAL: legitimate only as reference analysis, and
// the rendered policyTrust block keeps it visible (THREAT_MODEL "reviewed manifest" boundary).
// `--trust-policy` is the honest operator mode.
function selfApprovingPolicy(manifestBytes: Uint8Array): ManifestTrustPolicy {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(manifestBytes));
    return {
      trustPolicyId: "tp-reference-self",
      approvedHashes: [manifestContentHash(parsed)],
    };
  } catch {
    // Unparseable manifest bytes: the engine itself will classify the manifest as invalid;
    // an empty approved set keeps this path from masking that outcome.
    return { trustPolicyId: "tp-reference-self", approvedHashes: [] };
  }
}

export function referenceDeployment(
  manifestBytes: Uint8Array,
  options: ReferenceProfileOptions,
): DeploymentConfig {
  // The one clock rule for every edge (W5 round-1 Codex F3): the shared strict-instant
  // validator — grammar plus exact calendar round-trip, no offsets, no V8 rollover. The
  // deployment is where evaluationTime enters, so an invalid clock cannot be constructed
  // at all.
  if (parseStrictInstant(options.evaluationTime) === null) {
    throw new RequestError("invalid_evaluation_time", "/evaluationTime");
  }
  return {
    engineVersion: "aegis-core/0.1.0",
    environment: "reference",
    evaluationTime: options.evaluationTime,
    provenanceClass: "reference_scenario",
    trustPolicy: options.trustPolicy ?? selfApprovingPolicy(manifestBytes),
    boundaryPolicy: {
      quorum: {
        policyId: "pq-reference",
        requiredProviders: ["alchemy", "quicknode"],
        minAgreeing: 2,
      },
      confirmationDepth: "12",
      maxHeadLagBlocks: "1000",
    },
    providers: [PROVIDERS.alchemy, PROVIDERS.quicknode],
    // 7 days: the reference identity reads are ~3 days old at the reference clock —
    // current inside the window, stale past it (the K4/J5 rows). A declared policy
    // parameter, like confirmationDepth — never a fabricated assessment.
    freshnessPolicy: { policyId: "fp-reference", maxAgeSeconds: "604800" },
  };
}
