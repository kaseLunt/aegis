// W3 slice 2 — finalized-block selection (ENGINEERING_SPEC §Block selection and finality),
// TDD from the spec rules verbatim:
//   Single-chain: use the provider's finalized head; if finalized is unsupported, use the
//   configured confirmation-depth policy; pin every observation to the exact block hash;
//   expose any finality downgrade.
//   Multi-chain: never atomic — asOfTimestamp no later than the oldest finalized head,
//   one canonical block per chain at or before it, labeled time_aligned.
// WR3 hazard: QuickNode declares NO finalized/safe tags on OP [P-Q2] — the fallback path
// and downgrade exposure are mandatory behavior, not edge cases.
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { ChainError } from "../lib/aegis/chain/quorum";
import {
  type PinnedBlock,
  confirmationDepthTarget,
  selectConfirmationDepthBoundary,
  selectFinalizedBoundary,
  selectTimeAligned,
} from "../lib/aegis/chain/selection";

const h32 = (fill: string) => `0x${fill.repeat(64)}`;

function block(over: Partial<PinnedBlock> = {}): PinnedBlock {
  return {
    chainId: 1,
    number: "25577369",
    hash: h32("a"),
    parentHash: h32("b"),
    timestamp: "2026-07-22T10:00:00Z",
    finality: "finalized",
    ...over,
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

describe("single-chain: finalized head", () => {
  test("a valid finalized head pins the boundary to the exact block hash with no downgrade", () => {
    const s = selectFinalizedBoundary(block());
    expect(s.boundary.kind).toBe("execution_block");
    expect(s.boundary.block).toEqual(block());
    expect(s.boundary.block.finality).toBe("finalized");
    expect(s.downgrade).toBeNull();
  });

  test("fail-closed input validation: noncanonical number, short hash, malformed timestamp, fractional chainId", () => {
    expectChainError(() => selectFinalizedBoundary(block({ number: "0025577369" })), "noncanonical_unsigned_decimal");
    expectChainError(() => selectFinalizedBoundary(block({ hash: "0xabc" })), "invalid_block_hash");
    expectChainError(() => selectFinalizedBoundary(block({ parentHash: "0xabc" })), "invalid_block_hash");
    expectChainError(() => selectFinalizedBoundary(block({ timestamp: "2026-07-22 10:00:00" })), "noncanonical_timestamp");
    expectChainError(() => selectFinalizedBoundary(block({ chainId: 1.5 })), "invalid_chain_id");
  });

  test("a head not tagged finalized cannot be selected as a finalized boundary", () => {
    expectChainError(
      () => selectFinalizedBoundary(block({ finality: "confirmations" as const })),
      "finality_mismatch",
    );
  });
});

describe("single-chain: confirmation-depth fallback (finalized tag unsupported)", () => {
  test("confirmationDepthTarget computes latest minus depth as a minimal decimal", () => {
    expect(confirmationDepthTarget("25577369", "12")).toBe("25577357");
    expect(confirmationDepthTarget("100", "99")).toBe("1");
  });

  test("depth at or past the chain tip fails closed, never a negative or zero pin", () => {
    expectChainError(() => confirmationDepthTarget("12", "12"), "confirmation_depth_underflow");
    expectChainError(() => confirmationDepthTarget("12", "13"), "confirmation_depth_underflow");
  });

  test("QuickNode-OP shape: fallback pins latest-minus-depth, downgrades finality, and says why", () => {
    const latest = block({ chainId: 10, number: "154496611", finality: "unconfirmed" as const, hash: h32("c") });
    const pinned = block({ chainId: 10, number: "154496599", finality: "confirmations" as const, hash: h32("d"), parentHash: h32("e") });
    const s = selectConfirmationDepthBoundary(latest, pinned, { confirmationDepth: "12" });
    expect(s.boundary.block).toEqual(pinned);
    expect(s.boundary.block.finality).toBe("confirmations");
    expect(s.downgrade).toEqual({
      chainId: 10,
      requested: "finalized",
      used: "confirmations",
      confirmationDepth: "12",
      reasonCode: "finality_tag_unsupported",
    });
  });

  test("a pinned block that is not exactly latest-minus-depth fails closed", () => {
    const latest = block({ chainId: 10, number: "154496611" });
    const wrong = block({ chainId: 10, number: "154496600", finality: "confirmations" as const });
    expectChainError(
      () => selectConfirmationDepthBoundary(latest, wrong, { confirmationDepth: "12" }),
      "confirmation_target_mismatch",
    );
  });

  test("latest and pinned must be on the same chain, and the pinned finality must say confirmations", () => {
    const latest = block({ chainId: 1, number: "154496611" });
    const otherChain = block({ chainId: 10, number: "154496599", finality: "confirmations" as const });
    expectChainError(
      () => selectConfirmationDepthBoundary(latest, otherChain, { confirmationDepth: "12" }),
      "cross_chain_observations",
    );
    const wrongFinality = block({ chainId: 1, number: "154496599", finality: "finalized" as const });
    expectChainError(
      () => selectConfirmationDepthBoundary(latest, wrongFinality, { confirmationDepth: "12" }),
      "finality_mismatch",
    );
  });
});

describe("multi-chain: time-aligned selection (never atomic)", () => {
  const ethHead = block({ chainId: 1, number: "25577369", timestamp: "2026-07-22T10:00:00Z" });
  const opHead = block({ chainId: 10, number: "154496611", hash: h32("c"), parentHash: h32("d"), timestamp: "2026-07-22T10:00:05Z" });
  const opEarlier = block({ chainId: 10, number: "154496608", hash: h32("e"), parentHash: h32("f"), timestamp: "2026-07-22T09:59:58Z" });
  const opTooEarly = block({ chainId: 10, number: "154496500", hash: h32("1"), parentHash: h32("2"), timestamp: "2026-07-22T09:55:00Z" });

  test("asOfTimestamp is the oldest finalized head; younger chains resolve at or before it", () => {
    const s = selectTimeAligned([ethHead, opHead], [opEarlier, opTooEarly]);
    expect(s.label).toBe("time_aligned");
    expect(s.asOfTimestamp).toBe("2026-07-22T10:00:00Z"); // eth head is oldest
    expect(s.boundaries.map((b) => b.block.chainId)).toEqual([1, 10]); // sorted by chain
    expect(s.boundaries[0].block).toEqual(ethHead); // oldest chain pins its own head
    expect(s.boundaries[1].block).toEqual(opEarlier); // highest OP block with ts <= asOf
  });

  test("a head younger than asOf is never selected even though it is a candidate", () => {
    const s = selectTimeAligned([ethHead, opHead], [opEarlier]);
    expect(s.boundaries[1].block.number).toBe("154496608");
    expect(s.boundaries[1].block.timestamp <= s.asOfTimestamp).toBe(true);
  });

  test("a chain with no block at or before asOf fails closed", () => {
    const lateOnly = block({ chainId: 10, number: "154496611", hash: h32("c"), timestamp: "2026-07-22T10:00:05Z" });
    expectChainError(() => selectTimeAligned([ethHead, lateOnly], []), "no_block_at_or_before_asof");
  });

  test("duplicate-chain heads and single-chain input fail closed", () => {
    expectChainError(() => selectTimeAligned([ethHead, block({ chainId: 1, number: "25577370" })], []), "duplicate_chain_head");
    expectChainError(() => selectTimeAligned([ethHead], []), "insufficient_chains");
  });

  test("a candidate on a chain with no head fails closed (candidates cannot introduce chains)", () => {
    const strayCandidate = block({ chainId: 42161, number: "1000", timestamp: "2026-07-22T09:00:00Z" });
    expectChainError(() => selectTimeAligned([ethHead, opHead], [strayCandidate]), "candidate_without_head");
  });

  test("input order of heads and candidates never changes the selection (property)", () => {
    const heads = [ethHead, opHead];
    const candidates = [opEarlier, opTooEarly];
    const reference = selectTimeAligned(heads, candidates);
    fc.assert(
      fc.property(
        fc.shuffledSubarray(heads, { minLength: 2, maxLength: 2 }),
        fc.shuffledSubarray(candidates, { minLength: 2, maxLength: 2 }),
        (hs, cs) => {
          expect(selectTimeAligned(hs, cs)).toEqual(reference);
        },
      ),
      { numRuns: 25 },
    );
  });
});
