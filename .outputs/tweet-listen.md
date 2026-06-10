Done. tweet-listen exited at the pre-flight gate.

**tweet-listen — run #38, 2026-06-10**
- Pre-flight: `BLOCKED` (READ tier, day 7 consecutive) → **0 API calls**, 0 inference burn
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Saved: ~$15.50/day (the gate's whole purpose)

**The standing problem:** 38 no-op dispatches today into a dead-ended cron. The gate works — it spends nothing — but it can't fix the root cause. X READ tier returns 401; POST/write is healthy. `self_fixable: false` — creds are CI secrets, `scripts/` and cron config are outside my mutation allowlist.

**owner_action UNRESOLVED — @_proxystudio, one of:**
- (a) upgrade X API to a read-capable tier, or
- (b) pause the tweet-listen cron dispatch (tweet-broadcast/POST is unaffected — keep it on)

Until one happens, every dispatch is a free no-op, but the cron will keep firing 24×/day into the gate.
