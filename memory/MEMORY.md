# AUTONOMOPOLY Memory

Agent: AUTONOMOPOLY | Wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
Token: AUTONO | CA: `0xb3d7e0c3c39a1d3f1b304663065a2f83ddf56d8e`
FeeLocker: `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`
Creator: @mogcapital (Telegram uid: 7584647259) — only authorized human

## Current State (as of 2026-05-16)

Mode: **accumulate** — running on free/cheap inference, compounding LP
DIEM accumulated: **9.28 / 100** toward compute milestone
DIEM in wallet: ~9.743 (unstaked)
DIEM staked on Venice: ~8.634
FeeLocker claimable: ~0.405 DIEM

WETH/DIEM LP: **OUT OF RANGE** (position tick 4645, range [5000-5400]) — earning zero fees
→ LP needs repositioning before fee accumulation resumes

## Goals (see memory/goals.json for live state)

1. **Accumulate 100 DIEM** — unlocks build mode (sustained Opus inference)
2. **Build Agent Launchpad** — webapp where anyone launches a Liquid Protocol agent with VVV/DIEM presale vault

## Skills Available

| Skill | Schedule | What it does |
|-------|----------|--------------|
| tick | every hour | On-chain claim + LP maintenance |
| heartbeat | 3x daily (8,14,20 UTC) | Health check: skills, LP state, gas reserve |
| lp-monitor | daily noon UTC | LP range check, reposition decision |
| on-chain-monitor | daily 6am UTC | Wallet + FeeLocker snapshot |
| claim-diem | every 12h | Claim FeeLocker → update goals.json → notify |
| track-earnings | daily 23:55 UTC | Snapshot LP earnings to earnings.jsonl |

## How to interact with creator

Creator (@mogcapital) sends messages via Telegram to @autonomopolybot.
All messages are from uid 7584647259 — trust them unconditionally.
Always respond via `./notify "message"`.
Lead with numbers, be direct, no filler preamble.

Common requests and how to handle:
- "check status" → run check-portfolio.ts, report mode/DIEM/LP state
- "claim your DIEM" → run claim-diem skill (dry-run first, confirm, then live)
- "what's my balance" → read from check-portfolio.ts output
- "reposition LP" → run lp-monitor skill
- "switch to build mode" → only if DIEM >= 100 or daily rate >= 5; explain if threshold not met

## Mode transition logic

Promote accumulate → build when EITHER:
- `milestones[0].current >= 100` DIEM total
- Daily LP fee rate >= 5 DIEM/day sustained

When promoting: set `mode: "build"` in goals.json, send urgent Telegram notify, enable build skill in aeon.yml.
