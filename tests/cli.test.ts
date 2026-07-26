// W5 slice S3 — the CLI surface, driven in-process per the S3 plan (§4: zero subprocess
// precedent repo-wide; `main` is imported, never spawned; the built artifact gets one manual
// smoke run recorded in EV-W5).
//
// Matrix tests A1-A3 + B4: harness + envelope + the shipped-fixture reality. Every later
// exit-code and render test builds on the `run` helper here.
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { main } from "../bin/aegis";
import { manifestContentHash } from "../lib/aegis/manifest/trust";
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

describe("W5 S3 — B. exit codes", () => {
  test("B5: a re-sealed manifest covering the shipped identity reads earns exit 0 — in-test only", async () => {
    // Exit 0 is deliberately unreachable from shipped fixture files (W6's constraint: no
    // shipped fixture may produce a pass). The only honest route to the clean-exit row is
    // synthesizing a manifest whose expectations match what the shipped identity recording
    // actually observed, then re-sealing its content hash.
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Record<string, unknown>;
    manifest.targets = [
      {
        targetId: "reference-eip1967-proxy",
        chainId: 1,
        address: `0x${"a1".repeat(20)}`,
        identityStrategy: "eip1967",
        expectedImplementation: `0x${"b2".repeat(20)}`,
        // Derived, never hand-typed (INS-035ae3e4): sha256 over bytes(0x608060405f), the
        // impl code the shipped recording observes — proven `pass` in
        // tests/identity-compare.test.ts.
        expectedRuntimeCodeHash: `sha256:${createHash("sha256")
          .update(Buffer.from("608060405f", "hex"))
          .digest("hex")}`,
      },
    ];
    manifest.contentHash = manifestContentHash(manifest);

    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b5-"));
    try {
      const sealedPath = join(dir, "manifest.json");
      writeFileSync(sealedPath, jcsSerialize(manifest));
      const args = REFERENCE_ARGS.map((a) => (a === MANIFEST ? sealedPath : a));

      const human = await run(args);
      expect(human.exit).toBe(0);
      // THREAT_MODEL:153 — the clean exit may claim exactly "no blocking failure ... within
      // declared coverage", never a general health verdict.
      expect(human.stdout).toContain("no blocking failure");
      expect(human.stdout).toContain("within declared coverage");

      const json = await run([...args, "--json"]);
      expect(json.exit).toBe(0);
      const payload = JSON.parse(json.stdout).payload as {
        policyTrust: { state: string };
        verifications: readonly { state: string }[];
      };
      expect(payload.policyTrust.state).toBe("trusted");
      expect(payload.verifications.length).toBeGreaterThan(0);
      for (const v of payload.verifications) {
        expect(v.state).toBe("pass");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("exit 3 (unevaluated target): a target_boundary_unavailable limitation forces uncertainty", async () => {
    // Mapping-table row: "any target_boundary_unavailable limitation -> 3". A run whose every
    // evaluated verification passes must STILL exit 3 when a declared target went
    // unevaluated — the covered proxy target passes, but the chain-10 target has no boundary
    // because the run requests --chain 1 only (engine.ts emits the limitation instead of
    // silently dropping the target).
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as {
      targets: unknown[];
      contentHash: string;
    };
    manifest.targets = [
      {
        targetId: "reference-eip1967-proxy",
        chainId: 1,
        address: `0x${"a1".repeat(20)}`,
        identityStrategy: "eip1967",
        expectedImplementation: `0x${"b2".repeat(20)}`,
        expectedRuntimeCodeHash: `sha256:${createHash("sha256")
          .update(Buffer.from("608060405f", "hex"))
          .digest("hex")}`,
      },
      {
        targetId: "reference-direct",
        chainId: 10,
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        identityStrategy: "direct",
        expectedRuntimeCodeHash: `sha256:${"4".repeat(64)}`,
      },
    ];
    manifest.contentHash = manifestContentHash(manifest);

    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b5b-"));
    try {
      const sealedPath = join(dir, "manifest.json");
      writeFileSync(sealedPath, jcsSerialize(manifest));

      const result = await run([
        "verify",
        "--manifest", sealedPath,
        "--heads", HEADS,
        "--identity", IDENTITY,
        "--chain", "1",
        "--at", "finalized",
        "--evaluation-time", "2026-07-24T00:00:00Z",
        "--profile", "reference",
        "--json",
      ]);

      const payload = JSON.parse(result.stdout).payload as {
        policyTrust: { state: string };
        verifications: readonly { state: string }[];
        limitations: readonly { code: string }[];
      };
      // Preconditions that isolate the clause under test: everything evaluated passed…
      expect(payload.policyTrust.state).toBe("trusted");
      expect(payload.verifications.length).toBeGreaterThan(0);
      for (const v of payload.verifications) {
        expect(v.state).toBe("pass");
      }
      // …and the unevaluated target surfaced as the canonical limitation (code/text fields,
      // canonical.ts limitationKey) — so ONLY the limitation row can force the exit code.
      expect(
        payload.limitations.some((l) => l.code === "target_boundary_unavailable"),
      ).toBe(true);
      expect(result.exit).toBe(3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
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
