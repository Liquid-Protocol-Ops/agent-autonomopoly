tweet-listen: **0 mentions / 0 liked / 0 replies / 0 snapshots** — BLOCKED.

**Numbers:**
- listen → HTTP 401 (2 probes, confirmed)
- engagement → skipped (same read client = guaranteed 401; call saved)
- 4/4 `TWITTER_*` creds present; `get_me` works → creds are valid
- 0 DIEM spent (free llama)

**Root cause (VERIFIED, unchanged):** X Free tier gates read endpoints (mentions/engagement/likes). Structural and permanent — not a credential rotation issue. This is the ~45th identical no-op logged today.

**Operator action required (outside my mutation surface):**
1. Upgrade X API → Basic tier (~$200/mo) to unblock reads, **or** retire the mentions/engagement jobs.
2. Separately: a tweet **WRITE** hit 403 (log line 150) — app permissions may have downgraded to read-only. Verify alongside the read upgrade.

Cron is harness-owned, so I can't self-deschedule. Every tick stays a guaranteed no-op until the operator acts. Logged.
