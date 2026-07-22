// W3 slice 1 — provider quorum/conflict semantics (ENGINEERING_SPEC §Provider quorum and
// conflicts), TDD from the spec rules verbatim:
//   - Agreement requires matching block hashes and canonicalized raw results.
//   - A block-number match with a hash mismatch is a conflict.
//   - A decoded-value match with a raw mismatch is retained as separate evidence and
//     reviewed by policy (neither agreement nor automatic conflict).
//   - Provider timeout or malformed response is missing evidence, not a zero value.
//   - Required-provider disagreement yields conflict.
//   - Insufficient responses yield unknown.
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
  ChainError,
  type ProviderObservation,
  evaluateQuorum,
} from "../lib/aegis/chain/quorum";

const sha = (fill: string) => `sha256:${fill.repeat(64)}`;
const h32 = (fill: string) => `0x${fill.repeat(64)}`;

const BLOCK = { chainId: 1, number: "25577369", hash: h32("a") };

function ok(providerId: string, over: Partial<ProviderObservation> = {}): ProviderObservation {
  return {
    providerId,
    administrativeDomain: `domain-of-${providerId}`, // distinct per provider by default
    status: "ok",
    block: { ...BLOCK },
    rawResultHash: sha("1"),
    ...over,
  };
}

const POLICY = { policyId: "pq-1", requiredProviders: ["alchemy", "quicknode"], minAgreeing: 2 };

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

describe("agreement", () => {
  test("two required providers matching on block hash and raw result agree", () => {
    const r = evaluateQuorum([ok("alchemy"), ok("quicknode")], POLICY);
    expect(r.outcome).toBe("agreement");
    expect(r.agreeingProviders).toEqual(["alchemy", "quicknode"]);
    expect(r.reasonCodes).toEqual([]);
    expect(r.missingProviders).toEqual([]);
  });

  test("an OPTIONAL provider timing out does not break agreement of the required pair", () => {
    const r = evaluateQuorum(
      [ok("alchemy"), ok("quicknode"), { providerId: "ankr", status: "timeout" as const }],
      POLICY,
    );
    expect(r.outcome).toBe("agreement");
    expect(r.missingProviders).toEqual(["ankr"]);
  });
});

describe("conflicts", () => {
  test("block-number match with hash mismatch is a conflict", () => {
    const r = evaluateQuorum(
      [ok("alchemy"), ok("quicknode", { block: { ...BLOCK, hash: h32("b") } })],
      POLICY,
    );
    expect(r.outcome).toBe("conflict");
    expect(r.reasonCodes).toContain("block_hash_mismatch");
  });

  test("raw-result mismatch with differing decoded values is a conflict", () => {
    const r = evaluateQuorum(
      [
        ok("alchemy", { decodedValueHash: sha("2") }),
        ok("quicknode", { rawResultHash: sha("9"), decodedValueHash: sha("3") }),
      ],
      POLICY,
    );
    expect(r.outcome).toBe("conflict");
    expect(r.reasonCodes).toContain("raw_result_mismatch");
  });

  test("required-provider disagreement is a conflict even when two others agree", () => {
    const policy = { policyId: "pq-1", requiredProviders: ["alchemy", "quicknode", "infura"], minAgreeing: 2 };
    const r = evaluateQuorum(
      [ok("alchemy"), ok("quicknode"), ok("infura", { rawResultHash: sha("9") })],
      policy,
    );
    expect(r.outcome).toBe("conflict");
  });
});

describe("retained-for-policy-review (decoded match, raw mismatch)", () => {
  test("is neither agreement nor conflict: unknown with its own reason code", () => {
    const r = evaluateQuorum(
      [
        ok("alchemy", { decodedValueHash: sha("2") }),
        ok("quicknode", { rawResultHash: sha("9"), decodedValueHash: sha("2") }),
      ],
      POLICY,
    );
    expect(r.outcome).toBe("unknown");
    expect(r.reasonCodes).toContain("raw_result_mismatch_decoded_match");
  });
});

describe("missing evidence (never a zero value)", () => {
  test("timeout leaves the quorum insufficient: unknown, provider recorded as missing", () => {
    const r = evaluateQuorum(
      [ok("alchemy"), { providerId: "quicknode", status: "timeout" as const }],
      POLICY,
    );
    expect(r.outcome).toBe("unknown");
    expect(r.reasonCodes).toContain("insufficient_provider_responses");
    expect(r.reasonCodes).toContain("required_provider_missing");
    expect(r.missingProviders).toEqual(["quicknode"]);
  });

  test("malformed response is missing evidence exactly like a timeout", () => {
    const r = evaluateQuorum(
      [ok("alchemy"), { providerId: "quicknode", status: "malformed" as const }],
      POLICY,
    );
    expect(r.outcome).toBe("unknown");
    expect(r.missingProviders).toEqual(["quicknode"]);
  });

  test("an ok-status observation without block or raw hash degrades to missing evidence", () => {
    const r = evaluateQuorum(
      [ok("alchemy"), { providerId: "quicknode", status: "ok" as const }],
      POLICY,
    );
    expect(r.outcome).toBe("unknown");
    expect(r.missingProviders).toEqual(["quicknode"]);
  });

  test("a required provider timing out yields unknown even when two optionals agree", () => {
    const r = evaluateQuorum(
      [ok("ankr"), ok("drpc"), { providerId: "alchemy", status: "timeout" as const }, { providerId: "quicknode", status: "timeout" as const }],
      POLICY,
    );
    expect(r.outcome).toBe("unknown");
    expect(r.reasonCodes).toContain("required_provider_missing");
  });
});

describe("fail-closed preconditions", () => {
  test("the two-provider floor is enforced on the policy itself", () => {
    expectChainError(
      () => evaluateQuorum([ok("alchemy")], { policyId: "pq-1", requiredProviders: ["alchemy"], minAgreeing: 1 }),
      "invalid_quorum_policy",
    );
  });

  test("observations from different chains cannot be compared", () => {
    expectChainError(
      () => evaluateQuorum([ok("alchemy"), ok("quicknode", { block: { ...BLOCK, chainId: 10 } })], POLICY),
      "cross_chain_observations",
    );
  });

  test("observations at different block numbers cannot be compared (selection pins one block)", () => {
    expectChainError(
      () => evaluateQuorum([ok("alchemy"), ok("quicknode", { block: { ...BLOCK, number: "25577370" } })], POLICY),
      "block_number_mismatch",
    );
  });

  test("duplicate observations from one provider cannot self-corroborate", () => {
    expectChainError(
      () => evaluateQuorum([ok("alchemy"), ok("alchemy")], POLICY),
      "duplicate_provider_observation",
    );
  });
});

describe("determinism (property)", () => {
  test("observation order never changes the outcome or the agreeing set", () => {
    const observations: ProviderObservation[] = [
      ok("alchemy"),
      ok("quicknode"),
      ok("infura", { rawResultHash: sha("9"), decodedValueHash: sha("3") }),
      { providerId: "ankr", status: "timeout" },
    ];
    const policy = { policyId: "pq-1", requiredProviders: ["alchemy", "quicknode"], minAgreeing: 2 };
    const reference = evaluateQuorum(observations, policy);
    fc.assert(
      fc.property(
        fc.shuffledSubarray(observations, { minLength: observations.length, maxLength: observations.length }),
        (shuffled) => {
          expect(evaluateQuorum(shuffled, policy)).toEqual(reference);
        },
      ),
      { numRuns: 30 },
    );
  });
});
