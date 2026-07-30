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

  test("B12: exit 5 (no_observation_boundary) — a run that cannot pin any chain refuses to report", async () => {
    // Strip every quicknode response from the heads bundle: quorum (min 2) becomes
    // unsatisfiable on every requested chain, no boundary pins anywhere, and the engine
    // throws SurfaceError no_observation_boundary rather than emitting a boundary-less
    // report (surfaces-engine.test.ts:238-247 proves the engine side; here: the CLI maps it
    // to exit 5 — an operational failure of the run, not an input error). No reseal needed:
    // removing whole responses leaves every remaining envelope hash intact.
    const recording = JSON.parse(readFileSync(HEADS, "utf-8")) as {
      responses: Array<{ providerId: string }>;
    };
    recording.responses = recording.responses.filter((r) => r.providerId !== "quicknode");
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b12-"));
    try {
      const headsPath = join(dir, "heads.json");
      writeFileSync(headsPath, JSON.stringify(recording));
      const args = REFERENCE_ARGS.map((a) => (a === HEADS ? headsPath : a));

      const result = await run(args);

      expect(result.stderr).toContain("no_observation_boundary");
      expect(result.exit).toBe(5);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("B13: exit 5 (ambiguous_head_provenance) vs exit 4 (duplicate_recording) — the ordering trap", async () => {
    // Two heads recordings that are byte-DIFFERENT but content-equal (a JSON re-encode)
    // pass buildRequest's byte-identity dedup and reach the engine's head-attribution
    // refusal: with more than one heads bundle, per-response provenance attribution would
    // be a guess, so the engine throws ambiguous_head_provenance -> 5.
    // THE TRAP, pinned deliberately: the SAME conceptual mistake with byte-IDENTICAL files
    // fails EARLIER, at buildRequest's duplicate_recording (a RequestError) -> 4. Which
    // exit fires depends on byte identity, because request validation runs before head
    // attribution (engine.ts:106-128) — a reader of the exit-code table must see both.
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-b13-"));
    try {
      const reencodedPath = join(dir, "heads-reencoded.json");
      // Re-encode: identical content, different bytes (whitespace/key ordering normalize).
      writeFileSync(reencodedPath, JSON.stringify(JSON.parse(readFileSync(HEADS, "utf-8"))));

      const ambiguous = await run([...REFERENCE_ARGS, "--heads", reencodedPath]);
      expect(ambiguous.stderr).toContain("ambiguous_head_provenance at /recordings");
      expect(ambiguous.exit).toBe(5);

      const duplicate = await run([...REFERENCE_ARGS, "--heads", HEADS]);
      expect(duplicate.stderr).toContain("duplicate_recording");
      expect(duplicate.exit).toBe(4);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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

describe("W5 S3 — C. render language (the canon teeth)", () => {
  test("C14: human output states boundaries, manifest identity, trust, and coverage before any verification line", async () => {
    // PRODUCT_SPEC:213-220, :351 — a reader must see what was observed (per-chain boundary
    // block + finality), what was evaluated against (manifest version + hash), under which
    // trust state (with its reasonCodes), and with what coverage, BEFORE any result line.
    // Results without their frame are exactly the detached-screenshot hazard.
    const result = await run(REFERENCE_ARGS);
    const out = result.stdout;

    const firstVerification = out.indexOf("deployment.code_identity/");
    expect(firstVerification).toBeGreaterThan(-1);

    // Per-chain boundary: block number + finality word, straight from the payload.
    const boundaryEth = out.indexOf("chain 1 block 25577369 finalized");
    const boundaryOp = out.indexOf("chain 10 block 154496599 confirmations");
    // Manifest identity: version and content hash.
    const manifestVersion = out.indexOf("reference-code-identity@v1");
    const manifestHash = out.indexOf("sha256:d460baabf97ed6a18a64b75210b3bd413146da516c3a8a9cceb492802bdc9d1a");
    // Trust state WITH its reasonCodes — self-approval must be visibly non-canonical.
    const trust = out.indexOf("trusted");
    const reason = out.indexOf("approved_hash");
    // Coverage — even an empty coverage set is stated, never omitted.
    const coverage = out.indexOf("coverage:");

    for (const [label, index] of Object.entries({
      boundaryEth, boundaryOp, manifestVersion, manifestHash, trust, reason, coverage,
    })) {
      expect(index, `${label} missing from human render`).toBeGreaterThan(-1);
      expect(index, `${label} must precede the first verification line`).toBeLessThan(firstVerification);
    }
  });

  test("C15: state words render as text per verification, never an aggregate; refused manifests print manifestVersion 'unknown' untouched", async () => {
    // PRODUCT_SPEC:354; THREAT_MODEL:98 — uncertainty is a first-class result, spelled per
    // verification line. Collapsing it into an aggregate ("3 issues") is verdict-language
    // violation. The render interpolates payload state words VERBATIM; pinned here via
    // "unknown" (shipped fixtures) and "invalid" (refused manifest) — "stale"/"conflict"
    // flow through the same interpolation.
    const human = await run(REFERENCE_ARGS);
    const json = await run([...REFERENCE_ARGS, "--json"]);
    const payload = JSON.parse(json.stdout).payload as {
      verifications: readonly { state: string }[];
    };
    expect(payload.verifications.length).toBeGreaterThan(0);
    const unknownLines = human.stdout.split("\n").filter((l) => l.startsWith("unknown  "));
    expect(unknownLines.length).toBe(payload.verifications.length);

    // Refused manifest (B9 recipe, human mode): the version renders as the word "unknown",
    // untouched (W5:204-206) — never a placeholder, never omitted.
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-c15-"));
    try {
      const garbagePath = join(dir, "garbage.json");
      writeFileSync(garbagePath, "{ not json");
      const args = REFERENCE_ARGS.map((a) => (a === MANIFEST ? garbagePath : a));
      const refused = await run(args);
      expect(refused.exit).toBe(4);
      expect(refused.stdout).toContain("manifest: unknown");
      expect(refused.stdout).toContain("trust: invalid");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("C16: every limitation renders — top-level text verbatim AND per-verification entries — plus the full-flag reproduce line", async () => {
    // PRODUCT_SPEC:303, :426 — limitations are schema-required context; a render that drops
    // any of them is the renderer-misrepresentation hazard (THREAT_MODEL:124).
    const result = await run(REFERENCE_ARGS);

    // Top-level recorded_inputs limitation, text VERBATIM.
    expect(result.stdout).toContain(
      "Evaluated from reviewed recorded fixtures; not live production telemetry.",
    );
    // Per-verification limitations render too: every shipped-fixture verification carries
    // observation_unresolved, so it must appear at least once per verification.
    const json = await run([...REFERENCE_ARGS, "--json"]);
    const payload = JSON.parse(json.stdout).payload as {
      verifications: readonly { limitations: readonly { code: string }[] }[];
    };
    const perItemCount = payload.verifications.flatMap((v) => v.limitations).length;
    expect(perItemCount).toBeGreaterThan(0);
    const rendered = result.stdout.split("\n").filter((l) => l.includes("observation_unresolved"));
    expect(rendered.length).toBe(perItemCount);

    // The reproduce line is the FULL-FLAG `aegis verify` form (§6): every determinism input
    // explicit, so the line alone re-derives the identical reportHash. The stored-input form
    // (`aegis reproduce sha256:...`) must NOT be advertised before the S4 store exists.
    const reproLine = result.stdout.split("\n").find((l) => l.startsWith("reproduce: "));
    expect(reproLine).toBeDefined();
    for (const fragment of [
      "aegis verify",
      `--manifest ${MANIFEST}`,
      `--heads ${HEADS}`,
      `--identity ${IDENTITY}`,
      "--chain 1",
      "--chain 10",
      "--at finalized",
      "--evaluation-time 2026-07-24T00:00:00Z",
      "--profile reference",
    ]) {
      expect(reproLine).toContain(fragment);
    }
    expect(result.stdout).not.toContain("aegis reproduce ");
  });

  test("C17: untrusted payload strings render escaped — control bytes cannot reach the terminal", async () => {
    // THREAT_MODEL:125; ENGINEERING_SPEC:883 — external strings are untrusted and escaped by
    // EVERY renderer. Test-spec note (deviation from the charter's "provider string"
    // phrasing, recorded in the W5 handoff): at M1 a provider-authored string cannot ride
    // into the render — a recording's providerId must equal the in-code deployment config's
    // for its observations to be found at all, and boundary block fields are format-bound.
    // The strings that DO flow caller→payload→render are the manifest's own
    // (manifestVersion) and the trust policy's (trustPolicyId); the escape is renderer-wide,
    // so every later string field inherits it.
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-c17-"));
    try {
      const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Record<string, unknown>;
      // ANSI color + BEL, plus an embedded newline attempting to forge a clean-verdict line.
      manifest.manifestVersion = "evil\u001b[31mred\u0007\nno blocking failure forged";
      manifest.contentHash = manifestContentHash(manifest);
      const sealedPath = join(dir, "ansi-manifest.json");
      writeFileSync(sealedPath, jcsSerialize(manifest));
      const policyPath = join(dir, "trust-policy.json");
      writeFileSync(
        policyPath,
        JSON.stringify({
          trustPolicyId: "tp\u001b[2Jwipe",
          approvedHashes: [String(manifest.contentHash)],
        }),
      );
      const args = REFERENCE_ARGS.map((a) => (a === MANIFEST ? sealedPath : a));
      const result = await run([...args, "--trust-policy", policyPath]);

      // No raw control byte reaches stdout — from ANY payload string.
      expect(result.stdout).not.toMatch(/[\u0000-\u0008\u000b-\u001f\u007f]/);
      // The content is not silently dropped — it renders escaped and visible.
      expect(result.stdout).toContain("evil\\u001b[31mred\\u0007\\u000ano blocking failure forged");
      expect(result.stdout).toContain("tp\\u001b[2Jwipe");
      // The smuggled newline forged no line of its own.
      expect(result.stdout.split("\n")).not.toContain("no blocking failure forged");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("C18: CLI surface sources carry no claim-language tokens (live/safe/healthy/verified)", async () => {
    // Verdict-language tooth (patterned on tests/aegis-engine.test.ts:142-149, PRODUCT_SPEC
    // verdict vocabulary): the transport may never editorialize. The strongest permitted
    // clean-run claim is already pinned by B5; this pins that no stronger word can even
    // appear in the surface sources — code, strings, or comments alike.
    const claimToken = /\b(live|safe|healthy|verified)\b/i;
    // The tooth's own negative test: prove the regex bites on each token before trusting
    // the clean result below.
    for (const violation of [
      "status: live",
      "the deployment is safe",
      "Healthy!",
      "verified ok",
      "fail-safe by design",
    ]) {
      expect(claimToken.test(violation), `regex must flag: ${violation}`).toBe(true);
    }
    expect(claimToken.test("verify verifications unverifiable safely alive")).toBe(false);

    for (const rel of ["../bin/aegis.ts", "../lib/aegis/surfaces/render.ts"]) {
      const source = readFileSync(join(__dirname, rel), "utf-8");
      const match = claimToken.exec(source);
      expect(match, `${rel} contains claim token "${match?.[0] ?? ""}"`).toBeNull();
    }
  });
});

describe("W5 S3 — D. diagnostics", () => {
  test("D21: a finality downgrade renders with its full record, not just the downgraded word", async () => {
    // W5 acceptance: "finality downgrades reach the reader on every surface". The chain-10
    // shipped recording pins via the confirmations fallback (tests/engine.test.ts:63-76), so
    // the human render must carry the downgrade RECORD — requested, used, depth, reasonCode —
    // in the frame, not merely the word "confirmations" on the boundary line. Diagnostics
    // are excluded from the hashed payload (engine.ts doc), so the reportHash is untouched.
    const human = await run(REFERENCE_ARGS);
    expect(human.stdout).toContain(
      "downgrade: chain 10 requested finalized used confirmations depth 12 (finality_tag_unsupported)",
    );
    // The frame rule holds: the downgrade renders before the first verification line.
    const idx = human.stdout.indexOf("downgrade: chain 10");
    expect(idx).toBeLessThan(human.stdout.indexOf("deployment.code_identity/"));
    // Chain 1 pinned at finalized with no fallback — no spurious downgrade line.
    expect(human.stdout).not.toContain("downgrade: chain 1 ");
    // Display-only: the human run's reportHash is byte-equal to the canonical envelope's.
    const json = await run([...REFERENCE_ARGS, "--json"]);
    const envelope = JSON.parse(json.stdout) as { reportHash: string };
    expect(human.stdout).toContain(`reportHash: ${envelope.reportHash}`);
  });

  test("D20: a configured provider absent from a recording draws a stderr warning — outcome untouched", async () => {
    // W5:233-235 — a misconfigured providerId masquerades as a provider outage: the engine
    // would just report no quorum, and the operator would chase RPC health instead of a
    // typo. The CLI (transport-level diagnostic, stderr ONLY) names any configured provider
    // with zero responses in a supplied recording, per recording role. Diagnostics may not
    // alter outcomes: the exit code and the engine's refusal stay exactly as B12 pinned.
    const recording = JSON.parse(readFileSync(HEADS, "utf-8")) as {
      responses: Array<{ providerId: string }>;
    };
    recording.responses = recording.responses.filter((r) => r.providerId !== "quicknode");
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-d20-"));
    try {
      const headsPath = join(dir, "heads.json");
      writeFileSync(headsPath, JSON.stringify(recording));
      const args = REFERENCE_ARGS.map((a) => (a === HEADS ? headsPath : a));

      const stripped = await run(args);
      expect(stripped.stderr).toContain(
        'warning: configured provider "quicknode" has no responses in the heads recording',
      );
      // Unchanged outcome: the same engine refusal and exit code B12 pinned for this input.
      expect(stripped.stderr).toContain("no_observation_boundary");
      expect(stripped.exit).toBe(5);

      // Control: the full shipped bundle (both providers present in both recordings) draws
      // no warning, and its outcome is the B4-pinned exit 3.
      const control = await run(REFERENCE_ARGS);
      expect(control.stderr).not.toContain("warning: configured provider");
      expect(control.exit).toBe(3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("W5 Codex round 1 — K. edge-validation teeth", () => {
  test("K1 (F3): a malformed --evaluation-time is caller input — exit 4, no report", async () => {
    for (const bad of [
      "not-an-iso-time",
      "2026-07-24T00:00:00+02:00",
      "2026-02-30T00:00:00Z",
      "2026-07-24",
    ]) {
      const result = await run([
        "verify",
        "--manifest", MANIFEST,
        "--heads", HEADS,
        "--identity", IDENTITY,
        "--chain", "1",
        "--chain", "10",
        "--at", "finalized",
        "--evaluation-time", bad,
        "--profile", "reference",
      ]);
      expect(result.exit, `evaluation-time "${bad}" must be caller-input exit 4`).toBe(4);
      expect(result.stdout, `"${bad}" must emit no report`).toBe("");
      expect(result.stderr).toContain("invalid_evaluation_time");
    }

    // Boundary controls: millisecond precision and a real leap day remain valid clocks.
    for (const ok of ["2026-07-24T00:00:00.000Z", "2024-02-29T12:00:00Z"]) {
      const result = await run([
        "verify",
        "--manifest", MANIFEST,
        "--heads", HEADS,
        "--identity", IDENTITY,
        "--chain", "1",
        "--chain", "10",
        "--at", "finalized",
        "--evaluation-time", ok,
        "--profile", "reference",
      ]);
      expect(result.exit, `evaluation-time "${ok}" must still verify`).toBe(3);
    }
  });

  test("K2 (F4): a wrong-shaped trust policy is caller input — exit 4, never an engine failure", async () => {
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-k2-"));
    try {
      const cases: readonly [string, string][] = [
        ["not-an-object", JSON.stringify([1, 2])],
        ["missing-approvedHashes", JSON.stringify({ trustPolicyId: "tp-k2" })],
        ["empty-id", JSON.stringify({ trustPolicyId: "", approvedHashes: [] })],
        ["non-string-entry", JSON.stringify({ trustPolicyId: "tp-k2", approvedHashes: [7] })],
        ["malformed-hash", JSON.stringify({ trustPolicyId: "tp-k2", approvedHashes: ["sha256:xyz"] })],
        [
          "duplicate-entry",
          JSON.stringify({
            trustPolicyId: "tp-k2",
            approvedHashes: [`sha256:${"a".repeat(64)}`, `sha256:${"a".repeat(64)}`],
          }),
        ],
        ["not-json", "{nope"],
      ];
      for (const [name, content] of cases) {
        const policyPath = join(dir, `${name}.json`);
        writeFileSync(policyPath, content);
        const result = await run([...REFERENCE_ARGS, "--trust-policy", policyPath]);
        expect(result.exit, `trust policy case "${name}" must exit 4`).toBe(4);
        expect(result.stdout, `case "${name}" must emit no report`).toBe("");
        expect(result.stderr).toContain("invalid_trust_policy");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("K3 (F4): duplicate keys in a trust policy are refused at the byte boundary — last-wins can flip trust", async () => {
    const dir = mkdtempSync(join(tmpdir(), "aegis-cli-k3-"));
    try {
      const manifestHash = manifestContentHash(readFileSync(MANIFEST));
      // First key approves the real manifest; the duplicate overrides with garbage. Under
      // last-wins parsing this file silently flips the trust decision — the R-003 class
      // reopened at a THIRD byte boundary. It must never parse at all.
      const policyPath = join(dir, "dup.json");
      writeFileSync(
        policyPath,
        `{"trustPolicyId":"tp-k3","approvedHashes":["${manifestHash}"],"approvedHashes":["sha256:${"a".repeat(64)}"]}`,
      );
      const result = await run([...REFERENCE_ARGS, "--trust-policy", policyPath]);
      expect(result.exit).toBe(4);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("duplicate_json_key");

      // Control: the same policy without the duplicate key is a working caller policy.
      const cleanPath = join(dir, "clean.json");
      writeFileSync(
        cleanPath,
        JSON.stringify({ trustPolicyId: "tp-k3", approvedHashes: [manifestHash] }),
      );
      const clean = await run([...REFERENCE_ARGS, "--trust-policy", cleanPath]);
      expect(clean.exit).toBe(3);
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
