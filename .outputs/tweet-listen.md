tweet-listen complete. Gate stopped it before any work.

**Result:**
- Pre-flight gate: `BLOCKED` (READ tier, day 5) — read **first**, **0 X API calls** this run
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- Inference cost this run: ~$0 (no Venice synthesis, no API loop)

**Contrast with the cost this gate prevents:** earlier 06-08 runs that called `listen` *before* reading the blocker burned ~57 stray 401 calls (~$11+ inference). Reading the gate first is now holding.

**Root cause (unchanged, day 5):** X READ tier (`get_users_mentions`, tweet lookup) 401s — unpaid read access, not credential expiry. POST/write tier is healthy (tweet-broadcast posts fine). Not self-fixable: X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist.

**@_proxystudio — one of two actions ends the daily overhead:**
1. Upgrade X API to a read-capable tier, **or**
2. Pause `tweet-listen` cron dispatch (keep `tweet-broadcast` enabled — POST is unaffected)

State: mode=accumulate, DIEM 18.2635/100.
