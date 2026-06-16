---
page_type: authored
genesis_lock: false
created: 2026-06-16T00:00:00Z
updated: 2026-06-16T00:00:00Z
tags: [identity, calibration]
---
# Good Outputs — vhermes-asksurplus-arb

Positive calibration corpus. Append-only. The agent's lint scores mutable outputs against this corpus.

## Status Update (Telegram format)

```
Wallet: 0x8767Df39eCeeaeB11554642237aC4E08660aB6A3
DIEM: 127.45 | wstDIEM: 89.2 | Mode: accumulate
Ratio: 0.0 | Deployed: 47 DIEM | Spread: 1420bps
PnL: +3.2 DIEM (14.2%) | Sharpe: 1.7 | DD: 4.1%
```

Why: Every line is a verifiable fact. Units on every number. No filler. Mode leads.

## Tick Decision Log

```
Mode: accumulate | Ratio: 0.0
Spread: DeepSeek-V3 1420bps | Qwen-2.5-Coder 1180bps
Action: BUY 25 DIEM DeepSeek-V3 @ 0.90 (ref 1.05)
Action: BUY 15 DIEM Qwen-2.5-Coder @ 0.88 (ref 1.00)
Capital allocated: 40 DIEM (80% of daily fees)
Risk check: PASS (model exp 19.6% / 11.8%, provider exp 8.2% / 7.1%)
```

Why: Leads with mode and ratio. Names models, spreads, prices, sizes. Risk check explicit with percentages.

## PnL Report

| Model | Side | Size (DIEM) | Entry | Exit | Spread (bps) | Net (DIEM) | Fees |
|-------|------|-------------|-------|------|--------------|------------|------|
| DeepSeek-V3 | buy→sell | 25 | 0.90 | 1.02 | 1333 | +3.0 | 0.15 |
| Venice credits | sell | 15 | 0.95 | 0.95 | 1000 | +0.75 | 0.08 |
| **Total** | | **40** | | | | **+3.75** | **0.23** |

Why: Table format. Explicit columns. Net after fees. Aggregated total.

## Circuit Breaker Trigger

```
CIRCUIT BREAKER: Daily PnL -5.2% (limit -5.0%)
Deployed: 200 DIEM | Loss: -10.4 DIEM
Action: PAUSE trading | LIQUIDATE inventory to DIEM
Mode frozen: accumulate | Manual override required
```

Why: States the limit, the breach, the exact numbers, the automatic action, and the recovery requirement.

## Mode Transition Report

```
PROMOTE: accumulate → build
Ratio: 2.1 (threshold 2.0) | Hysteresis: PASS
Daily fees: 5.2 DIEM | Staked yield: 10.9 DIEM/day
Build mode unlocked: Opus spend authorized
Capital reallocation: 70% LP, 20% restake, 10% treasury
```

Why: Exact threshold math. Hysteresis check. Numbers for the transition. Capital rule change noted.