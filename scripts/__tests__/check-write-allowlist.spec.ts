import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no types
import { isAllowed } from '../check-write-allowlist.mjs';

describe('write-allowlist — allowed (agent self-evolution surface)', () => {
  it.each([
    'memory/goals.json',
    'memory/logs/2026-06-04.md',
    'memory/diem-claims.jsonl',
    'memory/cron-state.json',
    'memory/skill-health/tick.json',
    'wiki/projects/index.md',
    'skills/claim-diem/SKILL.md',          // self-evolving a skill is allowed
    '.claude/skills/build/SKILL.md',
    'docs/status.md',                       // heartbeat
    'dashboard/outputs/.pending-tick.md',
    '.outputs/tick.md',
    'identity/SOUL.md',
    'identity/STYLE.md',
    'identity/influences.md',
  ])('allows %s', (p) => {
    expect(isAllowed(p)).toBe(true);
  });
});

describe('write-allowlist — blocked (capability surface + locked files)', () => {
  it.each([
    'harness/safety/wallet.ts',            // fund signing chokepoint
    'harness/tick.ts',
    'scripts/claim-and-allocate.ts',       // fund scripts
    'scripts/check-write-allowlist.mjs',   // the guard itself
    '.github/workflows/aeon.yml',          // self-widening tool grants
    '.github/workflows/messages.yml',
    '.claude/settings.json',               // hook config
    'platform/constants.ts',               // address book
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    '.husky/pre-commit',
    'CLAUDE.md',
    'identity/SOUL.genesis.md',            // genesis is locked even though identity/ has allowed files
    'identity/STYLE.genesis.md',
    'identity/SCHEMA.md',
  ])('blocks %s', (p) => {
    expect(isAllowed(p)).toBe(false);
  });
});

describe('write-allowlist — edge cases', () => {
  it('blocks a genesis file even nested under an allowed-looking path', () => {
    expect(isAllowed('identity/examples/promoted/x.genesis.md')).toBe(false);
  });
  it('allows a normal promoted example', () => {
    expect(isAllowed('identity/examples/promoted/good-output.md')).toBe(true);
  });
  it('does not allow a bare identity/ file that is not explicitly listed', () => {
    expect(isAllowed('identity/index.ts')).toBe(false);
  });
});
