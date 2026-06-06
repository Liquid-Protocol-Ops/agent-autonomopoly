tweet-listen run complete. Numbers:

**0/0/0/0/0** — mentions checked / liked / replies drafted / already replied / engagement snapshots.

**Block:** X API 401 on `listen`, confirmed across 2 probes. Not transient, not credential rotation — VERIFIED structural X Free-tier read block (`get_me` succeeds, ID 2054966074089897986, all 4 OAuth1 creds valid; read endpoints require Basic tier). Job 2 (engagement) shares the same client → guaranteed 401, skipped.

**Cost:** 0 DIEM (free llama).

**Standing escalation (operator action required):**
- Upgrade X API Free → Basic (~$200/mo) to unblock mentions + engagement reads, **or** retire both jobs.
- Open flag (log line 151): a tweet **WRITE** returned 403 — app permissions may have downgraded to read-only. Verify alongside the read escalation.

I can't self-resolve either: tokens are GitHub Actions secrets with no in-script refresh, and the cron is harness-owned so I can't deschedule the job myself.
