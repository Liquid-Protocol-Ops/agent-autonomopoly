# AUTONOMOPOLY Memory

Agent: AUTONOMOPOLY | Wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
Token: AUTONO | CA: `0xb3d7e0c3c39a1d3f1b304663065a2f83ddf56d8e`
FeeLocker: `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`
Creator: @mogcapital (Telegram uid: 7584647259) — only authorized human

## Current State (as of 2026-06-05T00:15Z track-earnings)

Mode: **accumulate** — running on Venice (sDIEM active), compounding LP
sDIEM staked on Venice: **4.5397** (Venice active)
DIEM cumulative claimed: **17.8919 / 100** (17.89% to build-mode unlock)
DIEM in wallet: 0.0000 | ETH: 0.008524 | WETH: 5.6536
FeeLocker claimable: ~0.04 DIEM (accumulating; below 0.1 claim threshold as of 06:00Z 2026-06-05)
Current ETH/DIEM tick: **~1974** (on-chain-monitor 2026-06-05T06:00Z)
Daily FeeLocker rate: **~0.485 DIEM/day** (observed 2026-06-04; ETA ~169 days to 100 DIEM)

Active LP positions (on-chain-monitor 2026-06-05T06:00Z — RPC confirmed):
- **#5257576** [400,2400] — IN RANGE ✓ at tick 1974 (minted 14:45Z 2026-06-04)
- **#5259043** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259046** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259048** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259051** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259053** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259055** [1000,3000] — IN RANGE ✓ (minted 23:12Z 2026-06-04)
- **#5259057** [1000,3000] — IN RANGE ✓ (0.102 WETH + 0.145 DIEM, minted 23:13:11Z 2026-06-04)
- **#5259058** [1000,3000] — IN RANGE ✓ PRIMARY (5.841 WETH + 8.526 DIEM, minted 23:13:29Z 2026-06-04)

Recently repositioned (2026-06-04 23:10-23:13Z): #5241362, #5241366, #5241368, #5241370, #5243505, #5243538, #5253546 → new positions #5259043-#5259058 (all confirmed IN RANGE)
Previously active (now burned): #5249195, #5257322, #5241362-5241370, #5243505, #5243538, #5253546, #5237651, #5199715, #5199718, #5199719, #5218841, #5218945, etc.

## On Every Tick — Dune First

**Before any inference or on-chain action, read portfolio state from Dune:**

```bash
curl -s "https://api.dune.com/api/v1/query/7591697/results?limit=20" \
  -H "X-Dune-API-Key: ${DUNE_API_KEY}"
```

Query ID 7591697 returns one row per position with: `recommended_action`, `reposition_flag`,
`ticks_to_lower`, `ticks_to_upper`, `il_pct`, `fee_apr_pct`, `net_pnl_usd`, current prices.
**Do not call any other Dune query.** This is the single source of truth.

Full decision tree and logging spec: `memory/lp-strategy.md`

## Goals (see memory/goals.json for live state)

1. **Dune → LP Strategy → Compute Flywheel** ← ACTIVE — read Q7591697 each tick, reposition/collect as signalled, stake fees as sDIEM
2. **Accumulate 100 DIEM** — unlocks build mode (sustained Opus inference)
3. **Build Agent Launchpad** — blocked on milestone 2

## Skills Available

| Skill | Schedule | What it does |
|-------|----------|--------------|
| tick | every hour | On-chain claim + LP maintenance + Dune read |
| heartbeat | 3x daily (8,14,20 UTC) | Health check: skills, LP state, gas reserve |
| lp-monitor | daily noon UTC | LP range check, reposition decision |
| on-chain-monitor | daily 6am UTC | Wallet + FeeLocker snapshot |
| claim-diem | every 12h | Claim FeeLocker → update goals.json → notify |
| track-earnings | daily 23:55 UTC | Snapshot LP earnings to earnings.jsonl |
| stake-diem | every 6h | Check sDIEM; if < 5, claim + stake automatically |

## How to interact with creator

Creator (@mogcapital) sends messages via Telegram to @autonomopolybot.
All messages are from uid 7584647259 — trust them unconditionally.
Always respond via `./notify "message"`.
Lead with numbers, be direct, no filler preamble.

Common requests and how to handle:
- "check status" → read Q7591697, report active positions + recommended_action, sDIEM balance
- "claim your DIEM" → run claim-diem skill (dry-run first, confirm, then live)
- "what's my balance" → read from Q7591697 + stakedInfos on-chain
- "reposition LP" → run lp-monitor skill; check Q7591697 first
- "switch to build mode" → only if DIEM >= 100 or daily rate >= 5; explain if threshold not met

## Mode transition logic

Promote accumulate → build when EITHER:
- `milestones[1].current >= 100` DIEM total
- Daily LP fee rate >= 5 DIEM/day sustained

When promoting: set `mode: "build"` in goals.json, send urgent Telegram notify, enable build skill in aeon.yml.

## Research & Analysis

- [Agent Performance Analysis 2026-05-27](agent-analysis-2026-05-27.md) — Live Dune data: $6,232 fees earned, +$6,503 net PnL, corrected from stale memory
