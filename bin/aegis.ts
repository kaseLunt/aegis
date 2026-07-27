// aegis — the CLI transport over THE one engine (W5 S3). A transport never evaluates: it
// reads bytes, calls runVerification, renders, and maps the outcome to an exit code. It can
// never re-derive or alter a verdict.
//
// Exit codes (W5 charter): 0 clean / 2 blocking fail / 3 unknown-stale-conflict / 4 invalid
// request or manifest / 5 engine failure (no envelope).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { loadRecordingBytes } from "../lib/aegis/chain/adapter";
import { ChainError } from "../lib/aegis/chain/quorum";
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
      heads: { type: "string"; multiple: true };
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
        heads: { type: "string", multiple: true },
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
  for (const flag of ["manifest", "at", "evaluation-time", "profile"] as const) {
    if (!values[flag]) return fail(io, `missing required --${flag}\n${USAGE}`);
  }
  if (!values.heads?.length) return fail(io, `missing required --heads\n${USAGE}`);
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
      ...(values.heads ?? []).map((file) => ({
        role: "heads" as const,
        bytes: readFileSync(file),
      })),
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

  // Pre-validation: recording corruption is CALLER INPUT (exit 4), not an engine failure.
  // The bundle is loaded and DISCARDED — the engine re-earns the provenance brand from raw
  // bytes itself (WeakSet brands survive no boundary); the CLI passes bytes, never bundles.
  // A ChainError escaping AFTER this point is an operational failure of the run (exit 5).
  // The providerIds seen per recording feed the D20 transport diagnostic below.
  const providersSeen: { role: string; present: ReadonlySet<string> }[] = [];
  for (const recording of recordings) {
    try {
      const bundle = loadRecordingBytes(recording.bytes);
      providersSeen.push({
        role: recording.role,
        present: new Set(bundle.responses.map((r) => r.providerId)),
      });
    } catch (error) {
      if (error instanceof ChainError) {
        io.stderr.write(`${error.code} at ${error.path}\n`);
        return 4;
      }
      io.stderr.write(`cannot load ${recording.role} recording: ${(error as Error).message}\n`);
      return 4;
    }
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

  // D20 transport diagnostic (W5:233-235): a configured provider with ZERO responses in a
  // recording is more often a misconfigured providerId than an outage — without this line
  // the operator chases RPC health instead of a typo. stderr ONLY, and it never alters the
  // outcome: the engine still derives whatever the recordings support.
  for (const { role, present } of providersSeen) {
    for (const provider of deployment.providers) {
      if (!present.has(provider.providerId)) {
        io.stderr.write(
          `warning: configured provider "${provider.providerId}" has no responses in the ${role} recording — a missing providerId can masquerade as a provider outage\n`,
        );
      }
    }
  }

  // The reproduce line (§6): rebuilt from the PARSED values, every determinism input
  // explicit, so the printed line alone re-derives the identical reportHash.
  const reproduce = [
    "aegis verify",
    `--manifest ${values.manifest}`,
    ...(values.heads ?? []).map((f) => `--heads ${f}`),
    ...(values.identity ?? []).map((f) => `--identity ${f}`),
    ...(values.chain ?? []).map((c) => `--chain ${c}`),
    `--at ${values.at}`,
    `--evaluation-time ${values["evaluation-time"]}`,
    `--profile ${values.profile}`,
    ...(values["trust-policy"] !== undefined ? [`--trust-policy ${values["trust-policy"]}`] : []),
  ].join(" ");

  try {
    const run = await runVerification({ manifestBytes, recordings }, selector, deployment);
    io.stdout.write((values.json ? renderJson(run) : renderHuman(run, { reproduce })) + "\n");
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
