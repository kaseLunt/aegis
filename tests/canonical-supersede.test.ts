// W1 cycle: supersede the M0 non-cryptographic identifiers (roadmap M0 honest-limitations
// item "report identifiers are not cryptographic") and kill a latent nondeterminism bug —
// localeCompare key ordering is locale-dependent, which the spec's byte-identity contract
// cannot tolerate.
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import { canonicalJson, reportId, stableHash } from "../lib/aegis/canonical";

describe("M0 canonical module superseded by real content addressing", () => {
  test("canonicalJson orders keys by UTF-16 code units, not locale ('B' before 'a')", () => {
    expect(canonicalJson({ a: 1, B: 2 })).toBe('{"B":2,"a":1}');
  });

  test("stableHash is the sha256 of the JCS bytes (64 lowercase hex)", () => {
    const value = { hello: "world", n: 7 };
    const expected = createHash("sha256").update(Buffer.from('{"hello":"world","n":7}', "utf-8")).digest("hex");
    expect(stableHash(value)).toBe(expected);
    expect(stableHash(value)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("reportId is prefix plus first 12 hex of the content hash", () => {
    const value = { x: 1 };
    expect(reportId("AGS-HEALTH", value)).toBe(`AGS-HEALTH-${stableHash(value).slice(0, 12)}`);
  });

  test("key order of input never changes the hash", () => {
    expect(stableHash({ a: 1, b: { d: 2, c: 3 } })).toBe(stableHash({ b: { c: 3, d: 2 }, a: 1 }));
  });
});
