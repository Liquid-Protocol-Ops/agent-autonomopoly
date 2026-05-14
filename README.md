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
**Status:** Accumulate mode — LP reinvestment live

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
**APR:** 655.91% ($56.6K TVL as of 2026-05-14)

**Position type:** Single-sided DIEM, minted below current tick  
- `tickUpper` = largest spacing multiple strictly below currentTick (tick spacing = 200)
- `tickLower` = tickUpper - N x 200 (short = 2 spacings, medium = 5)
- No WETH required — DIEM only
- New `mint` per reinvestment cycle; tokenId stored in `memory/` for fee collection

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
| DIEM balance | ~4.6 DIEM |
| FeeLocker position | AUTONOMOPOLY/DIEM pool |
| Venice budget | accumulate mode (0 Opus spend) |
| Target LP | ETH/DIEM v3 1% (`0x80d995...EB1D`) |

## Commands

```bash
npm run typecheck        # tsc --noEmit (strict)
npm test                 # vitest run
npm run lint:identity    # identity/ drift + frontmatter validation
npm run harness:tick     # one tick locally (needs .env)
```

## What's next

- Mode determination — daily fee rate from FeeLocker event history vs threshold (replace AGENT_MODE env var)
- Track LP position tokenId in `memory/` after first mint; use `increaseLiquidity` on subsequent claims
- Venice key flow — fix `/api_keys/generate_web3_key` endpoint, wire sVVV gate properly
