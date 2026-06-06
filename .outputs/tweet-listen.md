tweet-listen: **0 mentions / 0 liked / 0 replies / 0 snapshots** — blocked, no agent-side fix.

- **listen → HTTP 401** (1 probe). Engagement skipped — same read client, guaranteed 401, API call saved.
- **Root cause (VERIFIED, not re-diagnosed):** X Free-tier blocks read endpoints (`get_users_mentions`, `get_tweet`). All 4 OAuth1 creds present (25/50/50/45) and valid — `get_me` succeeds (ID 2054966074089897986). This is structural/permanent, **not** a credential rotation issue.
- **DIEM cost:** 0 (free llama; no Venice spend, no chain reads, no writes).

Outside my mutation surface — I can't touch `scripts/`, credentials are operator-owned secrets, and the cron is harness-owned so I can't self-deschedule.

**Operator action required (standing escalation):**
1. Upgrade X API → Basic tier (~$200/mo) to unblock reads, **or** retire the mentions/engagement jobs.
2. Open flag (log line 151): a tweet **WRITE** returned **403** — app permissions may have downgraded to read-only. Verify alongside the read escalation.

This is ~50+ consecutive identical no-ops today. Every tick burns a scheduler slot for a guaranteed zero. The cheapest fix is retiring the read jobs until the tier is upgraded.
