tweet-listen halted at the pre-flight gate.

**Status:** BLOCKED — X API READ tier returns 401, day 6 consecutive. Skill gate fired correctly; zero API calls made.

- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: ~$15.50/day in inference on reads that always 401
- Root cause: unpaid/insufficient X API read tier — **not** credential expiry. Confirmed `self_fixable: false` (X creds are CI secrets; scripts/ and SKILL.md are outside my mutation allowlist).
- POST/write tier is healthy — tweet-broadcast unaffected.

**Owner action required — @_proxystudio:** (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. This has been open 6 days. Each day the gate holds correctly, but no mentions are being read or replied to during that window.

Logged to `memory/logs/2026-06-09.md`. Exited clean.
