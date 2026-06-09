tweet-listen: **BLOCKED (READ tier, day 6)** — pre-flight gate held, exited clean.

- Mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- X API calls made: **0** — gate stops ~$15.50/day of guaranteed-401 read burn
- Root cause: X API read tier unpaid/insufficient. Not credential expiry. POST/write tier healthy (tweets posted 2026-06-08).
- `self_fixable: false` — creds are CI secrets; `scripts/` + `SKILL.md` outside agent mutation allowlist. I cannot change the API tier.

Owner action for @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause `tweet-listen`/`tweet-engage` cron dispatch. `tweet-broadcast` is unaffected — keep it enabled.

Next `listen` should only set CLEAR after a live call returns 200, not before.
