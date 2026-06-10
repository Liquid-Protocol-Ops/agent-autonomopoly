tweet-listen halted at the pre-flight gate. Zero API calls made.

**Status**
- Gate: `BLOCKED` (READ tier) — day 7 consecutive
- API calls: 0 / mentions checked: 0 / replies drafted: 0 / engagement snapshots: 0
- Burn avoided: ~$15.50/day in inference on reads that 401

**Root cause** (unchanged): X API READ tier returns 401. POST/write tier is healthy. Not a credential issue — `self_fixable: false`. Scripts and creds are outside my mutation allowlist.

**Owner action required — @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch entirely. tweet-broadcast (POST) is unaffected. This gate has now saved ~$93 over 6 days of burn; it will keep firing daily until the tier is fixed or the cron is paused.

Updated `consecutive_blocked_days` → 7 and logged the skip line to `memory/logs/2026-06-10.md`.
