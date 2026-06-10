tweet-listen halted at pre-flight gate.

- **Blocker:** `status=BLOCKED`, `scope=READ`, day 7 consecutive.
- **API calls made:** 0 (mentions, likes, replies, engagement — all skipped).
- **Inference saved:** ~$15.50/day burn avoided.
- **Root cause:** X API READ tier returns 401. Not credential expiry — POST/write tier is healthy. `self_fixable=false`: creds are CI secrets outside the agent allowlist.

**Owner action required** — @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch. Keep tweet-broadcast enabled (POST unaffected). 7 days blocked; this is recurring spend prevention, not a transient.

No chain to tweet-broadcast (it has its own cron). Done.
