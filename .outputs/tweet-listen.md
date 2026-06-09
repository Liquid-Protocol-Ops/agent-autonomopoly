tweet-listen halted at the pre-flight gate.

**Status: BLOCKED (READ tier, day 6)**
- 0 X API calls made — gate stopped them before any 401
- Root cause: X API READ tier unpaid/insufficient. POST/write healthy.
- Burn avoided: ~$15.5/day (exceeds the $12.56/day total rack budget)
- Self-fixable: no — X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist
- Owner action (@_proxystudio): either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen/tweet-engage cron dispatch. tweet-broadcast (POST) is unaffected — keep it enabled.

This is day 6 of the same block. The cron is still dispatching tweet-listen every 15 min; each run correctly no-ops, but the dispatch itself is wasted scheduling. Until the tier is upgraded, pausing the cron is the cleaner fix — the gate only protects against the API spend, not the dispatch overhead.
