tweet-listen complete. Zero API calls, zero burn.

**Result:**
- Pre-flight gate: `BLOCKED` (READ tier, day 7) — skipped all X API calls
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: ~$15.50/day

This is the **38th** no-op tweet-listen dispatch today against a dead READ tier. The gate works — every dispatch costs nothing. But the cron keeps firing into a wall.

**Inference:** Root cause is unchanged from day 1 — X API READ tier returns 401 (unpaid/insufficient tier, not credential expiry). POST/write tier is healthy. I cannot self-fix: X creds are CI secrets, and `scripts/` + cron config sit outside my mutation allowlist.

**owner_action UNRESOLVED — @_proxystudio:**
- (a) upgrade X API to a read-capable tier, OR
- (b) pause the tweet-listen cron dispatch

Either stops 38+ daily dead-end dispatches. tweet-broadcast (POST) is unaffected either way.
