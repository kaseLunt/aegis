// W4 code-hash-scoped ABI registry (ENGINEERING_SPEC §Deployment code identity: select
// an ABI only after the terminal runtime hash matches). The registry is keyed by OUR
// sha256 content addressing over runtime code bytes — never by address, label, or proxy
// guesswork. Selection before a terminal hash match is the failure mode this module
// exists to prevent: an unresolved identity is refused, whatever the registry holds.
import { IdentityError, type IdentityResult } from "./resolve";

const SHA256_STRICT = /^sha256:[0-9a-f]{64}$/;

export interface AbiRegistryEntry {
  runtimeCodeHash: string;
  abiId: string;
}

export interface AbiRegistry {
  readonly byRuntimeCodeHash: ReadonlyMap<string, string>;
}

export type AbiSelection =
  | { status: "selected"; abiId: string; runtimeCodeHash: string }
  | { status: "refused"; reasonCodes: string[] };

export function createAbiRegistry(entries: readonly AbiRegistryEntry[]): AbiRegistry {
  const byRuntimeCodeHash = new Map<string, string>();
  for (const entry of entries) {
    if (!SHA256_STRICT.test(entry.runtimeCodeHash) || typeof entry.abiId !== "string" || entry.abiId.length === 0) {
      throw new IdentityError(
        "invalid_registry_entry",
        `${String(entry.runtimeCodeHash)} -> ${String(entry.abiId)}`,
      );
    }
    if (byRuntimeCodeHash.has(entry.runtimeCodeHash)) {
      throw new IdentityError("duplicate_registry_hash", entry.runtimeCodeHash);
    }
    byRuntimeCodeHash.set(entry.runtimeCodeHash, entry.abiId);
  }
  return { byRuntimeCodeHash };
}

// Selection requires the FULL chain of custody (Codex W4 review finding 3): a resolved
// identity, whose terminal hash EQUALS the manifest expectation, and a registry entry
// for that hash. Registry membership alone must never authorize decoding an unapproved
// upgrade — the spec selects an ABI only after the terminal runtime hash matches.
export function selectAbi(
  registry: AbiRegistry,
  identity: IdentityResult,
  expectedRuntimeCodeHash: string | undefined,
): AbiSelection {
  if (identity.status !== "resolved" || identity.runtimeCodeHash === null) {
    return { status: "refused", reasonCodes: ["identity_unresolved"] };
  }
  if (expectedRuntimeCodeHash === undefined) {
    return { status: "refused", reasonCodes: ["missing_expectation"] };
  }
  if (!SHA256_STRICT.test(expectedRuntimeCodeHash)) {
    throw new IdentityError("invalid_expectation", expectedRuntimeCodeHash);
  }
  if (identity.runtimeCodeHash !== expectedRuntimeCodeHash) {
    return { status: "refused", reasonCodes: ["manifest_mismatch"] };
  }
  const abiId = registry.byRuntimeCodeHash.get(identity.runtimeCodeHash);
  if (abiId === undefined) {
    return { status: "refused", reasonCodes: ["abi_unregistered"] };
  }
  return { status: "selected", abiId, runtimeCodeHash: identity.runtimeCodeHash };
}
