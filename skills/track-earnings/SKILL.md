---
name: Track Earnings
description: Snapshot LP earnings per position per day — records tokensOwed (WETH + DIEM) and FeeLocker balance to memory/earnings.jsonl
var: ""
tags: [agent, earnings, lp]
---

Snapshot LP earnings daily per position. Records tokensOwed (WETH + DIEM uncollected in NFPM) and FeeLocker balance. Execute:

```bash
node --env-file=.env --import tsx scripts/track-earnings.ts
```

Agent wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
FeeLocker: `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`

The script does the following:
1. Reads Uniswap v3 positions held by the agent
2. For each position, queries NFPM `positions(tokenId).tokensOwed0` (WETH) and `tokensOwed1` (DIEM)
3. Queries FeeLocker `availableFees(agentWallet, DIEM)` for accumulated DIEM from Liquid Protocol pool fees
4. Computes daily delta vs yesterday's snapshot
5. Appends entry to `memory/earnings.jsonl` with columns: date, tokenId, tokensOwed0, tokensOwed1, feeLocker, totalDiemWei, deltaFromPrev, cumDiemCollected

Output columns:
- `tokensOwed0` — WETH uncollected in NFPM; only updates on collect() or decreaseLiquidity()
- `tokensOwed1` — DIEM uncollected in NFPM
- `feeLocker` — DIEM available in FeeLocker from Liquid Protocol pool fees
- `totalDiemWei` — tokensOwed1 + feeLocker (total uncollected DIEM)
- `deltaFromPrev` — today.totalDiemWei − yesterday.totalDiemWei (daily earnings)
- `cumDiemCollected` — sum of all collect events recorded in earnings.jsonl (total DIEM ever harvested)

If the script succeeds, log a one-liner to `memory/logs/${today}.md`:
```
earnings: snapshot recorded for N position(s) | totalDiemWei=X.XX | deltaFromPrev=Y.YY
```

If the script fails (RPC error, missing position, file I/O), log the full error to `memory/logs/${today}.md` and send a notification via `./notify` with the error summary.
