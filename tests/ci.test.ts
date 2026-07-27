// W5 slice S5 — the CI adapter, driven in-process per the S5 plan. The adapter is the
// third transport over the one engine: shared exitCodeForPayload classification, shared
// renderJson canonical body (the S7 byte-identity artifact), plus a deterministic
// key=value summary projection for CI logs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { runCiVerification } from "../lib/aegis/surfaces/ci";
import { runVerification } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
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

function referenceCi() {
  return runCiVerification(
    REFERENCE_INPUTS,
    REFERENCE_SELECTOR,
    referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
  );
}

describe("W5 S5 — H. CI adapter", () => {
  test("H1: the CI entry shares the facade's hash, the shared classification, and the S7 canonical body", async () => {
    const ci = await referenceCi();

    const run = await runVerification(
      REFERENCE_INPUTS,
      REFERENCE_SELECTOR,
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    );

    // The shipped fixtures are honestly uncertain by construction (W6's constraint).
    expect(ci.exitCode).toBe(3);
    expect(ci.reportHash).toBe(run.reportHash);
    // Byte-identity with the CLI's canonical envelope — the S7 artifact, shared not rebuilt.
    expect(ci.canonicalBody).toBe(renderJson(run));
  });

  test("H2: the summary is a deterministic payload projection with individually named states", async () => {
    const first = await referenceCi();
    const second = await referenceCi();

    // Deterministic: no clock, no request ids — byte-identical across runs.
    expect(first.summaryLines).toEqual(second.summaryLines);

    const summary = first.summaryLines.join("\n");
    expect(first.summaryLines).toContain("exit=3");
    expect(first.summaryLines).toContain(`reportHash=${first.reportHash}`);
    // Trust line carries state AND reasonCodes — self-approval stays visibly non-canonical.
    expect(summary).toMatch(/^trust=trusted \(approved_hash\)/m);
    expect(summary).toMatch(/^boundaries=\d+$/m);
    // Per-state counts named INDIVIDUALLY — never collapsed into one aggregate word
    // (THREAT_MODEL:98). Every canonical state appears, zero or not.
    for (const state of ["pass", "fail", "unknown", "stale", "conflict"]) {
      expect(summary).toMatch(new RegExp(`^verifications\\.${state}=\\d+$`, "m"));
    }
    // The shipped fixtures are unknown by construction — the count must say so.
    expect(summary).toMatch(/^verifications\.unknown=[1-9]\d*$/m);
    expect(summary).toMatch(/^limitations=\d+$/m);
  });

  test("H3: thrown rows return the CLI's exit classes as data with the error visible", async () => {
    // RequestError (caller input): at passes through verbatim, the engine refuses it -> 4.
    const invalidRequest = await runCiVerification(
      REFERENCE_INPUTS,
      { ...REFERENCE_SELECTOR, at: "latest" as "finalized" },
      referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME }),
    );
    expect(invalidRequest.exitCode).toBe(4);
    expect(invalidRequest.reportHash).toBeNull();
    expect(invalidRequest.canonicalBody).toBeNull();
    expect(invalidRequest.summaryLines).toContain("exit=4");
    expect(invalidRequest.summaryLines).toContain("error=unsupported_at_selector at /at");

    // SurfaceError (operational): content-equal byte-different double heads — the B13
    // trap's 5-half, same on every transport.
    const reencoded = new TextEncoder().encode(
      JSON.stringify(JSON.parse(new TextDecoder().decode(HEADS_BYTES))),
    );
    const ambiguous = await runCiVerification(
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
    );
    expect(ambiguous.exitCode).toBe(5);
    expect(ambiguous.summaryLines).toContain("error=ambiguous_head_provenance at /recordings");
  });

  test("H4: CLI and CI transports agree byte-for-byte on the same inputs", async () => {
    // The same request through main(argv) (files) and runCiVerification (bytes): equal
    // exit codes and IDENTICAL canonical bytes — the S7 gate's CLI/CI pair, early.
    const { main } = await import("../bin/aegis");
    let stdout = "";
    const io = {
      stdout: { write: (s: string) => ((stdout += s), true) },
      stderr: { write: () => true },
    };
    const exit = await main(
      [
        "verify",
        "--manifest", join(DATA, "manifests", "reference-code-identity.json"),
        "--heads", join(DATA, "recordings", "reference-eth-op-heads.json"),
        "--identity", join(DATA, "recordings", "reference-identity-reads.json"),
        "--chain", "1",
        "--chain", "10",
        "--at", "finalized",
        "--evaluation-time", EVALUATION_TIME,
        "--profile", "reference",
        "--json",
      ],
      io,
    );

    const ci = await referenceCi();
    expect(ci.exitCode).toBe(exit);
    expect(`${ci.canonicalBody}\n`).toBe(stdout);
  });

  test("H5: the CI source and its summary output carry no claim-language tokens", async () => {
    // The C18/G1 tooth extended to the third transport — source AND emitted lines.
    const claimToken = /\b(live|safe|healthy|verified)\b/i;
    for (const violation of ["status: live", "the deployment is safe", "Healthy!", "verified ok"]) {
      expect(claimToken.test(violation), `regex must flag: ${violation}`).toBe(true);
    }
    expect(claimToken.test("verify verifications unverifiable safely alive")).toBe(false);

    const source = readFileSync(join(__dirname, "..", "lib", "aegis", "surfaces", "ci.ts"), "utf-8");
    const sourceMatch = claimToken.exec(source);
    expect(sourceMatch, `ci.ts contains claim token "${sourceMatch?.[0] ?? ""}"`).toBeNull();

    const ci = await referenceCi();
    const output = ci.summaryLines.join("\n");
    const outputMatch = claimToken.exec(output);
    expect(outputMatch, `summary contains claim token "${outputMatch?.[0] ?? ""}"`).toBeNull();
  });
});
