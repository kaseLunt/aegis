// W4 slice 2 — identity reads over the recorded-envelope adapter seam + quorum wiring.
// Key semantics under test:
//   - adapters expose getCode / getStorageWord / call AT a pinned block, each read
//     integrity-bound by the W3 envelope model and carrying a rawResultHash;
//   - observeIdentity fans every read the pure derivation needs across ALL providers and
//     accepts a value only on quorum agreement (administrative-domain independence);
//   - a non-agreed read is missing evidence: identity unknown (observation_unresolved),
//     NEVER a value — while quorum-agreed ABSENCE ("0x") is evidence and yields the
//     derivation-typed non-pass outcome (code_absent);
//   - observation input order never changes results; mutating observed bytes changes the
//     derived identity.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  type IdentityReadAdapter,
  type RecordingBundle,
  loadRecordingBytes,
  recordedAdapter,
} from "../lib/aegis/chain/adapter";
import { establishBoundary } from "../lib/aegis/chain/engine";
import { PROVIDERS, type ProviderConfig } from "../lib/aegis/chain/providers";
import type { QuorumPolicy } from "../lib/aegis/chain/quorum";
import type { PinnedBlock } from "../lib/aegis/chain/selection";
import { observeIdentity } from "../lib/aegis/identity/observe";
import {
  EIP1967_BEACON_SLOT,
  EIP1967_IMPLEMENTATION_SLOT,
} from "../lib/aegis/identity/resolve";
import { jcsSerialize } from "../lib/aegis/report/canonical";

const REC = join(__dirname, "..", "data", "recordings");

const shaOf = (v: unknown) =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;
const codeHash = (hex: string) =>
  `sha256:${createHash("sha256").update(Buffer.from(hex.slice(2), "hex")).digest("hex")}`;

// ---- reference scenario constants (addresses are lowercase, 20 bytes) ----
const PIN: PinnedBlock = {
  chainId: 1,
  number: "25577369",
  hash: "0x26997307bf47a13c29abb3e325fbb195cb9182632268f89a5627499f10f7afc7",
  parentHash: `0x${"11".repeat(32)}`,
  timestamp: "2026-07-20T23:59:59Z",
  finality: "finalized",
};

const PROXY = `0x${"a1".repeat(20)}`;
const IMPL = `0x${"b2".repeat(20)}`;
const BEACON_PROXY = `0x${"c3".repeat(20)}`;
const BEACON = `0x${"d4".repeat(20)}`;
const BEACON_IMPL = `0x${"e5".repeat(20)}`;
const CLONE = `0x${"f6".repeat(20)}`;
const CLONE_TARGET = `0x${"1a".repeat(20)}`;
const DIRECT = `0x${"0d".repeat(20)}`;

const PROXY_CODE = "0x60806040aa";
const IMPL_CODE = "0x608060405f";
const BEACON_CODE = "0x60806040bb";
const BEACON_IMPL_CODE = "0x60806040cc";
const DIRECT_CODE = "0x6080604001";
const CLONE_TARGET_CODE = "0x60806040dd";
const CLONE_CODE = `0x363d3d373d3d3d363d73${CLONE_TARGET.slice(2)}5af43d82803e903d91602b57fd5bf3`;

const IMPL_WORD = `0x${"00".repeat(12)}${IMPL.slice(2)}`;
const BEACON_WORD = `0x${"00".repeat(12)}${BEACON.slice(2)}`;
const BEACON_IMPL_WORD = `0x${"00".repeat(12)}${BEACON_IMPL.slice(2)}`;
const IMPLEMENTATION_SELECTOR = "0x5c60da1b";
const ZERO32 = `0x${"0".repeat(64)}`;
// Recording canon after the Codex W4 review: reads are keyed by the pinned block HASH
// (EIP-1898 request form), so the envelope binds which block answered.
const AT_PIN = { blockHash: PIN.hash };
const PIN_ARG = { number: PIN.number, hash: PIN.hash };

const QUORUM: QuorumPolicy = {
  policyId: "pq-reference",
  requiredProviders: ["alchemy", "quicknode"],
  minAgreeing: 2,
};

// ---- sealed in-memory recording bundles (both hashes recomputed, loader-verified) ----
interface ReadSpec {
  method: string;
  params: unknown[];
  result: unknown;
}

const READS: ReadSpec[] = [
  { method: "eth_getCode", params: [PROXY, AT_PIN], result: PROXY_CODE },
  { method: "eth_getStorageAt", params: [PROXY, EIP1967_IMPLEMENTATION_SLOT, AT_PIN], result: IMPL_WORD },
  { method: "eth_getCode", params: [IMPL, AT_PIN], result: IMPL_CODE },
  { method: "eth_getCode", params: [BEACON_PROXY, AT_PIN], result: BEACON_CODE.replace("bb", "ee") },
  // ERC-1967: the beacon applies only while the direct logic slot is empty.
  { method: "eth_getStorageAt", params: [BEACON_PROXY, EIP1967_IMPLEMENTATION_SLOT, AT_PIN], result: ZERO32 },
  { method: "eth_getStorageAt", params: [BEACON_PROXY, EIP1967_BEACON_SLOT, AT_PIN], result: BEACON_WORD },
  { method: "eth_getCode", params: [BEACON, AT_PIN], result: BEACON_CODE },
  { method: "eth_call", params: [{ data: IMPLEMENTATION_SELECTOR, to: BEACON }, AT_PIN], result: BEACON_IMPL_WORD },
  { method: "eth_getCode", params: [BEACON_IMPL, AT_PIN], result: BEACON_IMPL_CODE },
  { method: "eth_getCode", params: [CLONE, AT_PIN], result: CLONE_CODE },
  { method: "eth_getCode", params: [CLONE_TARGET, AT_PIN], result: CLONE_TARGET_CODE },
  { method: "eth_getCode", params: [DIRECT, AT_PIN], result: DIRECT_CODE },
];

function sealBundle(
  reads: ReadSpec[],
  providers: string[] = ["alchemy", "quicknode"],
  mutate?: (b: RecordingBundle) => void,
): RecordingBundle {
  const bundle = {
    recordingId: "identity-reads-test",
    capturedAt: "2026-07-20T23:59:59Z",
    responses: providers.flatMap((providerId) =>
      reads.map((r) => ({
        providerId,
        chainId: 1,
        method: r.method,
        params: r.params,
        result: r.result,
        rawResponseSha256: "sha256:" + "0".repeat(64),
        envelopeSha256: "sha256:" + "0".repeat(64),
        capturedAt: "2026-07-20T23:59:59Z",
      })),
    ),
  } as unknown as RecordingBundle;
  if (mutate) mutate(bundle);
  for (const r of bundle.responses) {
    r.rawResponseSha256 = shaOf(r.result);
    const envelope: Record<string, unknown> = { ...r };
    delete envelope.envelopeSha256;
    r.envelopeSha256 = shaOf(envelope);
  }
  return loadRecordingBytes(new TextEncoder().encode(JSON.stringify(bundle)));
}

const adaptersFor = (bundle: RecordingBundle): IdentityReadAdapter[] => [
  recordedAdapter(bundle, PROVIDERS.alchemy),
  recordedAdapter(bundle, PROVIDERS.quicknode),
];

describe("recorded adapter identity reads", () => {
  test("getCode at the pinned block returns the recorded code with its raw hash and provenance", async () => {
    const [alchemy] = adaptersFor(sealBundle(READS));
    const read = await alchemy.getCode(1, DIRECT, PIN_ARG);
    expect(read.value).toBe(DIRECT_CODE);
    expect(read.rawResultHash).toBe(shaOf(DIRECT_CODE));
    expect(read.sourceMode).toBe("recorded");
    expect(read.capturedAt).toBe("2026-07-20T23:59:59Z");
  });

  test("getStorageWord returns the recorded 32-byte word", async () => {
    const [alchemy] = adaptersFor(sealBundle(READS));
    const read = await alchemy.getStorageWord(1, PROXY, EIP1967_IMPLEMENTATION_SLOT, PIN_ARG);
    expect(read.value).toBe(IMPL_WORD);
  });

  test("call keys the recording by canonicalized request object", async () => {
    const [alchemy] = adaptersFor(sealBundle(READS));
    // Key order in the request object must not matter (JCS canonicalization).
    const read = await alchemy.call(1, { to: BEACON, data: IMPLEMENTATION_SELECTOR }, PIN_ARG);
    expect(read.value).toBe(BEACON_IMPL_WORD);
  });

  test("a missing recording is a typed failure, never an invented value", async () => {
    const [alchemy] = adaptersFor(sealBundle(READS));
    await expect(alchemy.getCode(1, `0x${"99".repeat(20)}`, PIN_ARG)).rejects.toMatchObject({
      code: "recording_missing",
    });
    await expect(alchemy.getCode(999, DIRECT, PIN_ARG)).rejects.toMatchObject({
      code: "unknown_chain",
    });
  });
});

describe("observeIdentity — quorum-wired identity derivation", () => {
  test("direct: both providers agree, identity resolves with one read of evidence", async () => {
    const r = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(r.identity.status).toBe("resolved");
    expect(r.identity.terminalAddress).toBe(DIRECT);
    expect(r.identity.runtimeCodeHash).toBe(codeHash(DIRECT_CODE));
    expect(r.identity.path).toEqual([{ role: "direct", address: DIRECT }]);
    expect(r.reads).toHaveLength(1);
    expect(r.reads[0].quorum.outcome).toBe("agreement");
    expect(r.reads[0].observations.map((o) => o.providerId)).toEqual(["alchemy", "quicknode"]);
  });

  test("eip1967: full proxy walk resolves with three quorum-agreed reads", async () => {
    const r = await observeIdentity("eip1967", PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(r.identity.status).toBe("resolved");
    expect(r.identity.path).toEqual([
      { role: "proxy", address: PROXY },
      { role: "implementation", address: IMPL },
    ]);
    expect(r.identity.runtimeCodeHash).toBe(codeHash(IMPL_CODE));
    expect(r.reads).toHaveLength(3);
    expect(r.reads.every((read) => read.quorum.outcome === "agreement")).toBe(true);
  });

  test("beacon: walk crosses the eth_call implementation() read", async () => {
    const r = await observeIdentity("beacon", BEACON_PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(r.identity.status).toBe("resolved");
    expect(r.identity.path).toEqual([
      { role: "proxy", address: BEACON_PROXY },
      { role: "beacon", address: BEACON },
      { role: "beacon_implementation", address: BEACON_IMPL },
    ]);
    expect(r.identity.runtimeCodeHash).toBe(codeHash(BEACON_IMPL_CODE));
  });

  test("eip1167_clone: target decoded from bytecode, target code hashed", async () => {
    const r = await observeIdentity("eip1167_clone", CLONE, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(r.identity.status).toBe("resolved");
    expect(r.identity.terminalAddress).toBe(CLONE_TARGET);
    expect(r.identity.runtimeCodeHash).toBe(codeHash(CLONE_TARGET_CODE));
    expect(r.reads).toHaveLength(2);
  });

  test("provider disagreement on code bytes: no value, identity unknown, conflict retained", async () => {
    const diverged = sealBundle(READS, ["alchemy", "quicknode"], (b) => {
      const qn = b.responses.find(
        (x) => x.providerId === "quicknode" && x.method === "eth_getCode" && (x.params as string[])[0] === DIRECT,
      )!;
      qn.result = "0x6080604002"; // one byte differs
    });
    const r = await observeIdentity("direct", DIRECT, adaptersFor(diverged), PIN, QUORUM);
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toEqual(["observation_conflict"]);
    expect(r.identity.runtimeCodeHash).toBeNull();
    expect(r.identity.path).toEqual([{ role: "direct", address: DIRECT }]);
    expect(r.reads).toHaveLength(1);
    expect(r.reads[0].quorum.outcome).toBe("conflict");
    expect(r.reads[0].quorum.reasonCodes).toContain("raw_result_mismatch");
  });

  test("a provider with no recording is missing evidence: unknown, never a single-provider value", async () => {
    const oneSided = sealBundle(READS, ["alchemy", "quicknode"], (b) => {
      b.responses = b.responses.filter(
        (x) => !(x.providerId === "quicknode" && x.method === "eth_getCode" && (x.params as string[])[0] === DIRECT),
      );
    });
    const r = await observeIdentity("direct", DIRECT, adaptersFor(oneSided), PIN, QUORUM);
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toEqual(["observation_unresolved"]);
    expect(r.reads[0].quorum.outcome).toBe("unknown");
    expect(r.reads[0].quorum.reasonCodes).toContain("insufficient_provider_responses");
    const qn = r.reads[0].observations.find((o) => o.providerId === "quicknode");
    expect(qn?.status).toBe("timeout");
  });

  test("administrative-domain overlap can never self-corroborate", async () => {
    const alias: ProviderConfig = {
      ...PROVIDERS.quicknode,
      providerId: "alias",
      administrativeDomain: PROVIDERS.alchemy.administrativeDomain,
    };
    const bundle = sealBundle(READS, ["alchemy", "alias"]);
    const adapters = [recordedAdapter(bundle, PROVIDERS.alchemy), recordedAdapter(bundle, alias)];
    const policy: QuorumPolicy = { ...QUORUM, requiredProviders: ["alchemy", "alias"] };
    const r = await observeIdentity("direct", DIRECT, adapters, PIN, policy);
    expect(r.identity.status).toBe("unknown");
    expect(r.reads[0].quorum.reasonCodes).toContain("administrative_domain_overlap");
  });

  test("quorum-agreed ABSENCE is evidence: '0x' yields the derivation-typed code_absent", async () => {
    const absent = sealBundle(
      [{ method: "eth_getCode", params: [DIRECT, AT_PIN], result: "0x" }],
    );
    const r = await observeIdentity("direct", DIRECT, adaptersFor(absent), PIN, QUORUM);
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toEqual(["code_absent"]);
    expect(r.identity.path).toEqual([{ role: "direct", address: DIRECT }]);
    expect(r.reads[0].quorum.outcome).toBe("agreement");
  });

  test("beacon implementation() revert ('0x') agreed by quorum: beacon_implementation_unresolved", async () => {
    const reverting = sealBundle(READS.map((r) =>
      r.method === "eth_call" ? { ...r, result: "0x" } : r,
    ));
    const r = await observeIdentity("beacon", BEACON_PROXY, adaptersFor(reverting), PIN, QUORUM);
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toEqual(["beacon_implementation_unresolved"]);
  });

  test("adapter order and recording order never change the result", async () => {
    const shuffled = sealBundle([...READS].reverse());
    const forward = await observeIdentity("eip1967", PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const reversed = await observeIdentity(
      "eip1967",
      PROXY,
      adaptersFor(shuffled).reverse(),
      PIN,
      QUORUM,
    );
    expect(reversed).toEqual(forward);
  });

  test("any observed-byte mutation changes the derived identity", async () => {
    const base = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const mutated = sealBundle(READS.map((r) =>
      r.method === "eth_getCode" && (r.params as string[])[0] === DIRECT
        ? { ...r, result: "0x6080604002" }
        : r,
    ));
    const changed = await observeIdentity("direct", DIRECT, adaptersFor(mutated), PIN, QUORUM);
    expect(changed.identity.status).toBe("resolved");
    expect(changed.identity.runtimeCodeHash).not.toBe(base.identity.runtimeCodeHash);
  });
});

describe("reference fixture end-to-end", () => {
  test("boundary pin from the heads fixture feeds identity reads from the identity fixture", async () => {
    const heads = loadRecordingBytes(readFileSync(join(REC, "reference-eth-op-heads.json")));
    const boundary = await establishBoundary(
      [recordedAdapter(heads, PROVIDERS.alchemy), recordedAdapter(heads, PROVIDERS.quicknode)],
      1,
      {
        quorum: QUORUM,
        confirmationDepth: "12",
        maxHeadLagBlocks: "1000",
      },
    );
    expect(boundary.status).toBe("pinned");
    if (boundary.status !== "pinned") return;

    const identity = loadRecordingBytes(readFileSync(join(REC, "reference-identity-reads.json")));
    const r = await observeIdentity(
      "eip1967",
      PROXY,
      [recordedAdapter(identity, PROVIDERS.alchemy), recordedAdapter(identity, PROVIDERS.quicknode)],
      boundary.boundary.block,
      QUORUM,
    );
    expect(r.identity.status).toBe("resolved");
    expect(r.identity.terminalAddress).toBe(IMPL);
    expect(r.identity.runtimeCodeHash).toBe(codeHash(IMPL_CODE));
    expect(r.reads.every((read) => read.quorum.outcome === "agreement")).toBe(true);
  });
});
