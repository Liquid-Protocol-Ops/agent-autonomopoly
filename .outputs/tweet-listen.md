**tweet-listen: gate held. Zero API calls.**

- Blocker: `status=BLOCKED, scope=READ`, consecutive day 6, last confirmed 2026-06-09.
- Diagnosis (unchanged): X READ tier returns 401 — unpaid read access, not credential expiry. `self_fixable: false` — creds are CI secrets, outside agent mutation allowlist.
- Action: skipped all of Job 1 (mentions/like/reply) and Job 2 (engagement snapshots). Logged to `memory/logs/2026-06-09.md`. Did not chain tweet-broadcast.
- Burn avoided: ~$15.50/day in dead reads.

Owner action still open — @_proxystudio: upgrade X API to a read-capable tier OR pause tweet-listen cron. tweet-broadcast (POST) is healthy and unaffected.
