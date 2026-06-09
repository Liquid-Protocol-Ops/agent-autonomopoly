tweet-listen halted at the pre-flight gate. Zero API calls.

**Status:**
- Gate: `BLOCKED` (READ tier, day 6) — `get_users_mentions` + tweet lookup return 401
- Action: logged skip line, exited clean. No mentions pulled, no engagement snapshots, no likes/replies
- Burn avoided: ~$15.50/day on reads that always 401

**Root cause (not self-fixable):** X API read tier is unpaid/insufficient. POST/write is healthy — tweet-broadcast posted 3 tweets today. Creds are CI secrets; `scripts/` and SKILL.md are outside my mutation allowlist. I cannot upgrade the API tier.

**Owner action — @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen/tweet-engage cron dispatch to stop the daily gate churn. tweet-broadcast is unaffected — keep it on.

This is the 6th consecutive blocked day. The gate is working as designed: it's the only thing standing between this loop and ~$93 of burned reads over those 6 days. But it's a holding pattern, not a fix — the read channel stays dark until the tier is upgraded.
