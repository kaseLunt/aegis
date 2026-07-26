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

// The one target the shipped identity recording actually covers: eip1967 proxy 0xa1a1…,
// impl 0xb2b2…, impl runtime code 0x608060405f. Hash derived, never hand-typed
// (INS-035ae3e4) — proven `pass` in tests/identity-compare.test.ts.
const COVERED_PROXY_TARGET = {
  targetId: "reference-eip1967-proxy",
  chainId: 1,
  address: `0x${"a1".repeat(20)}`,
  identityStrategy: "eip1967",
  expectedImplementation: `0x${"b2".repeat(20)}`,
  expectedRuntimeCodeHash: `sha256:${createHash("sha256")
    .update(Buffer.from("608060405f", "hex"))
    .digest("hex")}`,
};

// Re-seal the shipped manifest with substitute targets: same schema, recomputed contentHash.
function sealedManifestBytes(targets: unknown[]): string {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Record<string, unknown>;
  manifest.targets = targets;
  manifest.contentHash = manifestContentHash(manifest);
  return jcsSerialize(manifest);
}

describe("W5 S3 — B. exit codes", () => {
  test("B5: a re-sealed manifest covering the shipped identity reads earns exit 0 — in-test only", async () => {
    // Exit 0 is deliberately unreachable from shipped fixture files (W6's constraint: no
    // shipped fixture may produce a pass). The only honest route to the clean-exit row is
    // synthesizing a manifest whose expectations match what the shipped identity recording
    // actually observed, then re-sealing its content hash.
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b5-"));
    try {
      const sealedPath = join(dir, "manifest.json");
      writeFileSync(sealedPath, sealedManifestBytes([COVERED_PROXY_TARGET]));
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

  test("B6: exit 2 (blocking fail) — one fail outranks a sibling pass, worst state wins", async () => {
    // COVERED_PROXY_TARGET with a deliberately wrong runtime-code-hash expectation: the
    // implementation slot still matches (pass) while the terminal hash comparison fails.
    // Exit 2 must win over the sibling pass — precedence, not just single-state mapping
    // (tests/identity-compare.test.ts:230-244 proves the engine side of this split).
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b6-"));
    try {
      const sealedPath = join(dir, "manifest.json");
      writeFileSync(
        sealedPath,
        sealedManifestBytes([
          { ...COVERED_PROXY_TARGET, expectedRuntimeCodeHash: `sha256:${"7".repeat(64)}` },
        ]),
      );
      const args = REFERENCE_ARGS.map((a) => (a === MANIFEST ? sealedPath : a));

      const result = await run([...args, "--json"]);

      const payload = JSON.parse(result.stdout).payload as {
        verifications: readonly { state: string; verificationId?: string }[];
      };
      const states = payload.verifications.map((v) => v.state).sort();
      expect(states).toContain("fail");
      expect(states).toContain("pass");
      expect(result.exit).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("B7: exit 3 (conflict) — providers disagreeing on one read is uncertainty, not failure", async () => {
    // Baseline: B5 proves the covered manifest + shipped recordings earn exit 0. The ONLY
    // delta here is one provider's account of the impl bytecode — quicknode reports one
    // byte differently than alchemy for the same pinned read. Disagreement between
    // administratively independent providers must surface as `conflict` (exit 3), never a
    // pass (no quorum) and never a fail (nobody proved the expectation violated).
    const recording = JSON.parse(readFileSync(IDENTITY, "utf-8")) as {
      responses: Array<Record<string, unknown> & { providerId: string; params: unknown[]; result: unknown }>;
    };
    const impl = `0x${"b2".repeat(20)}`;
    const target = recording.responses.find(
      (r) => r.providerId === "quicknode" && r.method === "eth_getCode" && r.params[0] === impl,
    );
    if (!target) throw new Error("fixture drift: quicknode impl eth_getCode read not found");
    target.result = "0x608060405e"; // one byte off alchemy's 0x608060405f
    // Reseal: BOTH per-response hashes recomputed (the tests/engine.test.ts:39-49 idiom) so
    // the loader's integrity checks pass and the divergence is genuinely observational.
    const shaOf = (v: unknown) =>
      `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;
    for (const r of recording.responses) {
      r.rawResponseSha256 = shaOf(r.result);
      const envelope: Record<string, unknown> = { ...r };
      delete envelope.envelopeSha256;
      r.envelopeSha256 = shaOf(envelope);
    }

    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b7-"));
    try {
      const manifestPath = join(dir, "manifest.json");
      writeFileSync(manifestPath, sealedManifestBytes([COVERED_PROXY_TARGET]));
      const identityPath = join(dir, "identity.json");
      writeFileSync(identityPath, JSON.stringify(recording));
      const args = REFERENCE_ARGS.map((a) =>
        a === MANIFEST ? manifestPath : a === IDENTITY ? identityPath : a,
      );

      const result = await run([...args, "--json"]);

      const payload = JSON.parse(result.stdout).payload as {
        policyTrust: { state: string };
        verifications: readonly { state: string }[];
      };
      expect(payload.policyTrust.state).toBe("trusted");
      const states = payload.verifications.map((v) => v.state);
      expect(states).toContain("conflict");
      expect(states).not.toContain("fail");
      expect(result.exit).toBe(3);
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
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b5b-"));
    try {
      const sealedPath = join(dir, "manifest.json");
      writeFileSync(
        sealedPath,
        sealedManifestBytes([
          COVERED_PROXY_TARGET,
          {
            targetId: "reference-direct",
            chainId: 10,
            address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            identityStrategy: "direct",
            expectedRuntimeCodeHash: `sha256:${"4".repeat(64)}`,
          },
        ]),
      );

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

  test("B8: exit 4 (invalid request, thrown) — RequestError maps to 4 with code-at-path on stderr", async () => {
    // Three representative recipes. (a) is CLI arg validation; (b) and (c) reach the engine
    // and exercise the RequestError -> 4 mapping plus the uniform `code at path` stderr
    // renderer. All ten RequestError codes are unit-tested at request level
    // (request.ts:72-128); the CLI's job here is only the mapping and the rendering.
    const missingChain = await run(
      REFERENCE_ARGS.filter((a, i, all) => a !== "--chain" && all[i - 1] !== "--chain"),
    );
    expect(missingChain.exit).toBe(4);
    expect(missingChain.stderr).toContain("missing required --chain");

    const duplicateChain = await run([...REFERENCE_ARGS, "--chain", "1"]);
    expect(duplicateChain.exit).toBe(4);
    expect(duplicateChain.stderr).toContain("duplicate_chain_id at /chainIds");

    const atLatest = await run(
      REFERENCE_ARGS.map((a, i, all) => (all[i - 1] === "--at" ? "latest" : a)),
    );
    expect(atLatest.exit).toBe(4);
    expect(atLatest.stderr).toContain("unsupported_at_selector at /at");
  });

  test("B11: exit 4 (corrupt recording bytes) — recording corruption is caller input, not engine failure", async () => {
    // Tamper one recorded response WITHOUT recomputing its hashes: the loader's integrity
    // check must refuse it. The RULING (S3 plan §3): a ChainError at CLI pre-validation is
    // an invalid-input 4, reserved-for-operational-failure 5 stays honest. The CLI
    // pre-validates by loading and DISCARDING the bundle — the engine still re-earns the
    // provenance brand from raw bytes itself (the CLI passes bytes, never bundles).
    const recording = JSON.parse(readFileSync(HEADS, "utf-8")) as {
      responses: Array<{ result: unknown }>;
    };
    recording.responses[0].result = "0xdeadbeef"; // hashes now stale -> integrity_mismatch
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b11-"));
    try {
      const headsPath = join(dir, "heads.json");
      writeFileSync(headsPath, JSON.stringify(recording));
      const args = REFERENCE_ARGS.map((a) => (a === HEADS ? headsPath : a));

      const result = await run(args);

      expect(result.stderr).toContain("integrity_mismatch");
      expect(result.exit).toBe(4);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("B10: exit 3 (untrusted manifest) — zero verifications must never read as clean", async () => {
    // A valid manifest under a trust policy that does not approve it: every declared
    // invariant goes unevaluated. That is INCOMPLETE, not invalid (no exit 4) and
    // emphatically not clean (no exit 0) — the ruling that kills the dishonest
    // "nothing failed because nothing ran" path. Exit 3, with the refusal visible in
    // policyTrust and an empty verifications array.
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b10-"));
    try {
      const policyPath = join(dir, "trust-policy.json");
      writeFileSync(
        policyPath,
        JSON.stringify({
          trustPolicyId: "tp-cli-b10",
          approvedHashes: [`sha256:${"a".repeat(64)}`],
        }),
      );
      const result = await run([...REFERENCE_ARGS, "--trust-policy", policyPath, "--json"]);

      const payload = JSON.parse(result.stdout).payload as {
        policyTrust: { state: string };
        verifications: readonly unknown[];
      };
      expect(payload.policyTrust.state).toBe("untrusted");
      expect(payload.verifications).toEqual([]);
      expect(result.exit).toBe(3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("B9: exit 4 (invalid manifest, NOT thrown) — the payload completes and carries the refusal", async () => {
    // An unparseable or tampered manifest is caller input the engine refuses WITHOUT
    // throwing: the run completes with policyTrust.state "invalid" and zero verifications,
    // and exit 4 derives from the payload state (trust.ts:310-334). Two byte-level recipes:
    // plain garbage, and the duplicate-key tamper that R-003's strict parser exists to catch
    // (a document must not be hashable under one meaning and readable under another).
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b9-"));
    try {
      const garbagePath = join(dir, "garbage.json");
      writeFileSync(garbagePath, "{ not json");
      const dupPath = join(dir, "dup-key.json");
      const manifestText = readFileSync(MANIFEST, "utf-8");
      // Duplicate the schemaVersion key at the top level: identical text parses either way,
      // so only a duplicate-key-rejecting parser refuses it.
      const tampered = manifestText.replace(
        '"schemaVersion": "1",',
        '"schemaVersion": "1", "schemaVersion": "1",',
      );
      if (tampered === manifestText) throw new Error("fixture drift: schemaVersion anchor missing");
      writeFileSync(dupPath, tampered);

      for (const manifestPath of [garbagePath, dupPath]) {
        const args = REFERENCE_ARGS.map((a) => (a === MANIFEST ? manifestPath : a));
        const result = await run([...args, "--json"]);

        const payload = JSON.parse(result.stdout).payload as {
          policyTrust: { state: string };
          verifications: readonly unknown[];
        };
        expect(payload.policyTrust.state).toBe("invalid");
        expect(payload.verifications).toEqual([]);
        expect(result.exit).toBe(4);
      }
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
