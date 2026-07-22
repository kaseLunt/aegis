// W1 canonical report core — domain normalization + RFC 8785 (JCS) serialization + report
// identity. Spec: docs/ENGINEERING_SPEC.md §Canonicalization and hashing (v1.2
// clarifications). Pure: no I/O, no clock, no platform text handling (INS-001 — bytes are
// produced in memory and hashed in memory).
import { createHash } from "node:crypto";

export type RejectionPhase =
  | "schema_validation"
  | "referential_validation"
  | "domain_normalization";

export class CanonicalizationError extends Error {
  constructor(
    public readonly phase: RejectionPhase,
    public readonly code: string,
    public readonly path: string,
    detail?: string,
  ) {
    super(`${phase}:${code} at ${path}${detail ? ` -- ${detail}` : ""}`);
    this.name = "CanonicalizationError";
  }
}

type JsonObject = Record<string, unknown>;

const isObject = (v: unknown): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const obj = (v: unknown): JsonObject => (isObject(v) ? v : {});

const str = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

const cmpString = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Spec clarification 7: minimal unsigned decimals compare numerically via length-then-lex.
const cmpDecimal = (a: string, b: string): number =>
  a.length !== b.length ? a.length - b.length : cmpString(a, b);

type KeyPart = [value: string, mode: "s" | "d"];

function cmpTuple(a: KeyPart[], b: KeyPart[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c = a[i][1] === "d" ? cmpDecimal(a[i][0], b[i][0]) : cmpString(a[i][0], b[i][0]);
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

// Spec clarification 6: observation boundaries sort by kind, then identity, then
// number/slot/contentHash, then hash/root.
function boundaryKey(v: unknown): KeyPart[] {
  const b = obj(v);
  const kind = str(b.kind);
  if (kind === "execution_block") {
    const block = obj(b.block);
    return [
      [kind, "s"],
      [str(block.chainId), "s"],
      [str(block.number), "d"],
      [str(block.hash), "s"],
    ];
  }
  if (kind === "consensus_state") {
    const consensus = obj(b.consensus);
    return [
      [kind, "s"],
      [str(consensus.network), "s"],
      [str(consensus.slot), "d"],
      [str(consensus.blockRoot), "s"],
    ];
  }
  const snapshot = obj(b.snapshot);
  return [
    [kind, "s"],
    [str(snapshot.sourceId), "s"],
    [str(snapshot.contentHash), "s"],
    ["", "s"],
  ];
}

const sortScalarSet = (arr: unknown[]): unknown[] =>
  [...arr].sort((a, b) => cmpString(str(a), str(b)));

const sortEvidence = (arr: unknown[]): unknown[] =>
  [...arr].sort((a, b) => cmpString(str(obj(a).id), str(obj(b).id)));

// Domain normalization (spec §Canonical array rules + v1.2 clarifications). Operates on a
// structural clone; semantic-order arrays and unregistered open-typed subtrees (e.g.
// decodedResult) are never reordered.
export function normalizeReport(payload: unknown): unknown {
  const p = structuredClone(payload);
  if (!isObject(p)) return p;

  const coverage = p.coverage;
  if (isObject(coverage)) {
    for (const k of ["supported", "unsupported", "excluded"]) {
      const set = coverage[k];
      if (Array.isArray(set)) coverage[k] = sortScalarSet(set);
    }
  }
  const policyTrust = p.policyTrust;
  if (isObject(policyTrust)) {
    if (Array.isArray(policyTrust.reasonCodes)) {
      policyTrust.reasonCodes = sortScalarSet(policyTrust.reasonCodes);
    }
    if (Array.isArray(policyTrust.evidence)) {
      policyTrust.evidence = sortEvidence(policyTrust.evidence);
    }
  }
  if (Array.isArray(p.evidence)) p.evidence = sortEvidence(p.evidence);
  if (Array.isArray(p.observationBoundaries)) {
    p.observationBoundaries = [...p.observationBoundaries].sort((a, b) =>
      cmpTuple(boundaryKey(a), boundaryKey(b)),
    );
  }
  if (Array.isArray(p.policyRefs)) {
    p.policyRefs = [...p.policyRefs].sort(
      (a, b) =>
        cmpString(str(obj(a).kind), str(obj(b).kind)) ||
        cmpString(str(obj(a).id), str(obj(b).id)) ||
        cmpString(str(obj(a).version), str(obj(b).version)),
    );
  }
  return p;
}

// RFC 8785 serialization. Object members sort by UTF-16 code units (JS default string
// comparison). JSON.stringify's scalar output matches JCS for strings (escaping) and for
// the ES number grammar. Properties with undefined values are omitted.
function jcs(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new CanonicalizationError("domain_normalization", "nonfinite_number", "");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => jcs(v === undefined ? null : v)).join(",")}]`;
  }
  if (isObject(value)) {
    const entries = Object.keys(value)
      .sort(cmpString)
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${jcs(value[k])}`);
    return `{${entries.join(",")}}`;
  }
  throw new CanonicalizationError("domain_normalization", "unsupported_value_type", "", typeof value);
}

export function canonicalBytes(payload: unknown): Uint8Array {
  return new TextEncoder().encode(jcs(normalizeReport(payload)));
}

export function reportHash(payload: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalBytes(payload)).digest("hex")}`;
}
