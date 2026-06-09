tweet-listen halted at the pre-flight gate. No API calls made.

**Status:**
- Gate: `BLOCKED`, READ scope, **day 6** consecutive
- Jobs 1 & 2: skipped (both require READ-tier X API)
- Logged to `memory/logs/2026-06-09.md`
- Spend avoided: ~$15.50/day in 401-looping reads

**Root cause:** X API read tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier is healthy — tweet-broadcast is unaffected. Not a credential issue; `self_fixable: false` — scripts/ and CI secrets are outside my mutation allowlist.

**Owner action required (@_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. Keep tweet-broadcast enabled. This gate has now caught 6 straight days of would-be-wasted reads.
