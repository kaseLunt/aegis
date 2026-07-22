// W3 slice 3a — recorded-fixture adapter + provider configs (ENGINEERING_SPEC §Evidence
// acquisition: adapters perform I/O, evaluators do not). Recordings are content-addressed
// reference scenarios read in binary (INS-001); every response's canonical form is
// integrity-checked against its recorded sha256 at load, and a missing recording is a
// typed failure — never a silently invented value (spec: missing evidence, not zero).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { ChainError } from "../lib/aegis/chain/quorum";
import {
  loadRecordingBytes,
  recordedAdapter,
} from "../lib/aegis/chain/adapter";
import { PROVIDERS, QUORUM_PAIR_1 } from "../lib/aegis/chain/providers";
import { selectConfirmationDepthBoundary, selectFinalizedBoundary } from "../lib/aegis/chain/selection";

const REC = join(__dirname, "..", "data", "recordings");
const bundleBytes = (): Buffer => readFileSync(join(REC, "reference-eth-op-heads.json"));

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

describe("recording loader (binary boundary, INS-001)", () => {
  test("the reference bundle loads with every response integrity-verified", () => {
    const bundle = loadRecordingBytes(bundleBytes());
    expect(bundle.recordingId).toBe("reference-eth-op-heads");
    expect(bundle.responses.length).toBeGreaterThanOrEqual(4);
  });

  test("a CRLF-injected copy of the bundle loads identically (INS-001)", () => {
    const crlf = Buffer.from(new TextDecoder().decode(bundleBytes()).replace(/\n/g, "\r\n"), "utf-8");
    expect(crlf.equals(bundleBytes())).toBe(false);
    expect(loadRecordingBytes(crlf)).toEqual(loadRecordingBytes(bundleBytes()));
  });

  test("tampering with a recorded result fails closed (integrity_mismatch)", () => {
    const tampered = Buffer.from(
      new TextDecoder().decode(bundleBytes()).replace('"number": "25577369"', '"number": "25577370"'),
      "utf-8",
    );
    expect(tampered.equals(bundleBytes())).toBe(false);
    expectChainError(() => loadRecordingBytes(tampered), "integrity_mismatch");
  });

  test("undecodable and malformed bytes are typed load failures", () => {
    expectChainError(() => loadRecordingBytes(Buffer.from([0x7b, 0xff, 0xfe])), "invalid_utf8");
    expectChainError(() => loadRecordingBytes(Buffer.from('{"recordingId":', "utf-8")), "malformed_json");
  });
});

describe("recorded adapter semantics", () => {
  const bundle = () => loadRecordingBytes(bundleBytes());

  test("alchemy replays the recorded ETH finalized head deterministically", async () => {
    const a = recordedAdapter(bundle(), PROVIDERS.alchemy);
    const head = await a.getFinalizedHead(1);
    expect(head).not.toBeNull();
    expect(head!.number).toBe("25577369");
    expect(head!.hash).toBe("0x26997307bf47a13c29abb3e325fbb195cb9182632268f89a5627499f10f7afc7");
    expect(head!.finality).toBe("finalized");
    expect(await a.getFinalizedHead(1)).toEqual(head); // replay is stable
  });

  test("quicknode on OP declares NO finalized tag: getFinalizedHead is null, never a guess (WR3 P-Q2)", async () => {
    const q = recordedAdapter(bundle(), PROVIDERS.quicknode);
    expect(await q.getFinalizedHead(10)).toBeNull();
  });

  test("a missing recording is a typed failure, not an invented value", async () => {
    const a = recordedAdapter(bundle(), PROVIDERS.alchemy);
    await expect(a.getBlockByNumber(1, "999")).rejects.toMatchObject({ code: "recording_missing" });
  });

  test("the fallback path composes: quicknode OP latest + depth-12 target pins with a downgrade", async () => {
    const q = recordedAdapter(bundle(), PROVIDERS.quicknode);
    const latest = await q.getLatestHead(10);
    const pinned = await q.getBlockByNumber(10, "154496599");
    const s = selectConfirmationDepthBoundary(latest, pinned, { confirmationDepth: "12" });
    expect(s.boundary.block.number).toBe("154496599");
    expect(s.downgrade?.reasonCode).toBe("finality_tag_unsupported");
  });

  test("the finalized path composes: alchemy ETH head pins with no downgrade", async () => {
    const a = recordedAdapter(bundle(), PROVIDERS.alchemy);
    const s = selectFinalizedBoundary((await a.getFinalizedHead(1))!);
    expect(s.downgrade).toBeNull();
  });
});

describe("provider configs (declared capabilities only, no secrets)", () => {
  test("pair 1 is Alchemy + QuickNode with distinct administrative domains (WR3 §5)", () => {
    expect(QUORUM_PAIR_1).toEqual(["alchemy", "quicknode"]);
    expect(PROVIDERS.alchemy.administrativeDomain).not.toBe(PROVIDERS.quicknode.administrativeDomain);
  });

  test("capabilities are declared-or-absent, never confirmed without a probe (WR3 legend)", () => {
    expect(PROVIDERS.quicknode.chains[10].finalizedTag).toBe("declared_absent");
    expect(PROVIDERS.alchemy.chains[1].finalizedTag).toBe("declared");
    for (const p of Object.values(PROVIDERS)) {
      for (const c of Object.values(p.chains)) {
        expect(["declared", "declared_absent", "unknown"]).toContain(c.finalizedTag);
      }
    }
  });

  test("configs carry env-var NAMES for keys, never key material", () => {
    for (const p of Object.values(PROVIDERS)) {
      expect(p.keyEnvVar).toMatch(/^[A-Z0-9_]+$/);
      const text = JSON.stringify(p);
      expect(text).not.toMatch(/[0-9a-zA-Z_-]{32,}/); // no embedded key-shaped strings
    }
  });
});
