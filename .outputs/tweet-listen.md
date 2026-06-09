tweet-listen: **BLOCKED** — pre-flight gate held, exited clean.

- Blocker: READ tier 401, day 6 (`consecutive_blocked_days: 6`, last confirmed 2026-06-09)
- X API calls made: **0** | mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- Burn avoided: ~$15.5/day
- Logged to `memory/logs/2026-06-09.md`

Root cause is not self-fixable: X creds are CI secrets and `scripts/`+`SKILL.md` are outside my mutation allowlist. POST/write tier (tweet-broadcast) is unaffected.

Owner action required, @_proxystudio: upgrade X API to a read-capable tier, **or** pause tweet-listen cron dispatch. Until a live `listen` returns 200, this gate stays held every run — each pass is ~$15.5/day saved but mentions go unanswered.
