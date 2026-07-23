// W4 Codex senior review — every confirmed finding reproduced as a failing test first
// (roadmap/reviews/W4-codex-review.md). Finding numbers reference that disposition table.
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  type IdentityReadAdapter,
  type RecordingBundle,
  loadRecordingBytes,
  recordedAdapter,
} from "../lib/aegis/chain/adapter";
import { PROVIDERS } from "../lib/aegis/chain/providers";
import type { QuorumPolicy } from "../lib/aegis/chain/quorum";
import type { PinnedBlock } from "../lib/aegis/chain/selection";
import { createAbiRegistry, selectAbi } from "../lib/aegis/identity/abi";
import { compareIdentityTarget } from "../lib/aegis/identity/compare";
import { observeIdentity } from "../lib/aegis/identity/observe";
import {
  EIP1967_BEACON_SLOT,
  EIP1967_IMPLEMENTATION_SLOT,
  ObservationUnavailable,
  type IdentityResult,
  deriveIdentity,
} from "../lib/aegis/identity/resolve";
import { jcsSerialize } from "../lib/aegis/report/canonical";

const shaOf = (v: unknown) =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;
const codeHash = (hex: string) =>
  `sha256:${createHash("sha256").update(Buffer.from(hex.slice(2), "hex")).digest("hex")}`;

const PIN: PinnedBlock = {
  chainId: 1,
  number: "25577369",
  hash: "0x26997307bf47a13c29abb3e325fbb195cb9182632268f89a5627499f10f7afc7",
  parentHash: `0x${"11".repeat(32)}`,
  timestamp: "2026-07-20T23:59:59Z",
  finality: "finalized",
};
const OTHER_HASH = `0x${"22".repeat(32)}`;

const DIRECT = `0x${"0d".repeat(20)}`;
const PROXY = `0x${"a1".repeat(20)}`;
const IMPL = `0x${"b2".repeat(20)}`;
const DIRECT_CODE = "0x6080604001";
const IMPL_CODE = "0x608060405f";
const IMPL_WORD = `0x${"00".repeat(12)}${IMPL.slice(2)}`;
const ZERO32 = `0x${"0".repeat(64)}`;

const QUORUM: QuorumPolicy = {
  policyId: "pq-reference",
  requiredProviders: ["alchemy", "quicknode"],
  minAgreeing: 2,
};

const FRESH_CURRENT = {
  aggregate: "current" as const,
  assessments: [
    {
      policyId: "fp-reference",
      boundary: { kind: "execution_block", block: PIN },
      state: "current" as const,
    },
  ],
};
const CONTEXT_MANIFEST_HASH = shaOf("w4-fixes-manifest");
const CONTEXT = {
  provenanceClass: "reference_scenario",
  manifestHash: CONTEXT_MANIFEST_HASH,
  manifestEvidence: {
    id: shaOf(["manifest-ev", CONTEXT_MANIFEST_HASH]),
    kind: "manifest" as const,
    provenanceClass: "reference_scenario",
    sourceMode: "recorded",
    boundary: {
      kind: "source_snapshot" as const,
      snapshot: { sourceId: "manifest", contentHash: CONTEXT_MANIFEST_HASH },
    },
    rawResultHash: CONTEXT_MANIFEST_HASH,
    capturedAt: "2026-07-22T00:00:00Z",
  },
  freshness: FRESH_CURRENT,
};

interface ReadSpec {
  method: string;
  params: unknown[];
  result: unknown;
}

// Recording canon after finding 1: reads are keyed by the pinned BLOCK HASH
// (EIP-1898 request form), so the envelope itself binds which block answered.
const atPin = (hash: string) => ({ blockHash: hash, requireCanonical: true });
const READS: ReadSpec[] = [
  { method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE },
  { method: "eth_getCode", params: [PROXY, atPin(PIN.hash)], result: "0x60806040aa" },
  { method: "eth_getStorageAt", params: [PROXY, EIP1967_IMPLEMENTATION_SLOT, atPin(PIN.hash)], result: IMPL_WORD },
  { method: "eth_getCode", params: [IMPL, atPin(PIN.hash)], result: IMPL_CODE },
];

function sealBundle(
  reads: ReadSpec[],
  providers: string[] = ["alchemy", "quicknode"],
): RecordingBundle {
  const bundle = {
    recordingId: "w4-fixes-test",
    capturedAt: "2026-07-20T23:59:59Z",
    responses: providers.flatMap((providerId) =>
      reads.map((r) => ({
        providerId,
        chainId: 1,
        method: r.method,
        params: r.params,
        result: r.result,
        rawResponseSha256: shaOf(r.result),
        envelopeSha256: "sha256:" + "0".repeat(64),
        capturedAt: "2026-07-20T23:59:59Z",
      })),
    ),
  } as unknown as RecordingBundle;
  for (const r of bundle.responses) {
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

const RESOLVED: IdentityResult = {
  strategy: "eip1967",
  status: "resolved",
  path: [
    { role: "proxy", address: PROXY },
    { role: "implementation", address: IMPL },
  ],
  terminalAddress: IMPL,
  runtimeCodeHash: codeHash(IMPL_CODE),
  reasonCodes: [],
};

describe("finding 1 — reads are bound to the pinned block hash", () => {
  test("a recording captured at a different block hash is missing evidence, never a value", async () => {
    // Same number, different hash: the post-reorg world. The recorded envelope binds
    // PIN.hash; observing at OTHER_HASH must find nothing.
    const r = await observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle(READS)),
      { ...PIN, hash: OTHER_HASH },
      QUORUM,
    );
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toEqual(["observation_unresolved"]);
    const observations = r.reads[0].observations;
    expect(observations.every((o) => o.status !== "ok")).toBe(true);
  });

  test("adapter read keys include the block hash (EIP-1898 request form)", async () => {
    const [alchemy] = adaptersFor(sealBundle(READS));
    const ok = await alchemy.getCode(1, DIRECT, { number: PIN.number, hash: PIN.hash });
    expect(ok.value).toBe(DIRECT_CODE);
    await expect(
      alchemy.getCode(1, DIRECT, { number: PIN.number, hash: OTHER_HASH }),
    ).rejects.toMatchObject({ code: "recording_missing" });
  });
});

describe("finding 2 — comparison binds strategy and requires observation evidence", () => {
  test("a declared strategy differing from the observed one is a typed defect", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "eip1967",
      expectedImplementation: DIRECT,
      expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
    };
    expect(() => compareIdentityTarget(target, observed, PIN, CONTEXT)).toThrow(/strategy_mismatch/);
  });

});

describe("provenance boundary — only pipeline-produced observations may be compared", () => {
  const target = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };

  test("a real observeIdentity result is accepted", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const { verifications } = compareIdentityTarget(target, observed, PIN, CONTEXT);
    expect(verifications[0].state).toBe("pass");
  });

  test("an otherwise-perfect hand-built observation carries no brand and is refused", async () => {
    const real = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    // Structurally identical, but reconstructed by the caller — no pipeline provenance.
    const cloned = { identity: real.identity, reads: real.reads.map((r) => ({ ...r })), pinned: PIN };
    expect(() => compareIdentityTarget(target, cloned, PIN, CONTEXT)).toThrow(/unverified_observation/);
  });

  test("the relabeled-clone independence forgery is refused at the boundary", async () => {
    // Codex pass-5 scenario: clone one authentic provider's observation, relabel it as a
    // second independent provider/domain, and present a two-provider 'agreement'. A
    // hand-built observation cannot carry the pipeline brand, so it never reaches the
    // independence logic at all.
    const real = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const read = real.reads[0];
    const alchemy = read.observations.find((o) => o.providerId === "alchemy")!;
    const relabeledClone = {
      ...alchemy,
      providerId: "quicknode",
      administrativeDomain: "QuickNode, Inc.",
    };
    const forged = {
      identity: real.identity,
      reads: [{
        ...read,
        observations: [alchemy, relabeledClone],
        quorum: {
          outcome: "agreement" as const,
          reasonCodes: [],
          agreeingProviders: ["alchemy", "quicknode"],
          missingProviders: [],
        },
      }],
      pinned: PIN,
    };
    expect(() => compareIdentityTarget(target, forged, PIN, CONTEXT)).toThrow(/unverified_observation/);
  });
});

describe("finding 3 — ABI selection requires the manifest hash match", () => {
  const registry = createAbiRegistry([
    { runtimeCodeHash: codeHash(IMPL_CODE), abiId: "impl@v2" },
  ]);

  test("registry membership without a manifest expectation match is refused", () => {
    // The registry knows the observed hash, but the manifest expects a different one:
    // decoding must NOT proceed on an unapproved upgrade.
    const s = selectAbi(registry, RESOLVED, `sha256:${"7".repeat(64)}`);
    expect(s.status).toBe("refused");
    if (s.status === "refused") expect(s.reasonCodes).toEqual(["manifest_mismatch"]);
  });

  test("no declared expectation means no possible match — refused", () => {
    const s = selectAbi(registry, RESOLVED, undefined);
    expect(s.status).toBe("refused");
    if (s.status === "refused") expect(s.reasonCodes).toEqual(["missing_expectation"]);
  });

  test("selection succeeds only when observed == expected == registered", () => {
    const s = selectAbi(registry, RESOLVED, codeHash(IMPL_CODE));
    expect(s).toEqual({ status: "selected", abiId: "impl@v2", runtimeCodeHash: codeHash(IMPL_CODE) });
  });
});

describe("finding 4 — malformed observed data is typed evidence failure, never resolution", () => {
  test("non-hex intermediate proxy code cannot resolve through a valid slot", () => {
    const r = deriveIdentity("eip1967", PROXY, {
      getCode: (a: string) => (a === PROXY ? "not-hex-at-all" : IMPL_CODE),
      getStorageWord: () => IMPL_WORD,
      getBeaconImplementation: () => null,
    });
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("malformed_code_hex");
  });

  test("malformed terminal code is a typed unknown with the path retained, not a throw", () => {
    const r = deriveIdentity("eip1967", PROXY, {
      getCode: (a: string) => (a === PROXY ? "0x60806040aa" : "0x123"),
      getStorageWord: () => IMPL_WORD,
      getBeaconImplementation: () => null,
    });
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("malformed_code_hex");
    expect(r.path.map((s) => s.address)).toEqual([PROXY, IMPL]);
  });

  test("a malformed storage word is a typed unknown, not a throw", () => {
    const r = deriveIdentity("eip1967", PROXY, {
      getCode: () => "0x60806040aa",
      getStorageWord: () => "0xnot-a-word",
      getBeaconImplementation: () => null,
    });
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("malformed_storage_word");
  });

  test("beacon implementation() with nonzero ABI padding is unresolved, never sliced", async () => {
    const BEACON_PROXY = `0x${"c3".repeat(20)}`;
    const BEACON = `0x${"d4".repeat(20)}`;
    const paddedWord = `0x${"ff".repeat(12)}${IMPL.slice(2)}`;
    const reads: ReadSpec[] = [
      { method: "eth_getCode", params: [BEACON_PROXY, atPin(PIN.hash)], result: "0x60806040ee" },
      { method: "eth_getStorageAt", params: [BEACON_PROXY, EIP1967_IMPLEMENTATION_SLOT, atPin(PIN.hash)], result: ZERO32 },
      { method: "eth_getStorageAt", params: [BEACON_PROXY, EIP1967_BEACON_SLOT, atPin(PIN.hash)], result: `0x${"00".repeat(12)}${BEACON.slice(2)}` },
      { method: "eth_getCode", params: [BEACON, atPin(PIN.hash)], result: "0x60806040bb" },
      { method: "eth_call", params: [{ data: "0x5c60da1b", to: BEACON }, atPin(PIN.hash)], result: paddedWord },
    ];
    const r = await observeIdentity("beacon", BEACON_PROXY, adaptersFor(sealBundle(reads)), PIN, QUORUM);
    expect(r.identity.status).toBe("unknown");
    expect(r.identity.reasonCodes).toContain("beacon_implementation_unresolved");
  });
});

describe("finding 5 — conflict is distinguished from missing evidence end to end", () => {
  test("provider divergence surfaces as observation_conflict and a conflict verification state", async () => {
    const diverged = (() => {
      const reads = READS.map((r) =>
        r.method === "eth_getCode" && (r.params as unknown[])[0] === DIRECT ? { ...r } : r,
      );
      const bundle = {
        recordingId: "w4-conflict-test",
        capturedAt: "2026-07-20T23:59:59Z",
        responses: ["alchemy", "quicknode"].flatMap((providerId) =>
          reads.map((r) => ({
            providerId,
            chainId: 1,
            method: r.method,
            params: r.params,
            result:
              providerId === "quicknode" && r.method === "eth_getCode" && (r.params as unknown[])[0] === DIRECT
                ? "0x6080604002"
                : r.result,
            rawResponseSha256: "sha256:" + "0".repeat(64),
            envelopeSha256: "sha256:" + "0".repeat(64),
            capturedAt: "2026-07-20T23:59:59Z",
          })),
        ),
      } as unknown as RecordingBundle;
      for (const r of bundle.responses) {
        r.rawResponseSha256 = shaOf(r.result);
        const envelope: Record<string, unknown> = { ...r };
        delete envelope.envelopeSha256;
        r.envelopeSha256 = shaOf(envelope);
      }
      return loadRecordingBytes(new TextEncoder().encode(JSON.stringify(bundle)));
    })();
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(diverged), PIN, QUORUM);
    expect(observed.identity.status).toBe("unknown");
    expect(observed.identity.reasonCodes).toEqual(["observation_conflict"]);
    // The path walked so far is retained even on the conflicted read.
    expect(observed.identity.path).toEqual([{ role: "direct", address: DIRECT }]);

    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "direct",
      expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
    };
    const { verifications } = compareIdentityTarget(target, observed, PIN, CONTEXT);
    expect(verifications[0].state).toBe("conflict");
  });
});

describe("finding 6 — ERC-1967 beacon applies only when the logic slot is empty", () => {
  test("a populated implementation slot makes the beacon strategy ambiguous, never resolved", () => {
    const BEACON = `0x${"d4".repeat(20)}`;
    const r = deriveIdentity("beacon", PROXY, {
      getCode: () => "0x60806040aa",
      getStorageWord: (_a: string, slot: string) =>
        slot === EIP1967_IMPLEMENTATION_SLOT ? IMPL_WORD : `0x${"00".repeat(12)}${BEACON.slice(2)}`,
      getBeaconImplementation: () => IMPL,
    });
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toContain("logic_slot_populated");
  });
});

describe("finding 7 — provenance honesty in composed verifications", () => {
  test("missing manifest evidence is a typed context defect", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "direct",
      expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
    };
    expect(() =>
      compareIdentityTarget(target, observed, PIN, { provenanceClass: "reference_scenario" } as never),
    ).toThrow(/invalid_context/);
  });

  test("the evaluated freshness travels verbatim; expected side names the bound manifest ref", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "direct",
      expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
    };
    const { verifications } = compareIdentityTarget(target, observed, PIN, CONTEXT);
    expect(verifications[0].freshness).toEqual(FRESH_CURRENT);
    expect(verifications[0].expectedEvidenceIds).toEqual([CONTEXT.manifestEvidence.id]);
  });
});

describe("finding 8 — evidence refs are audit-sufficient", () => {
  test("storage reads carry the slot; values, response capture time and source mode travel from the envelope", async () => {
    const observed = await observeIdentity("eip1967", PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const target = {
      targetId: "t",
      chainId: 1,
      address: PROXY,
      identityStrategy: "eip1967",
      expectedRuntimeCodeHash: codeHash(IMPL_CODE),
    };
    const { evidence } = compareIdentityTarget(target, observed, PIN, CONTEXT);
    const reads = evidence.filter(
      (e): e is Exclude<typeof e, { kind: "manifest" }> => e.kind !== "manifest",
    );
    const storage = reads.filter((e) => e.kind === "storage_read");
    expect(storage.length).toBeGreaterThan(0);
    for (const e of storage) expect(e.calldata).toBe(EIP1967_IMPLEMENTATION_SLOT);
    for (const e of reads) {
      expect(e.capturedAt).toBe("2026-07-20T23:59:59Z"); // the ENVELOPE's capture time
      expect(e.sourceMode).toBe("recorded"); // adapter-declared, not caller-labeled
      expect("decodedResult" in e && typeof e.decodedResult === "string").toBe(true); // the quorum-agreed value
    }
  });
});

describe("finding 9 — indirection paths survive unresolved reads and custom targets", () => {
  test("the pure derivation returns the walked path when a read is unavailable", () => {
    const r = deriveIdentity("eip1967", PROXY, {
      getCode: (a: string) => {
        if (a === PROXY) return "0x60806040aa";
        throw new ObservationUnavailable("observation_conflict");
      },
      getStorageWord: () => IMPL_WORD,
      getBeaconImplementation: () => null,
    });
    expect(r.status).toBe("unknown");
    expect(r.reasonCodes).toEqual(["observation_conflict"]);
    expect(r.path.map((s) => s.address)).toEqual([PROXY, IMPL]);
  });

  test("the custom strategy retains its declared root in the path", () => {
    const r = deriveIdentity("custom", PROXY, {
      getCode: () => null,
      getStorageWord: () => ZERO32,
      getBeaconImplementation: () => null,
    });
    expect(r.status).toBe("unknown");
    expect(r.path).toEqual([{ role: "root", address: PROXY }]);
  });
});

describe("verification-pass residuals (F1/F2/F7)", () => {
  const MANIFEST_HASH = shaOf("residuals-manifest");
  const MANIFEST_EVIDENCE = {
    id: shaOf(["manifest-ev", MANIFEST_HASH]),
    kind: "manifest" as const,
    provenanceClass: "reference_scenario",
    sourceMode: "recorded",
    boundary: { kind: "source_snapshot" as const, snapshot: { sourceId: "manifest", contentHash: MANIFEST_HASH } },
    rawResultHash: MANIFEST_HASH,
    capturedAt: "2026-07-22T00:00:00Z",
  };
  const CTX = {
    provenanceClass: "reference_scenario",
    manifestHash: MANIFEST_HASH,
    manifestEvidence: MANIFEST_EVIDENCE,
    freshness: FRESH_CURRENT,
    };
  const DIRECT_TARGET = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };

  test("R1: the read canon demands canonicality — a blockHash-only recording never matches", async () => {
    const legacyKeyed = READS.map((r) => ({
      ...r,
      params: r.params.map((p) =>
        typeof p === "object" && p !== null && "blockHash" in (p as object)
          ? { blockHash: (p as { blockHash: string }).blockHash }
          : p,
      ),
    }));
    // Strip requireCanonical from the recorded keys: the adapter must not find them.
    const [alchemy] = adaptersFor(sealBundle(legacyKeyed));
    await expect(
      alchemy.getCode(1, DIRECT, { number: PIN.number, hash: PIN.hash }),
    ).rejects.toMatchObject({ code: "recording_missing" });
  });

  test("R3: stale freshness caps a matching comparison at 'stale', never pass", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const { verifications } = compareIdentityTarget(DIRECT_TARGET, observed, PIN, {
      ...CTX,
      freshness: {
        aggregate: "stale",
        assessments: [
          {
            policyId: "fp-reference",
            boundary: { kind: "execution_block", block: PIN },
            state: "stale",
          },
        ],
      },
    });
    expect(verifications[0].state).toBe("stale");
    expect(verifications[0].limitations.map((l) => l.code)).toContain("freshness_stale");
  });

  test("R3: unassessed freshness caps a matching comparison at 'unknown', never pass", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const { verifications } = compareIdentityTarget(DIRECT_TARGET, observed, PIN, {
      ...CTX,
      freshness: { aggregate: "unknown", assessments: [] },
    });
    expect(verifications[0].state).toBe("unknown");
    expect(verifications[0].limitations.map((l) => l.code)).toContain("freshness_unassessed");
  });

  test("R4: manifest evidence must be a manifest-kind ref bound to the trusted hash", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const otherHash = shaOf("some-other-manifest");
    expect(() =>
      compareIdentityTarget(DIRECT_TARGET, observed, PIN, {
        ...CTX,
        manifestEvidence: { ...MANIFEST_EVIDENCE, rawResultHash: otherHash },
      }),
    ).toThrow(/invalid_context/);
    expect(() =>
      compareIdentityTarget(DIRECT_TARGET, observed, PIN, {
        ...CTX,
        manifestEvidence: { ...MANIFEST_EVIDENCE, kind: "rpc_call" as never },
      }),
    ).toThrow(/invalid_context/);
  });

  test("R4: the comparison emits the bound manifest ref itself as evidence", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const { verifications, evidence } = compareIdentityTarget(DIRECT_TARGET, observed, PIN, CTX);
    expect(evidence.some((e) => e.id === MANIFEST_EVIDENCE.id && e.kind === "manifest")).toBe(true);
    expect(verifications[0].expectedEvidenceIds).toEqual([MANIFEST_EVIDENCE.id]);
  });
});

describe("confirmation-pass closures (F2/F7a survivors)", () => {
  const HASH2 = shaOf("confirmation-manifest");
  const FRESH_OK = {
    aggregate: "current" as const,
    assessments: [
      {
        policyId: "fp-reference",
        boundary: { kind: "execution_block", block: PIN },
        state: "current" as const,
      },
    ],
  };
  const CTX2 = {
    provenanceClass: "reference_scenario",
    manifestHash: HASH2,
    manifestEvidence: {
      id: shaOf(["manifest-ev", HASH2]),
      kind: "manifest" as const,
      provenanceClass: "reference_scenario",
      sourceMode: "recorded",
      boundary: { kind: "source_snapshot" as const, snapshot: { sourceId: "manifest", contentHash: HASH2 } },
      rawResultHash: HASH2,
      capturedAt: "2026-07-22T00:00:00Z",
    },
    freshness: FRESH_OK,
    };
  const DIRECT_TARGET2 = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };

  test("F7a: a claimed 'current' aggregate over a stale assessment is rejected", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(() =>
      compareIdentityTarget(DIRECT_TARGET2, observed, PIN, {
        ...CTX2,
        freshness: {
          aggregate: "current",
          assessments: [
            {
              policyId: "fp-reference",
              boundary: { kind: "execution_block", block: PIN },
              state: "stale",
            },
          ],
        },
      }),
    ).toThrow(/invalid_context/);
  });

  test("F7a: a claimed 'current' aggregate with NO assessments is rejected — empty can only be unknown", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    expect(() =>
      compareIdentityTarget(DIRECT_TARGET2, observed, PIN, {
        ...CTX2,
        freshness: { aggregate: "current", assessments: [] },
      }),
    ).toThrow(/invalid_context/);
  });

  test("F7a: a coherent current assessment still allows pass", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const { verifications } = compareIdentityTarget(DIRECT_TARGET2, observed, PIN, CTX2);
    expect(verifications[0].state).toBe("pass");
  });
});

describe("convergence pass 4 closures (quorum recompute, prototype states, spec precedence)", () => {
  const HASH4 = shaOf("pass4-manifest");
  const FRESH4 = {
    aggregate: "current" as const,
    assessments: [
      {
        policyId: "fp-reference",
        boundary: { kind: "execution_block", block: PIN },
        state: "current" as const,
      },
    ],
  };
  const CTX4 = {
    provenanceClass: "reference_scenario",
    manifestHash: HASH4,
    manifestEvidence: {
      id: shaOf(["manifest-ev", HASH4]),
      kind: "manifest" as const,
      provenanceClass: "reference_scenario",
      sourceMode: "recorded",
      boundary: { kind: "source_snapshot" as const, snapshot: { sourceId: "manifest", contentHash: HASH4 } },
      rawResultHash: HASH4,
      capturedAt: "2026-07-22T00:00:00Z",
    },
    freshness: FRESH4,
  };
  const T4 = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };

  test("F7a: prototype-chain property names are not freshness states", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    for (const state of ["toString", "__proto__", "constructor"]) {
      expect(() =>
        compareIdentityTarget(T4, observed, PIN, {
          ...CTX4,
          freshness: {
            aggregate: "current",
            assessments: [{
              policyId: "fp-reference",
              boundary: { kind: "execution_block", block: PIN },
              state: state as never,
            }],
          },
        }),
      ).toThrow(/invalid_context/);
    }
  });

  test("spec precedence: unknown outranks stale in the derived aggregate", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const mixed = [
      { policyId: "fp-a", boundary: { kind: "execution_block", block: PIN }, state: "stale" as const },
      { policyId: "fp-b", boundary: { kind: "execution_block", block: PIN }, state: "unknown" as const },
    ];
    // ENGINEERING_SPEC: "unknown outranks stale" — the mixed derivation is unknown.
    expect(() =>
      compareIdentityTarget(T4, observed, PIN, {
        ...CTX4,
        freshness: { aggregate: "stale", assessments: mixed },
      }),
    ).toThrow(/invalid_context/);
    const { verifications } = compareIdentityTarget(T4, observed, PIN, {
      ...CTX4,
      freshness: { aggregate: "unknown", assessments: mixed },
    });
    expect(verifications[0].state).toBe("unknown");
  });
});

describe("convergence pass 6 — branded observations are immutable, hash-bound, and pin-bound", () => {
  const HASH6 = shaOf("pass6-manifest");
  const CTX6 = {
    provenanceClass: "reference_scenario",
    manifestHash: HASH6,
    manifestEvidence: {
      id: shaOf(["manifest-ev", HASH6]),
      kind: "manifest" as const,
      provenanceClass: "reference_scenario",
      sourceMode: "recorded",
      boundary: { kind: "source_snapshot" as const, snapshot: { sourceId: "manifest", contentHash: HASH6 } },
      rawResultHash: HASH6,
      capturedAt: "2026-07-22T00:00:00Z",
    },
    freshness: {
      aggregate: "current" as const,
      assessments: [{ policyId: "fp", boundary: { kind: "execution_block", block: PIN }, state: "current" as const }],
    },
  };
  const T6 = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };

  test("P0: a branded observation is deeply frozen — post-hoc mutation cannot manufacture a pass", async () => {
    // A genuine UNKNOWN observation (absent code). A caller then tries to mutate it into a
    // resolved match. Freezing makes the graph immutable, so the outcome stays unknown.
    const observed = await observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: "0x" }])),
      PIN,
      QUORUM,
    );
    expect(observed.identity.status).toBe("unknown");
    expect(Object.isFrozen(observed.identity)).toBe(true);
    expect(Object.isFrozen(observed.reads)).toBe(true);
    // The mutation must not take effect (frozen); comparison sees the original unknown.
    try {
      (observed.identity as { status: string }).status = "resolved";
      (observed.identity as { runtimeCodeHash: string | null }).runtimeCodeHash = codeHash(DIRECT_CODE);
      (observed.identity as { terminalAddress: string | null }).terminalAddress = DIRECT;
    } catch {
      /* strict-mode TypeError is acceptable — the point is the field cannot change */
    }
    expect(observed.identity.status).toBe("unknown");
    const { verifications } = compareIdentityTarget(T6, observed, PIN, CTX6);
    expect(verifications.every((v) => v.state !== "pass")).toBe(true);
  });

  test("P0: a read whose value does not hash to its rawResultHash is malformed, never agreed", async () => {
    // An adapter that returns a value inconsistent with its committed raw hash. The honest
    // provider alone cannot reach quorum, so identity is unknown (missing evidence).
    const honest = recordedAdapter(
      sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }]),
      PROVIDERS.alchemy,
    );
    const lying: IdentityReadAdapter = {
      providerId: "quicknode",
      administrativeDomain: "QuickNode, Inc.",
      getCode: async () => ({
        value: DIRECT_CODE,
        rawResultHash: shaOf("0xdifferent"), // hash of a DIFFERENT value
        capturedAt: "2026-07-20T23:59:59Z",
        sourceMode: "recorded",
      }),
      getStorageWord: async () => ({ value: ZERO32, rawResultHash: shaOf(ZERO32), capturedAt: "x", sourceMode: "recorded" }),
      call: async () => ({ value: "0x", rawResultHash: shaOf("0x"), capturedAt: "x", sourceMode: "recorded" }),
    };
    const observed = await observeIdentity("direct", DIRECT, [honest, lying], PIN, QUORUM);
    expect(observed.identity.status).toBe("unknown");
    const qn = observed.reads[0].observations.find((o) => o.providerId === "quicknode");
    expect(qn?.status).toBe("malformed");
  });

  test("P1: comparing a branded observation against a different pin is rejected", async () => {
    const observed = await observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
    const otherBlock = { ...PIN, hash: `0x${"22".repeat(32)}` };
    expect(() => compareIdentityTarget(T6, observed, otherBlock, CTX6)).toThrow(/pin_mismatch/);
  });

  test("P0/pass7: a freshness assessment for a DIFFERENT block cannot vouch for this observation", async () => {
    // Observe (and compare) at PIN, but supply a 'current' assessment for another block.
    // Stale/irrelevant evidence must not pass under a mislabeled boundary.
    const observed = await observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
    const otherBlock = { ...PIN, number: "24000000", hash: `0x${"33".repeat(32)}` };
    expect(() =>
      compareIdentityTarget(T6, observed, PIN, {
        ...CTX6,
        freshness: {
          aggregate: "current",
          assessments: [{ policyId: "fp", boundary: { kind: "execution_block", block: otherBlock }, state: "current" }],
        },
      }),
    ).toThrow(/invalid_context/);
  });

  test("evidence boundary is derived from the observation's own bound pin", async () => {
    const observed = await observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
    const { evidence } = compareIdentityTarget(T6, observed, PIN, CTX6);
    for (const e of evidence) {
      if (e.kind === "manifest") continue;
      expect(e.boundary).toEqual({ kind: "execution_block", block: PIN });
    }
  });
});

describe("convergence pass 8 — the context is snapshotted before validation; caller-owned behavior cannot split validation from emission", () => {
  const T8 = {
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  };
  const FOREIGN_BLOCK = { ...PIN, number: "24000000", hash: `0x${"44".repeat(32)}` };
  const observedAtPin = () =>
    observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
  const foreignAssessment = () => ({
    policyId: "fp",
    boundary: { kind: "execution_block", block: FOREIGN_BLOCK },
    state: "current" as const,
  });
  const boundAssessment = () => ({
    policyId: "fp",
    boundary: { kind: "execution_block", block: PIN },
    state: "current" as const,
  });

  test("HIGH: a non-enumerable own `every` on the assessments array cannot bypass the boundary binding", async () => {
    // The Codex pass-8 repro: the indexed element (what serialization emits) is a
    // current assessment for a FOREIGN block; a forged own `every` answers true for
    // the pin-binding check. Validation must read the same indexed data the report
    // would, so this is invalid_context — never a pass at the observed block.
    const observed = await observedAtPin();
    const assessments = [foreignAssessment()];
    Object.defineProperty(assessments, "every", { value: () => true, enumerable: false });
    expect(() =>
      compareIdentityTarget(T8, observed, PIN, {
        ...CONTEXT,
        freshness: { aggregate: "current", assessments },
      }),
    ).toThrow(/invalid_context/);
  });

  test("HIGH: a forged Symbol.iterator cannot feed the aggregate a different element set than the indexed data", async () => {
    // for..of channels are caller-controlled too: the iterator yields a bound-current
    // assessment while the indexed element is foreign. Both dispatch channels forged.
    const observed = await observedAtPin();
    const assessments = [foreignAssessment()];
    Object.defineProperty(assessments, Symbol.iterator, {
      value: function* () {
        yield boundAssessment();
      },
      enumerable: false,
    });
    Object.defineProperty(assessments, "every", { value: () => true, enumerable: false });
    expect(() =>
      compareIdentityTarget(T8, observed, PIN, {
        ...CONTEXT,
        freshness: { aggregate: "current", assessments },
      }),
    ).toThrow(/invalid_context/);
  });

  test("HIGH: a toJSON that would serialize a different boundary than validation saw is caught, not emitted", async () => {
    // The live object is bound-current (what naive validation reads); its toJSON emits
    // a foreign-block assessment (what any JSON serializer downstream would persist).
    const observed = await observedAtPin();
    const assessment = { ...boundAssessment(), toJSON: () => foreignAssessment() };
    expect(() =>
      compareIdentityTarget(T8, observed, PIN, {
        ...CONTEXT,
        freshness: { aggregate: "current", assessments: [assessment] },
      }),
    ).toThrow(/invalid_context/);
  });

  test("a getter-valued assessment field is refused — inputs must be inert data, and the getter never runs (pass-10 contract)", async () => {
    // Under the inert-input contract, a lying getter cannot even be read: descriptor
    // inspection rejects the accessor before its body executes, so there is no channel
    // to split validation from emission — the class is closed by refusal, not neutralizing.
    const observed = await observedAtPin();
    let reads = 0;
    const assessment = {
      policyId: "fp",
      boundary: { kind: "execution_block", block: PIN },
      get state(): "current" | "unknown" {
        reads += 1;
        return reads === 1 ? "current" : "unknown";
      },
    };
    expect(() =>
      compareIdentityTarget(T8, observed, PIN, {
        ...CONTEXT,
        freshness: { aggregate: "current", assessments: [assessment] },
      }),
    ).toThrow(/invalid_context/);
    expect(reads).toBe(0);
  });

  test("emitted evidence and freshness are detached plain copies — post-call mutation of the caller's context cannot rewrite them", async () => {
    const observed = await observedAtPin();
    const assessment: { policyId: string; boundary: unknown; state: "current" | "stale" } = {
      policyId: "fp",
      boundary: { kind: "execution_block", block: PIN },
      state: "current",
    };
    const ctx = {
      ...CONTEXT,
      manifestEvidence: { ...CONTEXT.manifestEvidence },
      freshness: { aggregate: "current" as const, assessments: [assessment] },
    };
    const { verifications, evidence } = compareIdentityTarget(T8, observed, PIN, ctx);
    const manifestRef = evidence.find((e) => e.kind === "manifest");
    expect(manifestRef).not.toBe(ctx.manifestEvidence);
    expect(verifications[0].freshness).not.toBe(ctx.freshness);
    ctx.manifestEvidence.rawResultHash = shaOf("post-hoc");
    assessment.state = "stale";
    expect(manifestRef?.rawResultHash).toBe(CONTEXT.manifestHash);
    expect(verifications[0].freshness.assessments[0].state).toBe("current");
  });
});

describe("convergence pass 9 — every caller input is snapshotted before any validation (cross-argument re-entrancy)", () => {
  const observedAtPin9 = () =>
    observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );

  test("HIGH: a context carrying a toJSON is refused before it can rewrite the target's expected hash", async () => {
    // The Codex pass-9 repro under the pass-10 contract: a context.toJSON that would
    // mutate the sibling `target` is rejected when the context is snapshotted, so it
    // never runs and the target is untouched — no cross-argument rewrite is possible.
    const observed = await observedAtPin9();
    const declaredWrong = shaOf("not-the-observed-code");
    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "direct",
      expectedRuntimeCodeHash: declaredWrong,
    };
    let toJsonRan = false;
    const context = {
      ...CONTEXT,
      toJSON() {
        toJsonRan = true;
        target.expectedRuntimeCodeHash = codeHash(DIRECT_CODE);
        return { ...CONTEXT };
      },
    };
    expect(() => compareIdentityTarget(target, observed, PIN, context)).toThrow(/invalid_context/);
    expect(toJsonRan).toBe(false);
    expect(target.expectedRuntimeCodeHash).toBe(declaredWrong);
  });

  test("HIGH: a context carrying a toJSON that would rewrite the validated strategy is refused, and does not run", async () => {
    const observed = await observedAtPin9();
    const target = {
      targetId: "t",
      chainId: 1,
      address: DIRECT,
      identityStrategy: "eip1967",
      expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
    };
    let toJsonRan = false;
    const context = {
      ...CONTEXT,
      toJSON() {
        toJsonRan = true;
        target.identityStrategy = "direct";
        return { ...CONTEXT };
      },
    };
    expect(() => compareIdentityTarget(target, observed, PIN, context)).toThrow(/invalid_context/);
    expect(toJsonRan).toBe(false);
    expect(target.identityStrategy).toBe("eip1967");
  });
});

describe("convergence pass 10 — inert-input contract: no caller code runs during comparison", () => {
  const observedAtPin10 = () =>
    observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
  const goodTarget = () => ({
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  });

  test("HIGH target→context: a target toJSON that would mutate the context is refused (invalid_target), context untouched", async () => {
    // The reverse direction of the pass-9 finding: target is snapshotted first, so its
    // toJSON is rejected before the context is examined — the sibling stays clean.
    const observed = await observedAtPin10();
    let ran = false;
    const context = { ...CONTEXT, freshness: { ...FRESH_CURRENT } };
    const target = {
      ...goodTarget(),
      toJSON() {
        ran = true;
        (context.freshness as { aggregate: string }).aggregate = "stale";
        return goodTarget();
      },
    };
    expect(() => compareIdentityTarget(target, observed, PIN, context)).toThrow(/invalid_target/);
    expect(ran).toBe(false);
    expect(context.freshness.aggregate).toBe("current");
  });

  test("HIGH: a pinned getter cannot fire to steer the comparison — pinned must be inert (invalid_pin)", async () => {
    const observed = await observedAtPin10();
    let ran = false;
    const pinned: Record<string, unknown> = { ...PIN };
    Object.defineProperty(pinned, "hash", {
      enumerable: true,
      configurable: true,
      get() {
        ran = true;
        return PIN.hash;
      },
    });
    expect(() =>
      compareIdentityTarget(goodTarget(), observed, pinned as unknown as typeof PIN, CONTEXT),
    ).toThrow(/invalid_pin/);
    expect(ran).toBe(false);
  });

  test("P1-C: a function-valued expected field is refused, never silently dropped into a suppressed comparison", async () => {
    const observed = await observedAtPin10();
    const target = {
      ...goodTarget(),
      expectedRuntimeCodeHash: (() => codeHash(DIRECT_CODE)) as unknown as string,
    };
    expect(() => compareIdentityTarget(target, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });

  test("P1-C: a non-finite chainId is refused, never coerced to null", async () => {
    const observed = await observedAtPin10();
    const target = { ...goodTarget(), chainId: Number.POSITIVE_INFINITY };
    expect(() => compareIdentityTarget(target, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });

  test("P2: an invalid target is reported before a non-inert context (target-before-context precedence)", async () => {
    const observed = await observedAtPin10();
    const badTarget = { ...goodTarget(), address: "0xnot-an-address" };
    const context = {
      ...CONTEXT,
      toJSON() {
        return { ...CONTEXT };
      },
    };
    expect(() => compareIdentityTarget(badTarget, observed, PIN, context)).toThrow(/invalid_target/);
  });

  test("an unset optional field (undefined) stays valid — only the runtime-hash verification is emitted", async () => {
    // undefined own properties are treated as absent, exactly as JSON serialization does,
    // so the inert-input contract does not reject a legitimately-unset optional.
    const observed = await observedAtPin10();
    const target = { ...goodTarget(), expectedImplementation: undefined };
    const { verifications } = compareIdentityTarget(target, observed, PIN, CONTEXT);
    expect(verifications).toHaveLength(1);
    expect(verifications[0].state).toBe("pass");
  });

  test("legitimate plain-data inputs are unaffected — a matching comparison still passes", async () => {
    const observed = await observedAtPin10();
    const { verifications } = compareIdentityTarget(goodTarget(), observed, PIN, CONTEXT);
    expect(verifications[0].state).toBe("pass");
  });
});

describe("convergence pass 11 — proxies refused, required runtime hash enforced, I-JSON strings, depth aligned", () => {
  const observedAtPin11 = () =>
    observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
  const goodTarget = () => ({
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  });

  test("HIGH: a proxy target is refused before any trap fires — reflection cannot re-enter and mutate a sibling", async () => {
    const observed = await observedAtPin11();
    let trapped = false;
    const context = { ...CONTEXT, freshness: { ...FRESH_CURRENT } };
    const target = new Proxy(goodTarget(), {
      ownKeys(t) {
        trapped = true;
        (context.freshness as { aggregate: string }).aggregate = "stale";
        return Reflect.ownKeys(t);
      },
      getOwnPropertyDescriptor(t, k) {
        trapped = true;
        return Reflect.getOwnPropertyDescriptor(t, k);
      },
      get(t, k, r) {
        trapped = true;
        return Reflect.get(t, k, r);
      },
      getPrototypeOf(t) {
        trapped = true;
        return Reflect.getPrototypeOf(t);
      },
    });
    expect(() => compareIdentityTarget(target as never, observed, PIN, context)).toThrow(/invalid_target/);
    // Rejected by a native isProxy check that dispatches no trap; the sibling is untouched.
    expect(trapped).toBe(false);
    expect(context.freshness.aggregate).toBe("current");
  });

  test("HIGH: a proxy context is refused (invalid_context)", async () => {
    const observed = await observedAtPin11();
    const context = new Proxy({ ...CONTEXT }, {});
    expect(() => compareIdentityTarget(goodTarget(), observed, PIN, context as never)).toThrow(/invalid_context/);
  });

  test("HIGH: a proxy pinned is refused (invalid_pin)", async () => {
    const observed = await observedAtPin11();
    const pinned = new Proxy({ ...PIN }, {});
    expect(() => compareIdentityTarget(goodTarget(), observed, pinned as never, CONTEXT)).toThrow(/invalid_pin/);
  });

  test("HIGH: a nested proxy held in a data property is refused (invalid_context)", async () => {
    const observed = await observedAtPin11();
    const context = {
      ...CONTEXT,
      freshness: { ...FRESH_CURRENT, assessments: [new Proxy(FRESH_CURRENT.assessments[0], {})] },
    };
    expect(() => compareIdentityTarget(goodTarget(), observed, PIN, context as never)).toThrow(/invalid_context/);
  });

  test("HIGH: a target that declares no expectedRuntimeCodeHash is refused — never a vacuous empty comparison", async () => {
    const observed = await observedAtPin11();
    const noHash = { targetId: "t", chainId: 1, address: DIRECT, identityStrategy: "direct" };
    expect(() => compareIdentityTarget(noHash as never, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });

  test("P2: manifest evidence missing its snapshot sourceId is refused (invalid_context)", async () => {
    const observed = await observedAtPin11();
    const context = {
      ...CONTEXT,
      manifestEvidence: {
        ...CONTEXT.manifestEvidence,
        boundary: { kind: "source_snapshot" as const, snapshot: { contentHash: CONTEXT.manifestHash } },
      },
    };
    expect(() => compareIdentityTarget(goodTarget(), observed, PIN, context as never)).toThrow(/invalid_context/);
  });

  test("P2: a lone-surrogate string is refused up front, not passed through to fail later canonicalization", async () => {
    const observed = await observedAtPin11();
    const target = { ...goodTarget(), targetId: "t\uD800" };
    expect(() => compareIdentityTarget(target, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });

  test("P2: nesting depth aligns with the manifest I-JSON contract — a 300-deep extension is accepted, 2000-deep refused", async () => {
    const observed = await observedAtPin11();
    const nest = (n: number) => {
      let v: unknown = {};
      for (let i = 0; i < n; i += 1) v = { deeper: v };
      return v;
    };
    const okTarget = { ...goodTarget(), extension: nest(300) } as never;
    const { verifications } = compareIdentityTarget(okTarget, observed, PIN, CONTEXT);
    expect(verifications[0].state).toBe("pass");
    const tooDeep = { ...goodTarget(), extension: nest(2000) } as never;
    expect(() => compareIdentityTarget(tooDeep, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });
});

describe("convergence pass 12 — RegExp.test coercion closed; required field on type; surrogate-key coverage", () => {
  const observedAtPin12 = () =>
    observeIdentity(
      "direct",
      DIRECT,
      adaptersFor(sealBundle([{ method: "eth_getCode", params: [DIRECT, atPin(PIN.hash)], result: DIRECT_CODE }])),
      PIN,
      QUORUM,
    );
  const goodTarget = () => ({
    targetId: "t",
    chainId: 1,
    address: DIRECT,
    identityStrategy: "direct",
    expectedRuntimeCodeHash: codeHash(DIRECT_CODE),
  });

  test("HIGH: a one-element array manifestEvidence.id is refused — RegExp.test coercion cannot forge a string field", async () => {
    // ["sha256:…"] stringifies to the hash and would pass a bare SHA256_STRICT.test; the
    // type guard refuses it, so an array-valued id can never reach the emitted linkage.
    const observed = await observedAtPin12();
    const context = {
      ...CONTEXT,
      manifestEvidence: { ...CONTEXT.manifestEvidence, id: [CONTEXT.manifestEvidence.id] },
    };
    expect(() => compareIdentityTarget(goodTarget(), observed, PIN, context as never)).toThrow(/invalid_context/);
  });

  test("HIGH: a one-element array expectedImplementation is refused (invalid_target), never emitted as a fail", async () => {
    const observed = await observedAtPin12();
    const target = { ...goodTarget(), expectedImplementation: [IMPL] };
    expect(() => compareIdentityTarget(target as never, observed, PIN, CONTEXT)).toThrow(/invalid_target/);
  });

  test("P2: a lone-surrogate object KEY is refused up front (invalid_context)", async () => {
    const observed = await observedAtPin12();
    const context = {
      ...CONTEXT,
      freshness: {
        ...FRESH_CURRENT,
        assessments: [{ ...FRESH_CURRENT.assessments[0], ["k\uD800"]: 1 }],
      },
    };
    expect(() => compareIdentityTarget(goodTarget(), observed, PIN, context as never)).toThrow(/invalid_context/);
  });
});

describe("review test-quality items", () => {
  test("T2: the exported slot constants equal the official ERC-1967 literals", () => {
    expect(EIP1967_IMPLEMENTATION_SLOT).toBe(
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    );
    expect(EIP1967_BEACON_SLOT).toBe(
      "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50",
    );
  });

  test("T4: same-length EIP-1167 prefix/suffix mutations are rejected, never decoded", () => {
    const target = `0x${"1a".repeat(20)}`;
    const canonical = `363d3d373d3d3d363d73${target.slice(2)}5af43d82803e903d91602b57fd5bf3`;
    const prefixMutated = `0x${"463d3d373d3d3d363d73"}${target.slice(2)}5af43d82803e903d91602b57fd5bf3`;
    const suffixMutated = `0x363d3d373d3d3d363d73${target.slice(2)}5af43d82803e903d91602b57fd5bf4`;
    for (const code of [prefixMutated, suffixMutated]) {
      expect(code.length).toBe(canonical.length + 2);
      const r = deriveIdentity("eip1167_clone", PROXY, {
        getCode: (a: string) => (a === PROXY ? code : "0x6001"),
        getStorageWord: () => ZERO32,
        getBeaconImplementation: () => null,
      });
      expect(r.status).toBe("unknown");
      expect(r.reasonCodes).toContain("not_eip1167_clone");
    }
  });
});
