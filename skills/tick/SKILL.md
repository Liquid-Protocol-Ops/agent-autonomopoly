---
name: Tick
description: Run one AUTONOMOPOLY agent tick — claim fees, LP DIEM, LP range check + reposition, maintenance inference
var: ""
tags: [agent, on-chain, defi]
---

Run the agent tick. Execute:

```bash
node --import tsx scripts/queue-intent.ts tick
```

**Check `memory/goals.json` for the current `mode` before proceeding. The harness injects it as `AGENT_MODE` but read the file directly to confirm.**

### Every tick (accumulate + build mode)
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

## Every tick — LP range check (absorbed from lp-monitor, 2026-06-10)

The standalone lp-monitor skill is disabled — its duties run here so one job per
2h covers both (same chain reads, half the runs).

1. Read all positions:
   ```bash
   node --import tsx scripts/check-portfolio.ts
   ```
   Record every tokenId, in-range vs out-of-range, current pool tick, FeeLocker
   balance, wallet balances.

2. **In range** → note fee accrual in the log line. **Out of range** → queue a
   reposition intent for the gated executor (you cannot sign in this step):
   ```bash
   node --import tsx scripts/queue-intent.ts reposition --token-id <tokenId>
   ```
   The executor runs scripts/reposition.ts (reads liquidity on-chain, claims
   FeeLocker fees, swaps 50%, mints a new in-range position, records the new
   tokenId in `memory/lp-positions.jsonl`).

3. Safety checks before queueing: dry-run shows the right tokenId with non-zero
   liquidity; the new range brackets the current tick; ETH > 0.003 for gas. If a
   check fails, log the issue and notify instead of queueing.

4. Log to `memory/logs/${today}.md`:
   ```
   lp-check: N in range, M reposition queued | tick=C | FeeLocker=X DIEM
   ```
   Notify via `./notify` only when a reposition was queued or a safety check
   failed — all-in-range is log-only.

## After every tick — queue tweet content

Read `memory/goals.json`. If `tweetingPaused` is `true`, skip this entire section — do not write any files to `.pending-x/`. Log "tick: tweet generation skipped (tweetingPaused=true)" to `memory/logs/{today}.md`.

After the tick runs, generate tweet files in `.pending-x/`.

**In accumulate mode**: generate 2 tweets (see below).
**In build mode**: generate 3 tweets — add a build-update tweet (see below).

**Filename format:** `tweet-{YYYYMMDD-HHMMSSsss}-{type}.txt` — use seconds **and** milliseconds (e.g. `tweet-20260609-143022847-on-chain-report.txt`). This prevents same-basename collisions when two tweets are generated in the same second. Generate the timestamp once at the start of this section and reuse it for all files in this run.

**Non-empty body assertion:** Before writing any file, assert that the tweet body (everything after the `#content_type:` line) is non-empty and under 280 characters. If the body is empty, log an error to `memory/logs/{today}.md` and skip that file — do not write an empty stub.

1. **Self-report** (`on-chain-report` or `lp-update`): one tweet about AUTONO's current state — balance, mode, LP position, or fee rate. Use real numbers from the tick output. File: `tweet-{YYYYMMDD-HHMMSSsss}-on-chain-report.txt`

2. **Outward signal** — read the `## Content Type Weights` table from `memory/x-strategy.md`. Select a content type using the weights as probabilities, excluding `on-chain-report` and `lp-update` (those are self-report types). If the file is absent or all relevant weights are `insufficient_data`, use equal weights across: `base_signal`, `ecosystem_reaction`, `agent-philosophy`, `contrarian`, `question`, `milestone`. Then web-search at least one source from `## External signal sources` in `memory/x-strategy.md`. Pick the most interesting result from the last 48h and write a tweet with a specific take — not generic commentary. If no compelling signal is found, fall back to `agent-philosophy` (one concrete belief from `identity/SOUL.md`, stated plainly in one sentence). File: `tweet-{YYYYMMDD-HHMMSSsss}-{type}.txt`

Each file format:
```
#content_type:{type}
{tweet text — no hashtags, no emojis, under 280 chars}
```

3. **(Build mode only) Build-update** (`build-update`): one tweet about what you are actively building or what you just improved. Must include a specific detail — a file name, a metric, a before/after. No vague "I'm building the launchpad." Example: "self-improve ran: increased contrarian weight 0.15→0.22 based on 3-week engagement data. top-3 performing tweets all contrarian. feedback loop closing." File: `tweet-{YYYYMMDD-HHMMSSsss}-build-update.txt`

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
