---
name: tweet-listen
description: Read engagement metrics on recent tweets, monitor mentions, discover ecosystem accounts. Two-tier response model based on mention author.
var: ""
tags: [twitter, metrics, discovery]
---

Three jobs in one run: engagement metrics, @mention monitoring, Farcaster discovery.

## Permission tiers

**Collaborator — `@_proxystudio`:** Full access. May receive replies that include live on-chain data (queried fresh this run), complex analysis, and multi-part context. Can ask AUTONO to surface wallet state, LP health, fee earnings, or DIEM balance. Requests that imply on-chain writes are noted in `memory/x-collaborator-requests.jsonl` for operator review — AUTONO does not execute writes unilaterally.

**Public — all other accounts:** Text reply only. Reply content is derived exclusively from data already in `memory/` files — no new chain queries, no external API calls, no intent queuing, no workflow dispatch. Keep replies grounded, concise, on-character. Do not surface private operational details (wallet address, private key paths, exact credential names).

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

Parse the JSON array from stdout. For each mention, apply the permission tier:

### If author is `@_proxystudio` (collaborator tier):

Always queue a reply. You may:
- Read `memory/goals.json`, `memory/lp-positions.jsonl`, `memory/earnings.jsonl`, `memory/cron-state.json` to surface live context
- Craft a reply that directly answers their question or engages with their point using real numbers
- If they request an on-chain action (rebalance, claim, stake), append to `memory/x-collaborator-requests.jsonl`:
  ```json
  {"ts":"2026-06-05T09:12:00Z","from":"@_proxystudio","tweet_id":"123","request":"rebalance LP","reply_drafted":"yes"}
  ```
  And note in the reply that the request has been logged for operator review.

Write reply to `.pending-x/reply-{tweet_id}.txt`:
```
#content_type:reaction
[reply text — substantive, data-grounded, max 280 chars]
```

### If author is any other account:

Check if high-value: author is in `memory/x-accounts.json` OR likes ≥ 10 OR text mentions "Liquid Protocol", "DIEM", "Venice", "AUTONO", or "Base".

If high-value: write a reply draft using ONLY data from `memory/` files (no fresh chain reads):
```
#content_type:reaction
[reply text — on-character, concise, max 280 chars. No wallet ops, no external queries.]
```

If not high-value: skip. Do not queue a reply.

Cap at 3 reply drafts per run (across all tiers combined).

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

Skip Farcaster discovery if this run already queued 3 reply drafts (stay under rate limits).

## After all jobs

Log to `memory/logs/{today}.md`:
```
tweet-listen: engagement snapshots: N | mentions checked: N | reply drafts queued: N (proxystudio: N, public: N) | new accounts discovered: N
```
