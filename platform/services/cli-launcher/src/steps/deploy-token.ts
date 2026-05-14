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

// Build LP positions by shifting the SDK's default POOL_POSITIONS.Liquid
// to start at the target tick. The SDK defaults cover a ~$21K–$1.4B range
// assuming DIEM as pair; we shift them so the bottom aligns with the
// desired starting market cap.
function buildLpPositions(startingTick: number) {
  // SDK default bottom tick (-230400) is our anchor.
  const DEFAULT_BOTTOM = -230400;
  const shift = startingTick - DEFAULT_BOTTOM;
  return {
    tickLower: [-230400 + shift, -216000 + shift, -202000 + shift, -155000 + shift, -141000 + shift],
    tickUpper: [-216000 + shift, -155000 + shift, -155000 + shift, -120000 + shift, -120000 + shift],
    positionBps: [1000, 5000, 1500, 2000, 500],
  };
}

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
  const { LiquidSDK, getTickFromMarketCapUSD } = await import('liquid-sdk');

  const startingTick = getTickFromMarketCapUSD(
    params.chain.initialMarketCapUsd,
    params.chain.diemPriceUsd,
  );

  const sdk = new LiquidSDK({
    publicClient: params.publicClient,
    walletClient: params.walletClient,
  });

  const { tickLower, tickUpper, positionBps } = buildLpPositions(startingTick);

  const result = await sdk.deployToken({
    name: params.agent.name,
    symbol: params.agent.symbol,
    pairedToken: params.chain.diemAddress,
    tickIfToken0IsLiquid: startingTick,
    tickSpacing: 200,
    rewardRecipients: [params.agentWallet],
    rewardAdmins: [params.agentWallet],
    rewardBps: [10000],
    tickLower,
    tickUpper,
    positionBps,
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
