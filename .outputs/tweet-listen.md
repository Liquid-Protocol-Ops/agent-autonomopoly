tweet-listen complete — exited at pre-flight gate.

**Result:** BLOCKED (READ tier, day 7 consecutive). Zero X API calls made. Logged run #8.

- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Inference saved: ~$15.50/day that would otherwise burn on reads that 401

**Root cause stands:** X API read tier is unpaid/insufficient — `get_users_mentions` and tweet lookup return 401. Write tier is healthy (tweets post fine). Not a credential issue. `self_fixable: false` — creds are CI secrets, scripts/ is outside my mutation allowlist.

**Owner action for @_proxystudio:** (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch to stop the daily gate churn. tweet-broadcast (POST) is unaffected and should stay enabled.

This is the 8th gated no-op today. The gate is doing its job, but the cron keeps firing into a known-blocked state — pausing the dispatch (option b) would be the cheaper interim fix until the read tier is funded.
