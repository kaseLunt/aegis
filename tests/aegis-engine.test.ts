import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { canonicalJson } from "../lib/aegis/canonical";
import { REFERENCE_SNAPSHOT } from "../lib/aegis/fixtures";
import { buildProtocolReport, evaluateControls } from "../lib/aegis/invariants";
import { runPreflight } from "../lib/aegis/preflight";
import { runReplay } from "../lib/aegis/replay";

const CLOCK = "2026-07-20T18:00:00.000Z";

describe("protocol invariant engine", () => {
  it("produces byte-identical reports for identical inputs and an injected clock", () => {
    const first = buildProtocolReport(REFERENCE_SNAPSHOT, [], CLOCK);
    const second = buildProtocolReport(REFERENCE_SNAPSHOT, [], CLOCK);

    expect(canonicalJson(first)).toBe(canonicalJson(second));
    expect(first.reportHash).toBe(second.reportHash);
  });

  it("never reports backing as holding when liabilities exceed assets", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2_000_000 }),
        fc.integer({ min: 1, max: 2_000_000 }),
        (assets, deficit) => {
          const controls = evaluateControls({
            ...REFERENCE_SNAPSHOT,
            eethSharesHeldByWeeth: assets,
            weethTotalSupplyShares: assets + deficit,
          });
          expect(controls.find(({ id }) => id === "backing.coverage")?.state).toBe("violated");
        },
      ),
    );
  });

  it("holds at the exact positive-rebase cap and fails above it", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000, max: 2_000_000 }), (pooledEther) => {
        const atBoundary = evaluateControls({
          ...REFERENCE_SNAPSHOT,
          preTotalPooledEther: pooledEther,
          accruedRewardsEth: (pooledEther * REFERENCE_SNAPSHOT.maxPositiveRebaseBps) / 10_000,
        });
        const aboveBoundary = evaluateControls({
          ...REFERENCE_SNAPSHOT,
          preTotalPooledEther: pooledEther,
          accruedRewardsEth: (pooledEther * REFERENCE_SNAPSHOT.maxPositiveRebaseBps) / 10_000 + 1,
        });
        expect(atBoundary.find(({ id }) => id === "rebase.positive-cap")?.state).toBe("holding");
        expect(aboveBoundary.find(({ id }) => id === "rebase.positive-cap")?.state).toBe("violated");
      }),
    );
  });
});

describe("transaction preflight", () => {
  it("blocks every direct-pay request greater than the available balance", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (balance, excess) => {
          const report = runPreflight(
            {
              mode: "direct",
              amountUsd: String(balance + excess),
              directBalanceUsd: String(balance),
              collateralUsd: "0",
              debtUsd: "0",
              maxLtvBps: 8000,
              oracleAgeSeconds: 1,
            },
            CLOCK,
          );
          expect(report.verdict).toBe("blocked_by_policy");
          expect(report.checks.find(({ id }) => id === "funding.direct-balance")?.state).toBe("violated");
        },
      ),
    );
  });

  it("uses fixed-point arithmetic at the exact borrow-capacity boundary", () => {
    const report = runPreflight(
      {
        mode: "borrow",
        amountUsd: "3000.00",
        directBalanceUsd: "0",
        collateralUsd: "10000.00",
        debtUsd: "5000.00",
        maxLtvBps: 8000,
        oracleAgeSeconds: 1,
      },
      CLOCK,
    );

    expect(report.checks.find(({ id }) => id === "funding.borrow-headroom")?.state).toBe("holding");
    expect(report.metrics[0].after).toBe("$8,000.00");
    expect(report.metrics[0].boundary).toBe("$8,000.00");
  });

  it("never converts stale oracle evidence into a green verdict", () => {
    const report = runPreflight(
      {
        mode: "direct",
        amountUsd: "1",
        directBalanceUsd: "100",
        collateralUsd: "0",
        debtUsd: "0",
        maxLtvBps: 8000,
        oracleAgeSeconds: 301,
      },
      CLOCK,
    );
    expect(report.verdict).toBe("warning");
    expect(report.checks[0].state).toBe("advisory");
  });
});

describe("incident replay", () => {
  it("does not restore liveness before the configured public-fallback boundary", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (fallbackDelayDays) => {
        const replay = runReplay({ fallbackDelayDays, publicFallbackEnabled: true }, CLOCK);
        expect(replay.steps[3].timeLabel).toBe(`T+${fallbackDelayDays}D`);
        expect(replay.steps[4].timeLabel).toBe(`T+${fallbackDelayDays}D 03M`);
      }),
    );
  });

  it("keeps counterfactual output separate from the immutable scenario identity", () => {
    const reference = runReplay({ fallbackDelayDays: 14, publicFallbackEnabled: true }, CLOCK);
    const alternate = runReplay({ fallbackDelayDays: 7, publicFallbackEnabled: true }, CLOCK);
    expect(reference.scenarioId).toBe(alternate.scenarioId);
    expect(reference.reportHash).not.toBe(alternate.reportHash);
    expect(reference.outcome.referenceDelta).toBe("Reference policy");
    expect(alternate.outcome.referenceDelta).toBe("-7 days vs reference");
  });
});

describe("trust language", () => {
  it("does not label modeled product surfaces as live", async () => {
    const source = await readFile(new URL("../components/aegis-dashboard.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/(?:>|\s)live(?:<|\s|[.,!])/i);
    expect(source).toContain("REFERENCE_SCENARIO");
    expect(source).toContain("not a protocol safety score");
  });
});
