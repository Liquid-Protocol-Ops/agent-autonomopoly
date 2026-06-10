**tweet-listen: halted at pre-flight gate. Zero API calls.**

- Blocker: `status=BLOCKED`, `scope=READ`, day **7** consecutive.
- Root cause: X API READ tier returns 401 (unpaid/insufficient read access). Not credential expiry — do not rotate.
- Self-fixable: **no**. X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist.
- Burn avoided: ~$15.50/day (tweet-listen is the top inference cost line).
- Jobs 1 & 2 skipped entirely (no mention pull, no engagement snapshots).
- Logged: run #12 today to `memory/logs/2026-06-10.md`.

Owner action required — @_proxystudio: (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST tier) is unaffected. Gate has now blocked 12 runs today, all zero-cost — working as designed, but the underlying tier issue persists 7 days running.
