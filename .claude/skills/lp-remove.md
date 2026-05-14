---
name: lp-remove
description: Remove liquidity from an existing ETH/DIEM v3 LP position and collect proceeds. Use when closing a position to consolidate DIEM.
---

# LP Remove — Collect Fees + Decrease Liquidity

Two-step process to exit a Uniswap v3 position:
1. `collect` — harvest accrued fees (WETH + DIEM) to agent wallet
2. `decreaseLiquidity` — burn liquidity and unlock token principal

Both calls go to the NFPM at `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1`.

## Addresses (Base mainnet)

| Contract | Address |
|----------|---------|
| NFPM | `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` |
| DIEM ERC-20 | `0xF4d97F2da56e8c3098f3a8D538DB630A2606a024` |
| WETH | `0x4200000000000000000000000000000000000006` |
| ETH/DIEM v3 pool | `0x80d995189ecc593672aD4703b250a5e82672EB1D` |

## Read position state first

```bash
cast call 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  "positions(uint256)(uint96,address,address,address,uint24,int24,int24,uint128,uint256,uint256,uint128,uint128)" \
  <TOKEN_ID> \
  --rpc-url https://mainnet.base.org
# Returns: nonce, operator, token0, token1, fee, tickLower, tickUpper,
#          liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128,
#          tokensOwed0, tokensOwed1
```

## Step 1: Collect accrued fees

```solidity
// NFPM.collect(CollectParams)
struct CollectParams {
  uint256 tokenId;
  address recipient;
  uint128 amount0Max;  // use type(uint128).max to collect all
  uint128 amount1Max;  // use type(uint128).max to collect all
}
```

```bash
# Encode: collect all fees from position
cast send 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  "collect((uint256,address,uint128,uint128))(uint256,uint256)" \
  "(<TOKEN_ID>,<AGENT_ADDRESS>,340282366920938463463374607431768211455,340282366920938463463374607431768211455)" \
  --private-key $AGENT_PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

## Step 2: Decrease liquidity (full exit)

```solidity
struct DecreaseLiquidityParams {
  uint256 tokenId;
  uint128 liquidity;   // from positions() call above
  uint256 amount0Min;  // slippage floor
  uint256 amount1Min;  // slippage floor
  uint256 deadline;
}
```

```bash
# Full liquidity removal — set liquidity to value from positions() call
cast send 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))(uint256,uint256)" \
  "(<TOKEN_ID>,<LIQUIDITY>,0,0,<DEADLINE>)" \
  --private-key $AGENT_PRIVATE_KEY \
  --rpc-url https://mainnet.base.org

# Then collect again to pull the unlocked principal
cast send 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  "collect((uint256,address,uint128,uint128))(uint256,uint256)" \
  "(<TOKEN_ID>,<AGENT_ADDRESS>,340282366920938463463374607431768211455,340282366920938463463374607431768211455)" \
  --private-key $AGENT_PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

## Code path (not yet implemented)

Add `collectFromLP` and `removeFromLP` to `harness/providers/liquidity.ts` using the same
`TxSender` + `publicClient` pattern as `reinvestToLP`. Read `tokenId` from `memory/lp-positions.jsonl`.

## Notes

- Always collect fees before decreaseLiquidity — fees are tracked separately.
- After full exit, the NFT can be burned via `NFPM.burn(tokenId)` to reclaim gas.
- If the position is out of range (tickUpper < currentTick for DIEM-only), principal is 100% DIEM.
- `amount1Min = 0` is acceptable for a DIEM-only out-of-range position (no price risk).
