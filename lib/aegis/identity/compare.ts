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
import {
  IMPLEMENTATION_SELECTOR,
  decodeImplementationWord,
  type IdentityReadEvidence,
  type ObservedIdentity,
} from "./observe";
import {
  IdentityError,
  ObservationUnavailable,
  type CodeObservation,
  type IdentityResult,
  deriveIdentity,
} from "./resolve";

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

// The manifest-side EvidenceRef (kind "manifest") every verification cites as its
// expected-side provenance. It must be BOUND to the trusted manifest hash — a
// format-checked id proves nothing (Codex W4 verification pass, F7 residual).
export interface IdentityManifestEvidence {
  id: string;
  kind: "manifest";
  provenanceClass: string;
  sourceMode: string;
  boundary: { kind: "source_snapshot"; snapshot: { sourceId: string; contentHash: string } };
  rawResultHash: string;
  capturedAt: string;
}

// Freshness is an EVALUATED INPUT to the verification state (F7 residual): the caller
// (W5 wires the freshness policies) supplies per-boundary assessments, and the
// aggregate MUST be derivable from them (confirmation pass, F7a survivor): a claimed
// aggregate is never trusted over its own assessments, and an empty assessment list
// can only ever be "unknown".
export type FreshnessState = "current" | "aging" | "stale" | "unknown";

export interface FreshnessAssessment {
  policyId: string;
  boundary: unknown;
  state: FreshnessState;
}

export interface EvaluatedFreshness {
  aggregate: FreshnessState;
  assessments: FreshnessAssessment[];
}

export interface IdentityComparisonContext {
  provenanceClass: string;
  // The trusted manifest content hash (from the policy-trust result).
  manifestHash: string;
  manifestEvidence: IdentityManifestEvidence;
  freshness: EvaluatedFreshness;
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
  state: "pass" | "fail" | "unknown" | "conflict" | "stale";
  severity: "high";
  claimKind: "derived";
  statement: string;
  expected: string;
  actual: string | null;
  evidence: never[];
  expectedEvidenceIds: string[];
  actualEvidenceIds: string[];
  derivationInputIds: string[];
  freshness: EvaluatedFreshness;
  limitations: Array<{ code: string; text: string }>;
}

export interface IdentityComparison {
  verifications: IdentityVerification[];
  evidence: Array<IdentityEvidenceRef | IdentityManifestEvidence>;
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

// Worst-of ranking for deriving the aggregate: an affirmative staleness outranks the
// mere absence of an assessment.
const FRESHNESS_RANK: Record<FreshnessState, number> = {
  current: 0,
  aging: 1,
  unknown: 2,
  stale: 3,
};

function derivedAggregate(assessments: readonly FreshnessAssessment[]): FreshnessState | null {
  if (assessments.length === 0) return "unknown";
  let worst: FreshnessState = "current";
  for (const a of assessments) {
    if (
      typeof a !== "object" || a === null ||
      typeof a.policyId !== "string" || a.policyId.length === 0 ||
      typeof a.boundary !== "object" || a.boundary === null ||
      !(a.state in FRESHNESS_RANK)
    ) {
      return null;
    }
    if (FRESHNESS_RANK[a.state] > FRESHNESS_RANK[worst]) worst = a.state;
  }
  return worst;
}

function validateContext(context: IdentityComparisonContext): void {
  const me = context?.manifestEvidence;
  const fresh = context?.freshness;
  if (
    typeof context?.provenanceClass !== "string" || context.provenanceClass.length === 0 ||
    typeof context?.manifestHash !== "string" || !SHA256_STRICT.test(context.manifestHash) ||
    typeof me !== "object" || me === null ||
    !SHA256_STRICT.test(me.id) ||
    me.kind !== "manifest" ||
    // The manifest ref must be BOUND to the trusted manifest hash — both its raw result
    // and its snapshot boundary. Anything else lets observed evidence masquerade as
    // expected policy (F7 residual).
    me.rawResultHash !== context.manifestHash ||
    me.boundary?.kind !== "source_snapshot" ||
    me.boundary?.snapshot?.contentHash !== context.manifestHash ||
    typeof me.provenanceClass !== "string" || me.provenanceClass.length === 0 ||
    typeof me.sourceMode !== "string" || me.sourceMode.length === 0 ||
    typeof me.capturedAt !== "string" || me.capturedAt.length === 0 ||
    typeof fresh !== "object" || fresh === null ||
    !(fresh.aggregate in FRESHNESS_RANK) ||
    !Array.isArray(fresh.assessments) ||
    // The claimed aggregate must be DERIVABLE from its own assessments (F7a survivor):
    // an optimistic label over stale/absent assessments is rejected, not trusted.
    derivedAggregate(fresh.assessments) !== fresh.aggregate
  ) {
    throw new IdentityError(
      "invalid_context",
      "requires provenanceClass, the trusted manifestHash, a manifest EvidenceRef bound to it, and a freshness block whose aggregate matches its assessments",
    );
  }
}

// A resolved identity must be backed by a coherent derivation transcript. Confirmation
// pass (F2 survivor): the transcript's values are AUTHENTICATED against the
// quorum-committed raw hashes — a value the agreeing providers did not commit to is a
// forgery — and the identity claim must be REPRODUCED by re-running the pure derivation
// over the authenticated transcript. Anything else is a forged or corrupted observation.
const inconsistent = (detail: string): never => {
  throw new IdentityError("inconsistent_observation", detail);
};

const transcriptKey = (kind: string, address: string, slot?: string, data?: string): string =>
  `${kind}\0${address}\0${slot ?? ""}\0${data ?? ""}`;

function validateTranscript(
  target: IdentityTarget,
  identity: IdentityResult,
  reads: readonly IdentityReadEvidence[],
): void {
  const values = new Map<string, string>();
  for (const read of reads) {
    if (read.quorum.outcome !== "agreement" || read.agreedValue === null) {
      inconsistent("a resolved identity cannot cite a non-agreed read");
    }
    const agreeing = new Set(read.quorum.agreeingProviders);
    if (agreeing.size === 0) inconsistent("an agreed read must name its agreeing providers");
    // The recorded raw hash convention is sha256 over the JCS form of the result; every
    // agreeing observation must have committed to exactly this value.
    const valueHash = `sha256:${createHash("sha256")
      .update(Buffer.from(jcsSerialize(read.agreedValue), "utf-8"))
      .digest("hex")}`;
    const seen = new Set<string>();
    for (const o of read.observations) {
      if (!agreeing.has(o.providerId)) continue;
      seen.add(o.providerId);
      if (o.status !== "ok" || o.rawResultHash !== valueHash) {
        inconsistent("transcript value differs from the quorum-committed raw result");
      }
    }
    for (const p of agreeing) {
      if (!seen.has(p)) inconsistent("an agreeing provider has no observation in the transcript");
    }
    values.set(transcriptKey(read.kind, read.address, read.slot, read.data), read.agreedValue!);
  }
  // No reads outside the resolved indirection path: unrelated evidence is incoherent.
  const pathAddresses = new Set(identity.path.map((s) => s.address));
  for (const read of reads) {
    if (!pathAddresses.has(read.address)) {
      inconsistent("transcript read addresses differ from the resolved indirection path");
    }
  }
  // Replay the pure derivation over the authenticated transcript; the claim must be
  // reproduced EXACTLY — path, terminal, hash, status, everything.
  const reader: CodeObservation = {
    getCode: (address) => {
      const v = values.get(transcriptKey("code", address));
      if (v === undefined) throw new ObservationUnavailable("observation_unresolved");
      return v;
    },
    getStorageWord: (address, slot) => {
      const v = values.get(transcriptKey("storage", address, slot));
      if (v === undefined) throw new ObservationUnavailable("observation_unresolved");
      return v;
    },
    getBeaconImplementation: (address) => {
      const v = values.get(transcriptKey("call", address, undefined, IMPLEMENTATION_SELECTOR));
      if (v === undefined) throw new ObservationUnavailable("observation_unresolved");
      return decodeImplementationWord(v);
    },
  };
  const rederived = deriveIdentity(target.identityStrategy, target.address, reader);
  if (jcsSerialize(rederived as unknown as Record<string, unknown>) !== jcsSerialize(identity as unknown as Record<string, unknown>)) {
    inconsistent("the transcript does not re-derive to the claimed identity");
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

  const readEvidence = evidenceFromReads(observed.reads, pinned, context);
  const actualIds = [...new Set(readEvidence.map((e) => e.id))].sort();
  if (identity.status === "resolved") {
    // A resolved identity that cites no observation evidence is incoherent — it cannot
    // have been derived from quorum-agreed reads (finding 2)...
    if (actualIds.length === 0) {
      throw new IdentityError("missing_observation_evidence", target.targetId);
    }
    // ...and the transcript it cites must actually support it (F2 residual).
    validateTranscript(target, identity, observed.reads);
  }
  const evidence: Array<IdentityEvidenceRef | IdentityManifestEvidence> = [
    context.manifestEvidence,
    ...readEvidence,
  ];
  const expectedIds = [context.manifestEvidence.id];
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
    let state: IdentityVerification["state"];
    let statement: string;
    let limitations = unknownLimitations;
    if (identity.status !== "resolved") {
      state = conflicted ? "conflict" : "unknown";
      statement = conflicted
        ? `${subject} could not be compared: independent providers disagreed about the observed state. Disagreement is preserved as conflict, never averaged away.`
        : `${subject} could not be compared: identity is unknown. Missing evidence is never a value.`;
    } else {
      const matched = actual === expected;
      // Freshness gates the verdict (F7 residual): a comparison may never claim more
      // than its evaluated freshness supports — stale evidence yields a stale result
      // and an unassessed policy yields unknown, whether or not the values matched.
      if (context.freshness.aggregate === "stale") {
        state = "stale";
        statement = `${subject} was compared on evidence assessed STALE under the freshness policy; the result is stale, not a current verdict.`;
        limitations = [{
          code: "freshness_stale",
          text: "The freshness assessment for the observation boundary is stale.",
        }];
      } else if (context.freshness.aggregate === "unknown") {
        state = "unknown";
        statement = `${subject} was compared without an evaluated freshness result; the outcome is unknown, not a current verdict.`;
        limitations = [{
          code: "freshness_unassessed",
          text: "No freshness assessment accompanied the observation boundary.",
        }];
      } else if (matched) {
        state = "pass";
        statement = `${subject} matches the manifest expectation.`;
      } else {
        state = "fail";
        statement = `${subject} differs from the manifest expectation. ${DRIFT_CLAUSE}`;
      }
    }
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
      freshness: context.freshness,
      limitations,
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
