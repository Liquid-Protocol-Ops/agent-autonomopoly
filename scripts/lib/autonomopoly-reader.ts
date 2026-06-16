// AUTONOMOPOLY Read-Only State Sync
// Reads AUTONOMOPOLY state without write access

import { createPublicClient, http, parseAbi, Address } from 'viem';
import { base } from 'viem/chains';

const FEE_LOCKER_ABI = parseAbi([
  'function availableFees(address feeOwner, address token) view returns (uint256)',
  'function claim(address feeOwner, address token)',
]);

const LP_MANAGER_ABI = parseAbi([
  'function positions(address owner) view returns (uint256[] tokenIds)',
  'function positionInfo(uint256 tokenId) view returns (uint256 tickLower, uint256 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
]);

const GOALS_ABI = parseAbi([
  'function mode() view returns (string)',
  'function dailyFeeRate() view returns (uint256)',
  'function selfFundingRatio() view returns (uint256)', // scaled 1e18
]);

export interface LPPosition {
  tokenId: bigint;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export interface AutonomopolyState {
  mode: 'accumulate' | 'build';
  dailyFeeRate: bigint;        // DIEM/day (18 decimals)
  selfFundingRatio: number;    // ratio scaled 1e18 -> float
  lpPositions: LPPosition[];
  wallet: Address;
  totalFeesClaimable: bigint;
}

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const WALLET = process.env.AUTONOMOPOLY_WALLET as Address || '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const FEE_LOCKER = process.env.FEE_LOCKER_ADDRESS as Address;
const LP_MANAGER = process.env.LP_MANAGER_ADDRESS as Address;
const GOALS = process.env.GOALS_ADDRESS as Address;
const DIEM_TOKEN = process.env.DIEM_TOKEN_ADDRESS as Address;

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

export async function syncAutonomopolyState(): Promise<AutonomopolyState> {
  // Fetch mode, daily fee rate, self-funding ratio from Goals contract
  let mode: 'accumulate' | 'build' = 'accumulate';
  let dailyFeeRate = 0n;
  let selfFundingRatio = 0;

  if (GOALS) {
    try {
      const [modeStr, rate, ratio] = await Promise.all([
        client.readContract({ address: GOALS, abi: GOALS_ABI, functionName: 'mode' }) as Promise<string>,
        client.readContract({ address: GOALS, abi: GOALS_ABI, functionName: 'dailyFeeRate' }) as Promise<bigint>,
        client.readContract({ address: GOALS, abi: GOALS_ABI, functionName: 'selfFundingRatio' }) as Promise<bigint>,
      ]);
      mode = modeStr as 'accumulate' | 'build';
      dailyFeeRate = rate;
      selfFundingRatio = Number(ratio) / 1e18;
    } catch (e) {
      console.warn('[autonomopoly-reader] Goals contract read failed:', e);
    }
  }

  // Fetch claimable DIEM fees from FeeLocker
  let totalFeesClaimable = 0n;
  if (FEE_LOCKER && DIEM_TOKEN) {
    try {
      totalFeesClaimable = await client.readContract({
        address: FEE_LOCKER,
        abi: FEE_LOCKER_ABI,
        functionName: 'availableFees',
        args: [WALLET, DIEM_TOKEN],
      }) as bigint;
    } catch (e) {
      console.warn('[autonomopoly-reader] FeeLocker read failed:', e);
    }
  }

  // Fetch LP positions
  let lpPositions: LPPosition[] = [];
  if (LP_MANAGER) {
    try {
      const tokenIds = await client.readContract({
        address: LP_MANAGER,
        abi: LP_MANAGER_ABI,
        functionName: 'positions',
        args: [WALLET],
      }) as bigint[];

      for (const tokenId of tokenIds) {
        const info = await client.readContract({
          address: LP_MANAGER,
          abi: LP_MANAGER_ABI,
          functionName: 'positionInfo',
          args: [tokenId],
        }) as any;

        lpPositions.push({
          tokenId,
          tickLower: Number(info.tickLower),
          tickUpper: Number(info.tickUpper),
          liquidity: info.liquidity,
          tokensOwed0: info.tokensOwed0,
          tokensOwed1: info.tokensOwed1,
        });
      }
    } catch (e) {
      console.warn('[autonomopoly-reader] LP Manager read failed:', e);
    }
  }

  return {
    mode,
    dailyFeeRate,
    selfFundingRatio,
    lpPositions,
    wallet: WALLET,
    totalFeesClaimable,
  };
}

// Helper: Calculate LP value in DIEM
export function calculateLpValueDiem(positions: LPPosition[], diemPerEth: number): bigint {
  // Simplified: sum liquidity * price approximation
  // Real implementation would use Uniswap v3 math
  let total = 0n;
  for (const pos of positions) {
    total += pos.tokensOwed0 + pos.tokensOwed1; // fees claimable
    // Add position principal estimate
    total += pos.liquidity / 1000000n; // rough approximation
  }
  return total;
}