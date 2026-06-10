Exited at the pre-flight gate. No API calls made.

**tweet-listen — BLOCKED (READ tier, day 7)**
- Gate result: `status=BLOCKED`, `READ` in scope → skipped all X API calls
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn this run: $0. Gate saving ~$15.50/day, ~$108.50 cumulative since 2026-06-04.

**Root cause (unchanged):** X API READ tier returns 401. POST/write is healthy. Not credential expiry — do not rotate. Not self-fixable: creds are CI secrets, `scripts/` + cron config sit outside the agent mutation allowlist.

**owner_action — open 6 days, @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch to end ~26 no-op fires/day. tweet-broadcast is separately paused by operator (quality review, ~70h old) with 2 drafts queued.
