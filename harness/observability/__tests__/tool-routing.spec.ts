import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { emit, type ToolRoutingEntry } from '../tool-routing.js';

let dir: string;
let logPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tool-routing-'));
  logPath = join(dir, 'tool-routing.jsonl');
});

afterEach(() => {
  rmSync(dir, { recursive: true });
});

const FIXTURE: ToolRoutingEntry = {
  ts: '2026-05-06T00:00:00Z',
  provider: 'venice',
  variant: ':nitro',
  cache_hit: false,
  latency_ms: 312,
  tokens: { input: 1024, output: 256 },
  cost_usd: 0.0014,
};

describe('emit', () => {
  it('writes a valid JSON line', () => {
    emit(FIXTURE, logPath);
    const line = readFileSync(logPath, 'utf8').trimEnd();
    expect(JSON.parse(line)).toEqual(FIXTURE);
  });

  it('appends multiple entries as separate lines', () => {
    emit(FIXTURE, logPath);
    emit({ ...FIXTURE, provider: 'openrouter', variant: ':floor', cost_usd: 0.0008 }, logPath);
    const lines = readFileSync(logPath, 'utf8').trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).provider).toBe('venice');
    expect(JSON.parse(lines[1]!).provider).toBe('openrouter');
  });

  it('jsonl shape matches snapshot', () => {
    emit(FIXTURE, logPath);
    const parsed = JSON.parse(readFileSync(logPath, 'utf8').trimEnd());
    expect(parsed).toMatchInlineSnapshot(`
      {
        "cache_hit": false,
        "cost_usd": 0.0014,
        "latency_ms": 312,
        "provider": "venice",
        "tokens": {
          "input": 1024,
          "output": 256,
        },
        "ts": "2026-05-06T00:00:00Z",
        "variant": ":nitro",
      }
    `);
  });
});
