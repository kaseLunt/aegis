// M0 identifier module, superseded in W1: identifiers are now real content addresses —
// sha256 over RFC 8785 (JCS) bytes, delegating to the single JCS implementation in
// ./report/canonical. The previous FNV-1a/localeCompare version was non-cryptographic and
// locale-dependent (nondeterministic across environments), which the byte-identity
// contract cannot tolerate.
import { createHash } from "node:crypto";
import { jcsSerialize } from "./report/canonical";

export function canonicalJson(value: unknown): string {
  return jcsSerialize(value);
}

export function stableHash(value: unknown): string {
  return createHash("sha256").update(Buffer.from(canonicalJson(value), "utf-8")).digest("hex");
}

export function reportId(prefix: string, value: unknown): string {
  return `${prefix}-${stableHash(value).slice(0, 12)}`;
}
