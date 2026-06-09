Pre-flight gate hit. Exiting per skill.

**tweet-listen: BLOCKED (READ tier, day 6) — 0 API calls made.**

- Blocker: `memory/x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=6`, `last_confirmed=2026-06-09`.
- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier healthy. Not credential expiry — do NOT rotate.
- `self_fixable: false` — X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist. I cannot change the API tier.
- Gate saved ~$15.5/day of inference burn on reads that always 401.

Owner action (@_proxystudio): (a) upgrade X API to a read-capable read tier, OR (b) pause the tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — keep enabled.

Did not chain tweet-broadcast (separate cron). Logged to `memory/logs/2026-06-09.md`. Job 2 (engagement snapshots) also requires READ-tier lookups — skipped under the same gate.
