// W5 slice S4 — the report API surface, driven in-process per the S4 plan (§7: tests
// construct a Request and call the exported handler directly; vinext dispatch is bypassed).
//
// E-series: POST envelope + matrix. The handler is a transport over runVerification —
// payload and reportHash must equal the facade's direct output byte-for-byte.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { GET } from "../app/api/v1/reports/[hash]/route";
import { POST } from "../app/api/v1/verify/route";
import { API_LIMITS } from "../lib/aegis/surfaces/api";
import { jcsSerialize, reportHash } from "../lib/aegis/report/canonical";
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

  test("E9: every size/shape limit is boundary-exact — the limit passes, limit+1 draws its typed 400", async () => {
    // Total body: pad the valid reference body with trailing whitespace (JSON-legal) to
    // EXACTLY the limit -> full 200 run; one byte more -> request_too_large before any parse.
    const baseText = JSON.stringify(referenceBody());
    const atLimit = baseText + " ".repeat(API_LIMITS.maxBodyBytes - Buffer.byteLength(baseText));
    expect(Buffer.byteLength(atLimit)).toBe(API_LIMITS.maxBodyBytes);
    expect((await post(atLimit)).status).toBe(200);
    await expectError(await post(atLimit + " "), 400, "request_too_large");

    // Manifest: exactly maxManifestBytes of garbage passes the SIZE check (the run completes
    // with policyTrust invalid, B9's honest 200); one byte more -> manifest_too_large.
    const garbageManifest = "x".repeat(API_LIMITS.maxManifestBytes);
    const atManifestLimit = await post(referenceBody({ manifest: Buffer.from(garbageManifest).toString("base64") }));
    expect(atManifestLimit.status).toBe(200);
    await expectError(
      await post(referenceBody({ manifest: Buffer.from(garbageManifest + "x").toString("base64") })),
      400,
      "manifest_too_large",
      "/manifest",
    );

    // Recording: pad the heads document with trailing whitespace (content-preserving) to
    // exactly maxRecordingBytes -> full 200 run; one byte more -> recording_too_large.
    const headsText = new TextDecoder().decode(HEADS_BYTES);
    const paddedHeads = headsText + " ".repeat(API_LIMITS.maxRecordingBytes - Buffer.byteLength(headsText));
    expect(Buffer.byteLength(paddedHeads)).toBe(API_LIMITS.maxRecordingBytes);
    const atRecordingLimit = await post(
      referenceBody({
        recordings: [
          { role: "heads", bytes: Buffer.from(paddedHeads).toString("base64") },
          { role: "identity", bytes: b64(IDENTITY_BYTES) },
        ],
      }),
    );
    expect(atRecordingLimit.status).toBe(200);
    await expectError(
      await post(
        referenceBody({
          recordings: [
            { role: "heads", bytes: Buffer.from(paddedHeads + " ").toString("base64") },
            { role: "identity", bytes: b64(IDENTITY_BYTES) },
          ],
        }),
      ),
      400,
      "recording_too_large",
      "/recordings/0/bytes",
    );

    // Recording count: maxRecordings distinct documents pass; one more -> too_many_recordings.
    // Identity variants get distinct trailing whitespace so byte-identity dedup stays quiet.
    const identityText = new TextDecoder().decode(IDENTITY_BYTES);
    const identityVariant = (i: number): { role: "identity"; bytes: string } => ({
      role: "identity",
      bytes: Buffer.from(identityText + " ".repeat(i + 1)).toString("base64"),
    });
    const atCount = [
      { role: "heads", bytes: b64(HEADS_BYTES) },
      ...Array.from({ length: API_LIMITS.maxRecordings - 1 }, (_, i) => identityVariant(i)),
    ];
    expect(atCount.length).toBe(API_LIMITS.maxRecordings);
    // At the limit the gate passes and the request reaches the ENGINE, which refuses the
    // content-overlapping identity bundles as an operational failure (the CLI's
    // post-pre-validation ChainError -> 5 ruling, bin/aegis.ts:108): 503 with the engine's
    // own code — proof the count check did NOT fire.
    await expectError(
      await post(referenceBody({ recordings: atCount })),
      503,
      "duplicate_provider_observation",
    );
    await expectError(
      await post(referenceBody({ recordings: [...atCount, identityVariant(API_LIMITS.maxRecordings)] })),
      400,
      "too_many_recordings",
      "/recordings",
    );

    // chainIds count.
    const atChainLimit = Array.from({ length: API_LIMITS.maxChainIds }, (_, i) => i + 1);
    expect((await post(referenceBody({ chainIds: atChainLimit }))).status).toBe(200);
    await expectError(
      await post(referenceBody({ chainIds: [...atChainLimit, API_LIMITS.maxChainIds + 1] })),
      400,
      "too_many_chain_ids",
      "/chainIds",
    );

    // trustPolicy.approvedHashes count.
    const hashes = (n: number): string[] =>
      Array.from({ length: n }, (_, i) => `sha256:${i.toString(16).padStart(64, "0")}`);
    const atHashLimit = await post(
      referenceBody({ trustPolicy: { trustPolicyId: "tp-e9", approvedHashes: hashes(API_LIMITS.maxApprovedHashes) } }),
    );
    expect(atHashLimit.status).toBe(200);
    await expectError(
      await post(
        referenceBody({ trustPolicy: { trustPolicyId: "tp-e9", approvedHashes: hashes(API_LIMITS.maxApprovedHashes + 1) } }),
      ),
      400,
      "too_many_approved_hashes",
      "/trustPolicy/approvedHashes",
    );
  });

  test("E10: no caller can name a provider or URL — the deployment is structurally server-owned", async () => {
    // Unknown keys are rejected BY NAME at every nesting level (strict schemas): an
    // SSRF-probe shape cannot even be expressed (THREAT_MODEL:126; engine.ts:41-44).
    await expectError(
      await post(referenceBody({ providers: ["http://internal.example/"] })),
      400,
      "invalid_request_body",
      "/providers",
    );
    await expectError(
      await post(
        referenceBody({
          recordings: [{ role: "heads", bytes: b64(HEADS_BYTES), url: "http://internal.example/" }],
        }),
      ),
      400,
      "invalid_request_body",
      "/recordings/0/url",
    );
    // The only deployment selector is the server-owned profile registry.
    await expectError(
      await post(referenceBody({ profile: "production" })),
      400,
      "invalid_request_body",
      "/profile",
    );
  });

  test("E11: a caller trust policy overrides self-approval — untrusted is a completed 200 with the refusal visible", async () => {
    // The honest operator mode (B10's recipe): a policy that does not approve the manifest
    // leaves every invariant unevaluated. Incomplete, not invalid — and never silently
    // clean: the refusal rides inside the hashed payload with its reasonCodes.
    const res = await post(
      referenceBody({
        trustPolicy: { trustPolicyId: "tp-api-e11", approvedHashes: [`sha256:${"a".repeat(64)}`] },
      }),
    );
    expect(res.status).toBe(200);
    const envelope = JSON.parse(await res.text()) as {
      payload: {
        policyTrust: { state: string; trustPolicyId: string; reasonCodes: readonly string[] };
        verifications: readonly unknown[];
      };
    };
    expect(envelope.payload.policyTrust.state).toBe("untrusted");
    expect(envelope.payload.policyTrust.trustPolicyId).toBe("tp-api-e11");
    expect(envelope.payload.policyTrust.reasonCodes).toEqual(["manifest_hash_not_approved"]);
    expect(envelope.payload.verifications).toEqual([]);
  });
});

async function getReport(hash: string): Promise<Response> {
  return GET(new Request(`http://aegis.test/api/v1/reports/${hash}`), {
    params: Promise.resolve({ hash }),
  });
}

describe("W5 S4 — F. GET reports/[hash] + the store", () => {
  test("F1: POST-then-GET returns the identical payload core with fresh delivery metadata", async () => {
    const posted = JSON.parse(await (await post(referenceBody())).text()) as {
      requestId: string;
      payload: unknown;
      reportHash: string;
    };

    const res = await getReport(posted.reportHash);
    expect(res.status).toBe(200);
    // Content-addressed delivery: strong etag IS the hash; and the per-isolate store must
    // never be laundered into a permalink by intermediary caches at M1.
    expect(res.headers.get("etag")).toBe(`"${posted.reportHash}"`);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const text = await res.text();
    const fetched = JSON.parse(text) as {
      requestId: string;
      generatedAt: string;
      payload: unknown;
      reportHash: string;
    };
    expect(text).toBe(jcsSerialize(fetched));
    expect(Object.keys(fetched).sort()).toEqual(["generatedAt", "payload", "reportHash", "requestId"]);
    expect(fetched.reportHash).toBe(posted.reportHash);
    expect(jcsSerialize(fetched.payload)).toBe(jcsSerialize(posted.payload));
    // Delivery metadata is REGENERATED per delivery (ENGINEERING_SPEC:879 reading).
    expect(fetched.requestId).not.toBe(posted.requestId);
  });

  test("F2: a well-formed unknown hash is 404 not-retained — never 'does not exist'", async () => {
    const unknown = `sha256:${"b".repeat(64)}`;
    const res = await getReport(unknown);
    expect(res.status).toBe(404);
    const text = await res.text();
    const body = JSON.parse(text) as { error: { code: string; detail?: string } };
    expect(body.error.code).toBe("report_not_found");
    // Claim-strength discipline: absence from a per-isolate, non-durable store proves
    // nothing about the report's existence — only about current retention.
    expect(body.error.detail).toContain("not currently retained");
    expect(text).not.toContain("does not exist");
  });

  test("F3: a malformed hash is a typed 400 before any lookup", async () => {
    for (const bad of ["nonsense", "sha256:SHOUTING", `sha256:${"c".repeat(63)}`, `sha1:${"c".repeat(64)}`]) {
      await expectError(await getReport(bad), 400, "invalid_report_hash", "/hash");
    }
  });

  test("F4: the store is content-addressed — re-POST converges on one self-consistent entry", async () => {
    const first = JSON.parse(await (await post(referenceBody())).text()) as { reportHash: string };
    const second = JSON.parse(await (await post(referenceBody())).text()) as { reportHash: string };
    expect(second.reportHash).toBe(first.reportHash);

    const fetched = JSON.parse(await (await getReport(first.reportHash)).text()) as {
      payload: unknown;
      reportHash: string;
    };
    // The retrieved payload re-derives its own address — the strict W1 hash, recomputed.
    expect(reportHash(fetched.payload)).toBe(first.reportHash);
  });
});

describe("W5 S4 — G. teeth", () => {
  test("G1: API surface sources carry no claim-language tokens (live/safe/healthy/verified)", () => {
    // Same tooth as the CLI's C18, extended to the S4 surface sources — the transport may
    // never editorialize, in code, strings, or comments alike.
    const claimToken = /\b(live|safe|healthy|verified)\b/i;
    for (const violation of ["status: live", "the deployment is safe", "Healthy!", "verified ok"]) {
      expect(claimToken.test(violation), `regex must flag: ${violation}`).toBe(true);
    }
    expect(claimToken.test("verify verifications unverifiable safely alive")).toBe(false);

    for (const rel of [
      "../lib/aegis/surfaces/api.ts",
      "../app/api/v1/verify/route.ts",
      "../app/api/v1/reports/[hash]/route.ts",
    ]) {
      const source = readFileSync(join(__dirname, rel), "utf-8");
      const match = claimToken.exec(source);
      expect(match, `${rel} contains claim token "${match?.[0] ?? ""}"`).toBeNull();
    }
  });

  test("G2: each route module exports exactly its intended methods", async () => {
    // vinext auto-405s unexported methods at dispatch, which in-process tests bypass —
    // this pins the module surface itself so a stray handler cannot appear unnoticed.
    const verifyRoute = await import("../app/api/v1/verify/route");
    expect(Object.keys(verifyRoute).sort()).toEqual(["POST"]);
    const reportsRoute = await import("../app/api/v1/reports/[hash]/route");
    expect(Object.keys(reportsRoute).sort()).toEqual(["GET"]);
  });
});

describe("W5 Codex round 1 — F3 at the HTTP edge", () => {
  test("E12: a malformed evaluationTime is a 400 with the exact pointer — never a canonical report", async () => {
    // The clock enters the payload AND (today) evidence timestamps — an unvalidated
    // string here becomes a "successful" canonical report. Strict ISO-UTC only.
    for (const bad of ["not-an-iso-time", "2026-07-24T00:00:00+02:00", "2026-02-30T00:00:00Z", ""]) {
      const res = await post(referenceBody({ evaluationTime: bad }));
      await expectError(res, 400, "invalid_evaluation_time", "/evaluationTime");
    }
  });
});
