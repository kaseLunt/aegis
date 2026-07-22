// W3 finalized-block selection (ENGINEERING_SPEC §Block selection and finality). Pure:
// adapters fetch heads/blocks and call in; nothing here performs I/O or reads a clock.
// Single-chain: pin to the provider's finalized head, or — when the finalized tag is
// unsupported (WR3: QuickNode on OP [P-Q2]) — to the configured confirmation-depth
// target, with the finality downgrade exposed as a typed record, never hidden.
// Multi-chain: crosschain state is never atomic — asOfTimestamp is no later than the
// oldest finalized head, one canonical block per chain at or before it, time_aligned.
import { cmpDecimal } from "../report/canonical";
import { ChainError } from "./quorum";

export interface PinnedBlock {
  chainId: number;
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  finality: "finalized" | "safe" | "confirmations" | "unconfirmed";
}

export interface FinalityDowngrade {
  chainId: number;
  requested: "finalized";
  used: "confirmations";
  confirmationDepth: string;
  reasonCode: "finality_tag_unsupported";
}

export interface ExecutionBoundarySelection {
  boundary: { kind: "execution_block"; block: PinnedBlock };
  downgrade: FinalityDowngrade | null;
}

export interface TimeAlignedSelection {
  label: "time_aligned";
  asOfTimestamp: string;
  boundaries: Array<{ kind: "execution_block"; block: PinnedBlock }>;
}

const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;
const HASH32_RE = /^0x[0-9a-f]{64}$/;
// Fixed-width UTC Z form: lexicographic comparison IS chronological comparison.
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const bad = (code: string, path: string, detail?: string): never => {
  throw new ChainError(code, path, detail);
};

function validateBlock(path: string, b: PinnedBlock): void {
  if (typeof b.chainId !== "number" || !Number.isInteger(b.chainId)) {
    bad("invalid_chain_id", `${path}/chainId`, String(b.chainId));
  }
  if (typeof b.number !== "string" || !DECIMAL_RE.test(b.number)) {
    bad("noncanonical_unsigned_decimal", `${path}/number`, String(b.number));
  }
  for (const k of ["hash", "parentHash"] as const) {
    if (typeof b[k] !== "string" || !HASH32_RE.test(b[k])) {
      bad("invalid_block_hash", `${path}/${k}`, String(b[k]));
    }
  }
  if (typeof b.timestamp !== "string" || !TIMESTAMP_RE.test(b.timestamp)) {
    bad("noncanonical_timestamp", `${path}/timestamp`, String(b.timestamp));
  }
  // Codex W3 review P2#7: shape is not validity — reject impossible dates/times via an
  // exact round-trip, so lexicographic order is chronological over REAL instants only.
  const parsed = new Date(b.timestamp);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== `${b.timestamp.slice(0, -1)}.000Z`) {
    bad("noncanonical_timestamp", `${path}/timestamp`, `${b.timestamp} is not a real instant`);
  }
}

// Spec step 1/4: the finalized head IS the boundary; the exact hash pins every
// execution-layer observation. A head not actually tagged finalized must never be
// promoted to one (that is what the downgrade path is for).
export function selectFinalizedBoundary(head: PinnedBlock): ExecutionBoundarySelection {
  validateBlock("/head", head);
  if (head.finality !== "finalized") {
    bad("finality_mismatch", "/head/finality", `expected finalized, got ${head.finality}`);
  }
  return { boundary: { kind: "execution_block", block: { ...head } }, downgrade: null };
}

// Spec step 2: configured confirmation-depth policy when the finalized tag is
// unsupported. Pure decimal arithmetic; a depth at or past the tip fails closed (a
// zero/negative pin is never a boundary).
export function confirmationDepthTarget(latestNumber: string, depth: string): string {
  for (const [path, v] of [["/latestNumber", latestNumber], ["/depth", depth]] as const) {
    if (typeof v !== "string" || !DECIMAL_RE.test(v)) bad("noncanonical_unsigned_decimal", path, String(v));
  }
  const target = BigInt(latestNumber) - BigInt(depth);
  if (target <= 0n) {
    bad("confirmation_depth_underflow", "/depth", `${depth} >= tip ${latestNumber}`);
  }
  return target.toString();
}

// Spec step 5: the fallback is always exposed as a downgrade record — the report reader
// must be able to see that "finalized" was requested and "confirmations" was used.
export function selectConfirmationDepthBoundary(
  latest: PinnedBlock,
  pinned: PinnedBlock,
  policy: { confirmationDepth: string },
): ExecutionBoundarySelection {
  validateBlock("/latest", latest);
  validateBlock("/pinned", pinned);
  if (latest.chainId !== pinned.chainId) {
    bad("cross_chain_observations", "/pinned/chainId", `${latest.chainId} vs ${pinned.chainId}`);
  }
  if (pinned.finality !== "confirmations") {
    bad("finality_mismatch", "/pinned/finality", `expected confirmations, got ${pinned.finality}`);
  }
  const target = confirmationDepthTarget(latest.number, policy.confirmationDepth);
  if (pinned.number !== target) {
    bad("confirmation_target_mismatch", "/pinned/number", `expected ${target}, got ${pinned.number}`);
  }
  return {
    boundary: { kind: "execution_block", block: { ...pinned } },
    downgrade: {
      chainId: pinned.chainId,
      requested: "finalized",
      used: "confirmations",
      confirmationDepth: policy.confirmationDepth,
      reasonCode: "finality_tag_unsupported",
    },
  };
}

// Multi-chain (spec: never atomic): asOfTimestamp = the OLDEST head timestamp; each
// chain pins its highest block whose timestamp <= asOf, drawn from its head plus any
// caller-supplied candidates for that chain. Deterministic: output order is by chainId,
// selection is max-by-number, so input order can never change the result.
export function selectTimeAligned(
  heads: readonly PinnedBlock[],
  candidates: readonly PinnedBlock[],
): TimeAlignedSelection {
  if (heads.length < 2) {
    bad("insufficient_chains", "/heads", `multi-chain selection needs >=2 chains, got ${heads.length}`);
  }
  heads.forEach((h, i) => validateBlock(`/heads/${i}`, h));
  candidates.forEach((c, i) => validateBlock(`/candidates/${i}`, c));
  // Codex W3 review P1#6: alignment anchors must carry accepted finality — an
  // unconfirmed head is exactly what the single-chain selectors refuse to pin, and it
  // cannot re-enter through the multi-chain door.
  for (const [what, arr] of [["heads", heads], ["candidates", candidates]] as const) {
    arr.forEach((b, i) => {
      if (b.finality !== "finalized" && b.finality !== "confirmations") {
        bad("finality_mismatch", `/${what}/${i}/finality`, b.finality);
      }
    });
  }
  const byChain = new Map<number, { head: PinnedBlock; pool: PinnedBlock[] }>();
  for (const h of heads) {
    if (byChain.has(h.chainId)) bad("duplicate_chain_head", "/heads", String(h.chainId));
    byChain.set(h.chainId, { head: h, pool: [h] });
  }
  for (const c of candidates) {
    const entry = byChain.get(c.chainId);
    if (!entry) bad("candidate_without_head", "/candidates", String(c.chainId));
    if (cmpDecimal(c.number, entry!.head.number) > 0) {
      bad("candidate_above_head", "/candidates", `${c.number} > head ${entry!.head.number} on chain ${c.chainId}`);
    }
    entry!.pool.push(c);
  }
  // Oldest finalized head bounds the alignment: fixed-width UTC Z strings compare
  // lexicographically, so min() is chronological.
  const asOfTimestamp = [...byChain.values()]
    .map((e) => e.head.timestamp)
    .reduce((a, b) => (a <= b ? a : b));
  const boundaries = [...byChain.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chainId, { pool }]) => {
      const eligible = pool.filter((b) => b.timestamp <= asOfTimestamp);
      if (eligible.length === 0) {
        bad("no_block_at_or_before_asof", `/chains/${chainId}`, `asOf ${asOfTimestamp}`);
      }
      const pick = eligible.reduce((best, b) => (cmpDecimal(b.number, best.number) > 0 ? b : best));
      return { kind: "execution_block" as const, block: { ...pick } };
    });
  return { label: "time_aligned", asOfTimestamp, boundaries };
}
