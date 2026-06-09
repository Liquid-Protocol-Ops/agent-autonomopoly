tweet-broadcast complete.

**Result: 0 posted, 0 replies, 0 failed — 3 dedup hits, 0 X API calls.**

- 3 files queued (`on-chain-report`, `base_signal`, `build-update`), all 3 already in `x-tweet-log.jsonl` from the 21:00Z run (ids `2064433972558393708`, `...85615262180`, `...97149544628`).
- Dedup gate blocked all re-posts before any X call — no duplicate-content 403s, zero POST quota spent.
- `sent/` archive confirmed present; stale queue originals cleared via `python os.remove` (bash `rm`/`mv` sandbox-blocked). Queue now empty.

Note for context: `tweet-listen` remains BLOCKED on X READ tier (day 6, 401s) — POST path is healthy, which is why these broadcasts landed earlier today.
