// W1 typed rejections — malformed vectors (WR6, blind-derived) M-01..M-06 plus
// spec-clarification cardinality. specType names map 1:1 onto our canonical codes; the
// corpus allows an implementation to map phases while preserving intent
// (schema_or_referential_validation accepts either of our first two phases).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { CanonicalizationError, canonicalBytes } from "../lib/aegis/report/canonical";

const VEC = join(__dirname, "..", "roadmap", "research", "WR6", "vectors");

function loadJson(name: string): unknown {
  return JSON.parse(new TextDecoder().decode(readFileSync(join(VEC, name))));
}

interface MalformedVector {
  base: string;
  operations: Array<{ op: string; path: string; value?: unknown }>;
  expected: {
    typedRejection: { specType: string; path?: string; paths?: string[] };
    phase: string;
  };
}

function applyPatch(base: unknown, ops: MalformedVector["operations"]): unknown {
  const doc = JSON.parse(JSON.stringify(base)) as unknown;
  for (const { op, path, value } of ops) {
    const parts = path.split("/").slice(1).map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
    const last = parts.pop()!;
    let cur: unknown = doc;
    for (const p of parts) {
      cur = Array.isArray(cur) ? cur[Number(p)] : (cur as Record<string, unknown>)[p];
    }
    if (op === "remove") {
      if (Array.isArray(cur)) cur.splice(Number(last), 1);
      else delete (cur as Record<string, unknown>)[last];
    } else if (op === "add" && Array.isArray(cur)) {
      cur.splice(Number(last), 0, value);
    } else if (Array.isArray(cur)) {
      cur[Number(last)] = value;
    } else {
      (cur as Record<string, unknown>)[last] = value;
    }
  }
  return doc;
}

const PHASES: Record<string, string[]> = {
  schema_validation: ["schema_validation"],
  schema_or_referential_validation: ["schema_validation", "referential_validation"],
  domain_normalization: ["domain_normalization"],
};

const MALFORMED = [
  "malformed-duplicate-set-member.json",
  "malformed-decimal-leading-zero.json",
  "malformed-decimal-plus-sign.json",
  "malformed-uppercase-hex.json",
  "malformed-dangling-evidence-role-id.json",
  "malformed-missing-mandatory-field.json",
] as const;

describe("malformed vectors reject with typed errors (WR6)", () => {
  for (const name of MALFORMED) {
    test(name, () => {
      const vec = loadJson(name) as unknown as MalformedVector;
      const payload = applyPatch(loadJson(vec.base), vec.operations);
      let caught: unknown;
      try {
        canonicalBytes(payload);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(CanonicalizationError);
      const err = caught as CanonicalizationError;
      expect(err.code).toBe(vec.expected.typedRejection.specType);
      expect(PHASES[vec.expected.phase]).toContain(err.phase);
      const wanted = vec.expected.typedRejection.paths ?? [vec.expected.typedRejection.path!];
      expect(wanted).toContain(err.path);
    });
  }
});

describe("spec-clarification cardinality (ENGINEERING_SPEC v1.2 §clarification 9)", () => {
  test("empty observationBoundaries rejects", () => {
    const payload = applyPatch(loadJson("golden-01-minimal.json"), [
      { op: "replace", path: "/observationBoundaries", value: [] },
    ]);
    expect(() => canonicalBytes(payload)).toThrow(CanonicalizationError);
    try {
      canonicalBytes(payload);
    } catch (e) {
      expect((e as CanonicalizationError).code).toBe("insufficient_observation_boundaries");
      expect((e as CanonicalizationError).phase).toBe("schema_validation");
    }
  });

  test("golden payloads still canonicalize (no false rejections)", () => {
    expect(() => canonicalBytes(loadJson("golden-01-minimal.json"))).not.toThrow();
    expect(() => canonicalBytes(loadJson("golden-02-set-normalization.json"))).not.toThrow();
    expect(() => canonicalBytes(loadJson("golden-03-semantic-order-a.json"))).not.toThrow();
  });
});
