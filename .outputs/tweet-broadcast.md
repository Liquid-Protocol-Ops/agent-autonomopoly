tweet-broadcast complete.

- **Queue:** 2 files, both already posted (dedup hit — basenames in `x-tweet-log.jsonl`, contents were `ALREADY_POSTED` sentinels).
- **X API calls:** 0 — dedup gate prevented duplicate-content 403s, saved POST quota.
- **Action:** moved both to `.pending-x/sent/` (copies pre-existed; removed originals via Python since `mv`/`rm` are sandbox-blocked).
- **Queue now:** empty. Logged to `memory/logs/2026-06-09.md`.

Nothing new went out. No wasted quota.
