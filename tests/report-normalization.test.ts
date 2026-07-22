// W1 normalization surfaces not covered by the WR6 corpus (spec v1.2 clarification 6):
// verification/fact array ordering, role-ID set ordering, per-item evidence ordering,
// freshness assessments, limitations. Tests written BEFORE implementation (these sorts are
// deliberately absent until now).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { canonicalBytes, normalizeReport } from "../lib/aegis/report/canonical";

const VEC = join(__dirname, "..", "roadmap", "research", "WR6", "vectors");
const g01 = (): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(readFileSync(join(VEC, "golden-01-minimal.json")))) as Record<string, unknown>;

type J = Record<string, unknown>;
const EV_ID = "sha256:2222222222222222222222222222222222222222222222222222222222222222";

function verification(invariantId: string, evaluatorVersion: string, extra: Partial<J> = {}): J {
  return {
    invariantId,
    evaluatorVersion,
    state: "unknown",
    severity: "info",
    claimKind: "observed",
    statement: "t",
    evidence: [],
    expectedEvidenceIds: [],
    actualEvidenceIds: [],
    derivationInputIds: [],
    freshness: { aggregate: "unknown", assessments: [] },
    limitations: [],
    ...extra,
  };
}

describe("verification and fact array ordering", () => {
  test("verifications sort by (invariantId, evaluatorVersion)", () => {
    const p = g01();
    p.verifications = [verification("b.check", "1"), verification("a.check", "2"), verification("a.check", "1")];
    const n = normalizeReport(p) as J;
    const order = (n.verifications as J[]).map((v) => `${v.invariantId}@${v.evaluatorVersion}`);
    expect(order).toEqual(["a.check@1", "a.check@2", "b.check@1"]);
  });

  test("facts sort by (factId, evaluatorVersion)", () => {
    const p = g01();
    p.facts = [
      { factId: "z.fact", evaluatorVersion: "1", state: "available", claimKind: "observed", statement: "t", evidence: [], inputEvidenceIds: [], freshness: { aggregate: "unknown", assessments: [] }, limitations: [] },
      { factId: "a.fact", evaluatorVersion: "1", state: "available", claimKind: "observed", statement: "t", evidence: [], inputEvidenceIds: [], freshness: { aggregate: "unknown", assessments: [] }, limitations: [] },
    ];
    const n = normalizeReport(p) as J;
    expect((n.facts as J[]).map((f) => f.factId)).toEqual(["a.fact", "z.fact"]);
  });
});

describe("within-item ordering", () => {
  test("role-ID lists sort as sets", () => {
    const p = g01();
    const zz = `sha256:${"f".repeat(64)}`;
    p.verifications = [verification("a.check", "1", { expectedEvidenceIds: [zz, EV_ID], derivationInputIds: [zz, EV_ID] })];
    const n = normalizeReport(p) as J;
    const v = (n.verifications as J[])[0];
    expect(v.expectedEvidenceIds).toEqual([EV_ID, zz]);
    expect(v.derivationInputIds).toEqual([EV_ID, zz]);
  });

  test("verification.evidence sorts by id", () => {
    const p = g01();
    const evA = { ...(p.evidence as J[])[0] };
    const evB = { ...evA, id: `sha256:${"9".repeat(64)}` };
    p.evidence = [evA, evB];
    p.verifications = [verification("a.check", "1", { evidence: [evB, evA] })];
    const n = normalizeReport(p) as J;
    const ids = (((n.verifications as J[])[0].evidence) as J[]).map((e) => e.id);
    expect(ids).toEqual([evA.id, evB.id]);
  });

  test("freshness assessments sort by (policyId, boundary key)", () => {
    const p = g01();
    const snap = (p.observationBoundaries as J[])[0];
    const blockBoundary = {
      kind: "execution_block",
      block: { chainId: 1, number: "2", hash: "0xaa", parentHash: "0xbb", timestamp: "2026-07-21T00:00:00Z", finality: "finalized" },
    };
    p.verifications = [verification("a.check", "1", {
      freshness: {
        aggregate: "current",
        assessments: [
          { policyId: "p2", boundary: snap, state: "current" },
          { policyId: "p1", boundary: snap, state: "current" },
          { policyId: "p1", boundary: blockBoundary, state: "current" },
        ],
      },
    })];
    const n = normalizeReport(p) as J;
    const fresh = ((n.verifications as J[])[0].freshness) as J;
    const order = (fresh.assessments as J[]).map((a) => `${a.policyId}:${(a.boundary as J).kind}`);
    expect(order).toEqual(["p1:execution_block", "p1:source_snapshot", "p2:source_snapshot"]);
  });

  test("limitations sort by (code, text) at payload and item level", () => {
    const p = g01();
    p.limitations = [
      { code: "z", text: "1" },
      { code: "a", text: "2" },
      { code: "a", text: "1" },
    ];
    p.verifications = [verification("a.check", "1", { limitations: [{ code: "b", text: "x" }, { code: "a", text: "x" }] })];
    const n = normalizeReport(p) as J;
    expect((n.limitations as J[]).map((l) => `${l.code}/${l.text}`)).toEqual(["a/1", "a/2", "z/1"]);
    expect((((n.verifications as J[])[0].limitations) as J[]).map((l) => l.code)).toEqual(["a", "b"]);
  });
});

describe("end-to-end", () => {
  test("a payload with unsorted verifications canonicalizes without error and deterministically", () => {
    const p = g01();
    p.verifications = [verification("b.check", "1", { expectedEvidenceIds: [EV_ID] }), verification("a.check", "1")];
    const a = new TextDecoder().decode(canonicalBytes(p));
    const q = g01();
    q.verifications = [verification("a.check", "1"), verification("b.check", "1", { expectedEvidenceIds: [EV_ID] })];
    const b = new TextDecoder().decode(canonicalBytes(q));
    expect(a).toBe(b);
  });
});
