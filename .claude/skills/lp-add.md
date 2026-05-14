---
name: lp-add
description: Mint a single-sided DIEM LP position in the ETH/DIEM Uniswap v3 1% pool on Base. Use when reinvesting claimed DIEM fees in accumulate mode.
---

# LP Add — Single-Sided DIEM Mint

Mints a concentrated liquidity position in the ETH/DIEM v3 1% pool on Base.
Position holds only DIEM at mint time (tickUpper < currentTick). As DIEM
appreciates (tick falls), position earns fees and gradually converts DIEM → WETH.

## Addresses (Base mainnet)

| Contract | Address |
|----------|---------|
| ETH/DIEM v3 1% pool | `0x80d995189ecc593672aD4703b250a5e82672EB1D` |
| NFPM (NonfungiblePositionManager) | `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` |
| DIEM ERC-20 | `0xF4d97F2da56e8c3098f3a8D538DB630A2606a024` |
| WETH (token0) | `0x4200000000000000000000000000000000000006` |
| FeeLocker | `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF` |

Pool parameters: fee=10000 (1%), tickSpacing=200.
Token order: token0=WETH, token1=DIEM (by address sort).

## Flow

```
1. Read current tick from pool slot0()
2. Compute tickUpper = floor((currentTick - 1) / 200) * 200   (strictly below currentTick)
3. Compute tickLower = tickUpper - N * 200                      (N=2 short, N=5 medium)
4. Read agent DIEM balance (balanceOf) — use actual balance, not pre-claim estimate
5. approve(NFPM, diemBalance) on DIEM contract
6. waitForTransactionReceipt(approveHash)
7. mint({ token0: WETH, token1: DIEM, fee: 10000, tickLower, tickUpper,
          amount0Desired: 0, amount1Desired: diemBalance,
          amount0Min: 0, amount1Min: diemBalance * 99n / 100n,
          recipient: agentAddress, deadline: now + 600 })
8. waitForTransactionReceipt(mintHash)
9. Store tokenId from mint return value in memory/lp-positions.jsonl
```

## Code path

`harness/tick.ts` → accumulate branch → `harness/providers/liquidity.ts:reinvestToLP()`

## Dry run (cast)

```bash
# 1. Read current tick
cast call 0x80d995189ecc593672aD4703b250a5e82672EB1D \
  "slot0()(uint160,int24,uint16,uint16,uint16,uint8,bool)" \
  --rpc-url https://mainnet.base.org

# 2. Simulate approve (returns bool)
cast call 0xF4d97F2da56e8c3098f3a8D538DB630A2606a024 \
  "approve(address,uint256)(bool)" \
  0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  <DIEM_AMOUNT> \
  --from <AGENT_ADDRESS> \
  --rpc-url https://mainnet.base.org

# 3. Simulate mint (returns tokenId, liquidity, amount0, amount1)
#    Will revert STF if agent has no DIEM or allowance not set — expected in dry run.
cast call 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 \
  "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))(uint256,uint128,uint256,uint256)" \
  "(0x4200000000000000000000000000000000000006,0xF4d97F2da56e8c3098f3a8D538DB630A2606a024,10000,<TICK_LOWER>,<TICK_UPPER>,0,<DIEM_AMOUNT>,0,<DIEM_AMOUNT*99/100>,<AGENT_ADDRESS>,<DEADLINE>)" \
  --from <AGENT_ADDRESS> \
  --rpc-url https://mainnet.base.org
```

## Security notes

- **Approve exact amount only** — never unlimited approval.
- **amount1Min = 99%** — rejects if price moves >1% between slot0 read and mint.
- **Read balance post-claim** — use `getDiemBalance()` after claim receipt, not pre-claim `availableFees`.
- **New mint per cycle** — agent has no existing ETH/DIEM v3 position; each reinvestment is a fresh NFT.

## What to do after minting

Save the returned `tokenId` to `memory/lp-positions.jsonl`:
```jsonl
{"tokenId":"<id>","mintedAt":"<ISO>","tickLower":<n>,"tickUpper":<n>,"diemDeposited":"<wei>","mintTxHash":"0x..."}
```
Future ticks use `increaseLiquidity(tokenId, ...)` instead of `mint()` for gas efficiency.
