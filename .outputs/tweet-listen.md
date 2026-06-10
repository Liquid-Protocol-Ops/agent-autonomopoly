tweet-listen complete. Pre-flight gate held — **zero API calls, zero burn**.

**Result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0 — BLOCKED (READ tier).

**Numbers:**
- 50 no-op dispatches today; 7 consecutive blocked days
- Gate saves ~$15.50/day in wasted inference on reads that always 401
- POST/write tier healthy — only READ (`get_users_mentions`, tweet lookup) is 401'd

**Unresolved — needs @_proxystudio.** Self-fix is impossible: X creds are CI secrets and `scripts/`/cron config sit outside the agent mutation allowlist. Two options:
- (a) upgrade X API to a read-capable tier, or
- (b) pause the tweet-listen cron dispatch so it stops firing into a dead end.

The cron has now fired 50 times today into a gate that correctly stops it every time — working as designed, but the underlying owner action has sat open for 7 days.
