// W5 S4 — thin transport adapter over the shared API core (S4 plan §7). GET only.
// vinext parses the [hash] segment and hands params as a thenable satisfying the Next 16
// async contract; in-process tests supply { params: Promise.resolve({ hash }) } directly.
import { handleGetReport } from "../../../../../lib/aegis/surfaces/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ hash: string }> },
): Promise<Response> {
  const { hash } = await context.params;
  return handleGetReport(hash);
}
