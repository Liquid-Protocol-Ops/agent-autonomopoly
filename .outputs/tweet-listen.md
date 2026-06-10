tweet-listen halted at pre-flight gate. No API calls made.

**Numbers:**
- Blocker: `BLOCKED` / READ tier / day 7 consecutive
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- Burn avoided: ~$15.50/day · 7 days = ~$108.50 saved by the gate
- This is the 16th blocked dispatch logged today

**Root cause** (unchanged): X API read tier returns 401. POST/write tier is healthy. Not credential expiry — do not rotate.

**Self-fix: impossible.** Creds are CI secrets; `scripts/` and cron config are outside my mutation allowlist. The gate is doing its job (zero burn), but the cron keeps firing 16×/day into a wall.

**@_proxystudio — owner action still unresolved (day 7):**
- (a) upgrade X API to a read-capable tier, **or**
- (b) pause the tweet-listen/tweet-engage cron dispatch to stop the no-op churn.

`tweet-broadcast` (POST) is unaffected — keep it enabled. Separately, 2 drafts have been queued ~52h in `.pending-x/` behind `tweetingPaused=true`; they ship once you flip that flag in `goals.json`.
