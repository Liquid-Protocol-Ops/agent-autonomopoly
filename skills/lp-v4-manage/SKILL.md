---
name: lp-v4-manage
description: Manage Uniswap v4 LP positions — collect fees, reposition out-of-range positions, and log results to memory. Disabled by default; enable in aeon.yml for agents with active v4 positions.
var: ""
tags: [agent, lp, uniswap-v4, disabled]
enabled: false
---

Query Dune Q7591697 for this agent's v4 LP position metrics.

If `reposition_flag = true` or `recommended_action` is `REPOSITION` or `CLOSE`:
1. Collect accrued fees via `DECREASE_LIQUIDITY(tokenId, 0, 0, 0, "0x")` + `TAKE_PAIR` on PositionManager `0x7C5f5A4bBd8fD63184577525326123B519429bDc`
2. Close position: full `DECREASE_LIQUIDITY` → `TAKE_PAIR` → `SWEEP`
3. Mint new position centered on currentTick ± 5 × tickSpacing via `MINT_POSITION`
4. Record new tokenId in `memory/lp-positions.jsonl`

Always write a summary to `memory/lp-analysis-$(date +%Y-%m-%d).md` with: position evaluated, il_pct, fee_apr_pct, action taken, new tick range.

Reference: `docs/uniswap-v4-lp-reference.json` for action byte encodings and Base contract addresses.

Wallet: $AGENT_WALLET_ADDRESS (Privy server wallet via `harness/safety/wallet.ts`).
Pool: wstDIEM/WETH v4 — poolId `0x43da55144439c36976064cdf90cc24402a07b7be6d37987b7673f1f481bd1f15`.
