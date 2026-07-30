// W5 slice S0 — the canonical verification request.
//
// The request is the identity of "what was asked": everything a caller controls that can
// change the result. It is DERIVED from the actual input bytes rather than supplied
// alongside them, so `requestHash` cannot disagree with what the engine went on to verify.
//
// Deployment configuration (provider matrix, quorum/boundary policy, trust policy,
// environment) is deliberately NOT part of the request — it is not caller input, and the
// spec keys caches on provider policy and evaluator version SEPARATELY from the request
// hash (ENGINEERING_SPEC §Storage and caching).
import { createHash } from "node:crypto";
import type { ManifestTrustPolicy } from "../manifest/trust";
import { findDuplicateJsonKey, jcsSerialize } from "../report/canonical";

// Which role a recorded bundle plays in the run. Recorded mode must be told this rather
// than inferring it: a bundle answers whatever it happens to contain, and guessing would
// make a misconfigured run look like a provider outage.
export type RecordingRole = "heads" | "identity";

export interface RecordingInput {
  readonly role: RecordingRole;
  readonly bytes: Uint8Array;
}

export interface VerificationInputs {
  readonly manifestBytes: Uint8Array;
  readonly recordings: readonly RecordingInput[];
}

export interface VerificationSelector {
  readonly sourceMode: "recorded";
  readonly at: "finalized";
  readonly chainIds: readonly number[];
}

export interface RecordingRef {
  readonly role: RecordingRole;
  readonly bytesHash: string;
}

export interface VerificationRequest {
  readonly requestVersion: "1";
  readonly sourceMode: "recorded";
  readonly at: "finalized";
  readonly chainIds: readonly number[];
  readonly manifestBytesHash: string;
  readonly recordings: readonly RecordingRef[];
}

// Caller-contract violation arriving from an untyped edge (an HTTP body, a CLI argv).
// Machine code + JSON-pointer path, matching ChainError/ManifestError/CanonicalizationError.
export class RequestError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path: string, detail?: string) {
    super(detail ? `${code} at ${path}: ${detail}` : `${code} at ${path}`);
    this.name = "RequestError";
    this.code = code;
    this.path = path;
  }
}

const RECORDING_ROLES: readonly RecordingRole[] = ["heads", "identity"];

const sha256OfBytes = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Every rejection is fail-closed: a request that cannot verify anything must not be
// constructible, and an unsupported mode is refused rather than quietly narrowed to one we
// do support (a downgrade the caller never asked for is a false claim about what was run).
function assertRequestable(inputs: VerificationInputs, selector: VerificationSelector): void {
  if (selector.sourceMode !== "recorded") {
    throw new RequestError("unsupported_source_mode", "/sourceMode", `only "recorded" is supported at M1`);
  }
  if (selector.at !== "finalized") {
    throw new RequestError("unsupported_at_selector", "/at", `only "finalized" is supported at M1`);
  }
  if (selector.chainIds.length === 0) {
    throw new RequestError("empty_chain_ids", "/chainIds", "a request must cover at least one chain");
  }
  selector.chainIds.forEach((id, i) => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new RequestError("invalid_chain_id", `/chainIds/${i}`, "chain ids are positive safe integers");
    }
  });
  if (new Set(selector.chainIds).size !== selector.chainIds.length) {
    throw new RequestError("duplicate_chain_id", "/chainIds", "chainIds is a set");
  }
  if (inputs.manifestBytes.length === 0) {
    throw new RequestError("empty_manifest_bytes", "/manifestBytes", "no manifest was supplied");
  }
  inputs.recordings.forEach((r, i) => {
    if (!RECORDING_ROLES.includes(r.role)) {
      throw new RequestError("invalid_recording_role", `/recordings/${i}/role`, String(r.role));
    }
    if (r.bytes.length === 0) {
      throw new RequestError("empty_recording_bytes", `/recordings/${i}/bytes`, `role ${r.role}`);
    }
  });
  if (!inputs.recordings.some((r) => r.role === "heads")) {
    throw new RequestError("missing_heads_recording", "/recordings",
      "recorded mode cannot establish an observation boundary without head responses");
  }
}

// Set-like request fields are canonically ordered so the order a caller happens to supply
// chains or bundles in cannot change the request's identity. (Same discipline as
// normalizeReport, which sorts every set-like array before the report is hashed.)
export function buildRequest(
  inputs: VerificationInputs,
  selector: VerificationSelector,
): VerificationRequest {
  assertRequestable(inputs, selector);

  const recordings = inputs.recordings
    .map((r) => ({ role: r.role, bytesHash: sha256OfBytes(r.bytes) }))
    .sort((a, b) => (a.role === b.role ? cmp(a.bytesHash, b.bytesHash) : cmp(a.role, b.role)));

  const seen = new Set<string>();
  for (const r of recordings) {
    const key = `${r.role}\u0000${r.bytesHash}`;
    if (seen.has(key)) {
      throw new RequestError("duplicate_recording", "/recordings",
        `${r.role} bundle ${r.bytesHash} supplied more than once`);
    }
    seen.add(key);
  }

  return {
    requestVersion: "1",
    sourceMode: selector.sourceMode,
    at: selector.at,
    chainIds: [...selector.chainIds].sort((a, b) => a - b),
    manifestBytesHash: sha256OfBytes(inputs.manifestBytes),
    recordings,
  };
}

export function requestHash(request: VerificationRequest): string {
  return `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(request), "utf-8")).digest("hex")}`;
}

// The ONE strict-instant rule (W5 round-1 Codex F3, extended to evidence timestamps by
// round 2): grammar (ISO-UTC, optional milliseconds, Z only) plus an exact calendar
// round-trip — V8's Date.parse ROLLS impossible dates over (Feb 30 -> Mar 2) instead of
// refusing them, so NaN-checking is not a calendar check. Returns epoch milliseconds, or
// null when the value is not a real instant. Shared by the deployment clock validation
// and the freshness evaluation so the two can never disagree about what a timestamp is.
export function parseStrictInstant(value: string): number | null {
  const form = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d{1,3})?Z$/.exec(value);
  if (form === null) return null;
  const parsed = new Date(value);
  const fraction = (form[2] ?? ".").slice(1).padEnd(3, "0");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== `${form[1]}.${fraction}Z`) {
    return null;
  }
  return parsed.getTime();
}

// W5 round-1 Codex F4: the CLI's --trust-policy file is a THIRD untrusted byte boundary —
// raw JSON.parse there reopened the [[R-003]] last-wins class (a duplicate approvedHashes
// key silently flips the trust decision) and misclassified wrong-shaped caller input as an
// engine failure. Same discipline as the manifest/recording loaders: duplicate scan on the
// TEXT before parsing, then a strict shape — every failure is typed caller input.
const SHA256_ID = /^sha256:[0-9a-f]{64}$/;

export function loadTrustPolicyBytes(bytes: Uint8Array): ManifestTrustPolicy {
  const text = new TextDecoder().decode(bytes);
  const duplicate = findDuplicateJsonKey(text);
  if (duplicate !== null) {
    throw new RequestError("duplicate_json_key", "/trustPolicy", duplicate);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RequestError("invalid_trust_policy", "/trustPolicy", "not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RequestError("invalid_trust_policy", "/trustPolicy", "must be an object");
  }
  const record = parsed as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== "approvedHashes,trustPolicyId") {
    throw new RequestError(
      "invalid_trust_policy",
      "/trustPolicy",
      "exactly trustPolicyId and approvedHashes",
    );
  }
  const { trustPolicyId, approvedHashes } = record;
  if (typeof trustPolicyId !== "string" || trustPolicyId.length === 0) {
    throw new RequestError(
      "invalid_trust_policy",
      "/trustPolicy/trustPolicyId",
      "nonempty string required",
    );
  }
  if (!Array.isArray(approvedHashes)) {
    throw new RequestError("invalid_trust_policy", "/trustPolicy/approvedHashes", "array required");
  }
  const seen = new Set<string>();
  for (const [index, entry] of approvedHashes.entries()) {
    if (typeof entry !== "string" || !SHA256_ID.test(entry)) {
      throw new RequestError(
        "invalid_trust_policy",
        `/trustPolicy/approvedHashes/${index}`,
        "sha256:<64 lowercase hex> required",
      );
    }
    if (seen.has(entry)) {
      throw new RequestError(
        "invalid_trust_policy",
        `/trustPolicy/approvedHashes/${index}`,
        "duplicate entry",
      );
    }
    seen.add(entry);
  }
  return { trustPolicyId, approvedHashes: approvedHashes as string[] };
}
