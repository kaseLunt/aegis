// W5 S4 — thin transport adapter over the shared API core (S4 plan §7). Relative import
// on purpose: vitest resolves no "@/" alias, and this file is exercised in-process by
// tests/api.test.ts. POST only — vinext auto-405s other methods at dispatch.
import { handleVerify } from "../../../../lib/aegis/surfaces/api";

export async function POST(request: Request): Promise<Response> {
  return handleVerify(request);
}
