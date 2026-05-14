import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadConfig,
  loadCachedBearer,
  saveBearer,
  loadOrMintBearer,
  mintVeniceKey,
  callInference,
  type VeniceConfig,
} from '../venice.js';

// ── Shared fixtures ─────────────────────────────────────────────────

const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';

const BASE_ENV: Record<string, string> = {
  DIEM_TOKEN_ADDRESS: DUMMY_ADDRESS,
  VVV_STAKING_ADDRESS: DUMMY_ADDRESS,
  RPC_URL: 'https://base-mainnet.example.com',
};

const MOCK_SIGNER = {
  address: DUMMY_ADDRESS as `0x${string}`,
  signMessage: vi.fn().mockResolvedValue('0xsignature'),
  signTypedData: vi.fn(),
};

let dir: string;
let logPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'venice-'));
  logPath = join(dir, 'tool-routing.jsonl');
  Object.entries(BASE_ENV).forEach(([k, v]) => (process.env[k] = v));
});

afterEach(() => {
  rmSync(dir, { recursive: true });
  Object.keys(BASE_ENV).forEach(k => delete process.env[k]);
  delete process.env['VENICE_API_KEY'];
  delete process.env['VENICE_STAKING_ADDRESS'];
  vi.clearAllMocks();
});

// ── loadConfig ──────────────────────────────────────────────────────

describe('loadConfig', () => {
  it('loads required env vars', () => {
    const cfg = loadConfig();
    expect(cfg.diemAddress).toBe(DUMMY_ADDRESS);
    expect(cfg.stakingAddress).toBe(DUMMY_ADDRESS);
    expect(cfg.rpcUrl).toBe('https://base-mainnet.example.com');
  });

  it('falls back to VENICE_STAKING_ADDRESS when VVV_STAKING_ADDRESS is absent', () => {
    delete process.env['VVV_STAKING_ADDRESS'];
    process.env['VENICE_STAKING_ADDRESS'] = DUMMY_ADDRESS;
    const cfg = loadConfig();
    expect(cfg.stakingAddress).toBe(DUMMY_ADDRESS);
  });

  it('applies defaults for optional vars', () => {
    const cfg = loadConfig();
    expect(cfg.veniceApiBase).toBe('https://api.venice.ai/api/v1');
    expect(cfg.model).toBe('llama-3.3-70b');
    expect(cfg.bearerCachePath).toBe('memory/venice-bearer.json');
  });

  it('throws when DIEM_TOKEN_ADDRESS is missing', () => {
    delete process.env['DIEM_TOKEN_ADDRESS'];
    expect(() => loadConfig()).toThrow('DIEM_TOKEN_ADDRESS is required');
  });

  it('throws when both VVV_STAKING_ADDRESS and VENICE_STAKING_ADDRESS are missing', () => {
    delete process.env['VVV_STAKING_ADDRESS'];
    expect(() => loadConfig()).toThrow('VENICE_STAKING_ADDRESS is required');
  });

  it('throws when RPC_URL is missing', () => {
    delete process.env['RPC_URL'];
    expect(() => loadConfig()).toThrow('RPC_URL is required');
  });
});

// ── Bearer cache ────────────────────────────────────────────────────

describe('bearer cache', () => {
  it('returns null when cache file does not exist', () => {
    expect(loadCachedBearer(join(dir, 'nonexistent.json'))).toBeNull();
  });

  it('round-trips a bearer through save + load', () => {
    const cachePath = join(dir, 'memory', 'venice-bearer.json');
    const { writeFileSync, mkdirSync } = require('node:fs');
    mkdirSync(join(dir, 'memory'), { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ bearer: 'vn-test-bearer-abc123' }), 'utf8');
    expect(loadCachedBearer(cachePath)).toBe('vn-test-bearer-abc123');
  });

  it('returns null on malformed cache file', () => {
    const { writeFileSync } = require('node:fs');
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, 'not json', 'utf8');
    expect(loadCachedBearer(bad)).toBeNull();
  });
});

// ── mintVeniceKey ───────────────────────────────────────────────────

describe('mintVeniceKey', () => {
  it('follows generate_web3_key GET → sign → POST flow', async () => {
    const cfg = loadConfig();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { token: 'test-jwt-token' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { apiKey: 'vk-inference-key' } }) });

    const key = await mintVeniceKey(cfg, MOCK_SIGNER, mockFetch as unknown as typeof fetch);

    expect(key).toBe('vk-inference-key');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const [getCall, postCall] = mockFetch.mock.calls;
    expect(getCall![0]).toContain('/api_keys/generate_web3_key');
    expect(postCall![0]).toContain('/api_keys/generate_web3_key');

    const body = JSON.parse(postCall![1]!.body as string);
    expect(body.address).toBe(DUMMY_ADDRESS);
    expect(body.token).toBe('test-jwt-token');
    expect(body.signature).toBe('0xsignature');
    expect(body.apiKeyType).toBe('INFERENCE');
  });

  it('throws on token fetch failure', async () => {
    const cfg = loadConfig();
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(mintVeniceKey(cfg, MOCK_SIGNER, mockFetch as unknown as typeof fetch))
      .rejects.toThrow('Venice token fetch failed: 503');
  });

  it('throws on key mint failure', async () => {
    const cfg = loadConfig();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { token: 'tok' } }) })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(mintVeniceKey(cfg, MOCK_SIGNER, mockFetch as unknown as typeof fetch))
      .rejects.toThrow('Venice key mint failed: 403');
  });
});

// ── loadOrMintBearer ────────────────────────────────────────────────

describe('loadOrMintBearer', () => {
  it('returns VENICE_API_KEY env var without calling Venice', async () => {
    process.env['VENICE_API_KEY'] = 'env-api-key-xyz';
    const cfg = loadConfig();
    const mockFetch = vi.fn();
    const bearer = await loadOrMintBearer(cfg, MOCK_SIGNER, mockFetch as unknown as typeof fetch);
    expect(bearer).toBe('env-api-key-xyz');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns cached bearer without calling Venice', async () => {
    const { writeFileSync, mkdirSync } = require('node:fs');
    const cachePath = join(dir, 'memory', 'bearer.json');
    mkdirSync(join(dir, 'memory'), { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ bearer: 'cached-bearer-999' }), 'utf8');

    const cfg: VeniceConfig = { ...loadConfig(), bearerCachePath: cachePath };
    const mockFetch = vi.fn();
    const bearer = await loadOrMintBearer(cfg, MOCK_SIGNER, mockFetch as unknown as typeof fetch);

    expect(bearer).toBe('cached-bearer-999');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── callInference ───────────────────────────────────────────────────

describe('callInference', () => {
  it('calls Venice completions and logs via tool-routing', async () => {
    const cfg = loadConfig();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from Venice' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    });

    const result = await callInference(
      cfg,
      'test-bearer',
      { prompt: 'say hello' },
      logPath,
      mockFetch as unknown as typeof fetch,
    );

    expect(result).toBe('Hello from Venice');

    const { readFileSync } = require('node:fs');
    const line = JSON.parse(readFileSync(logPath, 'utf8').trimEnd());
    expect(line.provider).toBe('venice');
    expect(line.tokens).toEqual({ input: 10, output: 5 });
    expect(line.cost_usd).toBe(0);
    expect(line.cache_hit).toBe(false);
  });

  it('throws on non-ok inference response', async () => {
    const cfg = loadConfig();
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(
      callInference(cfg, 'bearer', { prompt: 'x' }, logPath, mockFetch as unknown as typeof fetch),
    ).rejects.toThrow('Venice inference failed: 429');
  });
});
