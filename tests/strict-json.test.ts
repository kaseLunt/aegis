// W5 slice S2 — R-003: duplicate JSON keys at the untrusted byte boundaries.
//
// `JSON.parse` silently keeps the LAST value for a duplicated key. That is a content-identity
// hazard exactly where Aegis accepts bytes from outside the repo: two readers of the same
// document can disagree about what it says, and the one that matters — the hash — is computed
// over whatever the parser happened to keep. The trust root then attests a document whose
// meaning was chosen by a parser quirk rather than by the author.
//
// The deferral note in manifest/trust.ts said this closes "when this boundary accepts untrusted
// bytes (W3/W5 API surface)". D-6bedc848 has the W5 report API accepting caller-supplied
// manifest bytes, so that condition is now met.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadRecordingBytes } from "../lib/aegis/chain/adapter";
import { ChainError } from "../lib/aegis/chain/quorum";
import { ManifestError, loadManifestBytes } from "../lib/aegis/manifest/trust";
import { findDuplicateJsonKey } from "../lib/aegis/report/canonical";

const enc = (s: string) => new TextEncoder().encode(s);
const DATA = join(__dirname, "..", "data");

describe("W5 S2 — findDuplicateJsonKey", () => {
  test("reports a duplicated key in a flat object", () => {
    expect(findDuplicateJsonKey('{"a":1,"a":2}')).toBe("/a");
  });

  test("accepts a document with no duplicates", () => {
    expect(findDuplicateJsonKey('{"a":1,"b":{"a":2},"c":[{"a":3},{"a":4}]}')).toBeNull();
  });

  test("the same key in sibling objects is not a duplicate", () => {
    expect(findDuplicateJsonKey('{"x":{"k":1},"y":{"k":2}}')).toBeNull();
  });

  test("reports a duplicate nested inside an object, with its path", () => {
    expect(findDuplicateJsonKey('{"outer":{"inner":1,"inner":2}}')).toBe("/outer/inner");
  });

  test("reports a duplicate nested inside an array element", () => {
    expect(findDuplicateJsonKey('{"list":[{"ok":1},{"dup":1,"dup":2}]}')).toBe("/list/1/dup");
  });

  // A scanner that naively splits on quotes would see a key here and mis-report.
  test("a colon inside a STRING VALUE is not mistaken for a key separator", () => {
    expect(findDuplicateJsonKey('{"a":"\\"b\\":1,\\"b\\":2","c":3}')).toBeNull();
  });

  test("escaped quotes inside keys are handled", () => {
    expect(findDuplicateJsonKey('{"a\\"b":1,"a\\"b":2}')).toBe('/a"b');
  });
});

describe("W5 S2 — the byte boundaries refuse duplicate keys", () => {
  test("loadManifestBytes refuses a manifest with a duplicated key", () => {
    const bytes = readFileSync(join(DATA, "manifests", "reference-code-identity.json"));
    // Duplicate `environment` with a DIFFERENT value: under last-wins this parses as
    // "production", so applicability would be evaluated against a value the document does not
    // unambiguously state.
    const tampered = new TextDecoder().decode(bytes).replace(
      '"environment": "reference"',
      '"environment": "reference", "environment": "production"',
    );

    expect(() => loadManifestBytes(enc(tampered))).toThrow(ManifestError);
    try {
      loadManifestBytes(enc(tampered));
    } catch (e) {
      expect((e as ManifestError).code).toBe("duplicate_json_key");
    }
  });

  test("loadRecordingBytes refuses a recording bundle with a duplicated key", () => {
    const bytes = readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json"));
    const tampered = new TextDecoder().decode(bytes).replace(
      '"recordingId"',
      '"recordingId": "spoofed", "recordingId"',
    );

    expect(() => loadRecordingBytes(enc(tampered))).toThrow(ChainError);
    try {
      loadRecordingBytes(enc(tampered));
    } catch (e) {
      expect((e as ChainError).code).toBe("duplicate_json_key");
    }
  });

  test("the shipped fixtures still load — the guard rejects duplicates, not valid documents", () => {
    expect(() =>
      loadManifestBytes(readFileSync(join(DATA, "manifests", "reference-code-identity.json"))),
    ).not.toThrow();
    expect(() =>
      loadRecordingBytes(readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json"))),
    ).not.toThrow();
  });
});
