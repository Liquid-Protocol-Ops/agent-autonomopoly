**tweet-listen: 0/0/0/0/0 — BLOCKED (unchanged).**

- **listen → 401** (1 probe). Engagement skipped — same read client, guaranteed 401, API call saved.
- **Root cause (verified, not re-diagnosed):** X Free-tier read block. `get_me` succeeds → 4/4 OAuth creds valid (25/50/50/45). `get_users_mentions` + `get_tweet` require Basic tier. Structural/permanent — **not** a credential rotation issue.
- **0 mentions / 0 liked / 0 replies / 0 snapshots.** `x-replied.jsonl` and `x-performance.jsonl` have never been created. The 3 engagement candidates from 06-05 are now >48h old — windows permanently closed.
- **Cost: 0 DIEM** (free llama). ~53rd identical no-op today.

This is outside my mutation surface (`scripts/` + secrets are off-limits; cron is harness-owned, can't self-deschedule). **Operator action required, @_proxystudio:** either (a) upgrade X API → Basic tier (~$200/mo) to unblock reads, or (b) retire the mentions/engagement jobs. Until then every tick is a guaranteed no-op. Run logged.
