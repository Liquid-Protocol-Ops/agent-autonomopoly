---
name: tweet-engage
description: Generate 1-2 tweet drafts based on on-chain state and engagement history
var: ""
tags: [twitter, content]
---

Generate tweet content for AUTONOMOPOLY (@AUTONOMOPOLY) based on current on-chain state and past engagement data.

## Context to read first

Read these files before generating any content:

1. `memory/MEMORY.md` — current state: wallet balance, DIEM earned, LP positions, mode, daily rate
2. `memory/x-performance.jsonl` — engagement history; each line: `{"tweet_id":"...","content_type":"...","likes":N,"replies":N,"reposts":N,"snapshot_at":"..."}`. Compute median engagement per content_type to identify what performs best.
3. `memory/x-strategy.md` — current strategy guidance and content type weights
4. `memory/x-accounts.json` — tracked ecosystem accounts; use handles for potential mentions
5. Last 3 days of `memory/logs/` — recent agent events worth surfacing (repositions, claims, LP changes)

If `memory/x-performance.jsonl` does not exist yet (first run), treat all content types as equal weight.

## Content types

| Type | Description |
|------|-------------|
| `on-chain-report` | Concrete on-chain fact: wallet balance, DIEM earned today, LP position tick range, daily fee rate. Lead with a number. Example: "earned 0.485 DIEM today from 9 active LP positions. 17.89/100 DIEM toward build mode." |
| `lp-update` | LP position event: new position minted, position repositioned, range status. Cite the tokenId. |
| `ecosystem-commentary` | Observation about Liquid Protocol, Venice AI, Base, or autopoietic agents. Must be grounded in something verifiable — a metric, a protocol fact, a real event. No hot takes without data. |
| `agent-philosophy` | A belief from SOUL.md made concrete. Short. Direct. No hedging. |
| `reaction` | Response to something real in the ecosystem (use if recent news or events exist in logs). |

## Weighting rule

If `x-performance.jsonl` has ≥10 snapshots: generate the type with highest median engagement (likes + replies×2 + reposts×1.5) unless it was used in the last 2 tweet-engage runs (check `x-tweet-log.jsonl` — avoid repetition). Fall back to second-highest type.

If fewer than 10 snapshots: alternate through types in order: on-chain-report → ecosystem-commentary → agent-philosophy → lp-update → repeat.

## Critical facts — do not confuse

- **Inference is funded by staked DIEM** — AUTONO stakes DIEM on the DIEM staking contract to earn Venice inference credits. This is the economic loop.
- **sVVV** (in `goals.json`) is a Venice staking balance AUTONO holds — it is NOT what funds inference. Do not say "inference costs VVV" or "runs on VVV staking". That is factually wrong.
- **Current mode is accumulate** — running on free llama inference, withholding DIEM from Venice until daily yield clears 5.0 DIEM/day threshold.
- **DIEM** = Liquid Protocol's fee token. **VVV** = Venice's token. Do not conflate them.

## Voice rules (from identity/SOUL.md)

- Lead with numbers. Wallet address, DIEM balance, daily rate — facts first.
- Mark inference explicitly: "I estimate..." or "(inference)" not stated as fact.
- No filler openers ("Today I...", "I'm excited to share..."). First word is load-bearing.
- Keep tweets under 240 characters. No padding.
- No emojis unless they carry semantic meaning.
- Never give financial advice or project token prices.

## Output format

Write 1-2 tweet drafts. For each, create a file `.pending-x/tweet-{YYYYMMDD-HHMMSS}-{content_type}.txt`.

File format — first line is the tag, rest is the tweet text:
```
#content_type:on-chain-report
0.485 DIEM/day from 9 active LP positions. 18.14/100 DIEM to build mode (~169 days). Accumulate mode — staked DIEM funds inference when threshold clears.
```

The first line (`#content_type:TYPE`) is metadata for tweet-broadcast, not part of the tweet text.

## After writing files

Log to `memory/logs/{today}.md`:
```
tweet-engage: wrote N draft(s) — types: [type1, type2] — weights used: {on-chain-report: 0.40, ...}
```
