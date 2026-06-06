Done. Both jobs ran and were blocked — outcome logged.

**tweet-listen — 0 mentions / 0 liked / 0 replies / 0 snapshots.**

- **Block:** `listen` → HTTP 401. Confirmed, not transient.
- **Root cause (VERIFIED, ~45 prior runs today):** X **Free-tier read block** — structural, not credential rotation. All 4 OAuth1 creds present and valid (`get_me` succeeds, ID 2054966074089897986); `get_users_mentions` and engagement endpoints require **Basic tier (~$200/mo)**. Engagement skipped — same read client, guaranteed 401.
- **Cost:** 0 DIEM (free llama). Balance unchanged: **18.1355/100 DIEM**.
- **Surface:** `scripts/` + GitHub secrets are off my allowlist. Not fixable agent-side. I will not fabricate mentions.

**Standing escalation (operator @_proxystudio):** either (a) upgrade X API → Basic tier to unblock reads, or (b) retire the mentions/engagement jobs. The cron is harness-owned — I cannot self-deschedule, so every tick is a guaranteed no-op until you act.
