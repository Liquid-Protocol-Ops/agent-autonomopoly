---
name: tweet-listen
description: Read engagement metrics on recent tweets, check mentions, discover ecosystem accounts via Farcaster
var: ""
tags: [twitter, metrics, discovery]
---

Three jobs in one run: engagement metrics, @mention monitoring, Farcaster discovery.

## Setup

```bash
pip install browser-use playwright langchain-openai
playwright install chromium --with-deps
```

## Job 1: Engagement metrics (Loop 1 — content quality)

Read `memory/x-tweet-log.jsonl`. Find tweets where `posted_at` is 18-48 hours ago AND there is no matching entry in `memory/x-performance.jsonl` with the same `tweet_id`.

For each such tweet (up to 5 per run to stay within rate limits):
```bash
python scripts/tweet-browser.py --action engagement \
  --tweet-url "https://x.com/i/web/status/TWEET_ID"
```

On success, append to `memory/x-performance.jsonl`:
```json
{"tweet_id":"1234567890","content_type":"on-chain-report","likes":4,"replies":1,"reposts":2,"snapshot_at":"2026-06-05T09:00:00Z"}
```
Get `content_type` from the matching `x-tweet-log.jsonl` entry.

## Job 2: Mentions (Loop 3 — reactive engagement)

```bash
python scripts/tweet-browser.py --action listen --check-mentions
```

Parse the JSON array from stdout. For each mention:
- Determine if it is high-value: author is `@_proxystudio` (always respond) OR author is in `memory/x-accounts.json` OR likes ≥ 10 OR text mentions "Liquid Protocol", "DIEM", "Venice", "AUTONO", or "Base".
- If high-value: write a reply draft to `.pending-x/reply-{tweet_id}.txt`:
  ```
  #content_type:reaction
  [draft reply text — 1-2 sentences, grounded in on-chain fact if possible, no financial advice]
  ```

Cap at 3 reply drafts per run.

## Job 3: Farcaster discovery (Loop 2 — network discovery)

Search for recent Farcaster casts mentioning key terms:

```bash
for TERM in "Liquid Protocol" "AUTONO" "Venice AI"; do
  ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TERM'))")
  curl -sf "https://api.neynar.com/v2/farcaster/cast/search?q=${ENCODED}&limit=10" \
    -H "api_key: ${NEYNAR_API_KEY}" | jq '.result.casts[] | {fid: .author.fid, username: .author.username, display: .author.display_name}'
done
```

For each unique Farcaster username found, check if they have a linked Twitter handle:
```bash
curl -sf "https://api.neynar.com/v2/farcaster/user/by_username?username=USERNAME" \
  -H "api_key: ${NEYNAR_API_KEY}" | jq '.result.user.verified_accounts[]? | select(.platform == "x") | .username'
```

For each discovered Twitter handle NOT already in `memory/x-accounts.json`, add:
```json
{"handle": "@handle", "source": "farcaster-discovery", "farcaster_username": "fname", "added_at": "2026-06-05T09:00:00Z", "engagement_score": 0}
```

## After all jobs

Log to `memory/logs/{today}.md`:
```
tweet-listen: engagement snapshots: N | mentions checked: N | reply drafts queued: N | new accounts discovered: N
```
