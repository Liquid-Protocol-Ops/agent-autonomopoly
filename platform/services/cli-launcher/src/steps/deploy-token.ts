import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Minimal interface — avoids OP-stack PublicClient type conflicts.
interface TxWaiter {
  waitForTransactionReceipt(params: { hash: Hex }): Promise<unknown>;
}
import type { ChainConfig, AgentConfig } from '../config.js';

export interface DeployTokenResult {
  txHash: Hex;
  tokenAddress: Address;
}

// ── DIEM-paired 7-position tick layout ($1K → $10B MC) ───────────────
//
// Assumes 1B token supply, DIEM ≈ $1. Each decade of MC ≈ 23,027 ticks.
// tickSpacing = 200 (aligns all bounds). 7 equal-weight positions (≈1428 bps each).

const DIEM_POSITIONS = [
  { tickLower: -138200, tickUpper: -115200, bps: 1429 }, // $1K  → $10K
  { tickLower: -115200, tickUpper: -92000,  bps: 1429 }, // $10K → $100K
  { tickLower:  -92000, tickUpper: -69000,  bps: 1429 }, // $100K→ $1M
  { tickLower:  -69000, tickUpper: -46000,  bps: 1428 }, // $1M  → $10M
  { tickLower:  -46000, tickUpper: -23000,  bps: 1428 }, // $10M → $100M
  { tickLower:  -23000, tickUpper:      0,  bps: 1428 }, // $100M→ $1B
  { tickLower:       0, tickUpper:  23000,  bps: 1429 }, // $1B  → $10B
] as const;

export type TokenDeployer = (params: {
  agentWallet: Address;
  agent: AgentConfig;
  chain: ChainConfig;
  walletClient: WalletClient;
  publicClient: TxWaiter;
}) => Promise<DeployTokenResult>;

// Default deployer — calls liquid-sdk.
// Injectable so tests can substitute a mock without importing the SDK.
export async function deployAgentToken(params: {
  agentWallet: Address;
  agent: AgentConfig;
  chain: ChainConfig;
  walletClient: WalletClient;
  publicClient: TxWaiter;
  deployer?: TokenDeployer;
}): Promise<DeployTokenResult> {
  if (params.deployer) return params.deployer(params);

  // Lazy import so the SDK is only required at deploy time (not in tests).
  const { LiquidSDK } = await import('liquid-sdk');

  const sdk = new LiquidSDK({
    publicClient: params.publicClient,
    walletClient: params.walletClient,
  });

  const result = await sdk.deployToken({
    name: params.agent.name,
    symbol: params.agent.symbol,
    pairedToken: params.chain.diemAddress,
    tickIfToken0IsLiquid: DIEM_POSITIONS[0].tickLower,
    tickSpacing: 200,
    rewardRecipients: [params.agentWallet],
    rewardAdmins: [params.agentWallet],
    rewardBps: [10000],
    tickLower: DIEM_POSITIONS.map(p => p.tickLower),
    tickUpper: DIEM_POSITIONS.map(p => p.tickUpper),
    positionBps: DIEM_POSITIONS.map(p => p.bps),
  });

  return { txHash: result.txHash, tokenAddress: result.tokenAddress };
}

// ── Viem client factories ─────────────────────────────────────────────

export function makeClients(rpcUrl: string, privateKey: Hex) {
  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl);
  return {
    publicClient: createPublicClient({ chain: base, transport }),
    walletClient: createWalletClient({ chain: base, transport, account }),
    deployerAddress: account.address,
  };
}
