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

  test("a resolved identity with no observation evidence is a typed defect, never compared", () => {
    const target = {
      targetId: "t",
      chainId: 1,
      address: PROXY,
      identityStrategy: "eip1967",
      expectedRuntimeCodeHash: codeHash(IMPL_CODE),
    };
    expect(() =>
      compareIdentityTarget(target, { identity: RESOLVED, reads: [] }, PIN, CONTEXT),
    ).toThrow(/missing_observation_evidence/);
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

  test("R2: a resolved transcript containing a non-agreed read is inconsistent", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const forged = {
      identity: observed.identity,
      reads: [
        ...observed.reads,
        {
          kind: "code" as const,
          address: DIRECT,
          agreedValue: null,
          quorum: { outcome: "conflict" as const, reasonCodes: ["raw_result_mismatch"], agreeingProviders: [], missingProviders: [] },
          observations: [],
        },
      ],
    };
    expect(() => compareIdentityTarget(DIRECT_TARGET, forged, PIN, CTX)).toThrow(/inconsistent_observation/);
  });

  test("R2: an unrelated agreed read (off the resolved path) is inconsistent", async () => {
    const direct = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const proxyReads = await observeIdentity("eip1967", PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const forged = { identity: direct.identity, reads: [...direct.reads, ...proxyReads.reads] };
    expect(() => compareIdentityTarget(DIRECT_TARGET, forged, PIN, CTX)).toThrow(/inconsistent_observation/);
  });

  test("R2: a claimed terminal hash that the transcript's terminal read cannot reproduce is inconsistent", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const forged = {
      identity: { ...observed.identity, runtimeCodeHash: `sha256:${"5".repeat(64)}` },
      reads: observed.reads,
    };
    const target = { ...DIRECT_TARGET, expectedRuntimeCodeHash: `sha256:${"5".repeat(64)}` };
    expect(() => compareIdentityTarget(target, forged, PIN, CTX)).toThrow(/inconsistent_observation/);
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

  test("F2: a forged agreed value is unmasked by the quorum-committed raw hashes", async () => {
    const observed = await observeIdentity("direct", DIRECT, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const FORGED_CODE = "0x6080604099";
    const forged = {
      identity: { ...observed.identity, runtimeCodeHash: codeHash(FORGED_CODE) },
      reads: observed.reads.map((r) => ({ ...r, agreedValue: FORGED_CODE })),
    };
    const target = { ...DIRECT_TARGET2, expectedRuntimeCodeHash: codeHash(FORGED_CODE) };
    // agreedValue and the claimed hash are internally consistent — but the providers'
    // raw hashes committed to DIFFERENT code. The forgery must not pass.
    expect(() => compareIdentityTarget(target, forged, PIN, CTX2)).toThrow(/inconsistent_observation/);
  });

  test("F2: a claim the authenticated transcript does not re-derive to is inconsistent", async () => {
    const observed = await observeIdentity("eip1967", PROXY, adaptersFor(sealBundle(READS)), PIN, QUORUM);
    const forged = {
      identity: {
        ...observed.identity,
        // Consistent transcript, but the claim swaps the terminal to the proxy itself.
        terminalAddress: PROXY,
        runtimeCodeHash: codeHash("0x60806040aa"),
      },
      reads: observed.reads,
    };
    const target = {
      targetId: "t",
      chainId: 1,
      address: PROXY,
      identityStrategy: "eip1967",
      expectedRuntimeCodeHash: codeHash("0x60806040aa"),
    };
    expect(() => compareIdentityTarget(target, forged, PIN, CTX2)).toThrow(/inconsistent_observation/);
  });

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
