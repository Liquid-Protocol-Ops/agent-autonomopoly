---
name: tweet-reflect
description: Weekly strategy update — reweight content types from engagement data, prune accounts
var: ""
tags: [twitter, strategy]
---

Weekly strategy calibration based on real engagement data from the past 7 days.

## Step 1: Aggregate engagement by content type

Read `memory/x-performance.jsonl`. For snapshots in the last 30 days, group by `content_type` and compute:
- `median_likes`, `median_replies`, `median_reposts`
- `engagement_score = median_likes + median_replies * 2 + median_reposts * 1.5`
- `sample_count` (how many tweets of this type)

Content types with fewer than 3 samples: mark as `insufficient_data`, do not change their weight.

## Step 2: Update memory/x-strategy.md

Rewrite the `## Content Type Weights` section of `memory/x-strategy.md` with the computed scores. Normalise scores to sum to 1.0. Keep the prose sections intact — only update the weights table.

Format:
```markdown
## Content Type Weights

_Updated: 2026-06-08 by tweet-reflect. Based on 14 engagement snapshots (last 30 days)._

| Type | Weight | Median engagement score | Sample count |
|------|--------|------------------------|--------------|
| on-chain-report | 0.35 | 6.2 | 5 |
| ecosystem-commentary | 0.28 | 4.8 | 4 |
| agent-philosophy | 0.22 | 3.9 | 3 |
| lp-update | 0.15 | 2.4 | 2 |
| reaction | — | — | insufficient_data (1 sample) |
```

If no performance data exists yet, write a note: "No data yet — equal weights applied by tweet-engage."

## Step 3: Record promoted candidates

Read `memory/x-performance.jsonl` and `memory/x-tweet-log.jsonl`. Identify the top 3 tweets by `engagement_score = likes + replies * 2 + reposts * 1.5` from the past 30 days. For each, fetch the tweet text from `x-tweet-log.jsonl` by `tweet_id`. Append to `memory/x-promoted-candidates.jsonl` (skip if `tweet_id` already present):

```json
{"tweet_id":"...","content_type":"on-chain-report","engagement_score":8.5,"text":"[full tweet text]","nominated_at":"2026-06-08T09:00:00Z","status":"candidate"}
```

These are nomination-only — the operator manually moves approved candidates into `identity/examples/promoted/`.

## Step 4: Prune and rank x-accounts.json

Read `memory/x-accounts.json`. For each account:
- If `engagement_score == 0` and `added_at` is more than 30 days ago: mark as `status: inactive`
- If account has been mentioned in a tweet that got >10 likes (check x-tweet-log.jsonl): increment `engagement_score`

Write updated `memory/x-accounts.json`.

## Step 5: Process discovery queue

Read `memory/x-discovery-queue.jsonl` (may not exist — skip silently if absent). For each entry, decide whether to add to `x-accounts.json`:
- Add if: the wallet belongs to a Liquid Protocol token deployer whose token has >$1K volume (check Dune Q7591697 data in MEMORY.md or memory/on-chain-state.json)
- Skip if: wallet is unknown or token has zero activity

Mark processed entries with `processed: true` in the queue file.

## Step 6: Write reflection

Append to `memory/logs/{today}.md`:
```
tweet-reflect: top content type this week: TYPE (score X.X) | strategy updated | accounts pruned: N | new accounts added: N
```

Also set `api_upgrade_ready: false` in `memory/x-strategy.md` frontmatter unless tweet-broadcast or tweet-listen has had `consecutive_failures >= 3` in `memory/cron-state.json` — if so, set `api_upgrade_ready: true` to signal the operator that the browser approach may need upgrading.
