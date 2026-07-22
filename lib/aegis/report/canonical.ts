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

// --- Structural validation (spec v1.2 clarifications 1, 2, 8, 9) -----------------------
// Three phases, first failure reports: schema_validation (mandatory fields, cardinality),
// referential_validation (role IDs + EvidenceRef membership vs top-level evidence),
// domain_normalization (canonical form: duplicates, minimal decimals, lowercase hex).
// Byte-length and enum strictness live in the full schema layer (validateReport, later
// slice); this structural layer is what abbreviated test vectors exercise.

const TOP_MANDATORY = [
  "schemaVersion", "engineVersion", "evaluationTime", "manifestVersion", "manifestHash",
  "policyRefs", "policyTrust", "sourceMode", "requestHash", "observationBoundaries",
  "evidence", "verifications", "facts", "coverage", "limitations",
] as const;

const EVIDENCE_MANDATORY = [
  "id", "kind", "provenanceClass", "sourceMode", "boundary", "rawResultHash", "capturedAt",
] as const;

const ROLE_LISTS = ["expectedEvidenceIds", "actualEvidenceIds", "derivationInputIds", "inputEvidenceIds"] as const;

const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;
const HEX_RE = /^0x[0-9a-f]*$/;

const fail = (phase: RejectionPhase, code: string, path: string, detail?: string): never => {
  throw new CanonicalizationError(phase, code, path, detail);
};

function evidenceArrays(p: JsonObject): Array<[path: string, arr: unknown[]]> {
  const out: Array<[string, unknown[]]> = [];
  if (Array.isArray(p.evidence)) out.push(["/evidence", p.evidence]);
  const pt = obj(p.policyTrust);
  if (Array.isArray(pt.evidence)) out.push(["/policyTrust/evidence", pt.evidence]);
  for (const [field, arr] of [["verifications", p.verifications], ["facts", p.facts]] as const) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((v, i) => {
      const ev = obj(v).evidence;
      if (Array.isArray(ev)) out.push([`/${field}/${i}/evidence`, ev]);
    });
  }
  return out;
}

function validateSchemaPhase(p: JsonObject): void {
  for (const k of TOP_MANDATORY) {
    if (p[k] === undefined) fail("schema_validation", "missing_mandatory_field", `/${k}`);
  }
  if (!Array.isArray(p.observationBoundaries) || p.observationBoundaries.length < 1) {
    fail("schema_validation", "insufficient_observation_boundaries", "/observationBoundaries");
  }
  for (const [base, arr] of evidenceArrays(p)) {
    arr.forEach((e, i) => {
      const ref = obj(e);
      for (const k of EVIDENCE_MANDATORY) {
        if (ref[k] === undefined) fail("schema_validation", "missing_mandatory_field", `${base}/${i}/${k}`);
      }
    });
  }
}

function validateReferentialPhase(p: JsonObject): void {
  const topIds = new Set(
    (Array.isArray(p.evidence) ? p.evidence : []).map((e) => str(obj(e).id)),
  );
  for (const [base, arr] of evidenceArrays(p)) {
    if (base === "/evidence") continue;
    arr.forEach((e, i) => {
      if (!topIds.has(str(obj(e).id))) {
        fail("referential_validation", "dangling_evidence_role_id", `${base}/${i}/id`,
          "EvidenceRef not present in top-level evidence");
      }
    });
  }
  for (const [field, arr] of [["verifications", p.verifications], ["facts", p.facts]] as const) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((v, i) => {
      const item = obj(v);
      for (const list of ROLE_LISTS) {
        const ids = item[list];
        if (!Array.isArray(ids)) continue;
        ids.forEach((id, j) => {
          if (!topIds.has(str(id))) {
            fail("referential_validation", "dangling_evidence_role_id", `/${field}/${i}/${list}/${j}`);
          }
        });
      }
    });
  }
}

function checkScalarSet(path: string, arr: unknown[]): void {
  const seen = new Set<string>();
  for (const v of arr) {
    const s = str(v);
    if (seen.has(s)) fail("domain_normalization", "duplicate_set_member", path, s);
    seen.add(s);
  }
}

function checkDecimal(path: string, v: unknown): void {
  if (typeof v === "string" && !DECIMAL_RE.test(v)) {
    fail("domain_normalization", "noncanonical_unsigned_decimal", path, v);
  }
}

function checkHex(path: string, v: unknown): void {
  if (typeof v === "string" && !HEX_RE.test(v)) {
    fail("domain_normalization", "noncanonical_hex", path, v);
  }
}

function checkBoundaryForm(path: string, v: unknown): void {
  const b = obj(v);
  if (b.kind === "execution_block") {
    const block = obj(b.block);
    checkDecimal(`${path}/block/number`, block.number);
    checkHex(`${path}/block/hash`, block.hash);
    checkHex(`${path}/block/parentHash`, block.parentHash);
  } else if (b.kind === "consensus_state") {
    const c = obj(b.consensus);
    checkDecimal(`${path}/consensus/slot`, c.slot);
    checkHex(`${path}/consensus/blockRoot`, c.blockRoot);
    if (c.stateRoot !== undefined) checkHex(`${path}/consensus/stateRoot`, c.stateRoot);
  }
}

function validateNormalizationPhase(p: JsonObject): void {
  const coverage = obj(p.coverage);
  for (const k of ["supported", "unsupported", "excluded"]) {
    if (Array.isArray(coverage[k])) checkScalarSet(`/coverage/${k}`, coverage[k] as unknown[]);
  }
  const pt = obj(p.policyTrust);
  if (Array.isArray(pt.reasonCodes)) checkScalarSet("/policyTrust/reasonCodes", pt.reasonCodes);
  for (const [base, arr] of evidenceArrays(p)) {
    checkScalarSet(base, arr.map((e) => str(obj(e).id)));
    arr.forEach((e, i) => {
      const ref = obj(e);
      checkBoundaryForm(`${base}/${i}/boundary`, ref.boundary);
      if (ref.address !== undefined) checkHex(`${base}/${i}/address`, ref.address);
      if (ref.calldata !== undefined) checkHex(`${base}/${i}/calldata`, ref.calldata);
    });
  }
  if (Array.isArray(p.observationBoundaries)) {
    p.observationBoundaries.forEach((b, i) => checkBoundaryForm(`/observationBoundaries/${i}`, b));
  }
  for (const [field, arr] of [["verifications", p.verifications], ["facts", p.facts]] as const) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((v, i) => {
      const item = obj(v);
      for (const list of ROLE_LISTS) {
        if (Array.isArray(item[list])) checkScalarSet(`/${field}/${i}/${list}`, item[list] as unknown[]);
      }
    });
  }
}

// Runs the three phases against the ORIGINAL payload (paths refer to input positions).
export function validateReportStructure(payload: unknown): void {
  if (!isObject(payload)) {
    fail("schema_validation", "missing_mandatory_field", "/", "payload is not an object");
  }
  const p = payload as JsonObject;
  validateSchemaPhase(p);
  validateReferentialPhase(p);
  validateNormalizationPhase(p);
}

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
  validateReportStructure(payload);
  return new TextEncoder().encode(jcs(normalizeReport(payload)));
}

export function reportHash(payload: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalBytes(payload)).digest("hex")}`;
}
