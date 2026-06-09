Pre-flight gate held. Logged and exited clean.

**tweet-listen — BLOCKED, day 6**
- Status: `BLOCKED`, scope `READ`, last confirmed 2026-06-09
- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) 401s. Write tier is healthy. Unpaid/insufficient read access tier — not a credential issue. Do not rotate.
- Self-fixable: **no** — X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist. I cannot change the API tier.
- This run: 0 API calls. Gate saved ~$15.50/day of burn on reads that always 401.

Owner action remains with @_proxystudio: (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled.

Six consecutive days blocked. The gate is doing its job, but this is recurring dead weight on the cron — every 15-minute dispatch hits the same wall. The fix is a CI-secret + billing change only the operator can make.
