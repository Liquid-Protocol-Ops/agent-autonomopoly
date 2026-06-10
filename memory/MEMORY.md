# AUTONOMOPOLY Memory

Agent: AUTONOMOPOLY | Wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
Token: AUTONO | CA: `0xb3d7e0c3c39a1d3f1b304663065a2f83ddf56d8e`
FeeLocker: `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`
Creator: @mogcapital (Telegram uid: 7584647259) — only authorized human

## Current State (as of 2026-06-09T17:09Z tick)

Mode: **BUILD** — activated 2026-06-08T22:00Z (operator override; thresholds not met). First directive: improve AUTONO itself.
sVVV staked: **4.5397** (API key gate — Venice key active)
sDIEM staked: **0** — Venice inference credits NOT yet funded; inference rides the
direct fallback (operator-subsidized). Self-funding wiring landed 2026-06-10:
build-mode claim-and-allocate stakes claims toward 5 sDIEM (`goals.json sdiemTarget`).
DIEM cumulative claimed: **18.5934 / 100** (18.59% to compute milestone)
DIEM in wallet: 0.0000 | ETH: 0.008396 | WETH: (LP-locked)
FeeLocker claimable: ~0.115 DIEM (likely above 0.1 threshold; claim queued for gated executor)
Current ETH/DIEM tick: **~1636** (on-chain-state.json last_block 47101209)
Daily FeeLocker rate: **~0.485 DIEM/day** (ETA ~167 days to 100 DIEM)

Active LP positions (lp-monitor 2026-06-09T06:00Z — RPC confirmed, 10 IN RANGE):
- **#5282442** [0,2000] — IN RANGE ✓
- **#5284108** [200,2200] — IN RANGE ✓
- **#5284622** [0,2000] — IN RANGE ✓
- **#5285821** [400,2400] — IN RANGE ✓
- **#5285822** [400,2400] — IN RANGE ✓
- **#5285824** [400,2400] — IN RANGE ✓
- **#5285827** [400,2400] — IN RANGE ✓
- **#5285828** [600,2600] — IN RANGE ✓
- **#5285830** [600,2600] — IN RANGE ✓
- **#5289244** [600,2600] — IN RANGE ✓

Boundary watch: #5282442 + #5284622 upper bound = 2000 (tick 1636, 364-tick headroom as of 2026-06-09)
Previously active (now burned): 65 positions as of last lp-monitor run.

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
| stake-diem | every 6h (:30) | sDIEM safety net: if < stake_min_diem, queue stake intent (wallet DIEM only) |
| goal-review | Monday 08:00 UTC | Weekly goal audit: ETAs, self-funding ratio, mode consistency → creator report |
| self-improve | daily 10:00 UTC | Build mode only — one high-impact improvement per day (cron in .github/workflows/aeon.yml) |

Disabled: tweet-listen (X READ tier blocked 7+ days — re-enable in aeon.yml when
read access is restored), tweet-broadcast paused via goals.json tweetingPaused.

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
