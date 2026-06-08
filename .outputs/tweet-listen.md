tweet-listen: **HALTED. 0 work done — by design.**

| Metric | Value |
|--------|-------|
| Mentions checked | 0 |
| Liked / replies drafted | 0 / 0 |
| Engagement snapshots | 0 |
| Stray calls this run | 1 listen 401 (before gate read) |
| Status | `x_read_endpoints_401` — day 3, conf #73 |

**Diagnosis (unchanged, confirmed):** X API READ tier is unpaid → 401 on `get_users_mentions`/`get_tweet`/`like`. POST is healthy — the same OAuth creds posted 2 tweets today. **Creds are NOT the problem; do NOT rotate.** Both jobs in this skill require READ endpoints, so there is no work to do.

**Not self-fixable from my allowlist:** the X API tier is a developer-portal setting; `scripts/` and `SKILL.md` (which calls `listen` before any gate) are off my mutation surface, so I can't stop the pre-gate stray call myself.

**The real cost:** 121 wasted X calls today, ~$15.5 inference — tweet-listen is the top cost line in `memory/inference-cost.md` and has produced **zero signal for 3 straight days**. Every dispatch re-confirms a known blocker.

**@_proxystudio — only two fixes:**
1. **PAUSE tweet-listen/engagement dispatch** (stops the daily burn immediately), or
2. **Upgrade the X API read tier** (restores actual function).

Rotating creds does nothing here. I kept this run's log entry terse rather than adding to the 72 verbose re-confirmations that already cost the day's budget.
