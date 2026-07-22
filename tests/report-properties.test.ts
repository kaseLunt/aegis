// W1 property tests (evidence target: Robust). Spec §Tests: randomized provider-completion
// and set-input order produce the same payload/hash; changing any hashed field changes the
// hash; platform newline handling can never reach hashed bytes (INS-001).
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";
import { afterAll, describe, expect, test } from "vitest";
import { canonicalBytes, reportHash } from "../lib/aegis/report/canonical";

const VEC = join(__dirname, "..", "roadmap", "research", "WR6", "vectors");
const loadJson = (name: string): unknown =>
  JSON.parse(new TextDecoder().decode(readFileSync(join(VEC, name))));

type J = Record<string, unknown>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function permute<T>(arr: T[], order: number[]): T[] {
  return order.map((i) => arr[i]);
}

const orderArb = (n: number) =>
  fc.shuffledSubarray([...Array(n).keys()], { minLength: n, maxLength: n });

describe("set-input order invariance (property)", () => {
  test("shuffling every set-like array of G-02 never changes bytes or hash", () => {
    const base = loadJson("golden-02-set-normalization.json") as J;
    const refBytes = new TextDecoder().decode(canonicalBytes(base));
    const refHash = reportHash(base);
    const coverage = base.coverage as J;
    fc.assert(
      fc.property(
        orderArb((coverage.supported as unknown[]).length),
        orderArb(((base.policyTrust as J).reasonCodes as unknown[]).length),
        orderArb((base.evidence as unknown[]).length),
        orderArb((base.observationBoundaries as unknown[]).length),
        (sup, rc, ev, ob) => {
          const p = clone(base);
          const cov = p.coverage as J;
          cov.supported = permute(cov.supported as unknown[], sup);
          (p.policyTrust as J).reasonCodes = permute((p.policyTrust as J).reasonCodes as unknown[], rc);
          p.evidence = permute(p.evidence as unknown[], ev);
          p.observationBoundaries = permute(p.observationBoundaries as unknown[], ob);
          expect(new TextDecoder().decode(canonicalBytes(p))).toBe(refBytes);
          expect(reportHash(p)).toBe(refHash);
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("hash sensitivity (property)", () => {
  const HASHED_FIELD_MUTATIONS: Array<[string, (p: J) => void]> = [
    ["schemaVersion", (p) => void (p.schemaVersion = "2")],
    ["engineVersion", (p) => void (p.engineVersion = "9")],
    ["evaluationTime", (p) => void (p.evaluationTime = "2026-07-22T00:00:00Z")],
    ["manifestHash", (p) => void (p.manifestHash = `sha256:${"9".repeat(64)}`)],
    ["sourceMode", (p) => void (p.sourceMode = "live")],
    ["requestHash", (p) => void (p.requestHash = `sha256:${"8".repeat(64)}`)],
    ["policyTrust.state", (p) => void ((p.policyTrust as J).state = "trusted")],
    ["coverage.supported member", (p) => void (((p.coverage as J).supported as string[])[0] = "mutated")],
    // NB: must differ from the fixture's existing value (sha256:777...) or the mutation is vacuous.
    ["evidence[0].rawResultHash", (p) => void ((p.evidence as J[])[0].rawResultHash = `sha256:${"a".repeat(64)}`)],
    ["block.number", (p) => {
      const ob = (p.observationBoundaries as J[]).find((b) => b.kind === "execution_block")!;
      (ob.block as J).number = "3";
      const ev = (p.evidence as J[]).find((e) => (e.boundary as J).kind === "execution_block")!;
      ((ev.boundary as J).block as J).number = "3";
    }],
  ];

  for (const [label, mutate] of HASHED_FIELD_MUTATIONS) {
    test(`changing ${label} changes the reportHash`, () => {
      const base = loadJson("golden-02-set-normalization.json") as J;
      const before = reportHash(base);
      const p = clone(base);
      mutate(p);
      expect(reportHash(p)).not.toBe(before);
    });
  }

  test("changing a referenced policy hash changes the reportHash", () => {
    const base = loadJson("golden-02-set-normalization.json") as J;
    const before = reportHash(base);
    const p = clone(base);
    (p.policyRefs as J[])[0].contentHash = `sha256:${"b".repeat(64)}`;
    expect(reportHash(p)).not.toBe(before);
  });

  test("changing a verification's freshness changes the reportHash", () => {
    const base = loadJson("golden-01-minimal.json") as J;
    const mk = (aggregate: string): J => {
      const p = clone(base);
      p.verifications = [{
        invariantId: "a.check", evaluatorVersion: "1", state: "unknown", severity: "info",
        claimKind: "observed", statement: "t", evidence: [], expectedEvidenceIds: [],
        actualEvidenceIds: [], derivationInputIds: [],
        freshness: { aggregate, assessments: [] }, limitations: [],
      }];
      return p;
    };
    expect(reportHash(mk("current"))).not.toBe(reportHash(mk("stale")));
  });
});

describe("determinism and platform-text immunity", () => {
  test("repeated canonicalization is byte-identical", () => {
    const base = loadJson("golden-03-semantic-order-a.json");
    const a = canonicalBytes(base);
    const b = canonicalBytes(loadJson("golden-03-semantic-order-a.json"));
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  const tmp = mkdtempSync(join(tmpdir(), "aegis-crlf-"));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  test("CRLF-injected fixture file produces the same reportHash (INS-001)", () => {
    const original = readFileSync(join(VEC, "golden-01-minimal.json"));
    const crlf = new TextDecoder().decode(original).replace(/\n/g, "\r\n");
    const crlfPath = join(tmp, "golden-01-crlf.json");
    writeFileSync(crlfPath, Buffer.from(crlf, "utf-8"));
    const viaCrlf = JSON.parse(new TextDecoder().decode(readFileSync(crlfPath))) as unknown;
    expect(reportHash(viaCrlf)).toBe(reportHash(loadJson("golden-01-minimal.json")));
    expect(reportHash(viaCrlf)).toBe(
      `sha256:9f87dc8827d3cb97794534a37d20f35fb7b70c1ce9afb3a3343a897a0567d5fe`,
    );
  });
});
