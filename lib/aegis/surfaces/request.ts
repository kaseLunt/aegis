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
import { jcsSerialize } from "../report/canonical";

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
