import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseEther } from 'viem';
import type { Address } from 'viem';

// ── Module mocks (hoisted before imports) ────────────────────────────

const vMocks = vi.hoisted(() => ({
  loadConfig: vi.fn(),
  makePublicClient: vi.fn(),
  getClaimable: vi.fn(),
  getStakedBalance: vi.fn(),
  claimDiem: vi.fn(),
  loadOrMintBearer: vi.fn(),
  callInference: vi.fn(),
}));

vi.mock('../providers/venice.js', () => vMocks);

import { runTick, type TickDeps } from '../tick.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const AGENT_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12' as Address;

const TEST_CONFIG = {
  diemAddress: '0x0000000000000000000000000000000000000001' as Address,
  stakingAddress: '0x0000000000000000000000000000000000000001' as Address,
  rpcUrl: 'https://base-mainnet.example.com',
  stakeThreshold: parseEther('0.1'),
  bearerCachePath: 'memory/venice-bearer.json',
  veniceApiBase: 'https://api.venice.ai/api/v1',
  model: 'llama-3.3-70b',
};

const MOCK_PUBLIC_CLIENT = {
  waitForTransactionReceipt: vi.fn().mockResolvedValue({}),
};

const MOCK_SIGNER = {
  address: AGENT_ADDRESS,
  signMessage: vi.fn(),
  signTypedData: vi.fn(),
} as unknown as import('../safety/wallet.js').Signer;

const MOCK_TX_SENDER = vi.fn().mockResolvedValue('0xtxhash' as `0x${string}`);

const DEPS: TickDeps = { signer: MOCK_SIGNER, txSender: MOCK_TX_SENDER };

// ── Setup ────────────────────────────────────────────────────────────

beforeEach(() => {
  vMocks.loadConfig.mockReturnValue(TEST_CONFIG);
  vMocks.makePublicClient.mockReturnValue(MOCK_PUBLIC_CLIENT);
  vMocks.getClaimable.mockResolvedValue(0n);
  vMocks.getStakedBalance.mockResolvedValue(parseEther('1'));  // well-funded
  vMocks.claimDiem.mockResolvedValue('0xclaim' as `0x${string}`);
  vMocks.loadOrMintBearer.mockResolvedValue('test-bearer');
  vMocks.callInference.mockResolvedValue('tick');
});

afterEach(() => { vi.clearAllMocks(); });

// ── Tests ────────────────────────────────────────────────────────────

describe('runTick — inference path', () => {
  it('calls inference when staked ≥ threshold', async () => {
    await runTick(DEPS);
    expect(vMocks.callInference).toHaveBeenCalledOnce();
  });

  it('passes the bearer and a non-empty prompt to callInference', async () => {
    await runTick(DEPS);
    expect(vMocks.callInference).toHaveBeenCalledWith(
      TEST_CONFIG,
      'test-bearer',
      expect.objectContaining({ prompt: expect.any(String), maxTokens: expect.any(Number) }),
      expect.any(String),
    );
  });

  it('loads or mints a bearer before inference', async () => {
    await runTick(DEPS);
    expect(vMocks.loadOrMintBearer).toHaveBeenCalledOnce();
    expect(vMocks.loadOrMintBearer).toHaveBeenCalledWith(TEST_CONFIG, MOCK_SIGNER);
  });

  it('skips inference when staked < threshold', async () => {
    vMocks.getStakedBalance.mockResolvedValue(0n);
    await runTick(DEPS);
    expect(vMocks.callInference).not.toHaveBeenCalled();
    expect(vMocks.loadOrMintBearer).not.toHaveBeenCalled();
  });
});

describe('runTick — claim path', () => {
  it('claims when claimable ≥ threshold', async () => {
    vMocks.getClaimable.mockResolvedValue(parseEther('0.5'));
    await runTick(DEPS);
    expect(vMocks.claimDiem).toHaveBeenCalledOnce();
    expect(vMocks.claimDiem).toHaveBeenCalledWith(TEST_CONFIG, AGENT_ADDRESS, MOCK_TX_SENDER);
  });

  it('waits for claim receipt before continuing', async () => {
    vMocks.getClaimable.mockResolvedValue(parseEther('0.5'));
    const order: string[] = [];
    vMocks.claimDiem.mockImplementation(async () => { order.push('claim'); return '0xclaim'; });
    MOCK_PUBLIC_CLIENT.waitForTransactionReceipt.mockImplementation(async () => { order.push('wait'); return {}; });
    await runTick(DEPS);
    expect(order).toEqual(['claim', 'wait']);
  });

  it('skips claim when claimable < threshold', async () => {
    vMocks.getClaimable.mockResolvedValue(parseEther('0.05'));
    await runTick(DEPS);
    expect(vMocks.claimDiem).not.toHaveBeenCalled();
  });
});

describe('runTick — exits cleanly', () => {
  it('resolves without throwing on the happy path', async () => {
    await expect(runTick(DEPS)).resolves.toBeUndefined();
  });

  it('resolves without throwing when skipping inference', async () => {
    vMocks.getStakedBalance.mockResolvedValue(0n);
    await expect(runTick(DEPS)).resolves.toBeUndefined();
  });
});
