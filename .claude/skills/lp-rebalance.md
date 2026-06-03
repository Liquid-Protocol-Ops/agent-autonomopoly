---
name: lp-rebalance
description: Check Dune Q7591697 for LP positions needing reposition, then execute reposition via scripts/reposition.ts for out-of-range or high-IL positions
---

## Context

This agent manages two LP positions:
1. **DIEM/ETH v3** — managed via `scripts/reposition.ts`. Token ID recorded in `memory/lp-positions.jsonl`.
2. **wstDIEM/WETH v4** — Uniswap v4 PositionManager. Pool ID: `0x43da55144...`. Addresses in `docs/uniswap-v4-lp-reference.json` and `platform/constants.ts`.

Reposition target: current tick ± 5 × tickSpacing. Claim FeeLocker fees before closing any position.

## Steps

1. **Query Dune Q7591697** — fetch current LP portfolio metrics:
   ```bash
   curl -s "https://api.dune.com/api/v1/query/7591697/results?limit=10" \
     -H "X-Dune-API-Key: $DUNE_API_KEY"
   ```
   Parse `recommended_action`, `reposition_flag`, `il_pct`, `fee_apr_pct`, `net_pnl_usd` for each position.

2. **Evaluate each position**:
   - If `reposition_flag = true` or `recommended_action` is `REPOSITION` or `CLOSE` → proceed to reposition
   - If `il_pct > 5` AND `fee_apr_pct < 20` → flag as high-IL/low-fee, consider repositioning
   - Otherwise → log status and exit

3. **For positions needing reposition** (v3 DIEM/ETH):
   ```bash
   node --env-file=.env --import tsx scripts/reposition.ts
   ```
   Pass `--force` only if the position is in-range but recommended action is still REPOSITION.

4. **For v4 wstDIEM/WETH positions**:
   - Read current tokenId from `memory/lp-positions.jsonl` (pool: wstDIEM_WETH_v4)
   - Decode position using PositionManager at `0x7C5f5A4bBd8fD63184577525326123B519429bDc`
   - Collect fees: call `modifyLiquidities` with `DECREASE_LIQUIDITY(tokenId, 0, 0, 0, "0x")`
   - Close position: `DECREASE_LIQUIDITY` with full liquidity → `TAKE_PAIR` → `SWEEP`
   - Mint new position: `MINT_POSITION` with tickLower/Upper = currentTick ± 5*tickSpacing
   - Reference: `docs/uniswap-v4-lp-reference.json` for action encodings

5. **Write results** to `memory/lp-analysis-$(date +%Y-%m-%d).md`:
   - Positions evaluated, actions taken, new tokenIds, tick ranges
   - IL %, fee APR, net PnL from Dune

6. **Update Dune strategy log** Q7582817 via REST API with new position data.

## Reference files
- `docs/uniswap-v4-lp-reference.json` — full action encodings, Base addresses, pool IDs
- `platform/constants.ts` — INFERENCE_VAULT, VAULT_ROUTER, pool addresses
- `scripts/reposition.ts` — v3 reposition implementation (use as primary for DIEM/ETH)
- `scripts/analyze-lp.ts` — runs Dune query, writes analysis (run this first if skipping to analysis only)
