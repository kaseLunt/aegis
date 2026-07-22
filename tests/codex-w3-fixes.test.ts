// Fixes for the Codex cross-vendor review of W3 (session 019f8c1b-5c35-78e1-b290-
// 5c5506945844; dispositions in roadmap/reviews/W3-codex-review.md). Each test encodes a
// verified finding; written before the fixes (RED first).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { jcsSerialize } from "../lib/aegis/report/canonical";
import {
  type ChainAdapter,
  type RecordingBundle,
  loadRecordingBytes,
  recordedAdapter,
} from "../lib/aegis/chain/adapter";
import { establishBoundary } from "../lib/aegis/chain/engine";
import { PROVIDERS } from "../lib/aegis/chain/providers";
import { ChainError, evaluateQuorum } from "../lib/aegis/chain/quorum";
import { type PinnedBlock, selectFinalizedBoundary, selectTimeAligned } from "../lib/aegis/chain/selection";

const REC = join(__dirname, "..", "data", "recordings");
const bundle = (): RecordingBundle =>
  loadRecordingBytes(readFileSync(join(REC, "reference-eth-op-heads.json")));

const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
const h32 = (fill: string) => `0x${fill.repeat(64)}`;
const shaOf = (v: unknown) =>
  `sha256:${createHash("sha256").update(Buffer.from(jcsSerialize(v), "utf-8")).digest("hex")}`;

const POLICY = {
  quorum: { policyId: "pq", requiredProviders: ["alchemy", "quicknode"], minAgreeing: 2 },
  confirmationDepth: "12",
  maxHeadLagBlocks: "1000",
};

function block(over: Partial<PinnedBlock> = {}): PinnedBlock {
  return {
    chainId: 1, number: "25577369", hash: h32("a"), parentHash: h32("b"),
    timestamp: "2026-07-22T10:00:00Z", finality: "finalized", ...over,
  };
}

function expectChainError(fn: () => unknown, code: string): void {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(ChainError);
  expect((caught as ChainError).code).toBe(code);
}

// Stub adapter for engine contract-enforcement tests (a live transport misbehaving).
function stubAdapter(providerId: string, domain: string, impl: Partial<ChainAdapter>): ChainAdapter {
  return {
    providerId,
    administrativeDomain: domain,
    getFinalizedHead: async () => block(),
    getLatestHead: async () => block(),
    getBlockByNumber: async () => block(),
    ...impl,
  };
}

describe("P0#1: administrative independence is enforced in quorum, not assumed", () => {
  const okObs = (providerId: string, domain: string) => ({
    providerId,
    administrativeDomain: domain,
    status: "ok" as const,
    block: { chainId: 1, number: "25577369", hash: h32("a") },
    rawResultHash: sha("1"),
  });

  test("two aliases of ONE administrative domain can never reach agreement", () => {
    const r = evaluateQuorum(
      [okObs("alchemy-route-a", "Alchemy Insights, Inc."), okObs("alchemy-route-b", "Alchemy Insights, Inc.")],
      { policyId: "pq", requiredProviders: ["alchemy-route-a", "alchemy-route-b"], minAgreeing: 2 },
    );
    expect(r.outcome).toBe("unknown");
    expect(r.reasonCodes).toContain("administrative_domain_overlap");
  });

  test("distinct domains still agree", () => {
    const r = evaluateQuorum(
      [okObs("alchemy", "Alchemy Insights, Inc."), okObs("quicknode", "QuickNode, Inc.")],
      POLICY.quorum,
    );
    expect(r.outcome).toBe("agreement");
  });

  test("an ok observation without an administrative domain is missing evidence, never counted", () => {
    const bare = { ...okObs("quicknode", "x"), administrativeDomain: undefined } as never;
    const r = evaluateQuorum([okObs("alchemy", "Alchemy Insights, Inc."), bare], POLICY.quorum);
    expect(r.outcome).toBe("unknown");
    expect(r.missingProviders).toEqual(["quicknode"]);
  });

  test("duplicate required-provider entries are an invalid policy", () => {
    expectChainError(
      () => evaluateQuorum(
        [okObs("alchemy", "A")],
        { policyId: "pq", requiredProviders: ["alchemy", "alchemy"], minAgreeing: 2 },
      ),
      "invalid_quorum_policy",
    );
  });
});

describe("P0#2: the engine validates returned blocks against the request", () => {
  test("providers returning blocks from the WRONG chain yield no boundary", async () => {
    const wrongChain = block({ chainId: 10 });
    const a = stubAdapter("alchemy", "A", { getFinalizedHead: async () => wrongChain });
    const b = stubAdapter("quicknode", "B", { getFinalizedHead: async () => wrongChain });
    const r = await establishBoundary([a, b], 1, POLICY);
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.outcome).toBe("unknown");
    expect(r.quorum.missingProviders).toEqual(["alchemy", "quicknode"]);
  });

  test("a re-fetched block at the wrong number is malformed evidence, not silently relabeled", async () => {
    const a = stubAdapter("alchemy", "A", {
      getFinalizedHead: async () => block({ number: "25577369" }),
      getBlockByNumber: async () => block({ number: "25577369" }), // asked for 25577360, returns head
    });
    const b = stubAdapter("quicknode", "B", {
      getFinalizedHead: async () => block({ number: "25577360", hash: h32("c"), parentHash: h32("d"), timestamp: "2026-07-22T09:59:00Z" }),
    });
    const r = await establishBoundary([a, b], 1, POLICY);
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.missingProviders).toContain("alchemy");
  });
});

describe("P1#4: native transport failures are missing evidence, never an engine crash", () => {
  test("an adapter rejecting with a plain Error becomes a missing observation", async () => {
    const a = recordedAdapter(bundle(), PROVIDERS.alchemy);
    const b = stubAdapter("quicknode", "QuickNode, Inc.", {
      getFinalizedHead: async () => {
        throw new Error("ETIMEDOUT");
      },
    });
    const r = await establishBoundary([a, b], 1, POLICY);
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.missingProviders).toEqual(["quicknode"]);
  });
});

describe("P1#5: head divergence beyond policy is stale, not silently pinned", () => {
  test("a provider proposing an ancient pin trips the divergence guard with diagnostics", async () => {
    const ancient = stubAdapter("quicknode", "QuickNode, Inc.", {
      getFinalizedHead: async () => block({ number: "1", hash: h32("c"), parentHash: h32("d"), timestamp: "2020-01-01T00:00:00Z" }),
    });
    const a = recordedAdapter(bundle(), PROVIDERS.alchemy);
    const r = await establishBoundary([a, ancient], 1, POLICY); // lag 25577368 >> 1000
    expect(r.status).toBe("unresolved");
    if (r.status !== "unresolved") return;
    expect(r.quorum.reasonCodes).toContain("head_divergence_exceeded");
    expect(r.proposals.map((p) => p.providerId)).toEqual(["alchemy", "quicknode"]);
  });

  test("proposal diagnostics are always exposed, even on success", async () => {
    const adapters = [recordedAdapter(bundle(), PROVIDERS.alchemy), recordedAdapter(bundle(), PROVIDERS.quicknode)];
    const r = await establishBoundary(adapters, 10, POLICY);
    expect(r.proposals.map((p) => [p.providerId, p.number])).toEqual([
      ["alchemy", "154496611"],
      ["quicknode", "154496599"],
    ]);
  });
});

describe("P1#3: recording integrity binds provenance, and only verified bundles are usable", () => {
  test("a relabeled copy of another provider's response fails integrity", () => {
    const text = new TextDecoder().decode(readFileSync(join(REC, "reference-eth-op-heads.json")));
    // Relabel quicknode's ETH response as a third alias without recomputing envelopes.
    const tampered = Buffer.from(text.replace('"providerId": "quicknode",\n      "chainId": 1', '"providerId": "quicknode-copy",\n      "chainId": 1'), "utf-8");
    expect(new TextDecoder().decode(tampered)).not.toBe(text);
    expectChainError(() => loadRecordingBytes(tampered), "integrity_mismatch");
  });

  test("duplicate lookup keys (provider, chain, method, params) are rejected at load", () => {
    const raw = JSON.parse(new TextDecoder().decode(readFileSync(join(REC, "reference-eth-op-heads.json")))) as { responses: unknown[] };
    raw.responses.push(JSON.parse(JSON.stringify(raw.responses[0])));
    expectChainError(
      () => loadRecordingBytes(new TextEncoder().encode(JSON.stringify(raw))),
      "duplicate_recording_key",
    );
  });

  test("recordedAdapter refuses a bundle that did not come from the verifying loader", () => {
    const forged = JSON.parse(JSON.stringify(bundle())) as RecordingBundle;
    expectChainError(() => recordedAdapter(forged, PROVIDERS.alchemy), "bundle_not_verified");
  });

  test("a recording whose result chainId contradicts its envelope chainId is invalid even fully resealed", () => {
    // Reseal BOTH hashes after the mutation: integrity passes, so the cross-field
    // consistency check must be what rejects — a self-consistent lie is still a lie.
    const raw = JSON.parse(new TextDecoder().decode(readFileSync(join(REC, "reference-eth-op-heads.json")))) as {
      responses: Array<Record<string, unknown> & { result: { chainId: number } }>;
    };
    const r = raw.responses[0];
    r.result.chainId = 10; // envelope says 1
    r.rawResponseSha256 = shaOf(r.result);
    const envelope: Record<string, unknown> = { ...r };
    delete envelope.envelopeSha256;
    r.envelopeSha256 = shaOf(envelope);
    expectChainError(
      () => loadRecordingBytes(new TextEncoder().encode(JSON.stringify(raw))),
      "invalid_recording",
    );
  });
});

describe("P1#6: time-aligned anchors must carry acceptable finality", () => {
  const ethHead = block({ chainId: 1 });
  test("an unconfirmed head can never anchor time alignment", () => {
    const unconfirmedOp = block({ chainId: 10, number: "154496611", hash: h32("c"), parentHash: h32("d"), finality: "unconfirmed" as const });
    expectChainError(() => selectTimeAligned([ethHead, unconfirmedOp], []), "finality_mismatch");
  });

  test("a candidate above its chain's accepted head is rejected", () => {
    const opHead = block({ chainId: 10, number: "154496611", hash: h32("c"), parentHash: h32("d"), timestamp: "2026-07-22T10:00:05Z" });
    const above = block({ chainId: 10, number: "154496612", hash: h32("e"), parentHash: h32("f"), timestamp: "2026-07-22T09:00:00Z", finality: "confirmations" as const });
    expectChainError(() => selectTimeAligned([ethHead, opHead], [above]), "candidate_above_head");
  });
});

describe("P2#7: timestamps must be real instants, not just well-shaped", () => {
  test("impossible dates and times are noncanonical", () => {
    expectChainError(() => selectFinalizedBoundary(block({ timestamp: "2026-02-30T10:00:00Z" })), "noncanonical_timestamp");
    expectChainError(() => selectFinalizedBoundary(block({ timestamp: "2026-01-01T25:00:00Z" })), "noncanonical_timestamp");
    expectChainError(() => selectFinalizedBoundary(block({ timestamp: "2026-02-29T00:00:00Z" })), "noncanonical_timestamp");
  });

  test("a real leap day is accepted", () => {
    expect(() => selectFinalizedBoundary(block({ timestamp: "2028-02-29T00:00:00Z" }))).not.toThrow();
  });
});

describe("P2#8: a status payload can never be treated as a value", () => {
  const dom = { alchemy: "A", quicknode: "B" };
  const payloadObs = (providerId: keyof typeof dom, status: "timeout" | "malformed", hash: string) => ({
    providerId,
    administrativeDomain: dom[providerId],
    status,
    block: { chainId: 1, number: "25577369", hash },
    rawResultHash: sha("1"),
  });
  const okObs = (providerId: keyof typeof dom) => ({
    providerId,
    administrativeDomain: dom[providerId],
    status: "ok" as const,
    block: { chainId: 1, number: "25577369", hash: h32("a") },
    rawResultHash: sha("1"),
  });

  test("a timeout carrying a complete MATCHING payload still cannot complete a quorum", () => {
    const r = evaluateQuorum([okObs("alchemy"), payloadObs("quicknode", "timeout", h32("a"))], POLICY.quorum);
    expect(r.outcome).toBe("unknown");
    expect(r.missingProviders).toEqual(["quicknode"]);
  });

  test("a malformed response carrying a CONFLICTING payload cannot manufacture a conflict", () => {
    const r = evaluateQuorum([okObs("alchemy"), payloadObs("quicknode", "malformed", h32("9"))], POLICY.quorum);
    expect(r.outcome).toBe("unknown");
    expect(r.reasonCodes).not.toContain("block_hash_mismatch");
  });
});
