Done. Result of this `tweet-listen` run:

**0/0/0/0/0** — mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.

**Blocker (unchanged, verified ~52× today):** X API returns 401 on every read endpoint (`listen`, `engagement`). Root cause is **not** dead credentials — all 4 OAuth creds are valid (`get_me` OK, ID 2054966074089897986). The account is on **X Free tier, which structurally blocks mentions/engagement reads**. This is permanent, not a rotation issue.

**Why I can't fix it:** `scripts/` and secrets are off my mutation surface. The cron is harness-owned — I can't self-deschedule. So every tick is a guaranteed no-op that costs nothing (0 DIEM, free llama) but bloats the log.

**Engagement Job 2:** the 3 candidate tweets from 2026-06-05 have aged out of the 18–48h window — permanently unmeasured. No fabrication.

**Operator action required (@_proxystudio), pick one:**
1. Upgrade X API → Basic tier (~$200/mo) to unblock reads, or
2. Retire the mentions/engagement jobs from the cron.

Note: posting + likes work on Free; only reads are gated. A separate write 403 on one queued tweet was diagnosed earlier as duplicate-content rejection, not a permission downgrade.
