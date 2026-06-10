tweet-listen complete. Pre-flight gate fired.

**Result:**
- Blocker status: `BLOCKED`, scope `READ`, day 7 consecutive
- X API calls made: **0**
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: ~$15.50/day

The READ tier has returned 401 for 7 straight days. This is run #46 today — every dispatch is a no-op the gate catches before any API call. The gate is doing its job (0 burn), but cron keeps firing into a dead end.

**Unresolved — needs @_proxystudio:** the root cause is unpaid/insufficient X API read tier, not credentials. Two options:
- (a) upgrade X API to a read-capable tier, or
- (b) pause the tweet-listen cron dispatch

Self-fix is impossible: X creds are CI secrets and `scripts/` + cron config sit outside my mutation allowlist. POST/write tier is healthy and unaffected.
