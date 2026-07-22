// W2 manifest model + trust root (ENGINEERING_SPEC §Manifest model, §Manifest trust root).
// A manifest declares expected state and is authenticated ONLY by the deployment-configured
// trust policy (approved content-hash set). Author/reviewer fields are descriptive content:
// they participate in the hash, never in the trust decision (THREAT_MODEL: a self-consistent
// manifest hash or reviewer-name field is not proof the manifest is authorized).
import { createHash } from "node:crypto";
import { assertJsonDomain, cmpDecimal, jcsSerialize } from "../report/canonical";

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

const obj = (v: unknown): JsonObject => (isObject(v) ? v : {});

const MANIFEST_MANDATORY = [
  "schemaVersion", "manifestVersion", "protocol", "environment", "author", "reviewers",
  "createdAt", "chainIds", "validity", "policyRefs", "targets", "invariantIds", "uncovered",
] as const;

const TARGET_MANDATORY = [
  "targetId", "chainId", "address", "identityStrategy", "expectedRuntimeCodeHash",
] as const;

const IDENTITY_STRATEGIES = ["direct", "eip1967", "beacon", "eip1167_clone", "custom"] as const;

const SHA256_STRICT = /^sha256:[0-9a-f]{64}$/;
const ADDRESS_STRICT = /^0x[0-9a-f]{40}$/;
const DECIMAL_STRICT = /^(0|[1-9][0-9]*)$/;

const bad = (code: string, path: string, detail?: string): never => {
  throw new ManifestError(code, path, detail);
};

function requireSha256(path: string, v: unknown): void {
  if (typeof v !== "string" || !SHA256_STRICT.test(v)) bad("invalid_sha256_identifier", path, String(v));
}
function requireAddress(path: string, v: unknown): void {
  if (typeof v !== "string" || !ADDRESS_STRICT.test(v)) bad("invalid_address", path, String(v));
}
function requireDecimal(path: string, v: unknown): void {
  if (typeof v !== "string" || !DECIMAL_STRICT.test(v)) bad("noncanonical_unsigned_decimal", path, String(v));
}
function requireUniqueMembers(path: string, arr: unknown[], key: (v: unknown) => string): void {
  const seen = new Set<string>();
  for (const v of arr) {
    const k = key(v);
    if (seen.has(k)) bad("duplicate_set_member", path, k);
    seen.add(k);
  }
}

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

// Domain normalization for manifests (spine review P1#5): JCS does not normalize arrays, so
// set-like manifest fields must be ordered before hashing or logically-equal manifests hash
// differently. Sets here: chainIds, invariantIds, uncovered, policyRefs. targets keep author
// order (declared collection, keyed by targetId for dedup only). Operates on a plain-object
// clone; assertJsonDomain (in jcsSerialize) rejects non-JSON before this runs.
function normalizeManifest(manifest: JsonObject): JsonObject {
  const m: JsonObject = { ...manifest };
  delete m.contentHash;
  const cmp = (a: unknown, b: unknown) => {
    const sa = String(a), sb = String(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  };
  if (Array.isArray(m.chainIds)) m.chainIds = [...m.chainIds].sort((a, b) => Number(a) - Number(b));
  if (Array.isArray(m.invariantIds)) m.invariantIds = [...m.invariantIds].sort(cmp);
  if (Array.isArray(m.uncovered)) m.uncovered = [...m.uncovered].sort(cmp);
  if (Array.isArray(m.policyRefs)) {
    m.policyRefs = [...m.policyRefs].sort((a, b) =>
      cmp(obj(a).kind, obj(b).kind) || cmp(obj(a).id, obj(b).id) || cmp(obj(a).version, obj(b).version));
  }
  return m;
}

// Content addressing: sha256 over the JCS bytes of the NORMALIZED manifest content with the
// embedded contentHash field excluded (a hash cannot cover itself).
export function manifestContentHash(manifest: unknown): string {
  if (!isObject(manifest)) throw new ManifestError("missing_mandatory_field", "/", "manifest is not an object");
  const bytes = Buffer.from(jcsSerialize(normalizeManifest(manifest)), "utf-8");
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

// Structural validation + integrity. A manifest that fails here is INVALID and is never
// evaluated for trust or applicability (spec: an invalid policy is not evaluated). Rejects
// non-plain/exotic input up front (assertJsonDomain) so a prototype-only object cannot pass
// inherited-property checks and then hash as {} (spine review P0#1/#3). Returns a
// deep-frozen deep copy so a caller cannot mutate content after the hash is bound.
export function loadManifest(raw: unknown): LoadedManifest {
  // The manifest API surfaces one error type. A non-I-JSON input (exotic/prototype-only/
  // toJSON) is a load failure, not a canonicalization internal.
  try {
    assertJsonDomain(raw);
  } catch (e) {
    throw new ManifestError("non_json_manifest", "/", e instanceof Error ? e.message : String(e));
  }
  if (!isObject(raw)) throw new ManifestError("missing_mandatory_field", "/", "manifest is not an object");
  for (const k of MANIFEST_MANDATORY) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) throw new ManifestError("missing_mandatory_field", `/${k}`);
  }
  if (raw.contentHash === undefined) {
    throw new ManifestError("missing_mandatory_field", "/contentHash", "immutable content hash is required");
  }
  if (!Array.isArray(raw.chainIds) || raw.chainIds.length < 1) {
    throw new ManifestError("missing_mandatory_field", "/chainIds", "at least one chain required");
  }
  raw.chainIds.forEach((c, i) => {
    if (typeof c !== "number" || !Number.isInteger(c)) bad("invalid_chain_id", `/chainIds/${i}`, String(c));
  });
  requireUniqueMembers("/chainIds", raw.chainIds, (c) => String(c));
  // Set-like string fields: members must be strings (mixed types would tie under String
  // coercion in normalizeManifest's sort, making the hash input-order-dependent), unique.
  for (const field of ["invariantIds", "uncovered"] as const) {
    const arr = Array.isArray(raw[field]) ? (raw[field] as unknown[]) : [];
    arr.forEach((v, i) => {
      if (typeof v !== "string") bad("invalid_set_member", `/${field}/${i}`, typeof v);
    });
    requireUniqueMembers(`/${field}`, arr, (v) => String(v));
  }
  requireSha256("/contentHash", raw.contentHash); // shape-check the embedded hash
  const policyRefs = Array.isArray(raw.policyRefs) ? raw.policyRefs : [];
  policyRefs.forEach((r, i) => requireSha256(`/policyRefs/${i}/contentHash`, obj(r).contentHash));
  // policyRefs are a set keyed by (kind, id, version): duplicate identities are rejected
  // rather than sorted, so normalizeManifest's sort key is always a total order and two
  // refs differing only in contentHash cannot ride on input order.
  requireUniqueMembers("/policyRefs", policyRefs, (r) =>
    JSON.stringify([String(obj(r).kind), String(obj(r).id), String(obj(r).version)]));
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
    requireAddress(`/targets/${i}/address`, t.address);
    requireSha256(`/targets/${i}/expectedRuntimeCodeHash`, t.expectedRuntimeCodeHash);
    if (t.expectedImplementation !== undefined) requireAddress(`/targets/${i}/expectedImplementation`, t.expectedImplementation);
    if (typeof t.chainId !== "number" || !Number.isInteger(t.chainId)) bad("invalid_chain_id", `/targets/${i}/chainId`, String(t.chainId));
  });
  requireUniqueMembers("/targets", raw.targets, (t) => String(obj(t).targetId));
  // Validity window: structure, minimal decimals, and from <= to per chain.
  const validity = obj(raw.validity);
  for (const end of ["fromBlock", "toBlock"] as const) {
    const b = validity[end];
    if (b === null || b === undefined) continue;
    if (!isObject(b)) { bad("invalid_validity_window", `/validity/${end}`); }
    else {
      if (typeof b.chainId !== "number") bad("invalid_chain_id", `/validity/${end}/chainId`, String(b.chainId));
      requireDecimal(`/validity/${end}/number`, b.number);
    }
  }
  if (isObject(validity.fromBlock) && isObject(validity.toBlock)) {
    const from = validity.fromBlock, to = validity.toBlock;
    if (from.chainId === to.chainId && cmpDecimal(String(from.number), String(to.number)) > 0) {
      bad("invalid_validity_window", "/validity", "fromBlock is after toBlock");
    }
  }
  const computed = manifestContentHash(raw);
  if (raw.contentHash !== computed) {
    throw new ManifestError("integrity_mismatch", "/contentHash",
      `embedded ${String(raw.contentHash)} != computed ${computed}`);
  }
  const frozen = deepFreeze(structuredClone(raw));
  return { manifest: frozen, contentHash: computed };
}

function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const k of Object.keys(v as object)) deepFreeze((v as JsonObject)[k]);
    Object.freeze(v);
  }
  return v;
}

// The manifest byte boundary (INS-001): callers read files in BINARY mode and hand bytes
// here; decoding is strict in-memory UTF-8 so platform text handling never touches hashed
// bytes. Content identity is over JCS bytes of the parsed content, so JSON whitespace
// (CRLF vs LF) cannot change the hash, while undecodable or malformed bytes are typed load
// failures. R-003: JSON.parse collapses duplicate keys; the duplicate-aware strict parser
// is deferred until this boundary accepts untrusted bytes (W3/W5 API surface).
export function loadManifestBytes(bytes: Uint8Array): LoadedManifest {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ManifestError("invalid_utf8", "/", "manifest bytes are not valid UTF-8");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new ManifestError("malformed_json", "/", e instanceof Error ? e.message : String(e));
  }
  return loadManifest(raw);
}

// The trust decision: set membership against the deployment-configured policy, nothing
// else. The caller-supplied contentHash is NOT trusted — it is recomputed from the manifest
// content here, so a forged LoadedManifest {content, approvedHash} or content mutated after
// load cannot be reported trusted (spine review P0#1). No field of the manifest influences
// this beyond its recomputed content hash.
export function evaluateTrust(loaded: LoadedManifest, policy: ManifestTrustPolicy): TrustEvaluation {
  const recomputed = manifestContentHash(loaded.manifest);
  if (loaded.contentHash !== recomputed) {
    throw new ManifestError("integrity_mismatch", "/contentHash",
      `bound ${String(loaded.contentHash)} != recomputed ${recomputed} (forged or mutated manifest)`);
  }
  const approved = policy.approvedHashes.includes(recomputed);
  return {
    state: approved ? "trusted" : "untrusted",
    trustPolicyId: policy.trustPolicyId,
    manifestHash: recomputed,
    reasonCodes: approved ? ["approved_hash"] : ["manifest_hash_not_approved"],
  };
}

// The report payload's policyTrust block (ENGINEERING_SPEC AssurancePayload.policyTrust) —
// the same shape W1's validateReport enforces. Evidence refs are caller-supplied: adapters
// perform I/O and construct EvidenceRefs; this module fabricates none. The refs are opaque
// here (unknown[]) so report vocabulary never leaks into manifest contracts.
export interface PolicyTrustBlock {
  state: "trusted" | "untrusted" | "invalid";
  trustPolicyId: string;
  manifestHash: string;
  reasonCodes: string[];
  evidence: unknown[];
}

// Wires manifest loading + trust evaluation into the payload block. A manifest that fails
// to load is `invalid` and is NEVER evaluated for trust (spec: an invalid policy is not
// evaluated) — the block then anchors to the sha256 of the exact rejected bytes so the
// report still identifies which document was refused, with the typed failure as reason code.
export function policyTrustFromBytes(
  bytes: Uint8Array,
  policy: ManifestTrustPolicy,
  evidence: readonly unknown[],
): PolicyTrustBlock {
  try {
    return { ...evaluateTrust(loadManifestBytes(bytes), policy), evidence: [...evidence] };
  } catch (e) {
    if (!(e instanceof ManifestError)) throw e;
    return {
      state: "invalid",
      trustPolicyId: policy.trustPolicyId,
      manifestHash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      reasonCodes: [e.code],
      evidence: [...evidence],
    };
  }
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
// deploymentEnvironment is deployment configuration (like ManifestTrustPolicy), never
// caller-of-report input. The boundary is validated before any window comparison:
// cmpDecimal is only sound for minimal decimals, so a zero-padded boundary number would
// otherwise compare as larger than every shorter bound and silently apply (fail-open) —
// malformed input is a typed failure instead (D-004 fail-closed).
export function checkApplicability(
  loaded: LoadedManifest,
  boundary: ExecutionBoundaryLike,
  deploymentEnvironment: string,
): ApplicabilityResult {
  if (typeof boundary.block.chainId !== "number" || !Number.isInteger(boundary.block.chainId)) {
    bad("invalid_chain_id", "/boundary/block/chainId", String(boundary.block.chainId));
  }
  requireDecimal("/boundary/block/number", boundary.block.number);
  const reasonCodes: string[] = [];
  const m = loaded.manifest;
  if (m.environment !== deploymentEnvironment) reasonCodes.push("environment_mismatch");
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
