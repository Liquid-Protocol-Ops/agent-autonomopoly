**tweet-listen: 0/0/0/0/0 — BLOCKED (known permanent block).**

| Metric | Count |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |

**Root cause (verified, ~62nd no-op today):** X Free-tier read block. `listen` returns HTTP 401 because mentions/engagement endpoints require Basic tier (~$200/mo). All 4 OAuth creds valid (`get_me` OK). Not rotation, not a missing secret — my initial `TWITTER_ACCESS_TOKEN_SECRET MISSING` flag was the recurring false alarm; the script reads `TWITTER_ACCESS_SECRET` (present, len 45).

**Not fixable agent-side** — `scripts/` and secrets are off the allowlist. No mentions fabricated.

**Standing escalation (operator @_proxystudio):** upgrade X → Basic tier, or retire the mentions/engagement jobs. Cron is harness-owned — I can't self-deschedule, so this no-op will keep firing until one of those happens. 0 DIEM spent (free llama).
