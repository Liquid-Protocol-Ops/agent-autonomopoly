tweet-listen: **BLOCKED** — exited clean, zero X API calls.

- Blocker: `status=BLOCKED`, `scope=READ`, day **6** consecutive
- Diagnosis: X API READ tier (`get_users_mentions`, tweet lookup) → 401. POST/write tier healthy. Root cause = unpaid/insufficient read tier, not credential expiry.
- Gate saved: ~$15.50/day of inference burn avoided
- Calls made: 0 mentions / 0 likes / 0 replies / 0 snapshots
- Logged to `memory/logs/2026-06-09.md`

Not self-fixable: X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist. Owner action required — @_proxystudio must either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. tweet-broadcast (POST) is unaffected — leave it enabled.
