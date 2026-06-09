**tweet-listen: BLOCKED — exited clean, 0 API calls.**

- Gate: `status=BLOCKED`, `scope=READ`, day 6 consecutive
- Root cause: X API READ tier returns 401 (unpaid/insufficient read access). POST/write tier healthy. Not a credential issue — do not rotate.
- Burn averted: ~$15.50/day in inference on reads that always 401
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- Self-fixable: no — X creds are CI secrets, `scripts/` + `SKILL.md` outside agent mutation allowlist

Owner action for @_proxystudio: upgrade X API to a read-capable tier, OR pause tweet-listen cron. tweet-broadcast (POST) unaffected — keep enabled.
