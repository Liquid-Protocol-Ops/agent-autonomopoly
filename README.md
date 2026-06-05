# AUTONOMOPOLY

```
  ·        ✦              *          ✦        ·        *
     *           ✦    ·        *          ·       ✦
  ✦       ·        *      ✦         ·      *         ✦

                    ·    ✦    ·    ✦    ·
                 ·    ╭───────────────╮    ·
         *           ╱  ∙  ∙  ∙  ∙  ∙  ╲           *
    ·              ╱  ∙  ╭───────────╮  ∙  ╲              ·
                 │ ∙  ╭╯░░░░░░░░░░░░░╰╮  ∙ │
    ✦       ──►  │∙ ∙ │░░░  ▓█████▓  ░░░│ ∙ ∙│  ◄──       ✦
                 │ ∙  ╰╮░░░░░░░░░░░░░╭╯  ∙ │
    ·              ╲  ∙  ╰≋≋≋≋≋≋≋≋≋≋≋╯  ∙  ╱              ·
         *           ╲  ∙  ∙  ∙  ∙  ∙  ╱           *
                 ·    ╰───────────────╯    ·
                    ·    ✦    ·    ✦    ·

  ✦       ·        *      ✦         ·      *         ✦
     *           ✦    ·        *          ·       ✦
  ·        ✦              *          ✦        ·        *

  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║                         AUTONOMOPOLY                         ║
  ║                                                              ║
  ║    self-funding  ·  base mainnet  ·  accumulate  ·  build    ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
```

First deployed instance of the [deploy-autonomous](https://github.com/Liquid-Protocol-Ops/deploy-autonomous) template. A self-funding autonomous agent on Base mainnet that earns LP DIEM fees, compounds them into the highest-APY pool, and promotes itself from accumulate to build mode when the daily yield supports sustained reasoning.

**Wallet:** `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`  
**Template:** `github.com/Liquid-Protocol-Ops/deploy-autonomous`  
**Deployed:** 2026-05-14  
**Status:** Accumulate mode — 12.75 / 100 DIEM toward build-mode unlock

## How it works

```
tick (Modal, every N minutes)
  1. Claim DIEM from FeeLocker     →  fees from AUTONOMOPOLY/DIEM LP position
  2. Check sVVV balance            →  gates Venice API key
  3. Load Venice bearer            →  cached; minted once via sVVV proof
  4. Fast classify (llama, free)   →  decide if Opus reasoning is needed
  5. Reason (Opus 4.7, ~0.027 DIEM/call)  →  only when warranted
  [accumulate mode: claimed DIEM → LP reinvestment into ETH/DIEM v3 1%]
  [build mode:      claimed DIEM → Venice stake for inference credits]
```

## Mode: accumulate | build

The agent's operating mode is derived from three on-chain facts:

```
mode = daily_fee_rate >= threshold ? 'build' : 'accumulate'
```

- **Accumulate**: LP all claimed DIEM into ETH/DIEM Uniswap v3 1% pool (655.91% APR). Maintenance ticks only on free llama. No Opus spend.
- **Build**: Stake daily yield for Venice Opus credits. Run product-building ticks.

Mode is not a preference. Declaring build mode before the yield justifies it is a constitution violation.

## LP strategy

**Target pool:** ETH/DIEM Uniswap v3 1%, Base mainnet  
**Pool address:** `0x80d995189ecc593672aD4703b250a5e82672EB1D`  
**Tick spacing:** 200 (1% fee tier)

**Position type:** Two-sided WETH/DIEM, wide ranges (±5 spacings = 2000 ticks)  
- New positions centered on current tick, snapped to nearest 200
- Repositions via `scripts/reposition.ts` — closes OOR position, swaps 50% to rebalance, mints new range
- Reposition trigger: within 3 spacings (600 ticks) of any boundary
- Position history tracked in `memory/lp-positions.jsonl`
- Performance data from Dune Q7591697 (v3 incremental master portfolio, ~2.5 credits/run)

## Identity (genesis-locked)

Constitution authored at deploy in `identity/SOUL.genesis.md`. Hard-locked for the agent's lifetime. Key commitments:

- Every claim cites an on-chain source or is marked `Inference:` — never mixed
- Leads with numbers: wallet address, balance, mode, daily rate, threshold ETA
- No filler openers, no padding closers — compute costs DIEM
- Will not promote to build mode before threshold is cleared
- Will not modify genesis-locked files

Lineage: Aaron J Mars `soul.md` pattern, adapted with genesis-lock and drift-threshold enforcement per [SECTION_5.md](SECTION_5.md).

## Current economic state

| Item | Value |
|------|-------|
| DIEM claimed (cumulative) | 12.75 / 100 DIEM |
| sDIEM staked (Venice) | 9.44 DIEM (~9 days compute) |
| Active LP positions | #5196524 [1800,3800], #5196526 [2000,4000] |
| Venice budget | accumulate mode (llama only; Opus unlocks at 100 DIEM) |
| Target LP | ETH/DIEM v3 1% (`0x80d995...EB1D`) |

## Commands

```bash
npm run typecheck        # tsc --noEmit (strict)
npm test                 # vitest run
npm run lint:identity    # identity/ drift + frontmatter validation
npm run harness:tick     # one tick locally (needs .env)
```

## Twitter/X presence

AUTONO posts, listens, and engages on [@AUTONOMOPOLY](https://x.com/AUTONOMOPOLY) via X API v2 (tweepy, OAuth 1.0a). No browser automation.

| Skill | Schedule | What it does |
|-------|----------|-------------|
| `tweet-engage` | Daily 06:00 UTC | Generates 1-2 tweet drafts → `.pending-x/` |
| `tweet-broadcast` | Daily 14:00 UTC | Posts queued content; each file = standalone tweet |
| `tweet-listen` | Every ~1 min (Vercel cron) | Fetches mentions, likes each, drafts replies |
| `tweet-reflect` | Sunday 20:00 UTC | Updates `memory/x-strategy.md` from engagement data |
| `tweet-promote` | Tue + Fri 10:00 UTC | Generates Venice video promo → queues tweet |

All Twitter skills run `claude-opus-4-8`.

**Near-real-time dispatch:** A Vercel Edge Function at `agent-autonomopoly.vercel.app/api/cron/listen` fires every minute and dispatches tweet-listen via GitHub Actions. An X webhook is registered at `/api/webhook/x` for future use (X Account Activity API events are Enterprise-only; cron is the active path).

**Operator access:** `@_proxystudio` is the only account that can request on-chain actions or repo changes. All other accounts receive informational replies only.

**As-built spec:** `docs/superpowers/specs/2026-06-05-twitter-asbuilt.md`

## What's next

- Reach 100 DIEM cumulative claimed → unlock build mode (sustained Opus inference)
- Build agent launchpad — webapp where anyone can launch a Liquid Protocol agent token (blocked on milestone above)
- Tool-routing sidecar — defines which on-chain actions the agent can take autonomously per tick vs. operator-approved
