// W5 slice S7 — the cross-surface byte-identity gate (S7 plan). The M1 gate,
// mechanically (charter W5:91-94): one request driven through all four surface entry
// paths yields four reportHash values equal to each other and to the facade's direct
// output — and the canonical payload BYTES are identical everywhere, with delivery
// metadata excluded from identity (ENGINEERING_SPEC:846, :879).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { main } from "../bin/aegis";
import { POST } from "../app/api/v1/verify/route";
import { jcsSerialize } from "../lib/aegis/report/canonical";
import { runCiVerification } from "../lib/aegis/surfaces/ci";
import { loadEvidenceDrawer } from "../lib/aegis/surfaces/drawer";
import { runVerification } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
import { renderJson } from "../lib/aegis/surfaces/render";

const DATA = join(__dirname, "..", "data");
const MANIFEST = join(DATA, "manifests", "reference-code-identity.json");
const HEADS = join(DATA, "recordings", "reference-eth-op-heads.json");
const IDENTITY = join(DATA, "recordings", "reference-identity-reads.json");
const MANIFEST_BYTES = new Uint8Array(readFileSync(MANIFEST));
const HEADS_BYTES = new Uint8Array(readFileSync(HEADS));
const IDENTITY_BYTES = new Uint8Array(readFileSync(IDENTITY));

const EVALUATION_TIME = "2026-07-24T00:00:00Z";

const REFERENCE_INPUTS = {
  manifestBytes: MANIFEST_BYTES,
  recordings: [
    { role: "heads", bytes: HEADS_BYTES },
    { role: "identity", bytes: IDENTITY_BYTES },
  ],
} as const;
const REFERENCE_SELECTOR = { sourceMode: "recorded", at: "finalized", chainIds: [1, 10] } as const;

const CLI_ARGS = [
  "verify",
  "--manifest", MANIFEST,
  "--heads", HEADS,
  "--identity", IDENTITY,
  "--chain", "1",
  "--chain", "10",
  "--at", "finalized",
  "--evaluation-time", EVALUATION_TIME,
  "--profile", "reference",
];

function deployment() {
  return referenceDeployment(MANIFEST_BYTES, { evaluationTime: EVALUATION_TIME });
}

async function cli(argv: string[]): Promise<{ exit: number; stdout: string }> {
  let stdout = "";
  const io = {
    stdout: { write: (s: string) => ((stdout += s), true) },
    stderr: { write: () => true },
  };
  const exit = await main(argv, io);
  return { exit, stdout };
}

function b64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function apiEnvelope(): Promise<{ payload: unknown; reportHash: string }> {
  const res = await POST(
    new Request("http://aegis.test/api/v1/verify", {
      method: "POST",
      body: JSON.stringify({
        manifest: b64(MANIFEST_BYTES),
        recordings: [
          { role: "heads", bytes: b64(HEADS_BYTES) },
          { role: "identity", bytes: b64(IDENTITY_BYTES) },
        ],
        chainIds: [1, 10],
        at: "finalized",
        evaluationTime: EVALUATION_TIME,
        profile: "reference",
      }),
    }),
  );
  expect(res.status).toBe(200);
  return JSON.parse(await res.text()) as { payload: unknown; reportHash: string };
}

describe("W5 S7 — J. cross-surface byte identity", () => {
  test("J1: the gate — four entry paths, one hash, identical canonical bytes", async () => {
    const run = await runVerification(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment());
    const canonical = renderJson(run);

    const cliRun = await cli([...CLI_ARGS, "--json"]);
    const envelope = await apiEnvelope();
    const ci = await runCiVerification(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment());
    const drawer = await loadEvidenceDrawer(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment());

    // Four hashes, equal to each other and to the facade's (the M1 gate, W5:91-94).
    const cliEnvelope = JSON.parse(cliRun.stdout) as { reportHash: string };
    expect(cliEnvelope.reportHash).toBe(run.reportHash);
    expect(envelope.reportHash).toBe(run.reportHash);
    expect(ci.reportHash).toBe(run.reportHash);
    expect(drawer.reportHash).toBe(run.reportHash);

    // Identical canonical BYTES on every surface that exposes them. The API's delivery
    // metadata (requestId/generatedAt) lives outside identity: re-serializing exactly
    // {payload, reportHash} from its envelope must reproduce the canonical bytes.
    expect(cliRun.stdout).toBe(`${canonical}\n`);
    expect(ci.canonicalBody).toBe(canonical);
    expect(drawer.canonicalBody).toBe(canonical);
    expect(jcsSerialize({ payload: envelope.payload, reportHash: envelope.reportHash })).toBe(
      canonical,
    );

    // Same classification through the shared classifier (the honest shipped reality).
    expect(cliRun.exit).toBe(3);
    expect(ci.exitCode).toBe(3);
    expect(drawer.classification).toBe(3);
  });

  test("J2: the documented command re-derives the identical envelope from its own reproduce line", async () => {
    const human = await cli(CLI_ARGS);
    const line = human.stdout.split("\n").find((l) => l.startsWith("reproduce: "));
    expect(line).toBeDefined();

    // "reproduce: aegis verify --manifest ... " — tokenize and re-run through main().
    // The line alone re-derives the identical hash (PRODUCT_SPEC:303; W5:110-112) — the
    // documented single command, executed mechanically, not trusted from prose.
    const tokens = (line as string).slice("reproduce: ".length).trim().split(/\s+/);
    expect(tokens[0]).toBe("aegis");
    const argv = tokens.slice(1);

    const first = await cli([...CLI_ARGS, "--json"]);
    const rederived = await cli([...argv, "--json"]);
    expect(rederived.exit).toBe(first.exit);
    expect(rederived.stdout).toBe(first.stdout);
  });

  test("J3: a second full pass is byte-identical — the gate is deterministic under repetition", async () => {
    const first = {
      cli: (await cli([...CLI_ARGS, "--json"])).stdout,
      ci: (await runCiVerification(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment())).canonicalBody,
      drawer: (await loadEvidenceDrawer(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment()))
        .canonicalBody,
      api: await apiEnvelope(),
    };
    const second = {
      cli: (await cli([...CLI_ARGS, "--json"])).stdout,
      ci: (await runCiVerification(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment())).canonicalBody,
      drawer: (await loadEvidenceDrawer(REFERENCE_INPUTS, REFERENCE_SELECTOR, deployment()))
        .canonicalBody,
      api: await apiEnvelope(),
    };

    expect(second.cli).toBe(first.cli);
    expect(second.ci).toBe(first.ci);
    expect(second.drawer).toBe(first.drawer);
    // The API's payload bytes are stable; its delivery metadata may legitimately differ
    // (ENGINEERING_SPEC:879) — identity excludes it by construction.
    expect(jcsSerialize({ payload: second.api.payload, reportHash: second.api.reportHash })).toBe(
      jcsSerialize({ payload: first.api.payload, reportHash: first.api.reportHash }),
    );
  });
});
