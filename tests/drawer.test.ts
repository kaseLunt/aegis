// W5 slice S6 — the evidence drawer's server-side loader, driven in-process per the S6
// plan. Fourth transport over the one engine: shared exitCodeForPayload classification,
// shared renderJson canonical body (the S7 byte-identity artifact), plus a display-only
// DrawerModel projection (hashed-payload fields + the engine-licensed diagnostics records).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadEvidenceDrawer } from "../lib/aegis/surfaces/drawer";
import { runVerification, SurfaceError } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
import { RequestError } from "../lib/aegis/surfaces/request";
import { renderJson } from "../lib/aegis/surfaces/render";

const DATA = join(__dirname, "..", "data");
const MANIFEST_BYTES = new Uint8Array(readFileSync(join(DATA, "manifests", "reference-code-identity.json")));
const HEADS_BYTES = new Uint8Array(readFileSync(join(DATA, "recordings", "reference-eth-op-heads.json")));
const IDENTITY_BYTES = new Uint8Array(readFileSync(join(DATA, "recordings", "reference-identity-reads.json")));

const EVALUATION_TIME = "2026-07-24T00:00:00Z";

const REFERENCE_INPUTS = {
  manifestBytes: MANIFEST_BYTES,
  recordings: [
    { role: "heads", bytes: HEADS_BYTES },
    { role: "identity", bytes: IDENTITY_BYTES },
  ],
} as const;
const REFERENCE_SELECTOR = { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] } as const;

function referenceDrawer() {
  return loadEvidenceDrawer(
    REFERENCE_INPUTS,
    REFERENCE_SELECTOR,
    referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
  );
}

describe("W5 S6 — I. evidence drawer loader", () => {
  test("I1: the drawer entry shares the facade's hash, the shared classification, and the S7 canonical body", async () => {
    const drawer = await referenceDrawer();

    const run = await runVerification(
      REFERENCE_INPUTS,
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    );

    // The shipped fixtures are honestly uncertain by construction (W6's constraint).
    expect(drawer.classification).toBe(3);
    expect(drawer.reportHash).toBe(run.reportHash);
    // Byte-identity with the canonical envelope — the S7 artifact, shared not rebuilt.
    expect(drawer.canonicalBody).toBe(renderJson(run));
  });

  test("I2: the model is an ordered frame-before-results projection with verbatim canonical vocabulary", async () => {
    const drawer = await referenceDrawer();
    const model = drawer.model;

    // The frame precedes results in the model's own key order (PRODUCT_SPEC:213-220, :351 —
    // the detached-screenshot hazard). RELATIVE order, so later additive fields (evidence,
    // I4) cannot silently break the frame.
    const keys = Object.keys(model);
    for (const [before, after] of [
      ["header", "trust"],
      ["trust", "boundaries"],
      ["boundaries", "coverage"],
      ["coverage", "verifications"],
      ["verifications", "limitations"],
    ] as const) {
      expect(keys.indexOf(before), `${before} present`).toBeGreaterThanOrEqual(0);
      expect(keys.indexOf(before), `${before} before ${after}`).toBeLessThan(keys.indexOf(after));
    }

    // Recorded labeling is part of the frame (W5:85-86) — never presented as live.
    expect(model.header.sourceMode).toBe("recorded");
    expect(model.header.manifestHash).toMatch(/^sha256:[0-9a-f]{64}$/);

    // Self-approval stays visibly non-canonical (the H2 idiom).
    expect(model.trust.state).toBe("trusted");
    expect(model.trust.reasonCodes).toContain("approved_hash");

    expect(model.boundaries.length).toBeGreaterThan(0);

    // Verdict vocabulary VERBATIM — canonical state words only, no re-wording, no friendly
    // mapping (S6 plan RULING; render.ts:56-70). The shipped fixtures are honestly
    // uncertain by construction.
    const CANONICAL = ["pass", "fail", "unknown", "stale", "conflict"];
    expect(model.verifications.length).toBeGreaterThan(0);
    for (const v of model.verifications) {
      expect(CANONICAL).toContain(v.state);
    }
    expect(model.verifications.every((v) => v.state === "unknown")).toBe(true);

    // Limitations pass through WHOLE — never summarized (render.ts:119-126 precedent).
    const run = await runVerification(
      REFERENCE_INPUTS,
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    );
    const p = run.payload as {
      readonly limitations: readonly { readonly code: string; readonly text: string }[];
    };
    expect(model.limitations).toEqual(p.limitations);
    expect(model.limitations.map((l) => l.code)).toContain("recorded_inputs");

    // Untrusted manifest (the B10 scenario in-process): the degraded "unknown" reaches the
    // drawer VERBATIM — a refused document must not place chosen strings in a canonical
    // field, and the loader never "fixes" it (W5:725-727).
    const untrusted = await loadEvidenceDrawer(
      REFERENCE_INPUTS,
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, {
        evaluationTime: EVALUATION_TIME,
        trustPolicy: { trustPolicyId: "tp-drawer-i2", approvedHashes: [`sha256:${"a".repeat(64)}`] },
      }),
    );
    expect(untrusted.model.header.manifestVersion).toBe("unknown");
    expect(untrusted.model.trust.state).toBe("untrusted");
    expect(untrusted.model.verifications).toEqual([]);
    // Zero verifications must never read as clean (the B10 ruling) — same shared classifier.
    expect(untrusted.classification).toBe(3);
  });

  test("I3: the D21 contract — finality downgrades reach the reader as full records, hash untouched", async () => {
    const drawer = await referenceDrawer();

    // The chain-10 shipped recording pins via the confirmations fallback: its boundary
    // carries the full downgrade RECORD — requested, used, depth, reasonCode — never just
    // the downgraded finality word (W5 acceptance: downgrades reach the reader on every
    // surface; engine.ts licenses this diagnostics read for the drawer).
    const op = drawer.model.boundaries.find((b) => b.block?.chainId === 10);
    expect(op?.downgrades).toEqual([
      {
        chainId: 10,
        requested: "finalized",
        used: "confirmations",
        confirmationDepth: "12",
        reasonCode: "finality_tag_unsupported",
      },
    ]);
    // Chain 1 pinned at finalized directly — no spurious downgrade record.
    const eth = drawer.model.boundaries.find((b) => b.block?.chainId === 1);
    expect(eth?.downgrades).toEqual([]);

    // Display-only (the D21 pin, drawer half): the licensed diagnostics read never
    // perturbs the hashed payload or the canonical bytes.
    const run = await runVerification(
      REFERENCE_INPUTS,
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    );
    expect(drawer.reportHash).toBe(run.reportHash);
    expect(drawer.canonicalBody).toBe(renderJson(run));
  });

  test("I4: evidence refs project provenance intact — head capturedAt is bundle-scoped, never per-call", async () => {
    const drawer = await referenceDrawer();
    const model = drawer.model;

    // Evidence sits inside the frame contract: after verifications, before limitations.
    const keys = Object.keys(model);
    expect(keys.indexOf("verifications")).toBeLessThan(keys.indexOf("evidence"));
    expect(keys.indexOf("evidence")).toBeLessThan(keys.indexOf("limitations"));

    // Two providers × two chains of head observations (the S1 defect's fix made these
    // rows exist at all) — every row with its provenance fields verbatim.
    const heads = model.evidence.filter((e) => e.method === "eth_getBlockByNumber");
    expect(heads).toHaveLength(4);
    for (const e of heads) {
      expect(e.kind).toBe("rpc_call");
      expect(e.id).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(["alchemy", "quicknode"]).toContain(e.providerId);
      expect(e.rawResultHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(e.sourceMode).toBe("recorded");
      expect(e.provenanceClass).toBe("reference_scenario");
      // Head capturedAt is BUNDLE-level ([[INS-84853447]]): scoped as such, never implied
      // to be a per-call timestamp.
      expect(e.capturedAtScope).toBe("bundle");
    }
    // The bundle-scope claim, pinned mechanically: one bundle, one timestamp — all four
    // head rows carry the identical capturedAt string.
    expect(new Set(heads.map((e) => e.capturedAt)).size).toBe(1);

    // The manifest evidence row: captured at the injected evaluation time, no rpc scope.
    const manifest = model.evidence.find((e) => e.kind === "manifest");
    expect(manifest).toBeDefined();
    expect(manifest?.capturedAt).toBe(EVALUATION_TIME);
    expect(manifest?.capturedAtScope).toBeUndefined();
  });

  test("I5: a throw propagates as an operational failure — never a verdict, never a null-state model", async () => {
    // S6 plan §2 RULING: the loader does NOT catch. No step on this surface consumes exit
    // classes as data; the page's error surface is the honest display of an operational
    // failure (W5:83-84 — a throw is never rendered as a verdict).

    // RequestError (caller input): `at` passes through verbatim, the engine refuses it.
    const invalidRequest = await loadEvidenceDrawer(
      REFERENCE_INPUTS,
      { ...REFERENCE_SELECTOR, at: "latest" as "finalized" },
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect(invalidRequest).toBeInstanceOf(RequestError);
    expect(invalidRequest).toMatchObject({ code: "unsupported_at_selector", path: "/at" });

    // SurfaceError (operational): content-equal byte-different double heads — the B13
    // trap's 5-half, refused identically on every transport.
    const reencoded = new TextEncoder().encode(
      JSON.stringify(JSON.parse(new TextDecoder().decode(HEADS_BYTES))),
    );
    const ambiguous = await loadEvidenceDrawer(
      {
        manifestBytes: MANIFEST_BYTES,
        recordings: [
          { role: "heads", bytes: HEADS_BYTES },
          { role: "heads", bytes: reencoded },
          { role: "identity", bytes: IDENTITY_BYTES },
        ],
      },
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect(ambiguous).toBeInstanceOf(SurfaceError);
    expect(ambiguous).toMatchObject({ code: "ambiguous_head_provenance", path: "/recordings" });
  });

  test("I6 (spike): the component renders the model frame-before-results as escaped text", async () => {
    // UNVERIFIED-no-precedent in this repo: importing a .tsx module from a .test.ts under
    // this vitest config (S6 plan §0). Dynamic import keeps a structural failure contained
    // to this test; the documented fallback is lint-only coverage recorded in EV-W5.
    // The component is sync and props-fed, so react-dom/server can render it without a DOM.
    const [{ ReportDrawer }, { renderToStaticMarkup }, { createElement }] = await Promise.all([
      import("../components/report-drawer"),
      import("react-dom/server"),
      import("react"),
    ]);
    const drawer = await referenceDrawer();
    const markup = renderToStaticMarkup(
      createElement(ReportDrawer, { model: drawer.model, reportHash: drawer.reportHash }),
    );

    // Frame before results in the RENDERED output: manifest identity, trust, the chain-10
    // downgrade record, and coverage all precede the first verification statement.
    const firstVerification = markup.indexOf("deployment.code_identity/");
    expect(firstVerification).toBeGreaterThan(0);
    for (const frameText of [
      drawer.model.header.manifestHash,
      "mode: recorded",
      "finality_tag_unsupported",
      "coverage",
    ]) {
      const at = markup.indexOf(frameText);
      expect(at, `frame text "${frameText}" present`).toBeGreaterThanOrEqual(0);
      expect(at, `frame text "${frameText}" precedes results`).toBeLessThan(firstVerification);
    }
    // The full downgrade record renders — never just the downgraded finality word.
    expect(markup).toContain("requested finalized used confirmations depth 12");

    // Every top-level limitation reaches the reader whole.
    for (const l of drawer.model.limitations) {
      expect(markup).toContain(l.code);
    }
    // The result hash is in the drawer (PRODUCT_SPEC drawer contents).
    expect(markup).toContain(drawer.reportHash);

    // Untrusted payload strings render ESCAPED: markup-significant characters from a
    // hostile statement can never become live markup (THREAT_MODEL:125 escaping clause —
    // React text nodes only, a property the source lint pins by banning
    // dangerouslySetInnerHTML).
    const hostile = {
      ...drawer.model,
      verifications: [
        {
          state: "unknown",
          invariantId: "deployment.code_identity/hostile",
          statement: '<script>alert(1)</script><img src=x onerror="p()">',
          limitations: [],
        },
      ],
    };
    const hostileMarkup = renderToStaticMarkup(
      createElement(ReportDrawer, { model: hostile, reportHash: drawer.reportHash }),
    );
    // The hostile text survives as INERT text (its "onerror=" substring may appear — that
    // is correct escaping, not a leak); what may never appear is a live tag.
    expect(hostileMarkup).not.toContain("<script>");
    expect(hostileMarkup).not.toContain("<img");
    expect(hostileMarkup).toContain("&lt;script&gt;");
  });

  test("I7 (tooth): drawer surface sources and rendered markup carry no claim-language tokens", async () => {
    // The C18/H5 tooth extended to the fourth transport: loader, component, AND page
    // sources; then the rendered markup itself. dangerouslySetInnerHTML is banned at the
    // source level — the escaping property I6 proves depends on it.
    const claimToken = /\b(live|safe|healthy|verified)\b/i;
    for (const violation of ["status: live", "the deployment is safe", "Healthy!", "verified ok"]) {
      expect(claimToken.test(violation), `regex must flag: ${violation}`).toBe(true);
    }
    expect(claimToken.test("verify verifications unverifiable safely alive")).toBe(false);

    for (const rel of [
      "../lib/aegis/surfaces/drawer.ts",
      "../components/report-drawer.tsx",
      "../app/reports/page.tsx",
    ]) {
      const source = readFileSync(join(__dirname, rel), "utf-8");
      const match = claimToken.exec(source);
      expect(match, `${rel} contains claim token "${match?.[0] ?? ""}"`).toBeNull();
      expect(source, `${rel} must not use dangerouslySetInnerHTML`).not.toContain(
        "dangerouslySetInnerHTML",
      );
    }

    const [{ ReportDrawer }, { renderToStaticMarkup }, { createElement }] = await Promise.all([
      import("../components/report-drawer"),
      import("react-dom/server"),
      import("react"),
    ]);
    // The output scan isolates TRANSPORT-authored text. Canonical payload strings render
    // verbatim by contract — the recorded_inputs limitation text itself contains "live"
    // in negation ("not live production telemetry"), and re-wording it would be the real
    // violation. So the scan renders a model whose every payload-derived string is a
    // neutral token, with every optional branch populated: whatever remains in the markup
    // is exactly what the component itself says.
    const neutral = {
      header: { manifestVersion: "x", manifestHash: "x", sourceMode: "recorded" },
      trust: { state: "unknown", reasonCodes: ["x"], trustPolicyId: "x" },
      boundaries: [
        {
          kind: "execution_block",
          block: { chainId: 1, number: "1", finality: "finalized", hash: "0x0" },
          downgrades: [
            { chainId: 1, requested: "finalized", used: "confirmations", confirmationDepth: "12", reasonCode: "x" },
          ],
        },
      ],
      coverage: { supported: 0, unsupported: 0, excluded: 0 },
      verifications: [
        { state: "unknown", invariantId: "x", statement: "x", limitations: [{ code: "x", text: "x" }] },
      ],
      evidence: [
        {
          id: "x",
          kind: "rpc_call",
          provenanceClass: "reference_scenario",
          sourceMode: "recorded",
          providerId: "x",
          method: "x",
          rawResultHash: "x",
          capturedAt: "x",
          capturedAtScope: "bundle" as const,
        },
      ],
      limitations: [{ code: "x", text: "x" }],
    };
    const markup = renderToStaticMarkup(
      createElement(ReportDrawer, { model: neutral, reportHash: "sha256:x" }),
    );
    const outputMatch = claimToken.exec(markup);
    expect(outputMatch, `markup contains claim token "${outputMatch?.[0] ?? ""}"`).toBeNull();
  });
});
