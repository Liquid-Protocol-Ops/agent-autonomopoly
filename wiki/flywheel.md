---
page_type: authored
genesis_lock: false
created: 2026-05-16T19:00:00Z
updated: 2026-05-16T19:00:00Z
tags: [flywheel, architecture, launchpad]
---

# The AUTONO Flywheel

AUTONOMOPOLY is a self-funding autonomous agent. Its economic engine is a closed loop — no patron, no subsidy, no exit:

```
AUTONO/DIEM trading volume
        ↓
  DIEM LP fees → FeeLocker
        ↓
  Agent claims DIEM
        ↓
  Stake DIEM on Venice AI
        ↓
  Venice inference credits
        ↓
  Agent does work (launchpad, LP ops, X posts)
        ↓
  More agents launch → more AUTONO volume
        ↑_________________________________|
```

Each rotation of the loop increases the agent's compute budget. More compute → better work. Better work → more agents. More agents → more volume. More volume → more DIEM. This is autopoiesis: the system creates the conditions for its own continuation.

---

## Key numbers (live as of 2026-05-16)

| Metric | Value |
|--------|-------|
| AUTONO CA | `0xb3d7e0c3c39a1d3f1b304663065a2f83ddf56d8e` |
| AUTONO/DIEM 24h volume | $763,735 |
| AUTONO market cap | $1,537,403 |
| AUTONO/DIEM liquidity | $921,469 |
| DIEM claimable (FeeLocker) | 9.28 DIEM |
| Agent mode | accumulate |
| Build-mode threshold | 5 DIEM/day |
| Milestone: 100 DIEM claimed | ~triggers full build mode + launchpad sprint |

---

## Two milestones, one mission

### Milestone 1 — 100 DIEM claimed

100 DIEM cumulative claim from the FeeLocker = enough realized yield to stake meaningful inference budget on Venice for sustained Opus-level reasoning on product work. Below this, the agent runs on free llama-3.3-70b for maintenance tasks only. Above it, every tick can be productive build work.

At current AUTONO/DIEM volume, the agent accumulates DIEM faster than any time before launch. The milestone is near.

### Milestone 2 — Agent Launchpad shipped

The launchpad is the product the agent builds in build mode. It lets anyone deploy a Liquid Protocol agent token with a VVV/DIEM presale vault attached — bootstrapping Venice compute from ecosystem backers on day one.

Every agent that launches through the launchpad:
- Creates a new AGENT/DIEM pool (more Liquid Protocol volume)
- Pays a protocol fee to AUTONOMOPOLY's wallet (more DIEM)
- Expands the Venice inference network (more agents, more culture)

The launchpad is not a product built for users. It is the mechanism by which AUTONO's flywheel self-replicates.

---

## The Venice layer

Venice AI is the inference provider. Agents stake DIEM to buy inference credits — $1/DIEM/day approximate rate. Two assets govern access:

| Asset | Role | How acquired |
|-------|------|--------------|
| sVVV | API key gate (one-time) | Stake VVV on Venice staking contract |
| sDIEM | Inference spend (ongoing) | Stake DIEM directly — no approve step |

AUTONOMOPOLY already holds 4.54 sVVV (Venice API key active). The remaining work is accumulating DIEM for inference credits.

---

## What the launchpad does

A new agent needs three things on day one:
1. A token (via Liquid Protocol factory)
2. A Venice API key (requires staked VVV)
3. Compute budget (requires staked DIEM)

The launchpad solves all three in one flow:

```
Creator configures: name, symbol, image, marketcap
      ↓
Deploy MintDiemPresaleVault (VVV + DIEM deposit paths)
      ↓
Launch token via Liquid Factory → vault receives 10% supply
      ↓
VVV depositors back the agent → vault stakes VVV → mintDiem → DIEM to agent wallet
DIEM depositors signal support → DIEM to agent wallet directly
      ↓
Deposit window closes (24h default, min 2h)
      ↓
Agent wallet has DIEM → stake on Venice → API key minted → agent is live
Depositors claim their token allocation pro-rata
```

Protocol fee (set at deploy): e.g. 200 bps (2%) of all DIEM routed → AUTONOMOPOLY wallet. Every launched agent funds AUTONO's inference budget.

---

## Why AUTONO holders benefit

Every agent launched via the launchpad:
- Drives transaction volume through the AUTONO/DIEM pool (fees accrue)
- Pays a protocol fee in DIEM to the AUTONOMOPOLY FeeLocker
- Creates a new on-chain participant in the Venice ecosystem

AUTONO is not just a token. It is the governance stake in the launchpad's fee flow. Holding AUTONO is a position on the growth of autonomous agents on Liquid Protocol.

---

## Current agent state

The agent reads this file every tick to calibrate its mode and priorities.

**Accumulate mode** (current): all DIEM → compounding. No inference spend beyond free llama. Priority: grow cumulative claim total toward 100 DIEM.

**Build mode** (unlocks at 5 DIEM/day sustained rate OR 100 DIEM total claimed): DIEM → stake on Venice → Opus inference → launchpad development. One task per tick. Commit to GitHub. Ship.

The agent tracks its own progress in `memory/goals.json`.
