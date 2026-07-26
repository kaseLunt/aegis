// aegis — the CLI transport over THE one engine (W5 S3). A transport never evaluates: it
// reads bytes, calls runVerification, renders, and maps the outcome to an exit code. It can
// never re-derive or alter a verdict.
//
// Exit codes (W5 charter): 0 clean / 2 blocking fail / 3 unknown-stale-conflict / 4 invalid
// request or manifest / 5 engine failure (no envelope).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { runVerification, SurfaceError } from "../lib/aegis/surfaces/engine";
import { referenceDeployment } from "../lib/aegis/surfaces/profiles";
import { RequestError } from "../lib/aegis/surfaces/request";
import { exitCodeForPayload, renderHuman, renderJson } from "../lib/aegis/surfaces/render";

export interface CliIo {
  readonly stdout: { write(chunk: string): unknown };
  readonly stderr: { write(chunk: string): unknown };
}

const USAGE = `usage: aegis verify --manifest <file> --heads <file> [--identity <file> ...]
  --chain <id> [--chain <id> ...] --at finalized --evaluation-time <ISO-UTC>
  --profile reference [--trust-policy <file>] [--json]

The reference profile without --trust-policy SELF-APPROVES the supplied manifest's content
hash (reference analysis only); pass --trust-policy for an operator-controlled approved set.`;

function fail(io: CliIo, message: string): number {
  io.stderr.write(message + "\n");
  return 4;
}

export async function main(argv: string[], io: CliIo): Promise<number> {
  let parsed: ReturnType<typeof parseArgs<{
    options: {
      manifest: { type: "string" };
      heads: { type: "string" };
      identity: { type: "string"; multiple: true };
      chain: { type: "string"; multiple: true };
      at: { type: "string" };
      "evaluation-time": { type: "string" };
      profile: { type: "string" };
      "trust-policy": { type: "string" };
      json: { type: "boolean" };
    };
    allowPositionals: true;
  }>>;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        manifest: { type: "string" },
        heads: { type: "string" },
        identity: { type: "string", multiple: true },
        chain: { type: "string", multiple: true },
        at: { type: "string" },
        "evaluation-time": { type: "string" },
        profile: { type: "string" },
        "trust-policy": { type: "string" },
        json: { type: "boolean" },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    return fail(io, `invalid arguments: ${(error as Error).message}\n${USAGE}`);
  }

  const { values, positionals } = parsed;
  if (positionals.length !== 1 || positionals[0] !== "verify") {
    return fail(io, USAGE);
  }
  for (const flag of ["manifest", "heads", "at", "evaluation-time", "profile"] as const) {
    if (!values[flag]) return fail(io, `missing required --${flag}\n${USAGE}`);
  }
  if (!values.chain?.length) return fail(io, `missing required --chain\n${USAGE}`);
  if (values.profile !== "reference") {
    return fail(io, `unknown profile '${values.profile}'; the only M1 profile is 'reference'`);
  }

  let manifestBytes: Uint8Array;
  let recordings: { role: "heads" | "identity"; bytes: Uint8Array }[];
  let trustPolicy: { trustPolicyId: string; approvedHashes: string[] } | undefined;
  try {
    manifestBytes = readFileSync(values.manifest as string);
    recordings = [
      { role: "heads" as const, bytes: readFileSync(values.heads as string) },
      ...(values.identity ?? []).map((file) => ({
        role: "identity" as const,
        bytes: readFileSync(file),
      })),
    ];
    if (values["trust-policy"]) {
      trustPolicy = JSON.parse(readFileSync(values["trust-policy"], "utf8"));
    }
  } catch (error) {
    return fail(io, `cannot read input: ${(error as Error).message}`);
  }

  // The at-selector is passed through VERBATIM: the ENGINE refuses anything but "finalized"
  // (RequestError unsupported_at_selector -> 4). The CLI does not pre-judge it.
  const selector = {
    sourceMode: "recorded" as const,
    at: values.at as "finalized",
    chainIds: (values.chain ?? []).map(Number),
  };
  const deployment = referenceDeployment(manifestBytes, {
    evaluationTime: values["evaluation-time"] as string,
    trustPolicy,
  });

  try {
    const run = await runVerification({ manifestBytes, recordings }, selector, deployment);
    io.stdout.write((values.json ? renderJson(run) : renderHuman(run)) + "\n");
    return exitCodeForPayload(run.payload);
  } catch (error) {
    if (error instanceof RequestError) {
      io.stderr.write(`${error.code} at ${error.path}\n`);
      return 4;
    }
    if (error instanceof SurfaceError) {
      // The only cases the spec reserves for "no envelope" (engine.ts doc comment).
      io.stderr.write(`${error.code} at ${error.path}\n`);
      return 5;
    }
    const code = (error as { code?: string }).code ?? "engine_failure";
    io.stderr.write(`${code}: ${(error as Error).message}\n`);
    return 5;
  }
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main(process.argv.slice(2), process).then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${(error as Error).message}\n`);
      process.exit(5);
    },
  );
}
