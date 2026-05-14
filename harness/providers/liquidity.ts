// Single-sided DIEM LP reinvestment into ETH/DIEM Uniswap v3 1% pool on Base.
//
// Strategy: deposit DIEM in a range below current tick (position is above current price).
// The position holds DIEM while price is above range. As DIEM appreciates (tick falls),
// price enters the range, the position earns fees and gradually converts DIEM → WETH.
//
// Pool:    ETH/DIEM v3 1%  (token0=WETH, token1=DIEM)
//          0x80d995189ecc593672aD4703b250a5e82672EB1D
// NFPM:    Uniswap v3 NonfungiblePositionManager on Base
//          0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1
//
// Tick direction: higher tick = more DIEM per WETH (DIEM cheaper).
//   "Less DIEM = more WETH" = DIEM appreciates = tick falls.
//
// Single-sided DIEM mint: tickUpper < currentTick, amount0=0, amount1=diemAmount.
// Each reinvestment mints a fresh position; the agent stores the tokenId in memory
// and can later collect fees or close via the NFPM.

import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';
import { ADDRESSES, ETH_DIEM_V3 } from '../../platform/constants.js';
import type { TxSender } from '../safety/wallet.js';

// ── ABIs ─────────────────────────────────────────────────────────────

const SLOT0_ABI = [{
  name: 'slot0', type: 'function', stateMutability: 'view',
  inputs: [],
  outputs: [
    { name: 'sqrtPriceX96',               type: 'uint160' },
    { name: 'tick',                        type: 'int24'   },
    { name: 'observationIndex',            type: 'uint16'  },
    { name: 'observationCardinality',      type: 'uint16'  },
    { name: 'observationCardinalityNext',  type: 'uint16'  },
    { name: 'feeProtocol',                 type: 'uint8'   },
    { name: 'unlocked',                    type: 'bool'    },
  ],
}] as const;

const ERC20_APPROVE_ABI = [{
  name: 'approve', type: 'function', stateMutability: 'nonpayable',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount',  type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

const NFPM_MINT_ABI = [{
  name: 'mint', type: 'function', stateMutability: 'payable',
  inputs: [{
    name: 'params', type: 'tuple',
    components: [
      { name: 'token0',         type: 'address' },
      { name: 'token1',         type: 'address' },
      { name: 'fee',            type: 'uint24'  },
      { name: 'tickLower',      type: 'int24'   },
      { name: 'tickUpper',      type: 'int24'   },
      { name: 'amount0Desired', type: 'uint256' },
      { name: 'amount1Desired', type: 'uint256' },
      { name: 'amount0Min',     type: 'uint256' },
      { name: 'amount1Min',     type: 'uint256' },
      { name: 'recipient',      type: 'address' },
      { name: 'deadline',       type: 'uint256' },
    ],
  }],
  outputs: [
    { name: 'tokenId',   type: 'uint256' },
    { name: 'liquidity', type: 'uint128' },
    { name: 'amount0',   type: 'uint256' },
    { name: 'amount1',   type: 'uint256' },
  ],
}] as const;

// ── Tick helpers ──────────────────────────────────────────────────────

// Largest multiple of spacing that is strictly less than tick.
// For DIEM single-sided deposit (token1): tickUpper must be < currentTick.
function tickBelowCurrent(currentTick: number, spacing: number): number {
  return Math.floor((currentTick - 1) / spacing) * spacing;
}

// ── Types ─────────────────────────────────────────────────────────────

export type TickRange = 'short' | 'medium';  // short=2 spacings, medium=5 spacings

export type ReinvestResult = {
  approveTxHash: Hex;
  mintTxHash:    Hex;
  tickLower:     number;
  tickUpper:     number;
  currentTick:   number;
};

// ── Main ──────────────────────────────────────────────────────────────

export async function reinvestToLP(
  rpcUrl:        string,
  agentAddress:  Address,
  diemAmount:    bigint,
  range:         TickRange,
  txSender:      TxSender,
  publicClient?: ReturnType<typeof createPublicClient>,
): Promise<ReinvestResult> {
  const client = publicClient ?? createPublicClient({ chain: base, transport: http(rpcUrl) });

  // 1. Read current tick from pool slot0.
  const slot0 = await client.readContract({
    address: ADDRESSES.ETH_DIEM_V3,
    abi:     SLOT0_ABI,
    functionName: 'slot0',
  });
  const currentTick = slot0[1];  // int24 returned as number by viem

  // 2. Compute tick range below current tick for single-sided DIEM deposit.
  //    tickUpper < currentTick  →  position holds only token1 (DIEM) at mint.
  //    As DIEM appreciates (tick falls), position earns fees converting DIEM → WETH.
  const n = range === 'short' ? 2 : 5;
  const tickUpper = tickBelowCurrent(currentTick, ETH_DIEM_V3.TICK_SPACING);
  const tickLower = tickUpper - n * ETH_DIEM_V3.TICK_SPACING;

  // 3. Approve DIEM to NonfungiblePositionManager.
  const approveData = encodeFunctionData({
    abi:          ERC20_APPROVE_ABI,
    functionName: 'approve',
    args:         [ADDRESSES.NFPM_V3, diemAmount],
  });
  const approveTxHash = await txSender({ to: ADDRESSES.DIEM, data: approveData });

  // Wait for approve to land before minting.
  await client.waitForTransactionReceipt({ hash: approveTxHash });

  // 4. Mint single-sided DIEM position.
  //    amount0Desired = 0 (no WETH needed), amount1Desired = diemAmount.
  //    amount1Min = 0 to tolerate minor price drift between approve and mint.
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);  // 10 min
  const mintData = encodeFunctionData({
    abi:          NFPM_MINT_ABI,
    functionName: 'mint',
    args: [{
      token0:         ADDRESSES.WETH,
      token1:         ADDRESSES.DIEM,
      fee:            ETH_DIEM_V3.FEE,
      tickLower,
      tickUpper,
      amount0Desired: 0n,
      amount1Desired: diemAmount,
      amount0Min:     0n,
      amount1Min:     0n,
      recipient:      agentAddress,
      deadline,
    }],
  });
  const mintTxHash = await txSender({ to: ADDRESSES.NFPM_V3, data: mintData });

  console.log(
    `[liquidity] reinvested ${diemAmount} DIEM | ` +
    `pool=ETH/DIEM v3 1% | ` +
    `ticks=[${tickLower}, ${tickUpper}] currentTick=${currentTick}`,
  );

  return { approveTxHash, mintTxHash, tickLower, tickUpper, currentTick };
}
