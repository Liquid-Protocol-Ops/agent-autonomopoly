import { describe, it, expect, vi, afterEach } from 'vitest';
import { provisionAgentWallet } from '../steps/provision-wallet.js';
import { agentRepoName, forkTemplateRepo } from '../steps/fork-repo.js';
import { writeRegistryEntry, readRegistry } from '../steps/write-registry.js';
import { unlinkSync, existsSync } from 'node:fs';

// ── provision-wallet ──────────────────────────────────────────────────

describe('provisionAgentWallet', () => {
  it('returns wallet id and address on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'wallet-abc', address: '0xDEAD' }),
    });

    const result = await provisionAgentWallet(
      { appId: 'app-1', appSecret: 'secret-1' },
      fetchFn as unknown as typeof fetch,
    );

    expect(result.walletId).toBe('wallet-abc');
    expect(result.address).toBe('0xDEAD');
  });

  it('sends to the correct Privy endpoint', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'w', address: '0x1' }),
    });

    await provisionAgentWallet(
      { appId: 'myapp', appSecret: 'mysecret' },
      fetchFn as unknown as typeof fetch,
    );

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.privy.io/v1/wallets',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      provisionAgentWallet({ appId: 'a', appSecret: 'b' }, fetchFn as unknown as typeof fetch),
    ).rejects.toThrow('401');
  });
});

// ── fork-repo ─────────────────────────────────────────────────────────

describe('agentRepoName', () => {
  it('lowercases and hyphenates the agent name', () => {
    expect(agentRepoName('My Cool Agent')).toBe('agent-my-cool-agent');
  });

  it('strips leading/trailing hyphens', () => {
    expect(agentRepoName('  alpha  ')).toBe('agent-alpha');
  });

  it('collapses multiple non-alphanumeric chars to a single hyphen', () => {
    expect(agentRepoName('Alpha!!! Beta')).toBe('agent-alpha-beta');
  });
});

describe('forkTemplateRepo', () => {
  const config = {
    token: 'ghp_test',
    templateRepo: 'Liquid-Protocol-Ops/deploy-autonomous',
    targetOrg: 'Liquid-Protocol-Ops',
  };

  it('returns full_name and html_url on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        full_name: 'Liquid-Protocol-Ops/agent-alpha',
        clone_url: 'https://github.com/Liquid-Protocol-Ops/agent-alpha.git',
        html_url: 'https://github.com/Liquid-Protocol-Ops/agent-alpha',
      }),
    });

    const result = await forkTemplateRepo(config, 'agent-alpha', fetchFn as unknown as typeof fetch);
    expect(result.fullName).toBe('Liquid-Protocol-Ops/agent-alpha');
    expect(result.htmlUrl).toBe('https://github.com/Liquid-Protocol-Ops/agent-alpha');
  });

  it('posts to the correct GitHub endpoint', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ full_name: 'x/y', clone_url: 'c', html_url: 'h' }),
    });

    await forkTemplateRepo(config, 'agent-test', fetchFn as unknown as typeof fetch);

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.github.com/repos/Liquid-Protocol-Ops/deploy-autonomous/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-ok GitHub response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('Unprocessable'),
    });

    await expect(
      forkTemplateRepo(config, 'agent-test', fetchFn as unknown as typeof fetch),
    ).rejects.toThrow('422');
  });
});

// ── write-registry ────────────────────────────────────────────────────

describe('writeRegistryEntry + readRegistry', () => {
  const tmpPath = '/tmp/test-registry-spec.json';

  afterEach(() => {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  });

  const entry = {
    id: 'agent-alpha',
    name: 'Alpha',
    wallet: '0xAAAA' as `0x${string}`,
    walletId: 'wallet-1',
    tokenAddress: '0xTOKEN' as `0x${string}`,
    deployTxHash: '0xTX' as `0x${string}`,
    repoUrl: 'https://github.com/org/repo',
    createdAt: '2026-05-13T00:00:00.000Z',
  };

  it('creates the registry file and writes the entry', () => {
    writeRegistryEntry(tmpPath, entry);
    const registry = readRegistry(tmpPath);
    expect(registry).toHaveLength(1);
    expect(registry[0]?.id).toBe('agent-alpha');
  });

  it('appends to an existing registry', () => {
    writeRegistryEntry(tmpPath, entry);
    writeRegistryEntry(tmpPath, { ...entry, id: 'agent-beta' });
    expect(readRegistry(tmpPath)).toHaveLength(2);
  });

  it('readRegistry returns empty array for missing file', () => {
    expect(readRegistry('/tmp/nonexistent-registry-xyz.json')).toEqual([]);
  });
});
