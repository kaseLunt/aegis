// W4 slice 2 — quorum-wired identity observation over the adapter seam.
// The pure evaluator (resolve.ts) owns WHICH read comes next; this orchestrator owns WHAT
// independent providers agreed that read returned. Derivation runs against a cache of
// quorum-agreed values; each cache miss triggers exactly one fan-out read across ALL
// adapters at the pinned block — keyed by the pin's BLOCK HASH (EIP-1898 form), so the
// answering block is bound by the envelope, never assumed (Codex W4 finding 1). A read
// without quorum agreement can never influence identity: the shim raises
// ObservationUnavailable (conflict vs unresolved preserved — finding 5) and the pure
// derivation returns a typed unknown that RETAINS the walked path (finding 9).
// Quorum-agreed ABSENCE ("0x") is evidence and flows into the derivation's typed
// outcomes (code_absent, ...).
import type { IdentityReadAdapter } from "../chain/adapter";
import {
  ChainError,
  type ProviderObservation,
  type QuorumPolicy,
  type QuorumResult,
  evaluateQuorum,
} from "../chain/quorum";
import type { PinnedBlock } from "../chain/selection";
import {
  type CodeObservation,
  type IdentityResult,
  ObservationUnavailable,
  deriveIdentity,
} from "./resolve";

// implementation() — the only ABI knowledge this module carries; selection of richer
// ABIs is the registry's job and happens only after a terminal hash match (slice 3).
const IMPLEMENTATION_SELECTOR = "0x5c60da1b";
// ABI-encoded `address` return: one 32-byte word, ZERO-padded high 12 bytes (Codex W4
// finding 4: nonzero padding is malformed data, never sliced into an address).
const PADDED_ADDRESS_RE = /^0x0{24}[0-9a-f]{40}$/;

export interface IdentityReadEvidence {
  kind: "code" | "storage" | "call";
  address: string;
  slot?: string;
  data?: string;
  // The quorum-agreed value (null when no agreement) — downstream evidence transparency.
  agreedValue: string | null;
  quorum: QuorumResult;
  observations: ProviderObservation[];
}

export interface ObservedIdentity {
  identity: IdentityResult;
  reads: IdentityReadEvidence[];
}

interface ReadRequest {
  kind: "code" | "storage" | "call";
  address: string;
  slot?: string;
  data?: string;
}

interface ReadOutcome {
  agreed: string | null;
  evidence: IdentityReadEvidence;
}

const keyOf = (r: ReadRequest): string => `${r.kind}\0${r.address}\0${r.slot ?? ""}\0${r.data ?? ""}`;

// Control-flow sentinel for the derivation trampoline. Not part of the public surface.
class ReadNeeded extends Error {
  constructor(public readonly request: ReadRequest) {
    super("identity read needed");
  }
}

// More reads than any supported strategy can require means the derivation is not
// converging over this observation set — a defect, not a provider outcome.
const MAX_READS = 8;

const cmpProvider = (a: ProviderObservation, b: ProviderObservation): number =>
  a.providerId < b.providerId ? -1 : a.providerId > b.providerId ? 1 : 0;

async function performRead(
  request: ReadRequest,
  adapters: readonly IdentityReadAdapter[],
  pinned: PinnedBlock,
  policy: QuorumPolicy,
): Promise<ReadOutcome> {
  const pin = { number: pinned.number, hash: pinned.hash };
  const values = new Map<string, string>();
  const observations: ProviderObservation[] = await Promise.all(
    adapters.map(async (adapter): Promise<ProviderObservation> => {
      try {
        const read =
          request.kind === "code"
            ? await adapter.getCode(pinned.chainId, request.address, pin)
            : request.kind === "storage"
              ? await adapter.getStorageWord(pinned.chainId, request.address, request.slot!, pin)
              : await adapter.call(
                  pinned.chainId,
                  { to: request.address, data: request.data! },
                  pin,
                );
        values.set(adapter.providerId, read.value);
        return {
          providerId: adapter.providerId,
          administrativeDomain: adapter.administrativeDomain,
          status: "ok",
          // Every observation is AT the established pin; the adapter read was keyed by
          // this exact block hash, so the binding is real, not annotated.
          block: { chainId: pinned.chainId, number: pinned.number, hash: pinned.hash },
          rawResultHash: read.rawResultHash,
          capturedAt: read.capturedAt,
          sourceMode: read.sourceMode,
        };
      } catch (e) {
        // Any adapter failure is missing evidence (W3 P1#4): keep the other providers'
        // diagnostics, never crash the observation pass.
        return {
          providerId: adapter.providerId,
          administrativeDomain: adapter.administrativeDomain,
          status: e instanceof ChainError && e.code === "recording_missing" ? "timeout" : "malformed",
        };
      }
    }),
  );
  observations.sort(cmpProvider);
  const quorum = evaluateQuorum(observations, policy);
  const agreed =
    quorum.outcome === "agreement" ? (values.get(quorum.agreeingProviders[0]) ?? null) : null;
  return {
    agreed,
    evidence: {
      kind: request.kind,
      address: request.address,
      ...(request.slot !== undefined ? { slot: request.slot } : {}),
      ...(request.data !== undefined ? { data: request.data } : {}),
      agreedValue: agreed,
      quorum,
      observations,
    },
  };
}

// The shim hands quorum-agreed values to the pure derivation. A miss aborts the run via
// ReadNeeded; a non-agreed read raises ObservationUnavailable, which the derivation
// converts to a typed unknown that keeps the walked path.
function shim(cache: Map<string, ReadOutcome>): CodeObservation {
  const agreedValue = (request: ReadRequest): string => {
    const outcome = cache.get(keyOf(request));
    if (!outcome) throw new ReadNeeded(request);
    if (outcome.agreed === null) {
      throw new ObservationUnavailable(
        outcome.evidence.quorum.outcome === "conflict"
          ? "observation_conflict"
          : "observation_unresolved",
      );
    }
    return outcome.agreed;
  };
  return {
    getCode: (address) => agreedValue({ kind: "code", address }),
    getStorageWord: (address, slot) => agreedValue({ kind: "storage", address, slot }),
    getBeaconImplementation: (address) => {
      const word = agreedValue({ kind: "call", address, data: IMPLEMENTATION_SELECTOR });
      // implementation() returns one zero-padded ABI-encoded address word; anything else
      // (revert data, "0x", nonzero padding) is an unresolved beacon answer —
      // resolve.ts types it, never guesses.
      if (!PADDED_ADDRESS_RE.test(word)) return null;
      return `0x${word.slice(26)}`;
    },
  };
}

export async function observeIdentity(
  strategy: string,
  address: string,
  adapters: readonly IdentityReadAdapter[],
  pinned: PinnedBlock,
  policy: QuorumPolicy,
): Promise<ObservedIdentity> {
  const cache = new Map<string, ReadOutcome>();
  for (;;) {
    try {
      const identity = deriveIdentity(strategy, address, shim(cache));
      return { identity, reads: [...cache.values()].map((o) => o.evidence) };
    } catch (e) {
      if (e instanceof ReadNeeded) {
        if (cache.size >= MAX_READS) {
          throw new ChainError("identity_read_budget_exceeded", "/observe", keyOf(e.request));
        }
        cache.set(keyOf(e.request), await performRead(e.request, adapters, pinned, policy));
        continue;
      }
      throw e;
    }
  }
}
