// W5 slice S4 — framework-free core of the report API surface (S4 plan §7). The route
// files under app/api/v1/** are thin adapters over this module so every HTTP edge builds
// the same envelope and classifies the same way — the exitCodeForPayload precedent.
//
// The envelope is the spec's four-field delivery wrapper (ENGINEERING_SPEC:868-877):
// requestId/generatedAt are delivery metadata and never enter the hash (:846, :879). The
// body is jcsSerialize of the envelope, never JSON.stringify, so the payload subtree stays
// byte-identical to the CLI's {payload, reportHash} core (S7 gate).
import { z } from "zod";
import { loadRecordingBytes } from "../chain/adapter";
import { ChainError } from "../chain/quorum";
import { findDuplicateJsonKey, jcsSerialize } from "../report/canonical";
import { runVerification, SurfaceError } from "./engine";
import { referenceDeployment } from "./profiles";
import { RequestError } from "./request";

// Size/shape limits, the S2 deferral landed at the HTTP edge (S4 plan §5). Canon names
// the limit CLASSES (ENGINEERING_SPEC:883) but no numbers anywhere — these values are the
// pinned RULING. Total-body is checked on the raw bytes BEFORE any decode or parse.
export const API_LIMITS = {
  maxBodyBytes: 16 * 1024 * 1024,
  maxManifestBytes: 1024 * 1024,
  maxRecordingBytes: 8 * 1024 * 1024,
  maxRecordings: 8,
  maxChainIds: 16,
  maxApprovedHashes: 64,
} as const;

// The zod schema validates the OUTER body only. The embedded manifest/recording documents
// stay base64 raw bytes and are NEVER parsed here: R-003's duplicate-key guard runs on
// decoded text inside the loaders, and byte identity decides duplicate_recording vs
// ambiguous_head_provenance — parse-then-restringify would destroy both (S4 plan §1).
const VERIFY_BODY = z
  .object({
    manifest: z.string(),
    recordings: z.array(
      z.object({ role: z.enum(["heads", "identity"]), bytes: z.string() }).strict(),
    ),
    chainIds: z.array(z.number()),
    at: z.string(),
    evaluationTime: z.string(),
    profile: z.literal("reference"),
    trustPolicy: z
      .object({ trustPolicyId: z.string(), approvedHashes: z.array(z.string()) })
      .strict()
      .optional(),
  })
  .strict();

// The external representation of report identity (ENGINEERING_SPEC:835-836), pinned
// strictly — a GET key is refused before any lookup if it does not match.
const REPORT_HASH_STRICT = /^sha256:[0-9a-f]{64}$/;

// Content-addressed report store — S4 plan §6 RULING. In-memory and PER-ISOLATE on
// purpose: the deployment has zero storage bindings, canon requires no GET durability at
// M1 (the durable permalink is M2, ROADMAP:127), and adding a binding is an owner
// decision outside W5's allowed_paths. Semantics: non-durable, empty after every
// redeploy; a POST handled by one isolate is invisible to a GET routed to another. Dev
// (single isolate) will LOOK durable; production retention is best-effort within one
// isolate lifetime. The stored payload is the engine's deep-frozen object.
const REPORT_STORE = new Map<string, unknown>();

function pointerFromIssue(issue: z.ZodIssue): string {
  const segments: readonly (string | number)[] =
    issue.code === "unrecognized_keys" ? [...issue.path, issue.keys[0]] : issue.path;
  return `/${segments.join("/")}`;
}

function errorResponse(status: number, code: string, path?: string, detail?: string): Response {
  return Response.json(
    {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      error: {
        code,
        ...(path === undefined ? {} : { path }),
        ...(detail === undefined ? {} : { detail }),
      },
    },
    { status },
  );
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

function reportResponse(payload: unknown, reportHash: string): Response {
  const envelope = {
    requestId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    payload,
    reportHash,
  };
  return new Response(jcsSerialize(envelope), {
    status: 200,
    headers: {
      "content-type": "application/json",
      etag: `"${reportHash}"`,
      "cache-control": "no-store",
    },
  });
}

export async function handleVerify(request: Request): Promise<Response> {
  // Total-body limit on the RAW bytes, before any decode or parse — the cheap DoS guard
  // (THREAT_MODEL:76/:127).
  const raw = await request.arrayBuffer();
  if (raw.byteLength > API_LIMITS.maxBodyBytes) {
    return errorResponse(400, "request_too_large");
  }
  const text = new TextDecoder().decode(raw);

  // R-003 at the outer boundary too: a duplicate key is invisible after parse, so the scan
  // runs on the text first — the same order the byte loaders use (scan, then parse).
  if (findDuplicateJsonKey(text) !== null) {
    return errorResponse(400, "duplicate_json_key");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return errorResponse(400, "malformed_request_body");
  }
  const checked = VERIFY_BODY.safeParse(parsed);
  if (!checked.success) {
    return errorResponse(400, "invalid_request_body", pointerFromIssue(checked.error.issues[0]));
  }
  const body = checked.data;

  // Shape limits on the validated outer body, before the (costlier) base64 decodes.
  if (body.recordings.length > API_LIMITS.maxRecordings) {
    return errorResponse(400, "too_many_recordings", "/recordings");
  }
  if (body.chainIds.length > API_LIMITS.maxChainIds) {
    return errorResponse(400, "too_many_chain_ids", "/chainIds");
  }
  if (body.trustPolicy !== undefined && body.trustPolicy.approvedHashes.length > API_LIMITS.maxApprovedHashes) {
    return errorResponse(400, "too_many_approved_hashes", "/trustPolicy/approvedHashes");
  }

  let manifestBytes: Uint8Array;
  try {
    manifestBytes = fromBase64(body.manifest);
  } catch {
    return errorResponse(400, "invalid_base64", "/manifest");
  }
  if (manifestBytes.byteLength > API_LIMITS.maxManifestBytes) {
    return errorResponse(400, "manifest_too_large", "/manifest");
  }
  const recordings: { role: "heads" | "identity"; bytes: Uint8Array }[] = [];
  for (const [index, recording] of body.recordings.entries()) {
    let bytes: Uint8Array;
    try {
      bytes = fromBase64(recording.bytes);
    } catch {
      return errorResponse(400, "invalid_base64", `/recordings/${index}/bytes`);
    }
    if (bytes.byteLength > API_LIMITS.maxRecordingBytes) {
      return errorResponse(400, "recording_too_large", `/recordings/${index}/bytes`);
    }
    recordings.push({ role: recording.role, bytes });
  }

  // Pre-validation, the CLI's B11 ruling: each recording is loaded and the result
  // DISCARDED — corruption is caller input (400), and the engine still re-earns the
  // WeakSet provenance brand from the raw bytes itself.
  for (const [index, recording] of recordings.entries()) {
    try {
      loadRecordingBytes(recording.bytes);
    } catch (error) {
      if (error instanceof ChainError) {
        return errorResponse(400, error.code, `/recordings/${index}/bytes`);
      }
      throw error;
    }
  }

  const selector = {
    sourceMode: "recorded" as const,
    // Passed through VERBATIM — the ENGINE refuses anything but "finalized" (the CLI rule).
    at: body.at as "finalized",
    chainIds: body.chainIds,
  };
  // Deployment construction validates the clock (invalid_evaluation_time, W5 round-1
  // Codex F3) — inside the guarded region so a refusal is a 400 with its exact pointer,
  // never an unhandled throw.
  try {
    const deployment = referenceDeployment(manifestBytes, {
      evaluationTime: body.evaluationTime,
      trustPolicy: body.trustPolicy,
    });
    const run = await runVerification({ manifestBytes, recordings }, selector, deployment);
    REPORT_STORE.set(run.reportHash, run.payload);
    return reportResponse(run.payload, run.reportHash);
  } catch (error) {
    // A RequestError is caller input the engine refused — the API surfaces its own
    // code + path verbatim and never pre-judges or re-words it (the CLI's exit-4 row).
    if (error instanceof RequestError) {
      return errorResponse(400, error.code, error.path);
    }
    // SurfaceError is the spec's only no-envelope case (ENGINEERING_SPEC:881): HTTP 503,
    // the CLI's exit-5 row. Anything else is equally an operational failure of the run.
    if (error instanceof SurfaceError) {
      return errorResponse(503, error.code, error.path);
    }
    const code =
      error instanceof Error && "code" in error && typeof error.code === "string"
        ? error.code
        : "engine_failure";
    return errorResponse(503, code);
  }
}

export function handleGetReport(hash: string): Response {
  if (!REPORT_HASH_STRICT.test(hash)) {
    return errorResponse(400, "invalid_report_hash", "/hash");
  }
  const payload = REPORT_STORE.get(hash);
  if (payload === undefined) {
    // Claim-strength discipline: a miss in a per-isolate, non-durable store says nothing
    // about whether the report ever existed — only that it is not retained HERE, NOW.
    return errorResponse(
      404,
      "report_not_found",
      "/hash",
      `report ${hash} is not currently retained by this instance; M1 retention is per-isolate and non-durable`,
    );
  }
  return reportResponse(payload, hash);
}
