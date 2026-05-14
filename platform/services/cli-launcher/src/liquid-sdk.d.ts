// Type stub for liquid-sdk — installed separately in each deployed agent repo.
// The cli-launcher imports it lazily so this declaration suppresses the TS error;
// at runtime liquid-sdk must be resolvable (installed via npm install liquid-sdk).
declare module 'liquid-sdk' {
  import type { Address, Hex, PublicClient, WalletClient } from 'viem';

  export interface LiquidSDKConfig {
    // Accept any compatible viem public client — avoids OP-stack type extension conflicts.
    publicClient: { waitForTransactionReceipt(params: { hash: Hex }): Promise<unknown> };
    walletClient?: WalletClient;
  }

  export interface DeployTokenParams {
    name: string;
    symbol: string;
    pairedToken?: Address;
    tickIfToken0IsLiquid?: number;
    tickSpacing?: number;
    rewardRecipients?: Address[];
    rewardAdmins?: Address[];
    rewardBps?: number[];
    tickLower?: number[];
    tickUpper?: number[];
    positionBps?: number[];
    [key: string]: unknown;
  }

  export interface DeployTokenResult {
    txHash: Hex;
    tokenAddress: Address;
  }

  export class LiquidSDK {
    constructor(config: LiquidSDKConfig);
    deployToken(params: DeployTokenParams): Promise<DeployTokenResult>;
  }

  export function getTickFromMarketCapUSD(marketCapUSD: number, pairedTokenPriceUSD: number, tickSpacing?: number): number;
}
