import { buildProtocolReport } from "@/lib/aegis/invariants";
import { REFERENCE_SNAPSHOT } from "@/lib/aegis/fixtures";
import type { ChainHead } from "@/lib/aegis/types";

interface RpcBlock {
  number: string;
  hash: string;
}

async function fetchHead(
  chain: string,
  chainId: number,
  url: string,
  recordedBlockNumber: number,
  recordedBlockHash: string,
): Promise<ChainHead> {
  const capturedAt = new Date().toISOString();
  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2_800);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`RPC returned ${response.status}`);
    const body = (await response.json()) as { result?: RpcBlock };
    if (!body.result?.number || !body.result.hash) throw new Error("RPC response omitted the block head");

    return {
      chain,
      chainId,
      status: "current",
      blockNumber: BigInt(body.result.number).toString(),
      blockHash: body.result.hash,
      capturedAt,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      chain,
      chainId,
      status: "recorded",
      blockNumber: String(recordedBlockNumber),
      blockHash: recordedBlockHash,
      capturedAt: REFERENCE_SNAPSHOT.asOf,
    };
  }
}

export async function GET() {
  const chainHeads = await Promise.all([
    fetchHead("Ethereum", 1, "https://ethereum-rpc.publicnode.com", REFERENCE_SNAPSHOT.ethereumBlockNumber, REFERENCE_SNAPSHOT.ethereumBlockHash),
    fetchHead("OP Mainnet", 10, "https://optimism-rpc.publicnode.com", REFERENCE_SNAPSHOT.optimismBlockNumber, REFERENCE_SNAPSHOT.optimismBlockHash),
  ]);
  const report = buildProtocolReport(undefined, chainHeads);

  return Response.json(report, {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
      etag: `"${report.reportHash}"`,
    },
  });
}
