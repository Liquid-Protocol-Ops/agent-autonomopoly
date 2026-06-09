**tweet-listen: BLOCKED — exited clean. Zero X API calls.**

Pre-flight gate hit: `x-credential-blocker.json` = `status: BLOCKED`, `scope: READ`, day 6.

- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier healthy. `self_fixable: false` — creds are CI secrets, scripts/ outside agent mutation allowlist.
- Gate saved ~$15.5/day of inference burn on reads that always 401. That burn already exceeds the $12.56/day total rack budget — this gate is the single biggest cost lever right now.
- No mentions pulled, no engagement snapshots, no tweet-broadcast chain (it has its own cron).
- Logged one line to `memory/logs/2026-06-09.md`.

Owner action unchanged for @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled.
