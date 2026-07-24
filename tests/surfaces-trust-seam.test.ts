// W5 slice S0 — the manifest->target binding seam (R-b4e2e152 §3).
//
// Before this seam, policyTrustFromBytes loaded the manifest, matched its recomputed content
// hash against the deployment's approved set, and then DISCARDED the loaded manifest — so a
// caller could hand the identity comparator any target it liked and nothing bound that target
// to the manifest whose hash the report claimed. trustedManifestFromBytes returns both, so
// targets can only ever be read from the manifest whose recomputed hash IS block.manifestHash.
//
// The load-bearing invariant under test: `loaded` is non-null ONLY when state is "trusted".
// An unapproved or invalid manifest's targets are unreachable, not merely unused.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  manifestContentHash,
  policyTrustFromBytes,
  trustedManifestFromBytes,
} from "../lib/aegis/manifest/trust";

const manifestBytes = () =>
  readFileSync(join(__dirname, "..", "data", "manifests", "reference-code-identity.json"));

const contentHash = () => manifestContentHash(JSON.parse(new TextDecoder().decode(manifestBytes())));

const approving = () => ({ trustPolicyId: "tp-reference", approvedHashes: [contentHash()] });
const rejecting = () => ({ trustPolicyId: "tp-reference", approvedHashes: [`sha256:${"0".repeat(64)}`] });

describe("W5 S0 — trustedManifestFromBytes", () => {
  test("yields the same policyTrust block policyTrustFromBytes already yielded", () => {
    const bytes = manifestBytes();
    const policy = approving();

    expect(trustedManifestFromBytes(bytes, policy, []).block).toEqual(
      policyTrustFromBytes(bytes, policy, []),
    );
  });

  test("an approved manifest comes back bound to the hash the report will carry", () => {
    const { block, loaded } = trustedManifestFromBytes(manifestBytes(), approving(), []);

    expect(block.state).toBe("trusted");
    expect(loaded).not.toBeNull();
    expect(loaded?.contentHash).toBe(block.manifestHash);
  });

  test("an unapproved manifest yields no manifest — its targets are unreachable", () => {
    const { block, loaded } = trustedManifestFromBytes(manifestBytes(), rejecting(), []);

    expect(block.state).toBe("untrusted");
    expect(loaded).toBeNull();
  });

  test("an invalid manifest yields no manifest and is never evaluated for trust", () => {
    const { block, loaded } = trustedManifestFromBytes(
      new TextEncoder().encode("{ not json"),
      approving(),
      [],
    );

    expect(block.state).toBe("invalid");
    expect(loaded).toBeNull();
  });

  test("the bound manifest is frozen, so targets cannot be swapped after the hash binding", () => {
    const { loaded } = trustedManifestFromBytes(manifestBytes(), approving(), []);

    expect(Object.isFrozen(loaded?.manifest)).toBe(true);
    expect(Object.isFrozen((loaded?.manifest as { targets: unknown[] }).targets)).toBe(true);
  });
});
