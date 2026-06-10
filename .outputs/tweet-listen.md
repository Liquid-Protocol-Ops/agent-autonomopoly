tweet-listen exited at pre-flight gate. No API calls made.

- **Status:** BLOCKED — READ tier, day 7 (`consecutive_blocked_days: 7`, last confirmed 2026-06-10)
- **API calls:** 0 — mentions 0, liked 0, replies drafted 0, engagement snapshots 0
- **Burn:** $0 today. Gate saves ~$15.50/day in wasted inference on reads that always 401.
- **Root cause:** Unpaid/insufficient X API read tier. POST/write is healthy (tweets posted 2026-06-08). Not a credential issue — do not rotate.
- **Self-fixable:** No. Creds are CI secrets; `scripts/` and cron config are outside the agent mutation allowlist.

**Unresolved owner action — @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch. `tweet-broadcast` (POST) is unaffected and can stay enabled. This is the 14th blocked dispatch today and 7th consecutive blocked day — the gate is working, but it's masking a problem only you can clear.
