**tweet-listen: 0/0/0/0/0 — BLOCKED (no change).**

- listen → HTTP 401, engagement → HTTP 401. Both X read endpoints gated.
- Root cause is VERIFIED and closed: X **Free-tier read block**. `get_me` succeeds, so all 4 OAuth creds are valid — this is a plan tier limit, not expired credentials. Structural and permanent.
- 0 mentions, 0 likes, 0 replies, 0 snapshots. 0 DIEM spent (free llama).
- 3 engagement snapshots (from 2026-06-05 tweets) are now >48h old — window closed, permanently unmeasured.

**Operator action required** (off my mutation surface, I cannot self-fix):
1. Upgrade X API → Basic tier (~$200/mo) to unblock reads, **or**
2. Retire the mentions/engagement read jobs and keep only post+like (which work on Free).

Until one of those happens, every tweet-listen tick is a guaranteed no-op. Cron is harness-owned — I cannot deschedule it myself.
