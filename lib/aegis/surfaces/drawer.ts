// W5 slice S6 — the evidence drawer's server-side loader (S6 plan). Fourth transport over
// the one engine: it calls runVerification only, classifies via the SHARED
// exitCodeForPayload, and carries the SHARED renderJson bytes as its canonical body — the
// S7 byte-identity artifact, reused not rebuilt.
//
// Thrown path (S6 plan §2 RULING): the loader does NOT catch. Unlike CI there is no step
// consuming exit classes as data; a throw is an operational failure surfacing as an error,
// never a verdict and never a null-state model.
import type { DeploymentConfig, VerificationRun } from "./engine";
import { runVerification } from "./engine";
import type { VerificationInputs, VerificationSelector } from "./request";
import { exitCodeForPayload, renderJson, view } from "./render";

// Display-only projection, ordered frame-before-results (PRODUCT_SPEC:213-220, :351): the
// component renders it in key order, so results can never appear without their frame —
// the detached-screenshot hazard. Every semantic field comes verbatim from the hashed
// payload (ENGINEERING_SPEC:879); the drawer re-words nothing. Fallbacks mirror
// renderHuman's exactly — no new semantics on this transport.
export interface DrawerModel {
  readonly header: {
    readonly manifestVersion: string;
    readonly manifestHash: string;
    readonly sourceMode: string;
  };
  readonly trust: {
    readonly state: string;
    readonly reasonCodes: readonly string[];
    readonly trustPolicyId?: string;
  };
  readonly boundaries: readonly {
    readonly kind: string;
    readonly block?: {
      readonly chainId?: number;
      readonly number?: string;
      readonly finality?: string;
      readonly hash?: string;
    };
    // The full downgrade record (requested/used/depth/reasonCode) — engine.ts licenses
    // this diagnostics read for the drawer; never just the downgraded finality word.
    readonly downgrades: readonly {
      readonly chainId: number;
      readonly requested: string;
      readonly used: string;
      readonly confirmationDepth: string;
      readonly reasonCode: string;
    }[];
  }[];
  readonly coverage: {
    readonly supported: number;
    readonly unsupported: number;
    readonly excluded: number;
  };
  readonly verifications: readonly {
    readonly state: string;
    readonly invariantId: string;
    readonly statement: string;
    readonly limitations: readonly { readonly code: string; readonly text: string }[];
  }[];
  readonly evidence: readonly {
    readonly id: string;
    readonly kind: string;
    readonly provenanceClass: string;
    readonly sourceMode: string;
    readonly providerId?: string;
    readonly method?: string;
    readonly rawResultHash?: string;
    readonly capturedAt: string;
    // Deterministically derived from hashed payload fields (ENGINEERING_SPEC:846): head
    // bundles carry ONE capture timestamp for every response ([[INS-84853447]]), so
    // eth_getBlockByNumber evidence is scoped "bundle" — the drawer must never imply a
    // per-call head timestamp. Other rpc reads are per-response. Non-rpc rows carry no
    // scope.
    readonly capturedAtScope?: "bundle" | "response";
  }[];
  readonly limitations: readonly { readonly code: string; readonly text: string }[];
}

export interface DrawerRun {
  readonly reportHash: string;
  readonly canonicalBody: string;
  readonly classification: number;
  readonly model: DrawerModel;
}

function drawerModel(run: VerificationRun): DrawerModel {
  const p = view(run.payload);
  const downgrades = run.diagnostics.boundaries.flatMap((b) => b.downgrades);
  return {
    header: {
      manifestVersion: p.manifestVersion ?? "unknown",
      manifestHash: p.manifestHash ?? "",
      sourceMode: p.sourceMode ?? "unknown",
    },
    trust: {
      state: p.policyTrust?.state ?? "unknown",
      reasonCodes: p.policyTrust?.reasonCodes ?? [],
      trustPolicyId: p.policyTrust?.trustPolicyId,
    },
    boundaries: (p.observationBoundaries ?? []).map((b) => ({
      kind: b.kind ?? "",
      block: b.block,
      downgrades: downgrades
        .filter((d) => d.chainId === b.block?.chainId)
        .map((d) => ({
          chainId: d.chainId,
          requested: d.requested,
          used: d.used,
          confirmationDepth: d.confirmationDepth,
          reasonCode: d.reasonCode,
        })),
    })),
    coverage: {
      supported: p.coverage?.supported?.length ?? 0,
      unsupported: p.coverage?.unsupported?.length ?? 0,
      excluded: p.coverage?.excluded?.length ?? 0,
    },
    verifications: (p.verifications ?? []).map((v) => ({
      state: v.state ?? "unknown",
      invariantId: v.invariantId ?? "",
      statement: v.statement ?? "",
      limitations: (v.limitations ?? []).map((l) => ({ code: l.code ?? "", text: l.text ?? "" })),
    })),
    evidence: (p.evidence ?? []).map((e) => ({
      id: e.id ?? "",
      kind: e.kind ?? "",
      provenanceClass: e.provenanceClass ?? "",
      sourceMode: e.sourceMode ?? "",
      providerId: e.providerId,
      method: e.method,
      rawResultHash: e.rawResultHash,
      capturedAt: e.capturedAt ?? "",
      ...(e.kind === "rpc_call"
        ? { capturedAtScope: e.method === "eth_getBlockByNumber" ? ("bundle" as const) : ("response" as const) }
        : {}),
    })),
    limitations: (p.limitations ?? []).map((l) => ({ code: l.code ?? "", text: l.text ?? "" })),
  };
}

export async function loadEvidenceDrawer(
  inputs: VerificationInputs,
  selector: VerificationSelector,
  deployment: DeploymentConfig,
): Promise<DrawerRun> {
  const run = await runVerification(inputs, selector, deployment);
  return {
    reportHash: run.reportHash,
    canonicalBody: renderJson(run),
    classification: exitCodeForPayload(run.payload),
    model: drawerModel(run),
  };
}
