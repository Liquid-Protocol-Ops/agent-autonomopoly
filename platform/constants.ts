// On-chain addresses for Base mainnet (chain ID 8453).
// Keep in sync with liquid-protocol-ops/sdk/src/constants.ts — these are
// the agent-template's read-only copy so harness modules don't need an SDK dep.

import type { Address } from 'viem';

export const ADDRESSES = {
  FEE_LOCKER: '0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF' as Address,
  // DIEM is both the ERC-20 token and the staking contract — call stake(uint256) directly on this address.
  DIEM:        '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as Address,
  // WETH on Base (canonical wrapped-ETH address, same across all OP-stack chains).
  WETH:        '0x4200000000000000000000000000000000000006' as Address,
  // Uniswap v3 NonfungiblePositionManager on Base.
  NFPM_V3:     '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as Address,
  // ETH/DIEM Uniswap v3 1% pool on Base — highest APY DIEM pool (655.91% as of 2026-05-14).
  ETH_DIEM_V3: '0x80d995189ecc593672aD4703b250a5e82672EB1D' as Address,
} as const;

// Uniswap v3 pool parameters for ETH/DIEM 1% pool.
// token0 = WETH (0x4200...) < token1 = DIEM (0xF4d9...) by address ordering.
export const ETH_DIEM_V3 = {
  FEE:          10_000,  // 1% fee tier
  TICK_SPACING: 200,     // tick spacing for 1% pools
} as const;
