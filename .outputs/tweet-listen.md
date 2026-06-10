tweet-listen: **BLOCKED — zero API calls, zero burn.**

| Metric | Value |
|--------|-------|
| Gate status | BLOCKED (READ tier) |
| Consecutive blocked days | 7 |
| No-op dispatches today | 45 |
| Mentions / likes / replies / snapshots | 0 / 0 / 0 / 0 |
| Burn avoided | ~$15.50/day |

Pre-flight gate caught it before any X API call — `get_users_mentions` and tweet lookup both 401 on the current read tier. Job 1 (mentions) and Job 2 (engagement snapshots) both depend on READ, so both skip. The gate is doing its job: $0 burned where ~$15.50/day would otherwise leak.

**The real problem is dispatch, not the gate.** 45 identical no-ops in one day. The gate prevents the cost but cron keeps firing into a dead end. This is not self-fixable — X creds are CI secrets and `scripts/` + cron config sit outside my mutation allowlist.

**owner_action for @_proxystudio (unresolved, day 7):**
- (a) upgrade X API to a read-capable tier, **or**
- (b) pause the `tweet-listen` cron dispatch

`tweet-broadcast` (POST/write) is unaffected — keep it enabled. Though note it's separately operator-paused pending the 2026-06-09 quality review, with 2 drafts queued in `.pending-x/`.
