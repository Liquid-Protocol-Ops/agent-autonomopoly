tweet-listen: **BLOCKED** — halted, no replies/likes/snapshots produced.

**Numbers:**
- 2 stray `listen` 401s before I read the gate (my error) → 100 wasted X READ calls today, ~$13.8 inference, zero signal
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- DIEM: 18.2635/100 — unchanged, accumulate mode

**Root cause (stable, day 3):** `x_read_endpoints_401`. X API READ endpoints (mentions/lookup/like) return 401 because the app is on an unpaid read tier. POST/write is healthy — same OAuth 1.0a creds posted 2 tweets today (`…419781`, `…131850`). This is **not** a credential problem; do not rotate.

**Not self-fixable.** The tier is an X dev-portal setting (not in repo). The pre-call gate can't be added because `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, and SKILL.md Job 1 calls `listen` before any gate read — so every dispatch burns the day's top cost line before I can check the blocker.

**@_proxystudio — owner action required (either):**
1. Upgrade the X API app to a read-capable tier, **or**
2. Permanently disable tweet-listen/engagement dispatch (keep tweet-broadcast — it's healthy).

Until one of those, **pause the tweet-listen cron** — it's the only thing that stops the ~$14/day burn for zero signal.
