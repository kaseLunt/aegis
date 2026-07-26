// W5 slice S3 — the CLI surface, driven in-process per the S3 plan (§4: zero subprocess
// precedent repo-wide; `main` is imported, never spawned; the built artifact gets one manual
// smoke run recorded in EV-W5).
//
// Matrix tests A1-A3 + B4: harness + envelope + the shipped-fixture reality. Every later
// exit-code and render test builds on the `run` helper here.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { main } from "../bin/aegis";
import { jcsSerialize, reportHash } from "../lib/aegis/report/canonical";

const DATA = join(__dirname, "..", "data");
const MANIFEST = join(DATA, "manifests", "reference-code-identity.json");
const HEADS = join(DATA, "recordings", "reference-eth-op-heads.json");
const IDENTITY = join(DATA, "recordings", "reference-identity-reads.json");

interface Captured {
  exit: number;
  stdout: string;
  stderr: string;
}

async function run(argv: string[]): Promise<Captured> {
  let stdout = "";
  let stderr = "";
  const io = {
    stdout: { write: (s: string) => ((stdout += s), true) },
    stderr: { write: (s: string) => ((stderr += s), true) },
  };
  const exit = await main(argv, io);
  return { exit, stdout, stderr };
}

const REFERENCE_ARGS = [
  "verify",
  "--manifest", MANIFEST,
  "--heads", HEADS,
  "--identity", IDENTITY,
  "--chain", "1",
  "--chain", "10",
  "--at", "finalized",
  "--evaluation-time", "2026-07-24T00:00:00Z",
  "--profile", "reference",
];

describe("W5 S3 — A. harness + envelope", () => {
  test("A1: main returns an exit code instead of exiting the process", async () => {
    const result = await run(REFERENCE_ARGS);

    expect(typeof result.exit).toBe("number");
    expect(Number.isInteger(result.exit)).toBe(true);
  });

  test("A2: --json emits the canonical envelope with exactly payload + reportHash", async () => {
    const result = await run([...REFERENCE_ARGS, "--json"]);

    const envelope = JSON.parse(result.stdout);
    expect(Object.keys(envelope).sort()).toEqual(["payload", "reportHash"]);
    expect(envelope.reportHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    // The hash is the payload's own strict W1 hash — the envelope cannot disagree with itself.
    expect(reportHash(envelope.payload)).toBe(envelope.reportHash);
    // Canonical bytes: the stdout body IS jcsSerialize of the envelope (plus one trailing
    // newline), never JSON.stringify — S7's byte-identity gate depends on this exact property.
    expect(result.stdout).toBe(jcsSerialize(envelope) + "\n");
  });

  test("A3: identical argv produces byte-identical stdout and equal hashes", async () => {
    const first = await run([...REFERENCE_ARGS, "--json"]);
    const second = await run([...REFERENCE_ARGS, "--json"]);

    expect(second.stdout).toBe(first.stdout);
    expect(second.exit).toBe(first.exit);
  });
});

describe("W5 S3 — B4. the shipped-fixture reality", () => {
  test("B4: shipped fixtures verify to unknown across the board and exit 3 — honestly", async () => {
    const result = await run([...REFERENCE_ARGS, "--json"]);

    // The reference manifest's expected values do not match what the shipped identity
    // recording observes, BY DESIGN (W6's constraint: no shipped fixture may produce a pass).
    // The documented command therefore exits 3, and EV-W5 must record 3, never a tuned 0.
    expect(result.exit).toBe(3);
    const envelope = JSON.parse(result.stdout);
    const payload = envelope.payload as {
      verifications: readonly { state: string }[];
    };
    expect(payload.verifications.length).toBeGreaterThan(0);
    for (const v of payload.verifications) {
      expect(v.state).toBe("unknown");
    }
  });
});

// Read the fixture bytes once here so a future refactor of the helper cannot silently point
// the suite at different inputs than the documented command uses.
test("the fixture paths used by this suite are the shipped reference set", () => {
  for (const path of [MANIFEST, HEADS, IDENTITY]) {
    expect(readFileSync(path).length).toBeGreaterThan(0);
  }
});
