// W1 canonical report core — golden-vector acceptance tests.
// Vectors were authored blind to this implementation (WR6, Codex; INS-002). They are the
// acceptance target: on mismatch, investigate the SPEC first — never adjust a vector.
// INS-001: vectors are read in BINARY mode; expected bytes come from inside the file,
// so platform newline handling can never touch what we hash.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { canonicalBytesStructural as canonicalBytes, reportHashStructural as reportHash } from "../lib/aegis/report/canonical";

const VEC = join(__dirname, "..", "roadmap", "research", "WR6", "vectors");

function loadJson(name: string): unknown {
  return JSON.parse(new TextDecoder().decode(readFileSync(join(VEC, name))));
}

function expectedOf(name: string): { bytes: Uint8Array; hash: string; length: number } {
  const text = new TextDecoder().decode(readFileSync(join(VEC, name)));
  const fence = /```text\n([\s\S]*?)\n```/.exec(text);
  if (!fence) throw new Error(`no text fence in ${name}`);
  const digest = /SHA-256 digest: `([0-9a-f]{64})`/.exec(text);
  const len = /Byte length: `(\d+)`/.exec(text);
  if (!digest || !len) throw new Error(`missing digest/length in ${name}`);
  return {
    bytes: new TextEncoder().encode(fence[1]),
    hash: digest[1],
    length: Number(len[1]),
  };
}

interface PatchVector {
  base: string;
  operations: Array<{ op: string; path: string; value?: unknown }>;
  expected: {
    reportHash: string;
    byteLength?: number;
    mustDifferFrom?: { reportHash: string };
  };
}

// Minimal JSON Patch (replace/add/remove with JSON Pointer) for the O-vectors.
function applyPatch(base: unknown, ops: PatchVector["operations"]): unknown {
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

describe("golden hash vectors (WR6, blind-derived)", () => {
  for (const [json, expected] of [
    ["golden-01-minimal.json", "golden-01-minimal.expected.md"],
    ["golden-02-set-normalization.json", "golden-02-set-normalization.expected.md"],
    ["golden-03-semantic-order-a.json", "golden-03-semantic-order-a.expected.md"],
  ] as const) {
    test(`${json} canonicalizes to the hand-derived bytes and hash`, () => {
      const exp = expectedOf(expected);
      const bytes = canonicalBytes(loadJson(json));
      expect(bytes.length).toBe(exp.length);
      expect(new TextDecoder().decode(bytes)).toBe(new TextDecoder().decode(exp.bytes));
      expect(reportHash(loadJson(json))).toBe(`sha256:${exp.hash}`);
    });
  }
});

describe("ordering vectors (WR6)", () => {
  test("O-01: shuffled set-like inputs produce byte-identical output to G-02", () => {
    const vec = loadJson("ordering-set-like-shuffle.json") as unknown as PatchVector;
    const patched = applyPatch(loadJson(vec.base), vec.operations);
    const exp = expectedOf("golden-02-set-normalization.expected.md");
    expect(new TextDecoder().decode(canonicalBytes(patched))).toBe(new TextDecoder().decode(exp.bytes));
    expect(reportHash(patched)).toBe(`sha256:${vec.expected.reportHash}`);
  });

  test("O-02: reversed semantic-order batch is NOT resorted and hashes differently from G-03", () => {
    const vec = loadJson("ordering-semantic-order-b.json") as unknown as PatchVector;
    const patched = applyPatch(loadJson(vec.base), vec.operations);
    const bytes = canonicalBytes(patched);
    expect(bytes.length).toBe(vec.expected.byteLength);
    expect(reportHash(patched)).toBe(`sha256:${vec.expected.reportHash}`);
    expect(vec.expected.reportHash).not.toBe(vec.expected.mustDifferFrom!.reportHash);
    expect(reportHash(patched)).not.toBe(`sha256:${vec.expected.mustDifferFrom!.reportHash}`);
  });
});
