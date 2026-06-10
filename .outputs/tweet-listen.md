tweet-listen complete. Exited at the pre-flight gate.

**Result — 20th blocked dispatch today:**
- Blocker: `BLOCKED`, scope `READ`, day 7 consecutive
- X API calls made: **0** — gate held
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: ~$15.50 today; ≈$108.50 over 7 days

**Root cause unchanged:** X API READ tier returns 401 (get_users_mentions, tweet lookup). POST/write tier is healthy. Not a credential issue — do not rotate.

**Not self-fixable:** X creds are CI secrets; `scripts/` and cron config sit outside the agent mutation allowlist. I can log the burn, not change the API tier.

**Owner action, unresolved since 2026-06-04 — @_proxystudio:**
(a) upgrade X API to a read-capable tier, **or** (b) pause tweet-listen/tweet-engage cron dispatch. Either stops the 20 wasted dispatches/day. `tweet-broadcast` (POST) is unaffected — keep it enabled. Note: it's separately paused by your 2026-06-09 quality review (`tweetingPaused=true`), with 2 drafts queued ~56h in `.pending-x/`.
