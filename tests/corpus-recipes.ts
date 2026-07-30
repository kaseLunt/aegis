// W6-S1 — the corpus authoring helper (W6 plan §2: authored-not-mysterious). Every
// on-disk scenario fixture is DERIVED from a committed spec by these deterministic
// recipes; the conformance tests re-derive and byte-compare, so a fixture can never
// drift from its disclosed recipe. This productizes the proven test idioms:
// sealedManifestBytes (tests/cli.test.ts B5), the two-hash bundle re-seal
// (tests/engine.test.ts sealedBundle), and the COVERED_PROXY_TARGET matched pair.
//
// NOT a test file (vitest collects tests/**/*.test.ts only) — a helper module.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { manifestContentHash } from "../lib/aegis/manifest/trust";
import { jcsSerialize } from "../lib/aegis/report/canonical";

export const DATA = join(__dirname, "..", "data");
export const REFERENCE_MANIFEST = join(DATA, "manifests", "reference-code-identity.json");
export const REFERENCE_HEADS = join(DATA, "recordings", "reference-eth-op-heads.json");
export const REFERENCE_IDENTITY = join(DATA, "recordings", "reference-identity-reads.json");

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

// The matched-pair target the shipped identity recording covers (the ONE address set with
// recorded reads): eip1967 proxy 0xa1a1…, impl 0xb2b2…, expected hash over the recorded
// implementation code BYTES "608060405f" — bytes, never a hex string (the W4 hazard).
export const COVERED_PROXY_TARGET = {
  targetId: "reference-eip1967-proxy",
  chainId: 1,
  address: `0x${"a1".repeat(20)}`,
  identityStrategy: "eip1967",
  expectedImplementation: `0x${"b2".repeat(20)}`,
  expectedRuntimeCodeHash: sha256(Buffer.from("608060405f", "hex")),
} as const;

export interface ScenarioSpec {
  readonly scenarioId: string;
  // Declared outcome row — what the corpus README table states and the parity test pins.
  readonly declaredVerdicts: readonly string[];
  readonly declaredExit: number;
  // Manifest derivation: targets swapped into the shipped reference manifest, resealed.
  readonly targets: readonly Record<string, unknown>[];
  // Evaluation clock for the documented command (strict ISO-UTC).
  readonly evaluationTime: string;
}

// Derive a scenario manifest's exact file bytes: parse the shipped reference manifest,
// swap targets and version, reseal contentHash over the normalized form, emit JCS + LF.
export function scenarioManifestBytes(spec: ScenarioSpec): Uint8Array {
  const manifest = JSON.parse(readFileSync(REFERENCE_MANIFEST, "utf-8")) as Record<
    string,
    unknown
  >;
  manifest.manifestVersion = `scenario-${spec.scenarioId}-v1`;
  manifest.targets = spec.targets;
  manifest.contentHash = manifestContentHash(manifest);
  return new TextEncoder().encode(`${jcsSerialize(manifest)}\n`);
}

// The committed scenario specs — the corpus's single source of truth (W6 plan §2).
export const SCENARIOS: readonly ScenarioSpec[] = [
  {
    scenarioId: "pass",
    // Both verification rows (implementation + runtime_code_hash) match the recorded
    // reads: the M1 success pair. Self-approved reference profile — visibly noncanonical
    // trust, disclosed in the outcome table.
    declaredVerdicts: ["pass", "pass"],
    declaredExit: 0,
    targets: [COVERED_PROXY_TARGET],
    evaluationTime: "2026-07-24T00:00:00Z",
  },
  {
    scenarioId: "mismatch",
    // The covered proxy with a deliberately wrong expectedRuntimeCodeHash: the impl-slot
    // row still passes, the terminal hash row fails — fail outranks the sibling pass
    // (the B6 shape). Two-provider agreeing evidence per ENGINEERING_SPEC:394-403, so the
    // fail is quorum-honest.
    declaredVerdicts: ["pass", "fail"],
    declaredExit: 2,
    targets: [{ ...COVERED_PROXY_TARGET, expectedRuntimeCodeHash: `sha256:${"7".repeat(64)}` }],
    evaluationTime: "2026-07-24T00:00:00Z",
  },
] as const;

export function scenarioManifestPath(spec: ScenarioSpec): string {
  return join(DATA, "manifests", `scenario-${spec.scenarioId}.json`);
}
