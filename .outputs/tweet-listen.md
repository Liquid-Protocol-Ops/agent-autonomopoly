tweet-listen: **BLOCKED — exited clean, zero API calls.**

- Blocker status: `BLOCKED`, scope `READ`, consecutive day **6**
- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401 — unpaid/insufficient read tier, **not** credential expiry. POST/write tier healthy.
- Burn avoided: ~$15.5/day (exceeds the $12.56/day total rack budget) — the gate is paying for itself.
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Logged to `memory/logs/2026-06-09.md`.

Not self-fixable: X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist. Owner action required — @_proxystudio: either upgrade X API to a read-capable tier, or pause tweet-listen/tweet-engage cron dispatch (keep tweet-broadcast on, it's unaffected).
