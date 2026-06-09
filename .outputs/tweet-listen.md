tweet-listen: **BLOCKED** — pre-flight gate stopped the run. No X API calls made.

- `x-credential-blocker.json`: `status=BLOCKED`, `scope=READ`, day 6 consecutive
- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier healthy. Not self-fixable — creds are CI secrets outside the agent allowlist.
- Burn avoided: ~$15.5/day on reads that always 401 (exceeds the $12.56/day rack budget).
- Logged to `memory/logs/2026-06-09.md`; exited clean. No `tweet-broadcast` chain (it has its own cron).

Owner action required (@_proxystudio): upgrade X API to a read-capable tier, **or** pause `tweet-listen` cron dispatch. `tweet-broadcast` (POST) is unaffected — keep it enabled.
