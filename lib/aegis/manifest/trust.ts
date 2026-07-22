// W2 manifest model + trust root (ENGINEERING_SPEC §Manifest model, §Manifest trust root).
// A manifest declares expected state and is authenticated ONLY by the deployment-configured
// trust policy (approved content-hash set). Author/reviewer fields are descriptive content:
// they participate in the hash, never in the trust decision (THREAT_MODEL: a self-consistent
// manifest hash or reviewer-name field is not proof the manifest is authorized).
import { createHash } from "node:crypto";
import { cmpDecimal, jcsSerialize } from "../report/canonical";

export class ManifestError extends Error {
  constructor(
    public readonly code: string,
    public readonly path: string,
    detail?: string,
  ) {
    super(`${code} at ${path}${detail ? ` -- ${detail}` : ""}`);
    this.name = "ManifestError";
  }
}

type JsonObject = Record<string, unknown>;

const isObject = (v: unknown): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const MANIFEST_MANDATORY = [
  "schemaVersion", "manifestVersion", "protocol", "environment", "author", "reviewers",
  "createdAt", "chainIds", "validity", "policyRefs", "targets", "invariantIds", "uncovered",
] as const;

const TARGET_MANDATORY = [
  "targetId", "chainId", "address", "identityStrategy", "expectedRuntimeCodeHash",
] as const;

const IDENTITY_STRATEGIES = ["direct", "eip1967", "beacon", "eip1167_clone", "custom"] as const;

export interface LoadedManifest {
  manifest: JsonObject;
  contentHash: string;
}

export interface ManifestTrustPolicy {
  trustPolicyId: string;
  approvedHashes: string[];
}

export interface TrustEvaluation {
  state: "trusted" | "untrusted";
  trustPolicyId: string;
  manifestHash: string;
  reasonCodes: string[];
}

// Content addressing: sha256 over the JCS bytes of the manifest content with the embedded
// contentHash field excluded (a hash cannot cover itself).
export function manifestContentHash(manifest: unknown): string {
  if (!isObject(manifest)) throw new ManifestError("missing_mandatory_field", "/", "manifest is not an object");
  const content: JsonObject = { ...manifest };
  delete content.contentHash;
  const bytes = Buffer.from(jcsSerialize(content), "utf-8");
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

// Structural validation + integrity. A manifest that fails here is INVALID and is never
// evaluated for trust or applicability (spec: an invalid policy is not evaluated).
export function loadManifest(raw: unknown): LoadedManifest {
  if (!isObject(raw)) throw new ManifestError("missing_mandatory_field", "/", "manifest is not an object");
  for (const k of MANIFEST_MANDATORY) {
    if (raw[k] === undefined) throw new ManifestError("missing_mandatory_field", `/${k}`);
  }
  if (!Array.isArray(raw.chainIds) || raw.chainIds.length < 1) {
    throw new ManifestError("missing_mandatory_field", "/chainIds", "at least one chain required");
  }
  if (!Array.isArray(raw.targets) || raw.targets.length < 1) {
    throw new ManifestError("missing_mandatory_field", "/targets", "at least one target required");
  }
  raw.targets.forEach((t, i) => {
    if (!isObject(t)) throw new ManifestError("missing_mandatory_field", `/targets/${i}`);
    for (const k of TARGET_MANDATORY) {
      if (t[k] === undefined) throw new ManifestError("missing_mandatory_field", `/targets/${i}/${k}`);
    }
    if (!IDENTITY_STRATEGIES.includes(String(t.identityStrategy) as (typeof IDENTITY_STRATEGIES)[number])) {
      throw new ManifestError("invalid_enum_member", `/targets/${i}/identityStrategy`, String(t.identityStrategy));
    }
  });
  const computed = manifestContentHash(raw);
  if (raw.contentHash !== undefined && raw.contentHash !== computed) {
    throw new ManifestError("integrity_mismatch", "/contentHash",
      `embedded ${String(raw.contentHash)} != computed ${computed}`);
  }
  return { manifest: raw, contentHash: computed };
}

// The trust decision: set membership against the deployment-configured policy, nothing
// else. No field of the manifest itself can influence this beyond its content hash.
export function evaluateTrust(loaded: LoadedManifest, policy: ManifestTrustPolicy): TrustEvaluation {
  const approved = policy.approvedHashes.includes(loaded.contentHash);
  return {
    state: approved ? "trusted" : "untrusted",
    trustPolicyId: policy.trustPolicyId,
    manifestHash: loaded.contentHash,
    reasonCodes: approved ? ["approved_hash"] : ["manifest_hash_not_approved"],
  };
}

export interface ApplicabilityResult {
  applicable: boolean;
  reasonCodes: string[];
}

interface ExecutionBoundaryLike {
  kind: "execution_block";
  block: { chainId: number; number: string };
}

// Applicability of a loaded manifest at an execution boundary (adversarial test 6: an
// expired or inapplicable manifest must surface as such, never silently apply).
export function checkApplicability(loaded: LoadedManifest, boundary: ExecutionBoundaryLike): ApplicabilityResult {
  const reasonCodes: string[] = [];
  const m = loaded.manifest;
  const chainIds = Array.isArray(m.chainIds) ? m.chainIds : [];
  if (!chainIds.includes(boundary.block.chainId)) reasonCodes.push("chain_not_covered");
  const validity = isObject(m.validity) ? m.validity : {};
  const fromBlock = isObject(validity.fromBlock) ? validity.fromBlock : undefined;
  if (
    fromBlock &&
    fromBlock.chainId === boundary.block.chainId &&
    cmpDecimal(boundary.block.number, String(fromBlock.number)) < 0
  ) {
    reasonCodes.push("manifest_not_yet_valid");
  }
  const toBlock = isObject(validity.toBlock) ? validity.toBlock : undefined;
  if (
    toBlock &&
    toBlock.chainId === boundary.block.chainId &&
    cmpDecimal(boundary.block.number, String(toBlock.number)) > 0
  ) {
    reasonCodes.push("manifest_expired");
  }
  return { applicable: reasonCodes.length === 0, reasonCodes };
}
