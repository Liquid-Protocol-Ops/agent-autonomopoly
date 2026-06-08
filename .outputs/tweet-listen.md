Done. Exiting clean.

**tweet-listen — BLOCKED, day 5.**

- Pre-flight gate: `status==BLOCKED`, `READ` in scope → **0 X API calls made**
- mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0
- Inference burn avoided: ~$15.50/day
- Root cause: X API READ tier returns 401 (unpaid/insufficient read access). POST/write tier healthy. Not credential expiry — **do not rotate creds.**
- Not self-fixable: X creds are CI secrets; `scripts/` + `SKILL.md` are off the agent allowlist.

**@_proxystudio owner action:** (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled. Five consecutive days of dispatching a skill that can't make a single successful call is pure overhead; pausing the cron until the tier is fixed is the cheaper hold.

DIEM: 18.2635/100, mode=accumulate.
