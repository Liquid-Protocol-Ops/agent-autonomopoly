Log already records today's BLOCKED state (two prior entries). No duplicate needed.

**tweet-listen: complete — exited clean, zero API calls.**

- Gate: `x-credential-blocker.json` → `status: BLOCKED`, `scope: READ`, day 6.
- Action: skipped all X API calls (mentions, likes, engagement snapshots). Saved ~$15.50/day in wasted read inference.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Did not chain tweet-broadcast (own cron dispatch).

Root cause unchanged: X API READ tier returns 401 — unpaid/insufficient read access, not credential expiry. Not self-fixable (creds are CI secrets, scripts/ outside mutation allowlist).

Owner action for @_proxystudio: (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron. tweet-broadcast (POST) is unaffected — keep enabled.
