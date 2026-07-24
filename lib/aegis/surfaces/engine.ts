// W5 slice S0 — the engine facade: THE one engine, and the only place the W1–W4 spine is
// composed.
//
// Every M1 surface (CLI, report API, CI adapter, web evidence drawer) calls this and renders
// what it returns. No surface may evaluate anything: the M1 exit gate is that the same request
// yields a byte-identical reportHash on all four, and the only way to guarantee that is one
// composition with four transports over it.
//
// Trust boundaries this function owns:
//   - It is handed BYTES and deployment CONFIG, never pre-built objects. WeakSet provenance
//     brands are process- and module-instance-local, so a "verified" bundle cannot be shipped
//     in from elsewhere; every run re-earns the brand here via loadRecordingBytes
//     (INS-a6fc2796 addendum 3).
//   - Deployment configuration (provider matrix, quorum/boundary policy, trust policy,
//     environment) is NEVER caller-of-report input; the request carries only caller intent.
//   - The returned payload is inert frozen I-JSON, so a transport cannot be shown one value
//     while the hash covers another.
import { createHash } from "node:crypto";
import { loadRecordingBytes, recordedAdapter } from "../chain/adapter";
import { type BoundaryPolicy, establishBoundary } from "../chain/engine";
import type { ProviderConfig } from "../chain/providers";
import type { QuorumResult } from "../chain/quorum";
import type { PinnedBlock } from "../chain/selection";
import { type ManifestTrustPolicy, checkApplicability, trustedManifestFromBytes } from "../manifest/trust";
import { jcsSerialize, reportHash } from "../report/canonical";
import {
  type VerificationInputs,
  type VerificationRequest,
  type VerificationSelector,
  buildRequest,
  requestHash,
} from "./request";

// Deployment configuration — reviewed, operator-owned, and never accepted from the caller of a
// report. Providers come from the reviewed matrix so verification can never become an SSRF
// primitive, and `provenanceClass` states what the configured recordings ARE (reference
// fixtures are not observed production state).
export interface DeploymentConfig {
  readonly engineVersion: string;
  readonly environment: string;
  readonly evaluationTime: string;
  readonly provenanceClass: string;
  readonly trustPolicy: ManifestTrustPolicy;
  readonly boundaryPolicy: BoundaryPolicy;
  readonly providers: readonly ProviderConfig[];
}

export interface BoundaryDiagnostic {
  readonly chainId: number;
  readonly status: "pinned" | "unresolved";
  readonly quorum: QuorumResult;
  readonly block: PinnedBlock | null;
}

// In-process-only detail that must NOT enter the hashed payload but that an evidence drawer
// and a CLI renderer legitimately want (why a boundary failed, which provider went missing).
export interface RunDiagnostics {
  readonly boundaries: readonly BoundaryDiagnostic[];
  readonly applicability: readonly { readonly chainId: number; readonly reasonCodes: readonly string[] }[];
}

export interface VerificationRun {
  readonly payload: unknown;
  readonly reportHash: string;
  readonly request: VerificationRequest;
  readonly diagnostics: RunDiagnostics;
}

// A run-level failure: the engine could not construct a meaningful report at all. Distinct in
// kind from an in-band verdict — `unknown`/`stale`/`conflict` are legitimate report content and
// must never surface as an operational error, and this must never surface as a verdict.
// Maps to CLI exit 5 / HTTP 503, the only cases the spec reserves for "no envelope".
export class SurfaceError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path: string, detail?: string) {
    super(detail ? `${code} at ${path}: ${detail}` : `${code} at ${path}`);
    this.name = "SurfaceError";
    this.code = code;
    this.path = path;
  }
}

const shaOfJcs = (value: unknown): string =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(value), "utf-8")).digest("hex")}`;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  return Object.freeze(value);
}

export async function runVerification(
  inputs: VerificationInputs,
  selector: VerificationSelector,
  deployment: DeploymentConfig,
): Promise<VerificationRun> {
  const request = buildRequest(inputs, selector);

  // Re-earn the provenance brand from raw bytes, in this process. A bundle is only adapter-usable
  // if loadRecordingBytes verified every response envelope here.
  const heads = inputs.recordings
    .filter((r) => r.role === "heads")
    .map((r) => loadRecordingBytes(r.bytes));
  const headAdapters = heads.flatMap((bundle) =>
    deployment.providers.map((provider) => recordedAdapter(bundle, provider)),
  );

  const boundaries: BoundaryDiagnostic[] = [];
  const observationBoundaries: unknown[] = [];
  const evidence: unknown[] = [];

  for (const chainId of request.chainIds) {
    const result = await establishBoundary(headAdapters, chainId, deployment.boundaryPolicy);
    boundaries.push({
      chainId,
      status: result.status,
      quorum: result.quorum,
      block: result.status === "pinned" ? result.boundary.block : null,
    });
    if (result.status !== "pinned") continue;

    observationBoundaries.push(result.boundary);
    for (const o of result.observations) {
      if (o.status !== "ok" || o.rawResultHash === undefined || o.capturedAt === undefined) continue;
      evidence.push({
        id: shaOfJcs({ providerId: o.providerId, boundary: result.boundary, kind: "head" }),
        kind: "rpc_call",
        provenanceClass: deployment.provenanceClass,
        sourceMode: request.sourceMode,
        providerId: o.providerId,
        method: "eth_getBlockByNumber",
        boundary: result.boundary,
        rawResultHash: o.rawResultHash,
        capturedAt: o.capturedAt,
      });
    }
  }

  // Fail closed rather than emit a boundaryless report: a canonical report asserts what was
  // observed AT a boundary, so with none established there is nothing honest to say. The
  // diagnostics carry why each chain failed.
  if (observationBoundaries.length === 0) {
    throw new SurfaceError(
      "no_observation_boundary",
      "/observationBoundaries",
      `no boundary established on any requested chain (${boundaries
        .map((b) => `${b.chainId}: ${b.quorum.outcome} [${b.quorum.reasonCodes.join(" ")}]`)
        .join("; ")})`,
    );
  }

  const { block: policyTrust, loaded } = trustedManifestFromBytes(
    inputs.manifestBytes,
    deployment.trustPolicy,
    [],
  );

  // A trusted manifest still has to APPLY at the boundary we pinned — nothing upstream checks
  // this, so an out-of-window or wrong-environment manifest would otherwise apply silently.
  const applicability = loaded
    ? boundaries
        .filter((b) => b.block !== null)
        .map((b) => ({
          chainId: b.chainId,
          reasonCodes: checkApplicability(
            loaded,
            { kind: "execution_block", block: { chainId: b.chainId, number: b.block!.number } },
            deployment.environment,
          ).reasonCodes,
        }))
        .filter((a) => a.reasonCodes.length > 0)
    : [];

  const limitations = [
    { code: "recorded_inputs", text: "Evaluated from reviewed recorded fixtures; not live production telemetry." },
    ...applicability.map((a) => ({
      code: "manifest_not_applicable",
      text: `Manifest does not apply at the chain ${a.chainId} boundary: ${a.reasonCodes.join(", ")}.`,
    })),
  ];

  const payload = {
    schemaVersion: "1",
    engineVersion: deployment.engineVersion,
    evaluationTime: deployment.evaluationTime,
    manifestVersion: manifestVersionOf(loaded),
    manifestHash: policyTrust.manifestHash,
    policyRefs: [],
    policyTrust,
    sourceMode: request.sourceMode,
    requestHash: requestHash(request),
    observationBoundaries,
    evidence,
    verifications: [],
    facts: [],
    coverage: { supported: [], unsupported: [], excluded: [] },
    limitations,
  };

  return deepFreeze({
    payload,
    reportHash: reportHash(payload),
    request,
    diagnostics: { boundaries, applicability },
  });
}

// An unapproved or unloadable manifest's self-declared version is NOT echoed into a canonical
// field: the document was refused, and repeating its chosen strings would let a rejected input
// place text in a report. The hash in policyTrust.manifestHash remains the authoritative
// identity of what was refused.
function manifestVersionOf(loaded: { manifest: Record<string, unknown> } | null): string {
  const declared = loaded?.manifest.manifestVersion;
  return typeof declared === "string" && declared.length > 0 ? declared : "unknown";
}
