// W3 adapter boundary (ENGINEERING_SPEC §Evidence acquisition: adapters perform I/O,
// evaluators do not). The recorded-fixture adapter replays content-addressed reference
// recordings: callers read files in BINARY mode and hand bytes here (INS-001); every
// response's canonical form is integrity-verified against its recorded sha256 at load;
// a missing recording is a typed failure — missing evidence is never an invented value.
import { createHash } from "node:crypto";
import { jcsSerialize } from "../report/canonical";
import { ChainError } from "./quorum";
import type { ProviderConfig } from "./providers";
import type { PinnedBlock } from "./selection";

export interface RecordedResponse {
  providerId: string;
  chainId: number;
  method: string;
  params: unknown[];
  result: unknown;
  rawResponseSha256: string;
  // Codex W3 review P1#3: rawResponseSha256 covers only the result; the envelope hash
  // binds provenance and lookup behavior (providerId, chainId, method, params,
  // capturedAt, rawResponseSha256, result) so a relabeled copy of another provider's
  // response fails integrity instead of impersonating independent agreement.
  envelopeSha256: string;
  capturedAt: string;
}

export interface RecordingBundle {
  recordingId: string;
  capturedAt: string;
  responses: RecordedResponse[];
}

export interface ChainAdapter {
  readonly providerId: string;
  // The reviewed administrative identity (P0#1): quorum independence is judged on this,
  // never on the providerId string an adapter chooses for itself.
  readonly administrativeDomain: string;
  getFinalizedHead(chainId: number): Promise<PinnedBlock | null>;
  getLatestHead(chainId: number): Promise<PinnedBlock>;
  getBlockByNumber(chainId: number, number: string): Promise<PinnedBlock>;
}

// W4 identity reads. Every read is AT the established pin and keyed by its BLOCK HASH
// (EIP-1898 request form, Codex W4 review finding 1): a number alone proves nothing
// about which block answered, so the recording envelope — and a live provider honoring
// {blockHash} — binds the exact block. The value travels with the integrity-verified
// raw-result hash the quorum layer compares, plus the envelope's capture time and the
// adapter-declared source mode (finding 8: provenance is not caller-labelable).
export interface BlockPin {
  number: string;
  hash: string;
}

export interface IdentityReadResult {
  value: string;
  rawResultHash: string;
  capturedAt: string;
  sourceMode: "live" | "recorded" | "simulation";
}

export interface IdentityReadAdapter {
  readonly providerId: string;
  readonly administrativeDomain: string;
  getCode(chainId: number, address: string, pin: BlockPin): Promise<IdentityReadResult>;
  getStorageWord(
    chainId: number,
    address: string,
    slot: string,
    pin: BlockPin,
  ): Promise<IdentityReadResult>;
  call(
    chainId: number,
    request: { to: string; data: string },
    pin: BlockPin,
  ): Promise<IdentityReadResult>;
}

// Only bundles that passed the verifying loader may back an adapter (P1#3): a
// structurally similar object constructed elsewhere has proven nothing.
const VERIFIED_BUNDLES = new WeakSet<RecordingBundle>();

const SHA256_STRICT = /^sha256:[0-9a-f]{64}$/;

const bad = (code: string, path: string, detail?: string): never => {
  throw new ChainError(code, path, detail);
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const sha256 = (text: string): string =>
  `sha256:${createHash("sha256").update(Buffer.from(text, "utf-8")).digest("hex")}`;

function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const k of Object.keys(v as object)) deepFreeze((v as Record<string, unknown>)[k]);
    Object.freeze(v);
  }
  return v;
}

export function loadRecordingBytes(bytes: Uint8Array): RecordingBundle {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return bad("invalid_utf8", "/", "recording bytes are not valid UTF-8") as never;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return bad("malformed_json", "/", e instanceof Error ? e.message : String(e)) as never;
  }
  if (!isObject(raw) || typeof raw.recordingId !== "string" || typeof raw.capturedAt !== "string") {
    bad("invalid_recording", "/", "recordingId and capturedAt are required");
  }
  const bundle = raw as unknown as RecordingBundle;
  if (!Array.isArray(bundle.responses) || bundle.responses.length === 0) {
    bad("invalid_recording", "/responses", "at least one response required");
  }
  const seenKeys = new Set<string>();
  bundle.responses.forEach((r, i) => {
    if (!isObject(r)) bad("invalid_recording", `/responses/${i}`);
    for (const k of ["providerId", "method", "capturedAt"] as const) {
      if (typeof r[k] !== "string") bad("invalid_recording", `/responses/${i}/${k}`, typeof r[k]);
    }
    if (typeof r.chainId !== "number" || !Number.isInteger(r.chainId)) {
      bad("invalid_chain_id", `/responses/${i}/chainId`, String(r.chainId));
    }
    if (!Array.isArray(r.params)) bad("invalid_recording", `/responses/${i}/params`, typeof r.params);
    for (const k of ["rawResponseSha256", "envelopeSha256"] as const) {
      if (typeof r[k] !== "string" || !SHA256_STRICT.test(r[k])) {
        bad("invalid_sha256_identifier", `/responses/${i}/${k}`, String(r[k]));
      }
    }
    const computed = sha256(jcsSerialize(r.result));
    if (computed !== r.rawResponseSha256) {
      bad("integrity_mismatch", `/responses/${i}`, `recorded ${r.rawResponseSha256} != computed ${computed}`);
    }
    // Envelope binds provenance + lookup fields (P1#3): hash of the response minus the
    // envelope hash itself.
    const { envelopeSha256, ...envelope } = r;
    const computedEnvelope = sha256(jcsSerialize(envelope));
    if (computedEnvelope !== envelopeSha256) {
      bad("integrity_mismatch", `/responses/${i}`, `envelope ${String(envelopeSha256)} != computed ${computedEnvelope}`);
    }
    // A recording whose result claims a different chain than its envelope is inconsistent.
    if (isObject(r.result) && typeof r.result.chainId === "number" && r.result.chainId !== r.chainId) {
      bad("invalid_recording", `/responses/${i}/result/chainId`, `${String(r.result.chainId)} != envelope ${r.chainId}`);
    }
    const key = jcsSerialize({ chainId: r.chainId, method: r.method, params: r.params, providerId: r.providerId });
    if (seenKeys.has(key)) bad("duplicate_recording_key", `/responses/${i}`, key);
    seenKeys.add(key);
  });
  const verified = deepFreeze(structuredClone(bundle));
  VERIFIED_BUNDLES.add(verified);
  return verified;
}

const keyOf = (chainId: number, method: string, params: unknown[]): string =>
  jcsSerialize({ chainId, method, params });

export function recordedAdapter(
  bundle: RecordingBundle,
  provider: ProviderConfig,
): ChainAdapter & IdentityReadAdapter {
  if (!VERIFIED_BUNDLES.has(bundle)) {
    bad("bundle_not_verified", "/", "bundle must come from loadRecordingBytes");
  }
  const index = new Map<string, RecordedResponse>();
  for (const r of bundle.responses) {
    if (r.providerId === provider.providerId) index.set(keyOf(r.chainId, r.method, r.params), r);
  }
  const lookupRaw = (chainId: number, method: string, params: unknown[], path: string): RecordedResponse => {
    const r = index.get(keyOf(chainId, method, params));
    if (!r) {
      bad("recording_missing", path,
        `${provider.providerId} chain ${chainId} ${method} ${JSON.stringify(params)}`);
    }
    return r!;
  };
  const lookup = (chainId: number, method: string, params: unknown[], path: string): PinnedBlock =>
    ({ ...(lookupRaw(chainId, method, params, path).result as PinnedBlock) });
  const capabilities = (chainId: number) => {
    const cap = provider.chains[chainId];
    if (!cap) bad("unknown_chain", "/chainId", `${provider.providerId} declares nothing for chain ${chainId}`);
    return cap!;
  };
  // The recorded raw hash was integrity-verified at load; it IS sha256(jcs(result)), so
  // returning it binds the quorum comparison to the verified recording. Capture time
  // and source mode come from the envelope/adapter, never from the caller.
  const readOf = (chainId: number, method: string, params: unknown[], path: string): IdentityReadResult => {
    capabilities(chainId);
    const r = lookupRaw(chainId, method, params, path);
    if (typeof r.result !== "string") {
      bad("malformed_recorded_result", path, `${method} result must be a hex string, got ${typeof r.result}`);
    }
    return {
      value: r.result as string,
      rawResultHash: r.rawResponseSha256,
      capturedAt: r.capturedAt,
      sourceMode: "recorded",
    };
  };
  return {
    providerId: provider.providerId,
    administrativeDomain: provider.administrativeDomain,
    // WR3 discipline: a declared-absent finalized tag means the adapter NEVER guesses a
    // finalized head — the caller must take the confirmation-depth fallback path.
    async getFinalizedHead(chainId: number): Promise<PinnedBlock | null> {
      if (capabilities(chainId).finalizedTag === "declared_absent") return null;
      return lookup(chainId, "eth_getBlockByNumber", ["finalized", false], "/finalizedHead");
    },
    async getLatestHead(chainId: number): Promise<PinnedBlock> {
      capabilities(chainId);
      return lookup(chainId, "eth_getBlockByNumber", ["latest", false], "/latestHead");
    },
    async getBlockByNumber(chainId: number, number: string): Promise<PinnedBlock> {
      capabilities(chainId);
      return lookup(chainId, "eth_getBlockByNumber", [number, false], "/blockByNumber");
    },
    // Canonicality is REQUIRED (Codex W4 verification pass, F1 residual): EIP-1898
    // defaults requireCanonical to false and permits serving a known-but-orphaned
    // block. The recording canon and every live request carry requireCanonical: true;
    // a provider's noncanonical error is a failed read — missing evidence, never a
    // value from an orphaned branch.
    async getCode(chainId: number, address: string, pin: BlockPin): Promise<IdentityReadResult> {
      return readOf(
        chainId,
        "eth_getCode",
        [address, { blockHash: pin.hash, requireCanonical: true }],
        "/getCode",
      );
    },
    async getStorageWord(
      chainId: number,
      address: string,
      slot: string,
      pin: BlockPin,
    ): Promise<IdentityReadResult> {
      return readOf(
        chainId,
        "eth_getStorageAt",
        [address, slot, { blockHash: pin.hash, requireCanonical: true }],
        "/getStorageAt",
      );
    },
    async call(
      chainId: number,
      request: { to: string; data: string },
      pin: BlockPin,
    ): Promise<IdentityReadResult> {
      // The recorded key canonicalizes the request object (JCS), so property order in the
      // caller's literal never matters.
      return readOf(
        chainId,
        "eth_call",
        [{ data: request.data, to: request.to }, { blockHash: pin.hash, requireCanonical: true }],
        "/call",
      );
    },
  };
}
