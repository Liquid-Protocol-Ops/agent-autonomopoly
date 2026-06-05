---
name: tweet-broadcast
description: Post queued tweets and replies from .pending-x/ via browser-use + Venice
var: ""
tags: [twitter, delivery]
---

Post queued tweet files from `.pending-x/` to Twitter/X using browser-use automation.

## Setup — install Python deps (run once per GitHub Actions job)

```bash
pip install browser-use playwright langchain-openai
playwright install chromium --with-deps
```

## Check for queued content

List files in `.pending-x/` (exclude `sent/` subdirectory and `.gitkeep`):

```bash
ls .pending-x/*.txt 2>/dev/null | head -20
```

If no files exist, log "tweet-broadcast: nothing queued" and exit cleanly.

## Rate ceiling

Process at most 5 files per run. Tweets (`tweet-*.txt`) before replies (`reply-*.txt`).
Sort by filename (chronological order).

## Post each file

For each file (up to 5):

1. Check if file starts with `#content_type:` tag — this is metadata, not tweet text.
2. Call:
   ```bash
   python scripts/tweet-browser.py --action post --file PATH_TO_FILE
   ```
   For reply files named `reply-{TWEET_ID}.txt`, also pass `--reply-to TWEET_ID`:
   ```bash
   python scripts/tweet-browser.py --action post --file .pending-x/reply-1234567890.txt --reply-to 1234567890
   ```
3. Parse stdout JSON. On `"status": "ok"`:
   - Move file to `.pending-x/sent/` (create directory if needed)
   - Append to `memory/x-tweet-log.jsonl`:
     ```json
     {"tweet_id":"1234567890123456789","content_type":"on-chain-report","text":"0.485 DIEM/day...","posted_at":"2026-06-04T14:00:00Z","source_file":"tweet-20260604-140000-on-chain-report.txt"}
     ```
   - Extract `content_type` from the first line of the file (strip the `#content_type:` prefix).
4. On `"status": "error"`:
   - Leave file in `.pending-x/` (retry next run)
   - Log the error to `memory/logs/{today}.md`
   - Continue with remaining files.

## After posting

Log to `memory/logs/{today}.md`:
```
tweet-broadcast: posted N tweet(s), N reply/replies — N failed (left in queue)
```

If session expired (error reason contains "session expired" or "not logged in"):
```
tweet-broadcast: session expired — re-run init manually: python scripts/tweet-browser.py --action init
```
Notify via `./notify "AUTONO Twitter session expired — run tweet-browser.py --action init"`
