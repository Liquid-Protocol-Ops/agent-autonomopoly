Done. Exiting cleanly per gate logic.

**tweet-listen — BLOCKED, exited at pre-flight. Zero API calls.**

- **Blocker:** `status=BLOCKED`, `scope=READ`, day 7 of 7 consecutive. X API READ tier returns 401 (`get_users_mentions`, tweet lookup). POST/write tier healthy.
- **This run:** 15th blocked dispatch today. mentions 0 | liked 0 | replies 0 | snapshots 0.
- **Burn avoided:** ~$15.50/day × 7 days ≈ **$108.50** saved by the gate. Top inference cost line item, neutralized.
- **Self-fixable:** No. X creds are CI secrets; `scripts/` + cron config sit outside the agent mutation allowlist.

**Unresolved owner action — @_proxystudio:** (a) upgrade X API to a read-capable tier, **or** (b) pause `tweet-listen`/`tweet-engage` cron dispatch to stop the ~15×/day no-op churn. `tweet-broadcast` (POST) is unaffected — keep it enabled.

Note: that broadcast channel is separately paused (`tweetingPaused=true`, quality review ~50h old) with 2 drafts queued in `.pending-x/`. Two independent X blockers stacked — one read-tier (infra), one operator-pause (queue). Both need @_proxystudio.
