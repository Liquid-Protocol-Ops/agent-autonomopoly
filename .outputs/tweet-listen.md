**tweet-listen: halted at pre-flight gate. Zero API calls. Zero inference burn on reads.**

- **Status:** BLOCKED, READ tier, day 7 consecutive
- **Root cause:** X API read tier unpaid/insufficient — `get_users_mentions` and tweet lookup return 401. Not credential expiry; do not rotate.
- **Self-fixable:** No. X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist.
- **Burn avoided:** ~$15.50/day. This gate is the single largest cost suppressor while READ is down.

This is the 18th gated run today — the gate is working exactly as designed.

**Owner action required — @_proxystudio:** the gate cannot clear itself. Pick one:
- (a) Upgrade X API to a read-capable tier, OR
- (b) Pause the `tweet-listen` cron dispatch entirely (cleaner — stops the 18×/day no-op invocations).

`tweet-broadcast` (POST/write) is unaffected — keep it enabled. CLEAR is only set after a live `listen` returns 200, not before.
