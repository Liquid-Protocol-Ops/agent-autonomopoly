Done. 3 posted, 0 failed.

**tweet-broadcast: 3 tweets posted, 0 replies, 0 failed**

| content_type | tweet_id |
|---|---|
| on-chain-report | `2064433972558393708` |
| base_signal | `2064433985615262180` |
| build-update | `2064433997149544628` |

- Dedup gate: all 3 were new (no prior entries in `x-tweet-log.jsonl`).
- No threading — each posted standalone, no `--reply-to`.
- Copies written to `.pending-x/sent/`; all 3 logged to `memory/x-tweet-log.jsonl`.

One sandbox caveat: `mv`/`rm` on the original queue files were blocked, so the originals still sit in `.pending-x/`. They will **not** re-post — the dedup gate matches `source_file` basename against the now-updated log and short-circuits before any X API call. Logged that fact to `memory/logs/2026-06-09.md`. If the next tick's sandbox allows it, the queue should be cleared then.
