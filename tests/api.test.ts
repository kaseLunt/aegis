// W5 slice S4 — the report API surface, driven in-process per the S4 plan (§7: tests
// construct a Request and call the exported handler directly; vinext dispatch is bypassed).
//
// E-series: POST envelope + matrix. The handler is a transport over runVerification —
// payload and reportHash must equal the facade's direct output byte-for-byte.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { POST } from "../app/api/v1/verify/route";
import { jcsSerialize } from "../lib/aegis/report/canonical";
import { runVerification } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
import { renderJson } from "../lib/aegis/surfaces/render";

const DATA = join(__dirname, "..", "data");
const MANIFEST_BYTES = new Uint8Array(readFileSync(join(DATA, "manifests", "reference-code-identity.json")));
const HEADS_BYTES = new Uint8Array(readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json")));
const IDENTITY_BYTES = new Uint8Array(readFileSync(join(DATA, "recordings", "reference-identity-reads.json")));

const EVALUATION_TIME = "2026-07-24T00:00:00Z";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function b64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function referenceBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    manifest: b64(MANIFEST_BYTES),
    recordings: [
      { role: "heads", bytes: b64(HEADS_BYTES) },
      { role: "identity", bytes: b64(IDENTITY_BYTES) },
    ],
    chainIds: [1, 10],
    at: "finalized",
    evaluationTime: EVALUATION_TIME,
    profile: "reference",
    ...overrides,
  };
}

async function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://aegis.test/api/v1/verify", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function referenceRun() {
  return runVerification(
    {
      manifestBytes: MANIFEST_BYTES,
      recordings: [
        { role: "heads", bytes: HEADS_BYTES },
        { role: "identity", bytes: IDENTITY_BYTES },
      ],
    },
    { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] },
    referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
  );
}

describe("W5 S4 — E. POST envelope", () => {
  test("E1: POST verify delivers the canonical four-field envelope over the facade's output", async () => {
    const res = await post(referenceBody());

    expect(res.status).toBe(200);
    const text = await res.text();
    const envelope = JSON.parse(text);
    expect(Object.keys(envelope).sort()).toEqual(["generatedAt", "payload", "reportHash", "requestId"]);
    // The body IS jcsSerialize of the envelope — never JSON.stringify — so the payload
    // subtree stays byte-identical to every other surface's serialization of it.
    expect(text).toBe(jcsSerialize(envelope));

    const run = await referenceRun();
    expect(envelope.reportHash).toBe(run.reportHash);
    expect(jcsSerialize(envelope.payload)).toBe(jcsSerialize(run.payload));
  });

  test("E2: the S7 core recomposed from the API response equals the CLI's renderJson bytes", async () => {
    const res = await post(referenceBody());
    const envelope = JSON.parse(await res.text());

    const run = await referenceRun();
    expect(jcsSerialize({ payload: envelope.payload, reportHash: envelope.reportHash })).toBe(renderJson(run));
  });

  test("E3: requestId and generatedAt are per-delivery metadata and never enter the hash", async () => {
    const first = JSON.parse(await (await post(referenceBody())).text());
    const second = JSON.parse(await (await post(referenceBody())).text());

    expect(first.reportHash).toBe(second.reportHash);
    expect(jcsSerialize(first.payload)).toBe(jcsSerialize(second.payload));
    expect(first.requestId).not.toBe(second.requestId);
    expect(first.requestId).toMatch(UUID);
    expect(second.requestId).toMatch(UUID);
    // ISO-UTC round-trip: the field is exactly what toISOString produces.
    expect(new Date(first.generatedAt).toISOString()).toBe(first.generatedAt);
  });
});

async function expectError(res: Response, status: number, code: string, path?: string): Promise<void> {
  expect(res.status).toBe(status);
  const body = (await res.json()) as { error: { code: string; path?: string } };
  expect(Object.keys(body).sort()).toEqual(["error", "generatedAt", "requestId"]);
  expect(body.error.code).toBe(code);
  if (path !== undefined) expect(body.error.path).toBe(path);
}

describe("W5 S4 — E. POST guard chain", () => {
  test("E4: each malformed outer body draws its typed 400", async () => {
    // Malformed JSON text — never an unhandled throw.
    await expectError(await post("{nope"), 400, "malformed_request_body");

    // Outer duplicate key at the TEXT level (R-003 tooth): invisible after parse, so the
    // guard must run on the bytes. Injected into the serialized text, never re-stringified.
    const dup = JSON.stringify(referenceBody()).replace(
      '"at":"finalized"',
      '"at":"finalized","at":"finalized"',
    );
    expect(dup).toContain('"at":"finalized","at":"finalized"');
    await expectError(await post(dup), 400, "duplicate_json_key");

    // Unknown key (strict schema) — an SSRF-probe shape is rejected BY NAME.
    await expectError(
      await post(referenceBody({ providerUrl: "http://169.254.169.254/" })),
      400,
      "invalid_request_body",
      "/providerUrl",
    );

    // Missing required field.
    const missing = referenceBody();
    delete missing.manifest;
    await expectError(await post(missing), 400, "invalid_request_body", "/manifest");

    // Invalid base64 carries the JSON-pointer of the offending field.
    await expectError(
      await post(referenceBody({ manifest: "@@not-base64@@" })),
      400,
      "invalid_base64",
      "/manifest",
    );
    await expectError(
      await post(referenceBody({ recordings: [{ role: "heads", bytes: "@@nope@@" }] })),
      400,
      "invalid_base64",
      "/recordings/0/bytes",
    );

    // Invalid recording role.
    await expectError(
      await post(referenceBody({ recordings: [{ role: "headz", bytes: b64(HEADS_BYTES) }] })),
      400,
      "invalid_request_body",
      "/recordings/0/role",
    );
  });

  test("E5: an engine RequestError surfaces verbatim as its typed 400 — the API does not pre-judge", async () => {
    // `at` passes through VERBATIM; the ENGINE refuses it (the CLI rule, B8's recipes).
    await expectError(await post(referenceBody({ at: "latest" })), 400, "unsupported_at_selector", "/at");
    await expectError(await post(referenceBody({ chainIds: [1, 10, 1] })), 400, "duplicate_chain_id", "/chainIds");
  });

  test("E6: corrupt recording bytes are caller input — typed 400, the engine never sees the bundle", async () => {
    // Tamper one recorded response WITHOUT recomputing its hashes (B11's recipe): the
    // pre-validation loader's integrity check refuses it as a 400, and the error path
    // points at the recording the caller must fix.
    const recording = JSON.parse(new TextDecoder().decode(HEADS_BYTES)) as {
      responses: Array<{ result: unknown }>;
    };
    recording.responses[0].result = "0xdeadbeef"; // hashes now stale -> integrity_mismatch
    const tampered = Buffer.from(JSON.stringify(recording)).toString("base64");

    await expectError(
      await post(
        referenceBody({
          recordings: [
            { role: "heads", bytes: tampered },
            { role: "identity", bytes: b64(IDENTITY_BYTES) },
          ],
        }),
      ),
      400,
      "integrity_mismatch",
      "/recordings/0/bytes",
    );
  });

  test("E7: byte-identical duplicate heads → 400; content-equal byte-different heads → 503 — the B13 trap", async () => {
    // Byte-identical duplicate fails EARLIER, at buildRequest's byte-identity dedup:
    // caller input, 400.
    await expectError(
      await post(
        referenceBody({
          recordings: [
            { role: "heads", bytes: b64(HEADS_BYTES) },
            { role: "heads", bytes: b64(HEADS_BYTES) },
            { role: "identity", bytes: b64(IDENTITY_BYTES) },
          ],
        }),
      ),
      400,
      "duplicate_recording",
    );

    // A re-encode is content-equal but byte-DIFFERENT: it passes dedup and reaches the
    // engine's head-attribution refusal — a SurfaceError, the spec's no-envelope 503.
    const reencoded = Buffer.from(
      JSON.stringify(JSON.parse(new TextDecoder().decode(HEADS_BYTES))),
    ).toString("base64");
    await expectError(
      await post(
        referenceBody({
          recordings: [
            { role: "heads", bytes: b64(HEADS_BYTES) },
            { role: "heads", bytes: reencoded },
            { role: "identity", bytes: b64(IDENTITY_BYTES) },
          ],
        }),
      ),
      503,
      "ambiguous_head_provenance",
      "/recordings",
    );
  });

  test("E8: completed reports deliver as 200 regardless of verdict — including trust-invalid", async () => {
    // The reference fixtures produce non-pass verdicts by construction (the CLI's
    // documented command exits 3) — a completed uncertain report is NEVER an error status
    // (ENGINEERING_SPEC:881). HTTP status is delivery; classification lives in the payload.
    const res = await post(referenceBody());
    expect(res.status).toBe(200);
    const envelope = JSON.parse(await res.text()) as {
      payload: { verifications: readonly { state: string }[] };
    };
    const states = envelope.payload.verifications.map((v) => v.state);
    expect(states.length).toBeGreaterThan(0);
    expect(states.some((s) => s !== "pass")).toBe(true);

    // Trust-invalid manifest (B9's duplicate-key tamper): the payload completes and
    // CARRIES the refusal — still 200, with the classification inside the hashed payload.
    const manifestText = new TextDecoder().decode(MANIFEST_BYTES);
    const tampered = manifestText.replace(
      '"schemaVersion": "1",',
      '"schemaVersion": "1", "schemaVersion": "1",',
    );
    expect(tampered).not.toBe(manifestText);
    const invalidRes = await post(
      referenceBody({ manifest: Buffer.from(tampered).toString("base64") }),
    );
    expect(invalidRes.status).toBe(200);
    const invalidEnvelope = JSON.parse(await invalidRes.text()) as {
      payload: { policyTrust: { state: string }; verifications: readonly unknown[] };
    };
    expect(invalidEnvelope.payload.policyTrust.state).toBe("invalid");
    expect(invalidEnvelope.payload.verifications).toEqual([]);
  });
});
