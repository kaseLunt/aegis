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

// --- I-JSON domain guard (RFC 8785 §3.1 input; spine review P0#1/#2, P1#6/#7) -----------
// Canonicalization is defined only over I-JSON: null, finite numbers, strings without lone
// surrogates, arrays, and PLAIN objects with own enumerable string keys. Anything else
// (undefined, Date/Map/exotic, toJSON, symbols, functions, prototype-only, cycles) could
// silently become {} / be dropped and merge two different inputs to one hash — rejected.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

// Deterministic nesting cap (W2 adversarial review): past ~9k levels the recursive walkers
// (jcs, structuredClone, deepFreeze) overflow the stack and a raw RangeError escapes the
// typed-error contract — and the overflow depth varies by platform/stack state. The guard
// runs first on every entry point, so rejection happens at the same depth everywhere and
// nothing downstream ever recurses deeper than this.
const MAX_NESTING_DEPTH = 1024;

export function assertJsonDomain(value: unknown, path = "", seen: WeakSet<object> = new WeakSet(), depth = 0): void {
  if (depth > MAX_NESTING_DEPTH) {
    fail("domain_normalization", "nesting_depth_exceeded", path || "/", `deeper than ${MAX_NESTING_DEPTH}`);
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("domain_normalization", "nonfinite_number", path || "/");
    return;
  }
  if (typeof value === "string") {
    if (LONE_SURROGATE.test(value)) fail("domain_normalization", "lone_surrogate", path || "/");
    return;
  }
  if (typeof value !== "object") {
    fail("domain_normalization", "non_json_value", path || "/", typeof value);
  }
  const o = value as object;
  if (seen.has(o)) fail("domain_normalization", "cyclic_value", path || "/");
  seen.add(o);
  if (Array.isArray(o)) {
    o.forEach((v, i) => {
      if (v === undefined) fail("domain_normalization", "undefined_array_member", `${path}/${i}`);
      assertJsonDomain(v, `${path}/${i}`, seen, depth + 1);
    });
  } else {
    if (Object.getPrototypeOf(o) !== Object.prototype && Object.getPrototypeOf(o) !== null) {
      fail("domain_normalization", "non_plain_object", path || "/");
    }
    if (typeof (o as JsonObject).toJSON === "function") {
      fail("domain_normalization", "tojson_not_permitted", path || "/");
    }
    if (Object.getOwnPropertySymbols(o).length > 0) {
      fail("domain_normalization", "symbol_key", path || "/");
    }
    for (const k of Object.keys(o)) {
      if (LONE_SURROGATE.test(k)) fail("domain_normalization", "lone_surrogate", `${path}/${k} (key)`);
      const v = (o as JsonObject)[k];
      if (v === undefined) fail("domain_normalization", "undefined_property", `${path}/${k}`);
      assertJsonDomain(v, `${path}/${k}`, seen, depth + 1);
    }
  }
  seen.delete(o);
}

// Spec clarification 7: minimal unsigned decimals compare numerically via length-then-lex.
// Exported as the single decimal-string comparator (manifest applicability reuses it).
export const cmpDecimal = (a: string, b: string): number =>
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

// Spine review P1#4: set-like arrays reject duplicates by their stable key; keys use typed
// components so numeric 1 and string "1" are NOT coerced equal.
function checkKeyedSet(path: string, arr: unknown[], key: (v: unknown) => string): void {
  const seen = new Set<string>();
  for (const v of arr) {
    const k = key(v);
    if (seen.has(k)) fail("domain_normalization", "duplicate_set_member", path, k);
    seen.add(k);
  }
}

const limitationKey = (v: unknown): string => JSON.stringify([str(obj(v).code), str(obj(v).text)]);
const boundaryStableKey = (v: unknown): string => JSON.stringify(boundaryKey(v).map(([s, m]) => `${m}:${s}`));

// Spine review P1#4: registered semantic-order arrays carry zero-based, minimal, contiguous,
// unique decimal indices (v1.2 clarification 4). safeBatch is the one registered shape.
function checkSemanticArray(path: string, arr: unknown[]): void {
  arr.forEach((item, i) => {
    const idx = obj(item).index;
    if (typeof idx !== "string" || !DECIMAL_RE.test(idx) || idx !== String(i)) {
      fail("domain_normalization", "semantic_index_invalid", `${path}/${i}/index`, str(idx));
    }
  });
}

function checkSemanticShapes(path: string, value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => checkSemanticShapes(`${path}/${i}`, v));
  } else if (isObject(value)) {
    if (Array.isArray(value.safeBatch)) checkSemanticArray(`${path}/safeBatch`, value.safeBatch);
    for (const k of Object.keys(value)) checkSemanticShapes(`${path}/${k}`, value[k]);
  }
}

function validateNormalizationPhase(p: JsonObject): void {
  const coverage = obj(p.coverage);
  for (const k of ["supported", "unsupported", "excluded"]) {
    if (Array.isArray(coverage[k])) checkScalarSet(`/coverage/${k}`, coverage[k] as unknown[]);
  }
  const pt = obj(p.policyTrust);
  if (Array.isArray(pt.reasonCodes)) checkScalarSet("/policyTrust/reasonCodes", pt.reasonCodes);
  if (Array.isArray(p.policyRefs)) {
    checkKeyedSet("/policyRefs", p.policyRefs, (v) => JSON.stringify([str(obj(v).kind), str(obj(v).id), str(obj(v).version)]));
  }
  if (Array.isArray(p.limitations)) checkKeyedSet("/limitations", p.limitations, limitationKey);
  for (const [base, arr] of evidenceArrays(p)) {
    checkScalarSet(base, arr.map((e) => str(obj(e).id)));
    arr.forEach((e, i) => {
      const ref = obj(e);
      checkBoundaryForm(`${base}/${i}/boundary`, ref.boundary);
      if (ref.address !== undefined) checkHex(`${base}/${i}/address`, ref.address);
      if (ref.calldata !== undefined) checkHex(`${base}/${i}/calldata`, ref.calldata);
      if (ref.decodedResult !== undefined) checkSemanticShapes(`${base}/${i}/decodedResult`, ref.decodedResult);
    });
  }
  if (Array.isArray(p.observationBoundaries)) {
    checkKeyedSet("/observationBoundaries", p.observationBoundaries, boundaryStableKey);
    p.observationBoundaries.forEach((b, i) => checkBoundaryForm(`/observationBoundaries/${i}`, b));
  }
  for (const [field, arr] of [["verifications", p.verifications], ["facts", p.facts]] as const) {
    if (!Array.isArray(arr)) continue;
    const idKey = field === "verifications"
      ? (v: unknown) => JSON.stringify([str(obj(v).invariantId), str(obj(v).evaluatorVersion)])
      : (v: unknown) => JSON.stringify([str(obj(v).factId), str(obj(v).evaluatorVersion)]);
    checkKeyedSet(`/${field}`, arr, idKey);
    arr.forEach((v, i) => {
      const item = obj(v);
      for (const list of ROLE_LISTS) {
        if (Array.isArray(item[list])) checkScalarSet(`/${field}/${i}/${list}`, item[list] as unknown[]);
      }
      if (Array.isArray(item.limitations)) checkKeyedSet(`/${field}/${i}/limitations`, item.limitations, limitationKey);
    });
  }
}

// --- Strict schema layer (spec v1.2: byte lengths, sha256 identifiers, enums) -----------
// Real payloads pass through this; abbreviated test vectors exercise only the structural
// layer above. All failures report phase schema_validation.

const ENUM = {
  sourceMode: ["live", "recorded", "simulation"],
  boundaryKind: ["execution_block", "consensus_state", "source_snapshot"],
  evidenceKind: ["rpc_call", "storage_read", "event_log", "transaction", "manifest", "source_snapshot", "audit", "simulation"],
  provenanceClass: [
    "observed_public_state", "observed_external_source", "code_property",
    "reviewed_research_rationale", "declared_configuration", "derived_result",
    "reference_scenario", "modeled_counterfactual",
  ],
  finality: ["finalized", "safe", "confirmations", "unconfirmed"],
  policyTrustState: ["trusted", "untrusted", "invalid"],
} as const;

const SHA256_STRICT = /^sha256:[0-9a-f]{64}$/;

function checkEnum(path: string, v: unknown, allowed: readonly string[]): void {
  if (!allowed.includes(str(v))) fail("schema_validation", "invalid_enum_member", path, str(v));
}

function checkSha256Strict(path: string, v: unknown): void {
  if (typeof v !== "string" || !SHA256_STRICT.test(v)) {
    fail("schema_validation", "invalid_sha256_identifier", path, str(v));
  }
}

function checkHexBytes(path: string, v: unknown, exactBytes?: number): void {
  const s = str(v);
  if (!HEX_RE.test(s) || (exactBytes !== undefined ? s.length !== 2 + 2 * exactBytes : s.length % 2 !== 0)) {
    fail("schema_validation", "invalid_hex_length", path, s);
  }
}

function checkBoundaryStrict(path: string, v: unknown): void {
  const b = obj(v);
  checkEnum(`${path}/kind`, b.kind, ENUM.boundaryKind);
  if (b.kind === "execution_block") {
    const block = obj(b.block);
    checkHexBytes(`${path}/block/hash`, block.hash, 32);
    checkHexBytes(`${path}/block/parentHash`, block.parentHash, 32);
    checkEnum(`${path}/block/finality`, block.finality, ENUM.finality);
  } else if (b.kind === "consensus_state") {
    const c = obj(b.consensus);
    checkHexBytes(`${path}/consensus/blockRoot`, c.blockRoot, 32);
    if (c.stateRoot !== undefined) checkHexBytes(`${path}/consensus/stateRoot`, c.stateRoot, 32);
  } else {
    checkSha256Strict(`${path}/snapshot/contentHash`, obj(b.snapshot).contentHash);
  }
}

function validateStrictSchemaPhase(p: JsonObject): void {
  checkSha256Strict("/manifestHash", p.manifestHash);
  checkSha256Strict("/requestHash", p.requestHash);
  checkEnum("/sourceMode", p.sourceMode, ENUM.sourceMode);
  const pt = obj(p.policyTrust);
  checkEnum("/policyTrust/state", pt.state, ENUM.policyTrustState);
  checkSha256Strict("/policyTrust/manifestHash", pt.manifestHash);
  if (Array.isArray(p.policyRefs)) {
    p.policyRefs.forEach((r, i) => checkSha256Strict(`/policyRefs/${i}/contentHash`, obj(r).contentHash));
  }
  if (Array.isArray(p.observationBoundaries)) {
    p.observationBoundaries.forEach((b, i) => checkBoundaryStrict(`/observationBoundaries/${i}`, b));
  }
  for (const [base, arr] of evidenceArrays(p)) {
    arr.forEach((e, i) => {
      const ref = obj(e);
      checkSha256Strict(`${base}/${i}/id`, ref.id);
      checkSha256Strict(`${base}/${i}/rawResultHash`, ref.rawResultHash);
      checkEnum(`${base}/${i}/kind`, ref.kind, ENUM.evidenceKind);
      checkEnum(`${base}/${i}/provenanceClass`, ref.provenanceClass, ENUM.provenanceClass);
      checkEnum(`${base}/${i}/sourceMode`, ref.sourceMode, ENUM.sourceMode);
      if (ref.address !== undefined) checkHexBytes(`${base}/${i}/address`, ref.address, 20);
      if (ref.calldata !== undefined) checkHexBytes(`${base}/${i}/calldata`, ref.calldata);
      checkBoundaryStrict(`${base}/${i}/boundary`, ref.boundary);
    });
  }
}

// Full validation for production payloads: structural schema, strict schema (lengths,
// identifiers, enums), referential integrity, canonical form. Guards the I-JSON domain
// (incl. the nesting cap) FIRST — every exported recursive entry point must reject
// over-deep input typed before any unguarded recursion runs (Codex W2-delta review F2).
export function validateReport(payload: unknown): void {
  assertJsonDomain(payload);
  if (!isObject(payload)) {
    fail("schema_validation", "missing_mandatory_field", "/", "payload is not an object");
  }
  const p = payload as JsonObject;
  validateSchemaPhase(p);
  validateStrictSchemaPhase(p);
  validateReferentialPhase(p);
  validateNormalizationPhase(p);
}

// Runs the three phases against the ORIGINAL payload (paths refer to input positions).
export function validateReportStructure(payload: unknown): void {
  assertJsonDomain(payload);
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
// decodedResult) are never reordered. Domain guard first: structuredClone recursion is
// unguarded and must never see input past the nesting cap.
export function normalizeReport(payload: unknown): unknown {
  assertJsonDomain(payload);
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
  if (Array.isArray(p.limitations)) p.limitations = sortLimitations(p.limitations);
  if (Array.isArray(p.verifications)) {
    p.verifications = [...p.verifications]
      .sort((a, b) =>
        cmpString(str(obj(a).invariantId), str(obj(b).invariantId)) ||
        cmpString(str(obj(a).evaluatorVersion), str(obj(b).evaluatorVersion)))
      .map(normalizeResultItem);
  }
  if (Array.isArray(p.facts)) {
    p.facts = [...p.facts]
      .sort((a, b) =>
        cmpString(str(obj(a).factId), str(obj(b).factId)) ||
        cmpString(str(obj(a).evaluatorVersion), str(obj(b).evaluatorVersion)))
      .map(normalizeResultItem);
  }
  return p;
}

// Spec clarification 6: limitations sort by (code, text).
const sortLimitations = (arr: unknown[]): unknown[] =>
  [...arr].sort((a, b) =>
    cmpString(str(obj(a).code), str(obj(b).code)) || cmpString(str(obj(a).text), str(obj(b).text)));

// Within a Verification or EvidenceFact: evidence by id, role-ID lists as sorted sets,
// freshness assessments by (policyId, boundary key), limitations by (code, text).
function normalizeResultItem(v: unknown): unknown {
  if (!isObject(v)) return v;
  if (Array.isArray(v.evidence)) v.evidence = sortEvidence(v.evidence);
  for (const list of ROLE_LISTS) {
    if (Array.isArray(v[list])) v[list] = sortScalarSet(v[list] as unknown[]);
  }
  if (Array.isArray(v.limitations)) v.limitations = sortLimitations(v.limitations);
  const freshness = v.freshness;
  if (isObject(freshness) && Array.isArray(freshness.assessments)) {
    freshness.assessments = [...freshness.assessments].sort((a, b) =>
      cmpString(str(obj(a).policyId), str(obj(b).policyId)) ||
      cmpTuple(boundaryKey(obj(a).boundary), boundaryKey(obj(b).boundary)));
  }
  return v;
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

// Generic RFC 8785 serialization for arbitrary JSON values (no report validation, no domain
// normalization) — the single JCS implementation. Enforces the I-JSON domain so no caller
// can hash a non-JSON value into an authoritative identity.
export function jcsSerialize(value: unknown): string {
  assertJsonDomain(value);
  return jcs(value);
}

// Structural entry point (TEST/abbreviated-vector use): I-JSON + structural/referential/
// canonical-form validation + normalization + JCS. Does NOT enforce byte lengths / enums,
// so the WR6 abbreviated-hex vectors pass. Not for production report identity.
export function canonicalBytesStructural(payload: unknown): Uint8Array {
  assertJsonDomain(payload);
  validateReportStructure(payload);
  return new TextEncoder().encode(jcs(normalizeReport(payload)));
}

// Production entry point: full strict validation (byte lengths, sha256 identifiers, enums)
// on top of the structural layer. Spine review P0#2 — reportHash MUST run this.
export function canonicalBytes(payload: unknown): Uint8Array {
  assertJsonDomain(payload);
  validateReport(payload);
  return new TextEncoder().encode(jcs(normalizeReport(payload)));
}

export function reportHash(payload: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalBytes(payload)).digest("hex")}`;
}

// Report identity over the structural layer, for abbreviated test vectors only.
export function reportHashStructural(payload: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalBytesStructural(payload)).digest("hex")}`;
}
