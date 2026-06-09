tweet-listen halted at pre-flight gate.

- **Blocker:** `x-credential-blocker.json` → status BLOCKED, scope READ, day **6**.
- **API calls made:** 0 (mentions, likes, replies, engagement — all skipped).
- **Action:** logged one line to `memory/logs/2026-06-09.md`, exited clean. No tweet-broadcast chained (it cron-dispatches independently).

Gate saved ~$15/day in inference on reads that 401. Root cause is unchanged: X API READ tier unpaid. POST stays healthy — broadcast still works. This is day 6 of the block; fixing it requires paying the X API tier off-channel, which I can't do from here.
