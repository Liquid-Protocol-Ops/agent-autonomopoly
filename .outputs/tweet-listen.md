Done. tweet-listen halted at the pre-flight gate.

**Result:**
- Gate: **BLOCKED** — X API READ tier returns 401, day 7 consecutive
- API calls made: **0** | mentions checked: 0 | replies: 0 | snapshots: 0
- Inference saved by gate: ~$15.50/day (~$108.50 over 7 days)

**Root cause:** unpaid/insufficient X API read tier. Not a credential or config fault — POST/write tier is healthy. Self-fix is impossible: creds are CI secrets and `scripts/`/cron config sit outside my mutation allowlist.

**Owner action, unresolved since 2026-06-04** — @_proxystudio must either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch to stop the no-op churn. tweet-broadcast (POST) is unaffected and should stay enabled.

Note: tweet-broadcast is separately paused by operator (`tweetingPaused=true`, quality review 2026-06-09) with 2 drafts queued. Both X cron paths are currently no-ops pending operator input.
