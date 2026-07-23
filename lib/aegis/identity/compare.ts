// W4 slice 3 — manifest expectation comparison producing W1-shaped Verifications.
// Pure evaluator over the slice-2 observation output: no I/O, no clock. Every declared
// manifest expectation is flagged INDEPENDENTLY (expectedRuntimeCodeHash,
// expectedImplementation) with drift-requiring-review semantics — an authorized upgrade
// can create a mismatch, so the language never asserts compromise. A mismatched or
// unknown identity can never produce pass; provider disagreement surfaces as the
// canonical `conflict` state, distinct from missing evidence (Codex W4 finding 5).
// The declared strategy must equal the observed one. Provider independence and read
// authenticity are guaranteed at the source (Codex W4 convergence pass 5): the
// comparator accepts ONLY observations produced by observeIdentity (provenance brand),
// so a caller cannot hand-forge a relabeled-clone observation to fake independence —
// authenticating labels inside the comparator was the wrong layer and is unnecessary.
// Evidence refs carry the envelope's capture time, the adapter-declared source mode, the
// storage slot as calldata, and the quorum-agreed value (finding 8) — emitted for the
// payload's top level and referenced by id through the W1 role lists.
import { createHash } from "node:crypto";
import type { PinnedBlock } from "../chain/selection";
import { jcsSerialize } from "../report/canonical";
import {
  type IdentityReadEvidence,
  type ObservedIdentity,
  isVerifiedObservation,
} from "./observe";
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

// Worst-of ranking for deriving the aggregate, in the CANONICAL spec precedence
// (ENGINEERING_SPEC §Freshness: "unknown outranks stale, which outranks aging, which
// outranks current") — spec-implementation lockstep, Codex pass-4 finding.
const FRESHNESS_RANK: Record<FreshnessState, number> = {
  current: 0,
  aging: 1,
  stale: 2,
  unknown: 3,
};

// Membership via own-property lookup only: the `in` operator would accept
// prototype-chain names like "toString" as states (Codex pass-4 finding).
const isFreshnessState = (state: unknown): state is FreshnessState =>
  typeof state === "string" && Object.hasOwn(FRESHNESS_RANK, state);

function derivedAggregate(assessments: readonly FreshnessAssessment[]): FreshnessState | null {
  // Indexed loop reading each field once (Codex pass-8): for..of dispatches the array's
  // own Symbol.iterator and repeated property reads re-invoke live getters — both
  // caller-controlled channels. The comparator additionally snapshots the whole context
  // before this runs; the loop shape keeps the function safe for any future caller too.
  if (assessments.length === 0) return "unknown";
  let worst: FreshnessState = "current";
  for (let i = 0; i < assessments.length; i += 1) {
    const a = assessments[i];
    if (typeof a !== "object" || a === null) return null;
    const state: unknown = a.state;
    if (
      typeof a.policyId !== "string" || a.policyId.length === 0 ||
      typeof a.boundary !== "object" || a.boundary === null ||
      !isFreshnessState(state)
    ) {
      return null;
    }
    if (FRESHNESS_RANK[state] > FRESHNESS_RANK[worst]) worst = state;
  }
  return worst;
}

// A freshness assessment vouches for evidence at THIS observation's boundary only
// (Codex W4 pass-7): its execution-block boundary must be exactly observedPin, so a
// `current` assessment for a different (e.g. newer) block cannot certify stale evidence.
function assessmentBindsPin(assessment: FreshnessAssessment, pin: PinnedBlock): boolean {
  const b = assessment.boundary as
    | { kind?: string; block?: { chainId?: number; number?: string; hash?: string } }
    | null;
  return (
    b?.kind === "execution_block" &&
    b.block?.chainId === pin.chainId &&
    b.block?.number === pin.number &&
    b.block?.hash === pin.hash
  );
}

// Every assessment must be for THIS observation's boundary (pass-7). Internal indexed
// loop, never a method dispatched from the caller-owned array (Codex pass-8): a forged
// non-enumerable own `every` returning true would otherwise defeat the binding while
// array serialization — which reads indices, not methods — carries the foreign-block
// assessment into report data.
function allAssessmentsBindPin(
  assessments: readonly FreshnessAssessment[],
  pin: PinnedBlock,
): boolean {
  for (let i = 0; i < assessments.length; i += 1) {
    if (!assessmentBindsPin(assessments[i], pin)) return false;
  }
  return true;
}

// One snapshot, one truth (Codex pass-8): capture the caller's context ONCE into plain
// data — the exact view any JSON serializer sees (indexed array elements, own enumerable
// properties, toJSON applied) — then validate AND emit only that snapshot. Reading the
// live object lets a lying getter or toJSON show the validator one context and the
// report another; the snapshot makes validation and emission read the same values.
function snapshotContext(context: IdentityComparisonContext): IdentityComparisonContext {
  let copy: unknown;
  try {
    copy = JSON.parse(JSON.stringify(context));
  } catch {
    throw new IdentityError("invalid_context", "context must be plain serializable data");
  }
  if (typeof copy !== "object" || copy === null) {
    throw new IdentityError("invalid_context", "context must be plain serializable data");
  }
  return copy as IdentityComparisonContext;
}

function validateContext(context: IdentityComparisonContext, observedPin: PinnedBlock): void {
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
    !isFreshnessState(fresh.aggregate) ||
    !Array.isArray(fresh.assessments) ||
    // The claimed aggregate must be DERIVABLE from its own assessments (F7a survivor):
    // an optimistic label over stale/absent assessments is rejected, not trusted.
    derivedAggregate(fresh.assessments) !== fresh.aggregate ||
    // A non-empty assessment set carrying a foreign block cannot certify this evidence
    // (pass-7); an empty set derives to "unknown", which can never pass, so absence
    // stays honest. Checked by an internal indexed loop (pass-8), never `.every`.
    !allAssessmentsBindPin(fresh.assessments, observedPin)
  ) {
    throw new IdentityError(
      "invalid_context",
      "requires provenanceClass, the trusted manifestHash, a manifest EvidenceRef bound to it, and a freshness block whose aggregate matches its assessments and whose assessments are bound to the observed block",
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
  // Provenance FIRST (Codex W4 convergence pass 5): only an observation the trusted
  // pipeline produced may be compared. This closes the relabeled-clone independence
  // forgery at the root — a hand-built observation carries no brand — so the provider
  // and administrative-domain labels are exactly those observeIdentity read from the
  // reviewed adapters, and no per-field authentication in the comparator is needed.
  if (!isVerifiedObservation(observed)) {
    throw new IdentityError(
      "unverified_observation",
      "observation must be produced by observeIdentity",
    );
  }
  // The observation is bound to the exact block it was taken at (Codex W4 pass-6 P1):
  // the caller's declared boundary must match it, and all evidence is derived from the
  // observation's own pin — never a caller-supplied replacement that could relabel the
  // result onto a different (e.g. reorged or stale) block.
  const observedPin = observed.pinned;
  if (
    pinned.chainId !== observedPin.chainId ||
    pinned.number !== observedPin.number ||
    pinned.hash !== observedPin.hash
  ) {
    throw new IdentityError(
      "pin_mismatch",
      `comparison pin ${pinned.chainId}/${pinned.number}/${pinned.hash} != observation pin ${observedPin.chainId}/${observedPin.number}/${observedPin.hash}`,
    );
  }
  validateTarget(target);
  // Validate and consume ONLY the plain snapshot (pass-8) — never the live caller
  // object. Everything emitted below (manifest ref, freshness) is this snapshot, so
  // the report carries exactly what was validated.
  const ctx = snapshotContext(context);
  validateContext(ctx, observedPin);
  if (target.chainId !== observedPin.chainId) {
    throw new IdentityError(
      "target_chain_mismatch",
      `target ${target.chainId} != pinned ${observedPin.chainId}`,
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

  // A branded resolved observation is internally consistent by construction: its identity
  // IS deriveIdentity() over exactly these reads, each read is a quorum-agreement outcome
  // (observeIdentity turns any non-agreement into an unknown, not a resolution), and read
  // values carry the adapters' loader-verified raw hashes. No transcript re-authentication
  // is therefore possible or needed once provenance holds.
  const readEvidence = evidenceFromReads(observed.reads, observedPin, ctx);
  const actualIds = [...new Set(readEvidence.map((e) => e.id))].sort();
  const evidence: Array<IdentityEvidenceRef | IdentityManifestEvidence> = [
    ctx.manifestEvidence,
    ...readEvidence,
  ];
  const expectedIds = [ctx.manifestEvidence.id];
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
      if (ctx.freshness.aggregate === "stale") {
        state = "stale";
        statement = `${subject} was compared on evidence assessed STALE under the freshness policy; the result is stale, not a current verdict.`;
        limitations = [{
          code: "freshness_stale",
          text: "The freshness assessment for the observation boundary is stale.",
        }];
      } else if (ctx.freshness.aggregate === "unknown") {
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
      freshness: ctx.freshness,
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
