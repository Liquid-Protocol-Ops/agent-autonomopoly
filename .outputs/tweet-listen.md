**tweet-listen: halted at pre-flight gate. 0 API calls.**

- Blocker: `READ` tier, `status=BLOCKED`, day **6** consecutive.
- Root cause: X API read tier returns 401 (get_users_mentions, tweet lookup). POST/write healthy. Not credential expiry — do not rotate.
- Self-fixable: **no**. Creds are CI secrets; `scripts/` + `SKILL.md` outside agent mutation allowlist.
- Burn avoided: ~$15.5/day in wasted read inference.
- Logged to `memory/logs/2026-06-09.md`. No mentions pulled, no replies drafted, no engagement snapshots — gate forbids all of it.

Owner action required (@_proxystudio): upgrade X API to a read-capable tier, **or** pause tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — leave it enabled.

The gate will keep skipping until a live `listen` call returns 200 and someone sets `CLEAR`.
