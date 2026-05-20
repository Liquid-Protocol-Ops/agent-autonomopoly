import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyMessage } from 'viem';
import {
  loadSignerFromEnv,
  loadPrivyConfig,
  loadSignerFromPrivy,
  makeTxSenderFromPrivy,
} from '../wallet.js';

// Known fixture: a deterministic private key with a well-known address.
// This is a public test vector; do not use this key for anything real.
const FIXTURE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const FIXTURE_ADDRESS = '0x14791697260E4c9A71f18484C9f997B308e59325';

describe('loadSignerFromEnv — happy path', () => {
  let savedEnv: string | undefined;
  beforeEach(() => {
    savedEnv = process.env['AGENT_PRIVATE_KEY'];
    process.env['AGENT_PRIVATE_KEY'] = FIXTURE_KEY;
  });
  afterEach(() => {
    if (savedEnv === undefined) delete process.env['AGENT_PRIVATE_KEY'];
    else process.env['AGENT_PRIVATE_KEY'] = savedEnv;
  });

  it('derives the correct address from the fixture key', () => {
    const signer = loadSignerFromEnv();
    expect(signer.address.toLowerCase()).toBe(FIXTURE_ADDRESS.toLowerCase());
  });

  it('signs a message and the signature verifies', async () => {
    const signer = loadSignerFromEnv();
    const message = 'hello world';
    const signature = await signer.signMessage({ message });
    const valid = await verifyMessage({
      address: signer.address,
      message,
      signature,
    });
    expect(valid).toBe(true);
  });

  it('accepts the key with or without the 0x prefix', () => {
    process.env['AGENT_PRIVATE_KEY'] = FIXTURE_KEY.slice(2); // strip 0x
    const signer = loadSignerFromEnv();
    expect(signer.address.toLowerCase()).toBe(FIXTURE_ADDRESS.toLowerCase());
  });
});

describe('loadSignerFromEnv — key isolation', () => {
  let savedEnv: string | undefined;
  beforeEach(() => {
    savedEnv = process.env['AGENT_PRIVATE_KEY'];
    process.env['AGENT_PRIVATE_KEY'] = FIXTURE_KEY;
  });
  afterEach(() => {
    if (savedEnv === undefined) delete process.env['AGENT_PRIVATE_KEY'];
    else process.env['AGENT_PRIVATE_KEY'] = savedEnv;
  });

  it('does not expose the private key via Object.keys', () => {
    const signer = loadSignerFromEnv();
    const keys = Object.keys(signer);
    for (const k of keys) {
      expect(k.toLowerCase()).not.toMatch(/private|secret|key$|raw/);
    }
  });

  it('does not expose the private key via JSON.stringify', () => {
    const signer = loadSignerFromEnv();
    const json = JSON.stringify(signer);
    // The fixture key (with and without 0x prefix) must not appear in the
    // JSON serialization.
    expect(json).not.toContain(FIXTURE_KEY);
    expect(json).not.toContain(FIXTURE_KEY.slice(2));
  });

  it('only exposes address + sign methods', () => {
    const signer = loadSignerFromEnv();
    const keys = Object.keys(signer).sort();
    expect(keys).toEqual(['address', 'signMessage', 'signTypedData']);
  });
});

describe('loadSignerFromEnv — error handling', () => {
  let savedEnv: string | undefined;
  beforeEach(() => {
    savedEnv = process.env['AGENT_PRIVATE_KEY'];
  });
  afterEach(() => {
    if (savedEnv === undefined) delete process.env['AGENT_PRIVATE_KEY'];
    else process.env['AGENT_PRIVATE_KEY'] = savedEnv;
  });

  it('throws when AGENT_PRIVATE_KEY is unset', () => {
    delete process.env['AGENT_PRIVATE_KEY'];
    expect(() => loadSignerFromEnv()).toThrow(/AGENT_PRIVATE_KEY is required/);
  });

  it('throws when AGENT_PRIVATE_KEY is empty', () => {
    process.env['AGENT_PRIVATE_KEY'] = '';
    expect(() => loadSignerFromEnv()).toThrow(/AGENT_PRIVATE_KEY is required/);
  });

  it('throws when AGENT_PRIVATE_KEY is malformed (wrong length)', () => {
    process.env['AGENT_PRIVATE_KEY'] = '0xdeadbeef';
    expect(() => loadSignerFromEnv()).toThrow(/malformed/);
  });

  it('throws when AGENT_PRIVATE_KEY contains non-hex characters', () => {
    process.env['AGENT_PRIVATE_KEY'] =
      '0xZZZZ567890123456789012345678901234567890123456789012345678901234';
    expect(() => loadSignerFromEnv()).toThrow(/malformed/);
  });

  it('does not echo the bad value in the malformed-key error message', () => {
    const badKey = '0xZZZZ567890123456789012345678901234567890123456789012345678901234';
    process.env['AGENT_PRIVATE_KEY'] = badKey;
    try {
      loadSignerFromEnv();
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as Error).message).not.toContain(badKey);
      expect((err as Error).message).not.toContain(badKey.slice(2));
      expect((err as Error).message).not.toContain('ZZZZ');
    }
  });
});

// ── Privy substrate ──────────────────────────────────────────────────

const PRIVY_ENV: Record<string, string> = {
  PRIVY_APP_ID: 'test-app-id',
  PRIVY_APP_SECRET: 'test-app-secret',
  PRIVY_WALLET_ID: 'test-wallet-id',
};

const MOCK_WALLET_ADDRESS = '0x14791697260E4c9A71f18484C9f997B308e59325' as `0x${string}`;

describe('loadPrivyConfig', () => {
  beforeEach(() => Object.entries(PRIVY_ENV).forEach(([k, v]) => (process.env[k] = v)));
  afterEach(() => { Object.keys(PRIVY_ENV).forEach(k => delete process.env[k]); vi.clearAllMocks(); });

  it('loads required env vars', () => {
    const cfg = loadPrivyConfig();
    expect(cfg.appId).toBe('test-app-id');
    expect(cfg.appSecret).toBe('test-app-secret');
    expect(cfg.walletId).toBe('test-wallet-id');
  });

  it('throws when PRIVY_APP_ID is missing', () => {
    delete process.env['PRIVY_APP_ID'];
    expect(() => loadPrivyConfig()).toThrow('PRIVY_APP_ID is required');
  });

  it('throws when PRIVY_APP_SECRET is missing', () => {
    delete process.env['PRIVY_APP_SECRET'];
    expect(() => loadPrivyConfig()).toThrow('PRIVY_APP_SECRET is required');
  });

  it('throws when PRIVY_WALLET_ID is missing', () => {
    delete process.env['PRIVY_WALLET_ID'];
    expect(() => loadPrivyConfig()).toThrow('PRIVY_WALLET_ID is required');
  });
});

describe('loadSignerFromPrivy', () => {
  afterEach(() => { vi.clearAllMocks(); });

  const cfg = { appId: 'app', appSecret: 'secret', walletId: 'wid' };

  it('resolves the wallet address via GET /v1/wallets/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: MOCK_WALLET_ADDRESS }),
    });
    const signer = await loadSignerFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    expect(signer.address).toBe(MOCK_WALLET_ADDRESS);
    expect(mockFetch.mock.calls[0]![0]).toContain('/v1/wallets/wid');
  });

  it('passes Basic auth and privy-app-id headers', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: MOCK_WALLET_ADDRESS }),
    });
    await loadSignerFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    const headers = mockFetch.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers['privy-app-id']).toBe('app');
    expect(headers['Authorization']).toMatch(/^Basic /);
  });

  it('throws on non-ok get-wallet response', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(loadSignerFromPrivy(cfg, mockFetch as unknown as typeof fetch))
      .rejects.toThrow('Privy get-wallet failed: 401');
  });

  it('signMessage calls personal_sign and returns the signature', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ address: MOCK_WALLET_ADDRESS }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { signature: '0xabc123', encoding: 'hex' } }),
      });
    const signer = await loadSignerFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    const sig = await signer.signMessage({ message: 'hello' });
    expect(sig).toBe('0xabc123');
    const body = JSON.parse(mockFetch.mock.calls[1]![1]!.body as string);
    expect(body.method).toBe('personal_sign');
    expect(body.params.message).toBe('hello');
    expect(body.params.encoding).toBe('utf-8');
  });

  it('signMessage throws on non-ok response', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ address: MOCK_WALLET_ADDRESS }) })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    const signer = await loadSignerFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    await expect(signer.signMessage({ message: 'x' })).rejects.toThrow('Privy personal_sign failed: 403');
  });
});

describe('makeTxSenderFromPrivy', () => {
  afterEach(() => { vi.clearAllMocks(); });

  const cfg = { appId: 'app', appSecret: 'secret', walletId: 'wid' };

  it('sends eth_sendTransaction and returns the tx hash', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { hash: '0xdeadbeef', transaction_id: 'tid' } }),
    });
    const txSender = makeTxSenderFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    const hash = await txSender({
      to: '0x1234567890123456789012345678901234567890',
      data: '0xabcd',
    });
    expect(hash).toBe('0xdeadbeef');
    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
    expect(body.method).toBe('eth_sendTransaction');
    expect(body.caip2).toBe('eip155:8453');
    expect(body.params.transaction.to).toBe('0x1234567890123456789012345678901234567890');
    expect(body.params.transaction.data).toBe('0xabcd');
  });

  it('throws on non-ok send-transaction response', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });
    const txSender = makeTxSenderFromPrivy(cfg, mockFetch as unknown as typeof fetch);
    await expect(txSender({ to: '0x0000000000000000000000000000000000000001', data: '0x' }))
      .rejects.toThrow('Privy eth_sendTransaction failed: 500');
  });
});
