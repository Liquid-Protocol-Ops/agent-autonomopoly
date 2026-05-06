// Mutation-surface enforcement for the agent's self-modifications.
//
// The agent can write to exactly two kinds of paths (per SECTION_5.md
// "Mutation surface (allowlist)"):
//
//   1. `identity/SOUL.md` and `identity/STYLE.md` — mutable working copies.
//   2. `memory/**` and `wiki/**`  — agent's working notebook.
//
// Everything else — harness/, scripts/, identity/SCHEMA.md,
// identity/SOUL.genesis.md, identity/STYLE.genesis.md, identity/influences.md,
// identity/examples/**, package.json, README.md, CLAUDE.md, the spec docs —
// is off-limits to the agent's self-modification path.
//
// This module is the single source of truth. No other module duplicates the
// patterns. Pure functions; no I/O.

export class AllowlistViolation extends Error {
  public readonly path: string;
  constructor(path: string) {
    super(`path is not in the agent mutation allowlist: ${path}`);
    this.name = 'AllowlistViolation';
    this.path = path;
  }
}

// Exact-match files the agent may write.
const ALLOWED_FILES: ReadonlySet<string> = new Set([
  'identity/SOUL.md',
  'identity/STYLE.md',
]);

// Directory prefixes (with trailing slash) under which all paths are allowed.
const ALLOWED_PREFIXES: readonly string[] = [
  'memory/',
  'wiki/',
];

function normalize(path: string): string {
  let p = path;
  // Strip leading "./" or "/".
  while (p.startsWith('./')) p = p.slice(2);
  if (p.startsWith('/')) p = p.slice(1);
  return p;
}

function containsTraversal(path: string): boolean {
  // Reject any segment equal to ".." — covers leading and embedded traversal.
  const segments = path.split('/');
  return segments.includes('..');
}

export function isAllowed(path: string): boolean {
  if (typeof path !== 'string' || path === '') return false;
  if (containsTraversal(path)) return false;
  const normalized = normalize(path);
  if (containsTraversal(normalized)) return false;
  if (ALLOWED_FILES.has(normalized)) return true;
  for (const prefix of ALLOWED_PREFIXES) {
    if (normalized.startsWith(prefix) && normalized.length > prefix.length) {
      // Disallow empty trailing segments like "memory/" or "memory//foo".
      if (!normalized.includes('//')) return true;
    }
  }
  return false;
}

export function assertAllowed(path: string): void {
  if (!isAllowed(path)) {
    throw new AllowlistViolation(path);
  }
}

// Exported so callers (e.g. tests, future introspection tools, status-api)
// can read the policy without re-implementing it. Treat as read-only.
export const ALLOWLIST_POLICY = Object.freeze({
  files: Array.from(ALLOWED_FILES),
  prefixes: [...ALLOWED_PREFIXES],
});
