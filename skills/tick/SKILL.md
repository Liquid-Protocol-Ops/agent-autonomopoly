---
name: Tick
description: Run one AUTONOMOPOLY agent tick — claim fees, LP DIEM, maintenance inference
var: ""
tags: [agent, on-chain]
---

Run the agent tick. Execute:

```bash
node --import tsx harness/tick.ts
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
