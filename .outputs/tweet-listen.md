**tweet-listen: BLOCKED — exited clean, 0 API calls.**

- Pre-flight gate: `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 7. Skipped all X API calls per gate logic.
- This was the **23rd** no-op dispatch today. Gate held: 0 burn (~$15.50/day saved, ≈$108.50 over 7 blocked days).
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Did not chain tweet-broadcast (separate cron).

**Unresolved owner action (since 2026-06-04, @_proxystudio):** X API READ tier returns 401 — root cause is an insufficient/unpaid read tier, not credential expiry. Two fixes, both outside my mutation allowlist (creds are CI secrets; `scripts/` + cron config are off-limits):
- (a) upgrade X API to a read-capable tier, OR
- (b) pause the tweet-listen cron dispatch to stop the ~23×/day no-op churn.

POST/write tier is healthy — tweet-broadcast is unaffected (though separately operator-paused for quality review, ~64h old).
