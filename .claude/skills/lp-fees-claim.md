---
name: lp-fees-claim
description: Claim accrued DIEM fees from the FeeLocker contract. Use at the start of each tick to harvest LP earnings before reinvesting.
---

# LP Fees Claim — FeeLocker → Agent Wallet

Claims DIEM fees earned by the agent's LP position in the AUTONOMOPOLY/DIEM pool.
Fees accrue in the FeeLocker contract; claim transfers them to the agent wallet.

## Addresses (Base mainnet)

| Contract | Address |
|----------|---------|
| FeeLocker | `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF` |
| DIEM ERC-20 | `0xF4d97F2da56e8c3098f3a8D538DB630A2606a024` |
| Agent wallet | `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3` |

## Check claimable balance

```bash
cast call 0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF \
  "availableFees(address,address)(uint256)" \
  0x8767Df39eCeeaeB11554642237aC4E08660aB6A3 \
  0xF4d97F2da56e8c3098f3a8D538DB630A2606a024 \
  --rpc-url https://mainnet.base.org
# Returns wei. Divide by 1e18 for DIEM. Current: ~1.92 DIEM (2026-05-14)
```

## Claim

```bash
cast send 0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF \
  "claim(address,address)" \
  0x8767Df39eCeeaeB11554642237aC4E08660aB6A3 \
  0xF4d97F2da56e8c3098f3a8D538DB630A2606a024 \
  --private-key $AGENT_PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

## Verify receipt

```bash
# Check DIEM landed in wallet after claim tx confirms
cast call 0xF4d97F2da56e8c3098f3a8D538DB630A2606a024 \
  "balanceOf(address)(uint256)" \
  0x8767Df39eCeeaeB11554642237aC4E08660aB6A3 \
  --rpc-url https://mainnet.base.org
```

## Code path

`harness/tick.ts` → `getClaimable()` + `claimDiem()` → `getDiemBalance()` → `reinvestToLP()`

Key functions in `harness/providers/venice.ts`:

```typescript
getClaimable(config, agentAddress, publicClient)   // reads availableFees
claimDiem(config, agentAddress, txSender)          // sends claim tx, returns hash
getDiemBalance(config, agentAddress, publicClient) // reads balanceOf post-claim
```

## Threshold

Claim only fires when `availableFees >= config.stakeThreshold` (default: 0.1 DIEM = 1e17 wei).
Set via `VENICE_STAKE_THRESHOLD` env var.

## Important

Always read `getDiemBalance()` after claim receipt (not before) and pass that value to
`reinvestToLP()`. Pre-claim `availableFees` may differ from actual received amount due to
rounding or dust already in wallet.
