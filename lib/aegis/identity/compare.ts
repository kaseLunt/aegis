// W4 slice 3 — manifest expectation comparison producing W1-shaped Verifications.
// Pure evaluator over the slice-2 observation output: no I/O, no clock. Every declared
// manifest expectation is flagged INDEPENDENTLY (expectedRuntimeCodeHash,
// expectedImplementation) with drift-requiring-review semantics — an authorized upgrade
// can create a mismatch, so the language never asserts compromise. A mismatched or
// unknown identity can never produce pass; unknown reasons travel as typed limitations.
// Evidence refs are emitted for the payload's top level; verifications reference them by
// id through the W1 role lists (referential integrity is validateReport's to enforce).
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
  sourceMode: "live" | "recorded" | "simulation";
  provenanceClass: string;
  capturedAt: string;
  // Optional expected-side evidence (e.g. the manifest EvidenceRef id) — must exist in
  // the payload's top-level evidence for referential validation to accept it.
  manifestEvidenceId?: string;
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
  rawResultHash: string;
  capturedAt: string;
}

export interface IdentityVerification {
  invariantId: string;
  evaluatorVersion: string;
  state: "pass" | "fail" | "unknown";
  severity: "high";
  claimKind: "derived";
  statement: string;
  expected: string;
  actual: string | null;
  evidence: never[];
  expectedEvidenceIds: string[];
  actualEvidenceIds: string[];
  derivationInputIds: string[];
  freshness: { aggregate: "not_applicable"; assessments: never[] };
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
      if (o.status !== "ok" || o.rawResultHash === undefined) continue;
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
        sourceMode: context.sourceMode,
        providerId: o.providerId,
        boundary: { kind: "execution_block", block: pinned },
        address: read.address,
        method: METHOD_BY_KIND[read.kind],
        ...(read.data !== undefined ? { calldata: read.data } : {}),
        rawResultHash: o.rawResultHash,
        capturedAt: context.capturedAt,
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
  if (target.chainId !== pinned.chainId) {
    throw new IdentityError(
      "target_chain_mismatch",
      `target ${target.chainId} != pinned ${pinned.chainId}`,
    );
  }
  const { identity } = observed;
  const root = identity.path[0]?.address;
  if (root !== undefined && root !== target.address) {
    throw new IdentityError("target_address_mismatch", `${target.address} != observed ${root}`);
  }

  const evidence = evidenceFromReads(observed.reads, pinned, context);
  const actualIds = [...new Set(evidence.map((e) => e.id))].sort();
  const expectedIds = context.manifestEvidenceId !== undefined ? [context.manifestEvidenceId] : [];
  const unknownLimitations: Array<{ code: string; text: string }> =
    identity.status === "unknown"
      ? identity.reasonCodes.map((code) => ({
          code,
          text: `Identity unresolved (${code}); the comparison result is unknown, never a guessed value.`,
        }))
      : [];

  const verification = (
    expectation: string,
    expected: string,
    actual: string | null,
    subject: string,
  ): IdentityVerification => {
    const state: IdentityVerification["state"] =
      identity.status !== "resolved" ? "unknown" : actual === expected ? "pass" : "fail";
    const statement =
      state === "pass"
        ? `${subject} matches the manifest expectation.`
        : state === "fail"
          ? `${subject} differs from the manifest expectation. ${DRIFT_CLAUSE}`
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
      freshness: { aggregate: "not_applicable", assessments: [] },
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
