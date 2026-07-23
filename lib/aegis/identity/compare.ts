// W4 slice 3 — manifest expectation comparison producing W1-shaped Verifications.
// Pure evaluator over the slice-2 observation output: no I/O, no clock. Every declared
// manifest expectation is flagged INDEPENDENTLY (expectedRuntimeCodeHash,
// expectedImplementation) with drift-requiring-review semantics — an authorized upgrade
// can create a mismatch, so the language never asserts compromise. A mismatched or
// unknown identity can never produce pass; provider disagreement surfaces as the
// canonical `conflict` state, distinct from missing evidence (Codex W4 finding 5).
// The declared strategy must equal the observed one, and a resolved identity without
// observation evidence is a typed defect (finding 2). Evidence refs carry the envelope's
// capture time, the adapter-declared source mode, the storage slot as calldata, and the
// quorum-agreed value (finding 8) — emitted for the payload's top level and referenced
// by id through the W1 role lists.
import { createHash } from "node:crypto";
import type { PinnedBlock } from "../chain/selection";
import { jcsSerialize } from "../report/canonical";
import type { IdentityReadEvidence, ObservedIdentity } from "./observe";
import { IdentityError } from "./resolve";

export const CODE_IDENTITY_EVALUATOR_VERSION = "1";
export const CODE_IDENTITY_INVARIANT = "deployment.code_identity";

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const SHA256_STRICT = /^sha256:[0-9a-f]{64}$/;

export interface IdentityTarget {
  targetId: string;
  chainId: number;
  address: string;
  identityStrategy: string;
  expectedImplementation?: string;
  expectedRuntimeCodeHash?: string;
}

export interface IdentityComparisonContext {
  provenanceClass: string;
  // The manifest-side EvidenceRef id (kind "manifest") the composed payload must carry —
  // every verification names its expected-side provenance (Codex W4 finding 7).
  manifestEvidenceId: string;
}

export interface IdentityEvidenceRef {
  id: string;
  kind: "rpc_call" | "storage_read";
  provenanceClass: string;
  sourceMode: string;
  providerId: string;
  boundary: { kind: "execution_block"; block: PinnedBlock };
  address: string;
  method: string;
  calldata?: string;
  decodedResult?: string;
  rawResultHash: string;
  capturedAt: string;
}

export interface IdentityVerification {
  invariantId: string;
  evaluatorVersion: string;
  state: "pass" | "fail" | "unknown" | "conflict";
  severity: "high";
  claimKind: "derived";
  statement: string;
  expected: string;
  actual: string | null;
  evidence: never[];
  expectedEvidenceIds: string[];
  actualEvidenceIds: string[];
  derivationInputIds: string[];
  freshness: { aggregate: "unknown"; assessments: never[] };
  limitations: Array<{ code: string; text: string }>;
}

export interface IdentityComparison {
  verifications: IdentityVerification[];
  evidence: IdentityEvidenceRef[];
}

const DRIFT_CLAUSE =
  "Drift requiring review — an authorized upgrade can produce this; it is not treated as proof of anything further.";

const METHOD_BY_KIND = {
  code: "eth_getCode",
  storage: "eth_getStorageAt",
  call: "eth_call",
} as const;

function validateTarget(target: IdentityTarget): void {
  if (
    typeof target.targetId !== "string" || target.targetId.length === 0 ||
    !Number.isInteger(target.chainId) ||
    typeof target.address !== "string" || !ADDRESS_RE.test(target.address) ||
    typeof target.identityStrategy !== "string" || target.identityStrategy.length === 0 ||
    (target.expectedImplementation !== undefined && !ADDRESS_RE.test(target.expectedImplementation)) ||
    (target.expectedRuntimeCodeHash !== undefined && !SHA256_STRICT.test(target.expectedRuntimeCodeHash))
  ) {
    throw new IdentityError("invalid_target", target.targetId ?? "<missing targetId>");
  }
}

function validateContext(context: IdentityComparisonContext): void {
  if (
    typeof context?.provenanceClass !== "string" || context.provenanceClass.length === 0 ||
    typeof context?.manifestEvidenceId !== "string" || !SHA256_STRICT.test(context.manifestEvidenceId)
  ) {
    throw new IdentityError(
      "invalid_context",
      "provenanceClass and a sha256 manifestEvidenceId are required",
    );
  }
}

function evidenceFromReads(
  reads: readonly IdentityReadEvidence[],
  pinned: PinnedBlock,
  context: IdentityComparisonContext,
): IdentityEvidenceRef[] {
  const refs: IdentityEvidenceRef[] = [];
  for (const read of reads) {
    for (const o of read.observations) {
      // Only complete observations are evidence; a timeout/malformed provider response
      // has no raw result to bind and shows up in the retained quorum diagnostics.
      if (
        o.status !== "ok" ||
        o.rawResultHash === undefined ||
        o.capturedAt === undefined ||
        o.sourceMode === undefined
      ) {
        continue;
      }
      const descriptor = {
        address: read.address,
        boundary: { hash: pinned.hash, number: pinned.number },
        chainId: pinned.chainId,
        data: read.data ?? null,
        kind: read.kind,
        providerId: o.providerId,
        rawResultHash: o.rawResultHash,
        slot: read.slot ?? null,
      };
      refs.push({
        id: `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(descriptor), "utf-8")).digest("hex")}`,
        kind: read.kind === "storage" ? "storage_read" : "rpc_call",
        provenanceClass: context.provenanceClass,
        sourceMode: o.sourceMode,
        providerId: o.providerId,
        boundary: { kind: "execution_block", block: pinned },
        address: read.address,
        method: METHOD_BY_KIND[read.kind],
        // Audit sufficiency (finding 8): the storage slot travels as calldata, the
        // call data as calldata, and the quorum-agreed value as decodedResult.
        ...(read.kind === "storage" && read.slot !== undefined ? { calldata: read.slot } : {}),
        ...(read.kind === "call" && read.data !== undefined ? { calldata: read.data } : {}),
        ...(read.agreedValue !== null ? { decodedResult: read.agreedValue } : {}),
        rawResultHash: o.rawResultHash,
        capturedAt: o.capturedAt,
      });
    }
  }
  return refs;
}

export function compareIdentityTarget(
  target: IdentityTarget,
  observed: ObservedIdentity,
  pinned: PinnedBlock,
  context: IdentityComparisonContext,
): IdentityComparison {
  validateTarget(target);
  validateContext(context);
  if (target.chainId !== pinned.chainId) {
    throw new IdentityError(
      "target_chain_mismatch",
      `target ${target.chainId} != pinned ${pinned.chainId}`,
    );
  }
  const { identity } = observed;
  // The comparison is only meaningful for the strategy the manifest declared: a result
  // derived under a different strategy proves nothing about this target (finding 2).
  if (identity.strategy !== target.identityStrategy) {
    throw new IdentityError(
      "strategy_mismatch",
      `target declares ${target.identityStrategy}, observation derived ${identity.strategy}`,
    );
  }
  const root = identity.path[0]?.address;
  if (root !== undefined && root !== target.address) {
    throw new IdentityError("target_address_mismatch", `${target.address} != observed ${root}`);
  }

  const evidence = evidenceFromReads(observed.reads, pinned, context);
  const actualIds = [...new Set(evidence.map((e) => e.id))].sort();
  // A resolved identity that cites no observation evidence is incoherent — it cannot
  // have been derived from quorum-agreed reads (finding 2).
  if (identity.status === "resolved" && actualIds.length === 0) {
    throw new IdentityError("missing_observation_evidence", target.targetId);
  }
  const expectedIds = [context.manifestEvidenceId];
  const conflicted = identity.reasonCodes.includes("observation_conflict");
  const unknownLimitations: Array<{ code: string; text: string }> =
    identity.status === "unknown"
      ? identity.reasonCodes.map((code) => ({
          code,
          text: `Identity unresolved (${code}); the comparison result is ${
            conflicted ? "conflict" : "unknown"
          }, never a guessed value.`,
        }))
      : [];

  const verification = (
    expectation: string,
    expected: string,
    actual: string | null,
    subject: string,
  ): IdentityVerification => {
    const state: IdentityVerification["state"] =
      identity.status !== "resolved"
        ? conflicted
          ? "conflict"
          : "unknown"
        : actual === expected
          ? "pass"
          : "fail";
    const statement =
      state === "pass"
        ? `${subject} matches the manifest expectation.`
        : state === "fail"
          ? `${subject} differs from the manifest expectation. ${DRIFT_CLAUSE}`
          : state === "conflict"
            ? `${subject} could not be compared: independent providers disagreed about the observed state. Disagreement is preserved as conflict, never averaged away.`
            : `${subject} could not be compared: identity is unknown. Missing evidence is never a value.`;
    return {
      invariantId: `${CODE_IDENTITY_INVARIANT}/${target.targetId}/${expectation}`,
      evaluatorVersion: CODE_IDENTITY_EVALUATOR_VERSION,
      state,
      severity: "high",
      claimKind: "derived",
      statement,
      expected,
      actual,
      evidence: [],
      expectedEvidenceIds: expectedIds,
      actualEvidenceIds: actualIds,
      derivationInputIds: actualIds,
      // Honestly unassessed (a freshness policy applies but none ran here); W5 wires the
      // freshness policies — never "not_applicable" for an applicable predicate.
      freshness: { aggregate: "unknown", assessments: [] },
      limitations: unknownLimitations,
    };
  };

  const verifications: IdentityVerification[] = [];
  if (target.expectedRuntimeCodeHash !== undefined) {
    verifications.push(
      verification(
        "runtime_code_hash",
        target.expectedRuntimeCodeHash,
        identity.runtimeCodeHash,
        "Terminal runtime code hash",
      ),
    );
  }
  if (target.expectedImplementation !== undefined) {
    verifications.push(
      verification(
        "implementation",
        target.expectedImplementation,
        identity.terminalAddress,
        "Terminal identity address",
      ),
    );
  }
  return { verifications, evidence };
}
