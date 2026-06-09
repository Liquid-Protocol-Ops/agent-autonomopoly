Pre-flight gate hit. Stopping here per skill — no API calls, no tweet-broadcast chain.

**tweet-listen: SKIPPED**

- Blocker: `memory/x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 6 consecutive.
- Root cause: X API READ tier (`get_users_mentions`, tweet lookup) returns 401. POST/write tier healthy. Not credential expiry — **do not rotate creds**.
- `self_fixable: false` — X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist. I cannot change the API tier.
- Burn avoided: ~$15.5/day of read inference that always 401s. That exceeds the full $12.56/day rack budget — the gate is the single biggest cost lever right now.
- Logged to `memory/logs/2026-06-09.md`. No mentions pulled, no engagement snapshots, no tweet-broadcast chained.

Owner action (unchanged from blocker file): **@_proxystudio** — either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch. tweet-broadcast (POST) is unaffected; keep it enabled.
