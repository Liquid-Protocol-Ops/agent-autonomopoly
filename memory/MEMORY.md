# AUTONOMOPOLY Memory

Agent: AUTONOMOPOLY | Wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
Token: AUTONO | CA: `0xb3d7e0c3c39a1d3f1b304663065a2f83ddf56d8e`
FeeLocker: `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`
Creator: @mogcapital (Telegram uid: 7584647259) — only authorized human

## Current State (as of 2026-06-09T17:09Z tick)

Mode: **ACCUMULATE** — automatic cost-indexed gate adopted 2026-06-10 (ratio 0.76
< 1.0 floor). Promotes itself to build at self-funding ratio ≥ 2.0; self-improve
resumes then. The 2026-06-08 build override is retired to `modeHistory`.
sVVV staked: **4.5397** (API key gate — Venice key active)
sDIEM staked: **9.5992** (on-chain stakedInfos, first stake-diem run 2026-06-10T19:21Z
— corrects the earlier "sDIEM = 0" doc error; nothing had read stakedInfos before).
Self-funding ratio: **0.76** (9.5992 ÷ $12.56/day 7d-avg burn). Lean schedule should
lift it toward ~1.9 at the next cost-report; build auto-promotes at ratio 2.0.
claim-and-allocate stakes claims toward the dynamic target (1.5× trailing burn)
in BOTH modes, so the ratio climbs regardless of mode.
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
2. **Self-funding ratio ≥ 2.0** — auto-unlocks build mode (sDIEM covers 2× inference burn)
3. **Accumulate 100 DIEM** — capital milestone (no longer gates mode)
4. **Build Agent Launchpad** — resumes in build mode

## Skills Available

Lean schedule (operator decision 2026-06-10): ~30 LLM runs/day, down from ~60.

| Skill | Schedule | What it does |
|-------|----------|--------------|
| tick | hourly | On-chain claim + LP maintenance + LP range check/reposition queue (absorbed lp-monitor) |
| heartbeat | 2x daily (8,20 UTC) | Health check: skills, LP state, gas reserve |
| on-chain-monitor | daily 6am UTC | Wallet + FeeLocker snapshot |
| claim-diem | every 12h | Claim FeeLocker → stake sDIEM to target → LP rest → update goals.json |
| track-earnings | daily 23:55 UTC | **script-only (no LLM)** — snapshot LP earnings to earnings.jsonl |
| stake-diem | every 12h (:30) | **script-only (no LLM)** — sDIEM safety net: below target → queue stake intent (wallet DIEM only) |
| goal-review | Monday 08:00 UTC | Weekly goal audit: ETAs, self-funding ratio, mode consistency → creator report |
| self-improve | daily 10:00 UTC | Build mode only — one high-impact improvement per day (cron in .github/workflows/aeon.yml) |

Disabled: lp-monitor (absorbed into tick; manual dispatch still works), all
tweet-* skills (posting operator-paused + X READ blocked — re-enable together
when self-funding ratio ≥ 1; the Vercel cron also no-ops while
goals.json tweetingPaused is true).

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
- "switch to build mode" → mode is automatic now (self-funding ratio gate); explain the current ratio and what it needs to reach 2.0. Operator can force via goals.json modeOverride

## Mode transition logic (automatic cost-indexed gate, 2026-06-10)

Build mode is gated on self-funding, not a fixed DIEM count. Hysteresis on
`ratio = sDIEM ÷ trailing 7d daily inference cost`:
- promote to **build** at ratio ≥ 2.0 (`buildModeOnSelfFundingRatio`)
- demote to **accumulate** below 1.0 (`accumulateModeBelowRatio`); hold in between
- `goals.json modeOverride` is an operator escape hatch (unset by default) — wins
  over the gate when set
- claim-and-allocate evaluates the gate every run; goal-review reconciles
  `goals.json mode` weekly, appends to `modeHistory`, and notifies on change
- self-improve (daily) only runs in build mode — it pauses below the gate
- The old 100-DIEM / 5-per-day thresholds are retired; 100 DIEM remains as a
  capital milestone only

## Research & Analysis

- [Agent Performance Analysis 2026-05-27](agent-analysis-2026-05-27.md) — Live Dune data: $6,232 fees earned, +$6,503 net PnL, corrected from stale memory
