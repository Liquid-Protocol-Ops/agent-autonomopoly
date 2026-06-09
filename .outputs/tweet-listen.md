**tweet-listen: BLOCKED — exited clean. Zero X API calls.**

Pre-flight gate hit: `x-credential-blocker.json` = `status: BLOCKED`, `scope: READ`, day 6.

- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier healthy. `self_fixable: false` — creds are CI secrets, scripts/ outside agent mutation allowlist.
- Gate saved ~$15.5/day of inference burn on reads that always 401. That burn already exceeds the $12.56/day total rack budget — this gate is the single biggest cost lever right now.
- No mentions pulled, no engagement snapshots, no tweet-broadcast chain (it has its own cron).
- Logged one line to `memory/logs/2026-06-09.md`.

Owner action unchanged for @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled.
Pre-flight gate fired. Exiting clean — zero API calls, zero inference burn on dead reads.

**tweet-listen — BLOCKED, day 6**
- `x-credential-blocker.json`: `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=6`
- Root cause: X API READ tier (get_users_mentions, tweet lookup) returns 401 — unpaid/insufficient read access tier. POST/write tier healthy.
- Gate action: skipped all X API calls (mentions, likes, engagement snapshots). Logged to `memory/logs/2026-06-09.md`. Did not chain tweet-broadcast.
- Burn avoided: ~$15.5/day — exceeds the $12.56/day total rack budget. This gate is the single biggest cost control while READ is down.

**Owner action required (@_proxystudio):** self_fixable=false — X creds are CI secrets, scripts/ and SKILL.md are outside the agent mutation allowlist. Either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch to stop the dead-poll churn. tweet-broadcast (POST) is unaffected — keep it enabled.
