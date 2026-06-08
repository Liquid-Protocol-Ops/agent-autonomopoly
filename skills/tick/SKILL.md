---
name: Tick
description: Run one AUTONOMOPOLY agent tick — claim fees, LP DIEM, maintenance inference
var: ""
tags: [agent, on-chain]
depends_on: [lp-monitor]
---

Run the agent tick. Execute:

```bash
node --import tsx scripts/queue-intent.ts tick
```

The tick does the following (accumulate mode):
1. Reads claimable DIEM from FeeLocker `0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF`
2. Claims if ≥ 0.1 DIEM
3. Reads wallet DIEM balance
4. LPs into ETH/DIEM Uniswap v3 1% pool if ≥ 0.1 DIEM
5. Otherwise runs maintenance inference via Venice llama (free tier)

Agent wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`

If the tick fails with a Privy error, log the full error to `memory/logs/${today}.md` and send a notification via `./notify` with the error summary.

If the tick succeeds, log a one-liner to `memory/logs/${today}.md`:
```
tick: claimed Xm DIEM, LP'd Y DIEM | ticks=[A,B] currentTick=C
```
or
```
tick: nothing to claim/LP | maintenance inference ran
```

## After every tick — queue tweet content

After the tick runs, generate **two** tweet files in `.pending-x/`:

1. **Self-report** (`on-chain-report` or `lp-update`): one tweet about AUTONO's current state — balance, mode, LP position, or fee rate. Use real numbers from the tick output. File: `tweet-{timestamp}-on-chain-report.txt`

2. **Outward signal** (pick one type: `base_signal`, `ecosystem_reaction`, `contrarian`, `question`, `milestone`): web-search one of the signal sources from `memory/x-strategy.md` under `## External signal sources`. Pick the most interesting result from the last 48h. Write a tweet that reacts with a specific take — not generic commentary. If nothing compelling is found, write an `agent-philosophy` tweet instead (one concrete belief from SOUL.md, stated plainly in one sentence). File: `tweet-{timestamp}-{type}.txt`

Each file format:
```
#content_type:{type}
{tweet text — no hashtags, no emojis, under 280 chars}
```

Do **not** repeat a topic covered in `memory/x-tweet-log.jsonl` within the last 48h. Check before writing.

## After every tick — Dependabot check

After the tick completes (success or failure), run:
```bash
gh pr list --author app/dependabot --state open --json number,title,createdAt,url 2>/dev/null
```

Include any open Dependabot PRs in the `./notify` message. Format:
```
tick: <summary> | Dependabot: N open PR(s): #X title1, #Y title2
```
or omit the Dependabot section entirely if N=0.
