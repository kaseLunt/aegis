// W2 loader-from-bytes — the manifest byte boundary (INS-001: files are read in binary and
// decoded strictly in memory; platform text handling never touches hashed bytes). Content
// identity comes from JCS bytes of the parsed content, so JSON whitespace (CRLF vs LF) can
// never change a manifest's hash — but undecodable or malformed bytes are typed load
// failures, never silently coerced.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { ManifestError, evaluateTrust, loadManifestBytes } from "../lib/aegis/manifest/trust";

const FIXTURES = join(__dirname, "..", "data", "manifests");
const fixtureBytes = (): Buffer => readFileSync(join(FIXTURES, "reference-code-identity.json"));

function expectManifestError(fn: () => unknown, code: string): void {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(ManifestError);
  expect((caught as ManifestError).code).toBe(code);
}

describe("loadManifestBytes", () => {
  test("the sealed reference fixture loads from binary bytes with a verified content hash", () => {
    const loaded = loadManifestBytes(fixtureBytes());
    expect(loaded.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(loaded.manifest.contentHash).toBe(loaded.contentHash);
    expect(loaded.manifest.manifestVersion).toBe("reference-code-identity@v1");
  });

  test("a CRLF-injected copy of the fixture produces the same content hash (INS-001)", () => {
    const original = fixtureBytes();
    const crlf = Buffer.from(
      new TextDecoder().decode(original).replace(/\n/g, "\r\n"),
      "utf-8",
    );
    expect(crlf.equals(original)).toBe(false);
    expect(loadManifestBytes(crlf).contentHash).toBe(loadManifestBytes(original).contentHash);
  });

  test("bytes that are not valid UTF-8 fail typed (invalid_utf8), never parsed", () => {
    const bytes = Buffer.from([0x7b, 0x22, 0xff, 0xfe, 0x22, 0x7d]);
    expectManifestError(() => loadManifestBytes(bytes), "invalid_utf8");
  });

  test("well-encoded but malformed JSON fails typed (malformed_json)", () => {
    const bytes = Buffer.from('{"schemaVersion": "1",', "utf-8");
    expectManifestError(() => loadManifestBytes(bytes), "malformed_json");
  });

  test("valid JSON that is not a valid manifest still fails manifest validation", () => {
    const bytes = Buffer.from("[1,2,3]", "utf-8");
    expectManifestError(() => loadManifestBytes(bytes), "missing_mandatory_field");
  });

  test("the sealed fixture itself follows the approved-hash set: trusted iff approved", () => {
    const loaded = loadManifestBytes(fixtureBytes());
    const approving = { trustPolicyId: "tp-ref", approvedHashes: [loaded.contentHash] };
    const nonApproving = { trustPolicyId: "tp-ref", approvedHashes: [`sha256:${"0".repeat(64)}`] };
    expect(evaluateTrust(loaded, approving).state).toBe("trusted");
    const t = evaluateTrust(loaded, nonApproving);
    expect(t.state).toBe("untrusted");
    expect(t.reasonCodes).toEqual(["manifest_hash_not_approved"]);
  });

  test("tampering with the sealed fixture's content fails closed (integrity_mismatch)", () => {
    const tampered = Buffer.from(
      new TextDecoder().decode(fixtureBytes()).replace(
        '"protocol": "etherfi"',
        '"protocol": "not-etherfi"',
      ),
      "utf-8",
    );
    expect(tampered.equals(fixtureBytes())).toBe(false);
    expectManifestError(() => loadManifestBytes(tampered), "integrity_mismatch");
  });
});
