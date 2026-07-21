import { runReplay } from "@/lib/aegis/replay";
import { z } from "zod";

const optionsSchema = z
  .object({
    fallbackDelayDays: z.number().int().min(1).max(30),
    publicFallbackEnabled: z.boolean(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const options = optionsSchema.parse(await request.json());
    const report = runReplay(options);
    return Response.json(report, {
      headers: {
        "cache-control": "no-store",
        etag: `"${report.reportHash}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "INVALID_REPLAY_OPTIONS", issues: error.issues },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "REPLAY_EVALUATION_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
