// W1 strict schema layer — spec v1.2: byte lengths (32-byte hashes/roots, 20-byte
// addresses), sha256 identifiers exactly 64 lowercase hex, enum membership. The WR6 golden
// vectors deliberately use abbreviated hex and exercise only the structural layer; this
// layer is what real payloads pass through, so fixtures here are full-length.
import { describe, expect, test } from "vitest";
import { CanonicalizationError, validateReport } from "../lib/aegis/report/canonical";

const h32 = (fill: string) => `0x${fill.repeat(64)}`;
const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
const addr = (fill: string) => `0x${fill.repeat(40)}`;

function fullPayload(): Record<string, unknown> {
  const boundary = {
    kind: "execution_block",
    block: {
      chainId: 1,
      number: "25577369",
      hash: h32("a"),
      parentHash: h32("b"),
      timestamp: "2026-07-22T00:00:00Z",
      finality: "finalized",
    },
  };
  const evidence = {
    id: sha("2"),
    kind: "rpc_call",
    provenanceClass: "observed_public_state",
    sourceMode: "recorded",
    providerId: "provider-a",
    boundary,
    address: addr("c"),
    method: "eth_call",
    calldata: "0x00",
    rawResultHash: sha("5"),
    capturedAt: "2026-07-22T00:00:00Z",
  };
  return {
    schemaVersion: "1",
    engineVersion: "1",
    evaluationTime: "2026-07-22T00:00:01Z",
    manifestVersion: "1",
    manifestHash: sha("0"),
    policyRefs: [],
    policyTrust: {
      state: "trusted",
      trustPolicyId: "tp-1",
      manifestHash: sha("0"),
      reasonCodes: ["approved_hash"],
      evidence: [evidence],
    },
    sourceMode: "recorded",
    requestHash: sha("1"),
    observationBoundaries: [boundary],
    evidence: [evidence],
    verifications: [],
    facts: [],
    coverage: { supported: [], unsupported: [], excluded: [] },
    limitations: [],
  };
}

function mutate(fn: (p: Record<string, unknown>) => void): Record<string, unknown> {
  const p = fullPayload();
  fn(p);
  return p;
}

function expectReject(payload: unknown, code: string): void {
  let caught: unknown;
  try {
    validateReport(payload);
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(CanonicalizationError);
  expect((caught as CanonicalizationError).code).toBe(code);
  expect((caught as CanonicalizationError).phase).toBe("schema_validation");
}

type J = Record<string, unknown>;

describe("strict schema layer (full-length payloads)", () => {
  test("a fully-formed payload validates", () => {
    expect(() => validateReport(fullPayload())).not.toThrow();
  });

  test("31-byte block hash rejects with invalid_hex_length", () => {
    expectReject(
      mutate((p) => ((((p.observationBoundaries as J[])[0].block) as J).hash = `0x${"a".repeat(62)}`)),
      "invalid_hex_length",
    );
  });

  test("19-byte address rejects with invalid_hex_length", () => {
    expectReject(
      mutate((p) => ((p.evidence as J[])[0].address = `0x${"c".repeat(38)}`)),
      "invalid_hex_length",
    );
  });

  test("odd-nibble calldata rejects with invalid_hex_length", () => {
    expectReject(
      mutate((p) => ((p.evidence as J[])[0].calldata = "0x0")),
      "invalid_hex_length",
    );
  });

  test("63-hex sha256 identifier rejects with invalid_sha256_identifier", () => {
    expectReject(
      mutate((p) => (p.manifestHash = `sha256:${"0".repeat(63)}`)),
      "invalid_sha256_identifier",
    );
  });

  test("uppercase sha256 identifier rejects with invalid_sha256_identifier", () => {
    expectReject(
      mutate((p) => (p.requestHash = `sha256:${"A".repeat(64)}`)),
      "invalid_sha256_identifier",
    );
  });

  test("unknown sourceMode rejects with invalid_enum_member", () => {
    expectReject(mutate((p) => (p.sourceMode = "imagined")), "invalid_enum_member");
  });

  test("unknown evidence kind rejects with invalid_enum_member", () => {
    expectReject(
      mutate((p) => ((p.evidence as J[])[0].kind = "vibes")),
      "invalid_enum_member",
    );
  });

  test("unknown finality rejects with invalid_enum_member", () => {
    expectReject(
      mutate((p) => ((((p.observationBoundaries as J[])[0].block) as J).finality = "probably")),
      "invalid_enum_member",
    );
  });

  test("unknown policyTrust state rejects with invalid_enum_member", () => {
    expectReject(
      mutate((p) => ((p.policyTrust as J).state = "vouched")),
      "invalid_enum_member",
    );
  });

  test("strict layer still runs the structural phases (missing field caught)", () => {
    expectReject(
      mutate((p) => delete (p.evidence as J[])[0].rawResultHash),
      "missing_mandatory_field",
    );
  });
});
