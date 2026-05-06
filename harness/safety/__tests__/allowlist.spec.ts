import { describe, expect, it } from 'vitest';
import {
  ALLOWLIST_POLICY,
  AllowlistViolation,
  assertAllowed,
  isAllowed,
} from '../allowlist.js';

describe('isAllowed — positive cases', () => {
  it.each([
    'identity/SOUL.md',
    'identity/STYLE.md',
    'memory/foo.md',
    'memory/nested/bar.md',
    'memory/2026/q2/notes.md',
    'wiki/baz.md',
    'wiki/projects/launchpad/index.md',
  ])('allows %s', (path) => {
    expect(isAllowed(path)).toBe(true);
  });

  it('allows leading "./" prefixes', () => {
    expect(isAllowed('./identity/SOUL.md')).toBe(true);
    expect(isAllowed('./memory/foo.md')).toBe(true);
  });

  it('allows leading "/" prefixes', () => {
    expect(isAllowed('/identity/SOUL.md')).toBe(true);
  });
});

describe('isAllowed — rejection cases', () => {
  it.each([
    // harness spine
    'harness/tick.ts',
    'harness/safety/wallet.ts',
    'harness/safety/allowlist.ts',
    'harness/index.ts',
    // scripts and tooling
    'scripts/lint-identity.ts',
    'scripts/__tests__/lint-identity.spec.ts',
    // genesis-locked identity files
    'identity/SCHEMA.md',
    'identity/SOUL.genesis.md',
    'identity/STYLE.genesis.md',
    'identity/influences.md',
    'identity/README.md',
    // examples are deployer-appendable, NOT agent-writable
    'identity/examples/good-outputs.md',
    'identity/examples/bad-outputs.md',
    'identity/examples/promoted/foo.md',
    // root spec / config / CI
    'package.json',
    'tsconfig.json',
    'README.md',
    'CLAUDE.md',
    'SECTION_5.md',
    'ARCHITECTURE_v2.md',
    'BUNDLE.md',
    'PLAN.md',
    'MVP_PLAN.md',
    'DECISIONS.md',
    '.gitignore',
    '.github/workflows/ci.yml',
    // platform / dune
    'platform/STATUS.md',
    'dune/agent-fleet-overview.sql',
  ])('rejects %s', (path) => {
    expect(isAllowed(path)).toBe(false);
  });

  it('rejects empty strings and non-strings', () => {
    expect(isAllowed('')).toBe(false);
    // @ts-expect-error — runtime guard for non-string input
    expect(isAllowed(null)).toBe(false);
    // @ts-expect-error
    expect(isAllowed(undefined)).toBe(false);
    // @ts-expect-error
    expect(isAllowed(42)).toBe(false);
  });

  it('rejects paths that look allowed but aren\'t', () => {
    // Prefix not followed by content
    expect(isAllowed('memory/')).toBe(false);
    expect(isAllowed('wiki/')).toBe(false);
    // Non-allowlisted identity .md files
    expect(isAllowed('identity/SOUL.md.bak')).toBe(false);
    expect(isAllowed('identity/SOULsomething.md')).toBe(false);
    // Lookalike top-level dirs
    expect(isAllowed('memorystore/foo.md')).toBe(false);
    expect(isAllowed('wikiclone/foo.md')).toBe(false);
  });
});

describe('isAllowed — path-traversal rejection', () => {
  it.each([
    'memory/../harness/tick.ts',
    'memory/foo/../../harness/x.ts',
    '../identity/SOUL.md',
    'wiki/../../etc/passwd',
    '..',
    '../',
  ])('rejects traversal in %s', (path) => {
    expect(isAllowed(path)).toBe(false);
  });

  it('rejects double-slash patterns', () => {
    expect(isAllowed('memory//foo.md')).toBe(false);
    expect(isAllowed('wiki//')).toBe(false);
  });
});

describe('assertAllowed', () => {
  it('returns void for allowed paths', () => {
    expect(() => assertAllowed('memory/foo.md')).not.toThrow();
    expect(() => assertAllowed('identity/SOUL.md')).not.toThrow();
  });

  it('throws AllowlistViolation specifically for rejected paths', () => {
    expect(() => assertAllowed('harness/tick.ts')).toThrow(AllowlistViolation);
  });

  it('throws an error whose message names the rejected path', () => {
    try {
      assertAllowed('package.json');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AllowlistViolation);
      expect((err as AllowlistViolation).path).toBe('package.json');
      expect((err as Error).message).toContain('package.json');
    }
  });

  it('AllowlistViolation has the correct name', () => {
    try {
      assertAllowed('foo');
    } catch (err) {
      expect((err as Error).name).toBe('AllowlistViolation');
    }
  });
});

describe('ALLOWLIST_POLICY', () => {
  it('exposes the allowed files and prefixes', () => {
    expect(ALLOWLIST_POLICY.files).toContain('identity/SOUL.md');
    expect(ALLOWLIST_POLICY.files).toContain('identity/STYLE.md');
    expect(ALLOWLIST_POLICY.prefixes).toContain('memory/');
    expect(ALLOWLIST_POLICY.prefixes).toContain('wiki/');
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ALLOWLIST_POLICY)).toBe(true);
  });
});
