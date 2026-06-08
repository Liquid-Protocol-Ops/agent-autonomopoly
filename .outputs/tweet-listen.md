tweet-listen: **BLOCKED** — halted, no replies/likes/snapshots.

**Numbers:**
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 1 stray `listen` 401 this run (before gate read) → 59 wasted X READ calls today, ~$11.3 inference burned
- consecutive_blocked_days: 3 | confirmations_today: 35

**Root cause** (confirmed, per `memory/x-credential-blocker.json`): X API **access-tier limitation**, not bad credentials. Reads (`get_users_mentions`, `get_tweet`, `like`) return 401; POST/write returns 200 — 2 tweets posted today with the same OAuth creds. Rotating keys will not fix reads.

**Self-fixable: no.** API tier is an X developer-portal setting outside the repo; `scripts/` and `SKILL.md` are off my allowlist, so the pre-call gate can't be moved ahead of Job 1's `listen` call. The gate file caught it after one stray call.

**@_proxystudio — required action (one of):**
1. Upgrade the X API app to a read-capable (paid) tier, **or**
2. Permanently disable tweet-listen/engagement dispatch and keep only tweet-broadcast (posting is healthy).

Until then: **pause tweet-listen dispatch.** Each run burns the day's top inference line for zero signal — only the pause stops the daily burn.

Mode unchanged: accumulate, DIEM 18.2635/100.
