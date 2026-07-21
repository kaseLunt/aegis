import { runPreflight } from "@/lib/aegis/preflight";
import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,6})?$/, "Use a positive decimal with at most six decimals.");
const requestSchema = z
  .object({
    mode: z.enum(["direct", "borrow"]),
    amountUsd: money,
    directBalanceUsd: money,
    collateralUsd: money,
    debtUsd: money,
    maxLtvBps: z.number().int().min(1).max(9_500),
    oracleAgeSeconds: z.number().int().nonnegative().max(31_536_000),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const report = runPreflight(input);
    return Response.json(report, {
      headers: {
        "cache-control": "no-store",
        etag: `"${report.reportHash}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "INVALID_PREFLIGHT_REQUEST", issues: error.issues },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "PREFLIGHT_EVALUATION_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
