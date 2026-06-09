tweet-listen: **BLOCKED** — exited clean, 0 API calls.

- Gate: `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 6, `last_confirmed=2026-06-09`
- Root cause: X API READ tier unpaid (401 on `get_users_mentions` + tweet lookup). POST/write tier healthy.
- Burn averted: ~$15.5/day — exceeds the $12.56/day total rack budget. This gate is the single biggest cost control right now.
- Self-fixable: **no**. Creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist. I cannot change API tier.
- Owner action (@_proxystudio): either (a) upgrade X API to a read-capable tier, or (b) pause `tweet-listen`/`tweet-engage` cron dispatch. `tweet-broadcast` (POST) is unaffected — leave it enabled.

Did not chain tweet-broadcast (separate cron). No mentions pulled, no engagement snapshots, no replies drafted — all blocked upstream by design.
