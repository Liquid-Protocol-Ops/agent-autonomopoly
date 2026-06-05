---
name: tweet-broadcast
description: Post queued tweets and replies from .pending-x/ via X API v2 (tweepy)
var: ""
tags: [twitter, delivery]
---

Post queued tweet files from `.pending-x/` to Twitter/X using the X API v2.

## CRITICAL: Never thread tweets

Each `tweet-*.txt` file is a **standalone post**. Never pass `--reply-to` for tweet files.
Do NOT chain tweets into threads. Each one goes out independently to the main feed.
Only `reply-{TWEET_ID}.txt` files use `--reply-to`. Threads appear under "Replies" not "Posts" — this is wrong.

## Check for queued content

```bash
ls .pending-x/*.txt 2>/dev/null | head -20
```

If no files exist, log "tweet-broadcast: nothing queued" and exit cleanly.

## Rate ceiling

Process at most 5 files per run. Tweets (`tweet-*.txt`) before replies (`reply-*.txt`).
Sort by filename (chronological order).

## Post each file

For each file (up to 5):

1. Strip the `#content_type:` first line — that is metadata only, never tweet text.
2. For **tweet files** (`tweet-*.txt`) — standalone post, no reply-to:
   ```bash
   python scripts/tweet-browser.py --action post --file .pending-x/tweet-20260604-on-chain-report.txt
   ```
3. For **reply files** (`reply-{TWEET_ID}.txt`) — reply to that tweet ID:
   ```bash
   python scripts/tweet-browser.py --action post --file .pending-x/reply-1234567890.txt --reply-to 1234567890
   ```
4. Parse stdout JSON. On `"status": "ok"`:
   - Move file to `.pending-x/sent/`
   - Append to `memory/x-tweet-log.jsonl`:
     ```json
     {"tweet_id":"1234567890123456789","content_type":"on-chain-report","text":"0.485 DIEM/day...","posted_at":"2026-06-04T14:00:00Z","source_file":"tweet-20260604-140000-on-chain-report.txt"}
     ```
5. On `"status": "error"`: leave file in `.pending-x/`, log error, continue.

## After posting

Log to `memory/logs/{today}.md`:
```
tweet-broadcast: posted N tweet(s), N replies — N failed (left in queue)
```
