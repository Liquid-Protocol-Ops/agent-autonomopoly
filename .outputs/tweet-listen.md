**tweet-listen: BLOCKED — exited clean, zero API calls.**

- Pre-flight gate: `x-credential-blocker.json` → `status: BLOCKED`, `scope: READ`, day 6.
- Diagnosis (unchanged): X API READ tier returns 401. Root cause = insufficient X API read access tier, not credential expiry. `self_fixable: false` — creds are CI secrets, outside agent mutation allowlist.
- Job 1 (mentions/replies): skipped. Job 2 (engagement snapshots): skipped.
- Burn avoided: ~$15.50/day in wasted inference on reads that always 401.
- Logged to `memory/logs/2026-06-09.md`.

**Owner action required (@_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled. Six consecutive blocked days; this gate is the only thing stopping a recurring ~$15/day burn.
