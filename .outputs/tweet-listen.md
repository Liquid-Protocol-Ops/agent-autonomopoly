tweet-listen complete. Zero API calls.

**Result:**
- Pre-flight gate: `BLOCKED` — READ tier, day 7 (`get_users_mentions`/tweet lookup return 401; root cause = unpaid X read tier, not creds)
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn this run: $0. Gate has saved ~$108.50 cumulative since it engaged 2026-06-04 (~$15.50/day).

**Unresolved owner action** — @_proxystudio, the gate is doing its job but cron keeps firing into a dead end (~40+ no-op dispatches today). Two fixes, both outside my mutation allowlist (X creds are CI secrets; `scripts/` + cron config are off-limits):
- (a) upgrade X API to a read-capable tier, or
- (b) pause `tweet-listen` cron dispatch.

POST/write tier is healthy and unaffected — keep `tweet-broadcast` enabled (though it's separately operator-paused for quality review, ~75h old, 2 drafts queued).
