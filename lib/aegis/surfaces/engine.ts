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
import type { FinalityDowngrade, PinnedBlock } from "../chain/selection";
import {
  type EvaluatedFreshness,
  type FreshnessState,
  type IdentityTarget,
  compareIdentityTarget,
} from "../identity/compare";
import { type ObservedIdentity, observeIdentity } from "../identity/observe";
import {
  type LoadedManifest,
  type ManifestTrustPolicy,
  checkApplicability,
  trustedManifestFromBytes,
} from "../manifest/trust";
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
  // The freshness policy is DECLARED config, like confirmationDepth: an id plus the
  // maximum evidence age (decimal seconds) it accepts as current (W5 round-1 Codex F2 —
  // freshness is evaluated over evidence timestamps, never fabricated).
  readonly freshnessPolicy: { readonly policyId: string; readonly maxAgeSeconds: string };
}

export interface BoundaryDiagnostic {
  readonly chainId: number;
  readonly status: "pinned" | "unresolved";
  readonly quorum: QuorumResult;
  readonly block: PinnedBlock | null;
  // W5 acceptance: finality downgrades reach the reader on every surface. Diagnostics are
  // excluded from the hashed payload, so carrying the full record here leaves reportHash
  // untouched (pinned by D21).
  readonly downgrades: readonly FinalityDowngrade[];
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

  // Head observations lose per-response provenance on the way through the W3 engine:
  // ChainAdapter.getFinalizedHead returns a PinnedBlock, so `capturedAt`/`sourceMode` from the
  // recording envelope never reach ProviderObservation (identity reads DO keep theirs, via
  // IdentityReadResult). Until that adapter contract carries metadata, the bundle's own
  // capturedAt is the honest timestamp for every response it contains. With more than one heads
  // bundle the attribution would be a guess, so refuse instead of guessing.
  if (heads.length !== 1) {
    throw new SurfaceError(
      "ambiguous_head_provenance",
      "/recordings",
      `exactly one heads recording is supported; got ${heads.length}`,
    );
  }
  const headsCapturedAt = heads[0].capturedAt;

  const boundaries: BoundaryDiagnostic[] = [];
  const observationBoundaries: unknown[] = [];
  const evidenceById = new Map<string, unknown>();

  for (const chainId of request.chainIds) {
    const result = await establishBoundary(headAdapters, chainId, deployment.boundaryPolicy);
    boundaries.push({
      chainId,
      status: result.status,
      quorum: result.quorum,
      block: result.status === "pinned" ? result.boundary.block : null,
      downgrades: result.downgrades,
    });
    if (result.status !== "pinned") continue;

    observationBoundaries.push(result.boundary);
    for (const o of result.observations) {
      if (o.status !== "ok" || o.rawResultHash === undefined) continue;
      const ref = {
        id: shaOfJcs({ providerId: o.providerId, boundary: result.boundary, kind: "head" }),
        kind: "rpc_call",
        provenanceClass: deployment.provenanceClass,
        sourceMode: request.sourceMode,
        providerId: o.providerId,
        method: "eth_getBlockByNumber",
        boundary: result.boundary,
        rawResultHash: o.rawResultHash,
        capturedAt: o.capturedAt ?? headsCapturedAt,
      };
      evidenceById.set(idOf(ref), ref);
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

  // Targets come from the TRUSTED manifest — the one whose recomputed content hash IS
  // policyTrust.manifestHash — never from caller input (R-b4e2e152 §3). When the manifest is
  // untrusted or invalid there is no manifest to read them from, so nothing is verified.
  const identityAdapters = inputs.recordings
    .filter((r) => r.role === "identity")
    .map((r) => loadRecordingBytes(r.bytes))
    .flatMap((bundle) => deployment.providers.map((provider) => recordedAdapter(bundle, provider)));

  const verifications: unknown[] = [];
  const unverifiableTargets: { targetId: string; chainId: number }[] = [];
  const notApplicableTargets: { targetId: string; chainId: number }[] = [];
  const inapplicableChains = new Set(applicability.map((a) => a.chainId));

  for (const target of targetsOf(loaded)) {
    const pinned = boundaries.find((b) => b.chainId === target.chainId)?.block ?? null;
    if (pinned === null) {
      // A declared expectation we could not evaluate is surfaced, never silently dropped —
      // a filtered target reads as "checked and fine" when it was never checked at all.
      unverifiableTargets.push({ targetId: target.targetId, chainId: target.chainId });
      continue;
    }
    // W5 round-1 Codex F1: a TRUSTED manifest must also APPLY at this chain's boundary.
    // An out-of-window or wrong-environment manifest is gated BEFORE observation and
    // comparison — recording the inapplicability while still evaluating would let a
    // pass-capable fixture reach a false-clean exit 0.
    if (inapplicableChains.has(target.chainId)) {
      notApplicableTargets.push({ targetId: target.targetId, chainId: target.chainId });
      continue;
    }

    const observed = await observeIdentity(
      target.identityStrategy,
      target.address,
      identityAdapters,
      pinned,
      deployment.boundaryPolicy.quorum,
    );

    const comparison = compareIdentityTarget(target, observed, pinned, {
      provenanceClass: deployment.provenanceClass,
      manifestHash: policyTrust.manifestHash,
      manifestEvidence: manifestEvidenceOf(policyTrust.manifestHash, deployment, request.sourceMode),
      // EVALUATED, never fabricated (W5 round-1 Codex F2): the policy is applied to the
      // observation's own evidence timestamps; the comparator then gates the verdict
      // (stale evidence can never yield a current pass).
      freshness: evaluateFreshness(observed, deployment, pinned),
    });

    verifications.push(...comparison.verifications);
    // Referential integrity is the caller's job: every ref a verification names must also be
    // present in top-level evidence, and set-like arrays must be duplicate-free. The manifest
    // ref repeats across targets, so dedupe by id.
    for (const ref of comparison.evidence) evidenceById.set(idOf(ref), ref);
  }

  const limitations = [
    // "reviewed" is banned here (W5 round-1 Codex F5): the API accepts arbitrary caller
    // bytes, and integrity-valid material is not evidence of review — the payload may
    // never attest one.
    { code: "recorded_inputs", text: "Evaluated from recorded fixtures; not live production telemetry." },
    ...applicability.map((a) => ({
      code: "manifest_not_applicable",
      text: `Manifest does not apply at the chain ${a.chainId} boundary: ${a.reasonCodes.join(", ")}.`,
    })),
    ...unverifiableTargets.map((t) => ({
      code: "target_boundary_unavailable",
      text: `Target ${t.targetId} was not evaluated: no observation boundary on chain ${t.chainId}.`,
    })),
    ...notApplicableTargets.map((t) => ({
      code: "target_manifest_not_applicable",
      text: `Target ${t.targetId} was not evaluated: manifest does not apply at the chain ${t.chainId} boundary.`,
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
    evidence: [...evidenceById.values()],
    verifications,
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

// Targets of the TRUSTED manifest only. loadManifest already validated every target against
// TARGET_MANDATORY (targetId, chainId, address, identityStrategy, expectedRuntimeCodeHash) and
// deep-froze the result, so these are inert plain data that snapshotInert accepts as-is; they
// are passed through whole rather than reprojected, so a field the manifest declares can never
// be dropped on the way to the comparator.
function targetsOf(loaded: LoadedManifest | null): readonly IdentityTarget[] {
  if (loaded === null) return [];
  const targets = loaded.manifest.targets;
  return Array.isArray(targets) ? (targets as IdentityTarget[]) : [];
}

// The manifest's own evidence ref, bound to the hash the report carries: the comparator
// requires rawResultHash === manifestHash and a source_snapshot boundary whose contentHash is
// that same hash, so a format-valid-but-unbound ref cannot stand in for the real one.
function manifestEvidenceOf(manifestHash: string, deployment: DeploymentConfig, sourceMode: string) {
  return {
    id: shaOfJcs(["manifest-evidence", manifestHash]),
    kind: "manifest" as const,
    provenanceClass: deployment.provenanceClass,
    sourceMode,
    boundary: {
      kind: "source_snapshot" as const,
      snapshot: { sourceId: "manifest", contentHash: manifestHash },
    },
    rawResultHash: manifestHash,
    // The manifest's acquisition time is unknowable at M1: caller bytes carry no
    // acquisition metadata, and a wall clock would break payload determinism. The only
    // honest value is the canonical degraded "unknown" (the manifestVersion precedent) —
    // aliasing the injected evaluation clock as a capture time presents a modeled or
    // future clock as source-snapshot acquisition (W5 round-1 Codex F6).
    capturedAt: "unknown",
  };
}

// The freshness policy, applied (W5 round-1 Codex F2). The assessable signal is the
// observation's own per-response capture timestamps versus the injected evaluation clock:
// every resolved provider read must be younger than the policy's maxAgeSeconds to be
// current; any older read makes the observation stale; and when nothing is assessable —
// no resolved reads, an unparseable timestamp, or a capture AFTER the evaluation clock —
// the state is "unknown", never an optimistic default. Head-lag freshness is the quorum
// policy's axis (maxHeadLagBlocks), not this one.
function evaluateFreshness(
  observed: ObservedIdentity,
  deployment: DeploymentConfig,
  pinned: PinnedBlock,
): EvaluatedFreshness {
  const evaluatedAt = Date.parse(deployment.evaluationTime);
  const maxAgeMs = Number(deployment.freshnessPolicy.maxAgeSeconds) * 1000;
  const captures = observed.reads.flatMap((read) =>
    read.observations
      .filter((o) => o.status === "ok")
      .map((o) => (typeof o.capturedAt === "string" ? Date.parse(o.capturedAt) : Number.NaN)),
  );
  let state: FreshnessState;
  if (captures.length === 0 || captures.some((c) => Number.isNaN(c) || c > evaluatedAt)) {
    state = "unknown";
  } else if (captures.some((c) => evaluatedAt - c > maxAgeMs)) {
    state = "stale";
  } else {
    state = "current";
  }
  return {
    aggregate: state,
    assessments: [
      {
        policyId: deployment.freshnessPolicy.policyId,
        boundary: { kind: "execution_block", block: pinned },
        state,
      },
    ],
  };
}

const idOf = (ref: unknown): string => String((ref as { id?: unknown }).id);

// An unapproved or unloadable manifest's self-declared version is NOT echoed into a canonical
// field: the document was refused, and repeating its chosen strings would let a rejected input
// place text in a report. The hash in policyTrust.manifestHash remains the authoritative
// identity of what was refused.
function manifestVersionOf(loaded: { manifest: Record<string, unknown> } | null): string {
  const declared = loaded?.manifest.manifestVersion;
  return typeof declared === "string" && declared.length > 0 ? declared : "unknown";
}
