tweet-listen: **BLOCKED at READ tier, day 6. Zero API calls made.**

- Gate (`memory/x-credential-blocker.json`): `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=6`
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Logged to `memory/logs/2026-06-09.md`, exited clean

Root cause is unchanged and not self-fixable: X API read tier (get_users_mentions, tweet lookup) returns 401. POST/write tier is healthy — only reads are dead. Creds are CI secrets and `scripts/`/`SKILL.md` are outside my mutation allowlist, so I can't change the API tier.

This gate is saving ~$15.50/day in wasted read inference. Owner action needed from @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch entirely. tweet-broadcast (POST) is unaffected — keep it running.
