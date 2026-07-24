// W5 slice S0 — the canonical verification request: the identity of "what was asked".
// The request is derived FROM the actual input bytes, never supplied alongside them, so
// requestHash cannot disagree with what the engine verified.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { RequestError, buildRequest, requestHash } from "../lib/aegis/surfaces/request";

const DATA = join(__dirname, "..", "data");
const manifestBytes = () => readFileSync(join(DATA, "manifests", "reference-code-identity.json"));
const headsBytes = () => readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json"));
const identityBytes = () => readFileSync(join(DATA, "recordings", "reference-identity-reads.json"));

const SELECTOR = { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] } as const;
const inputs = () => ({
  manifestBytes: manifestBytes(),
  recordings: [{ role: "heads", bytes: headsBytes() }] as const,
});

describe("W5 S0 — canonical verification request", () => {
  test("requestHash is stable across a JSON round-trip of the request", () => {
    const request = buildRequest(inputs(), SELECTOR);

    expect(requestHash(request)).toBe(requestHash(JSON.parse(JSON.stringify(request))));
  });

  test("the order recordings are supplied in does not change requestHash", () => {
    const heads = { role: "heads", bytes: headsBytes() } as const;
    const identity = { role: "identity", bytes: identityBytes() } as const;

    const forward = buildRequest({ manifestBytes: manifestBytes(), recordings: [heads, identity] }, SELECTOR);
    const reverse = buildRequest({ manifestBytes: manifestBytes(), recordings: [identity, heads] }, SELECTOR);

    expect(requestHash(reverse)).toBe(requestHash(forward));
  });

  test("the order chainIds are supplied in does not change requestHash", () => {
    const ascending = buildRequest(inputs(), { ...SELECTOR, chainIds: [1, 10] });
    const descending = buildRequest(inputs(), { ...SELECTOR, chainIds: [10, 1] });

    expect(requestHash(descending)).toBe(requestHash(ascending));
  });

  test("requestHash is a strict sha256 identifier", () => {
    expect(requestHash(buildRequest(inputs(), SELECTOR))).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

// A request that cannot verify anything must not be constructible: every rejection below is
// a caller-contract violation arriving from an untyped edge (an HTTP body, a CLI argv), so
// each is a typed throw, never a silently narrowed request.
describe("W5 S0 — request rejections (fail closed)", () => {
  const rejects = (build: () => unknown, code: string) => {
    expect(build).toThrow(RequestError);
    try {
      build();
    } catch (e) {
      expect((e as RequestError).code).toBe(code);
    }
  };

  test("a request covering no chain is refused", () => {
    rejects(() => buildRequest(inputs(), { ...SELECTOR, chainIds: [] }), "empty_chain_ids");
  });

  test("a duplicated chainId is refused rather than deduped", () => {
    rejects(() => buildRequest(inputs(), { ...SELECTOR, chainIds: [1, 1] }), "duplicate_chain_id");
  });

  test("a non-integer chainId is refused", () => {
    rejects(() => buildRequest(inputs(), { ...SELECTOR, chainIds: [1.5] }), "invalid_chain_id");
  });

  test("an unsupported sourceMode is refused, never downgraded to recorded", () => {
    rejects(
      () => buildRequest(inputs(), { ...SELECTOR, sourceMode: "live" as "recorded" }),
      "unsupported_source_mode",
    );
  });

  test("an unsupported block selector is refused", () => {
    rejects(
      () => buildRequest(inputs(), { ...SELECTOR, at: "latest" as "finalized" }),
      "unsupported_at_selector",
    );
  });

  test("a run with no heads recording is refused — no boundary could be established", () => {
    rejects(
      () => buildRequest({ manifestBytes: manifestBytes(), recordings: [] }, SELECTOR),
      "missing_heads_recording",
    );
  });

  test("an unknown recording role is refused", () => {
    rejects(
      () =>
        buildRequest(
          { manifestBytes: manifestBytes(), recordings: [{ role: "logs" as "heads", bytes: headsBytes() }] },
          SELECTOR,
        ),
      "invalid_recording_role",
    );
  });

  test("the same bundle supplied twice in the same role is refused", () => {
    rejects(
      () =>
        buildRequest(
          {
            manifestBytes: manifestBytes(),
            recordings: [
              { role: "heads", bytes: headsBytes() },
              { role: "heads", bytes: headsBytes() },
            ],
          },
          SELECTOR,
        ),
      "duplicate_recording",
    );
  });

  test("empty manifest bytes are refused", () => {
    rejects(
      () => buildRequest({ manifestBytes: new Uint8Array(), recordings: [{ role: "heads", bytes: headsBytes() }] }, SELECTOR),
      "empty_manifest_bytes",
    );
  });
});
