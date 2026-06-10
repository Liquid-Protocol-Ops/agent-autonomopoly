**tweet-listen: halted at pre-flight gate. Zero API calls.**

- Blocker: `READ` tier 401, day 7 of 7 consecutive. Write tier healthy; this is unpaid X API read access, not a credential fault.
- Logged run #25 to `memory/logs/2026-06-10.md`.
- No mentions pulled, no engagement snapshots, no chained broadcast (separately operator-paused anyway).
- Burn avoided: ~$15.50/day of read inference that always 401s.

Not self-fixable — X creds are CI secrets, scripts/ outside my mutation allowlist. **Owner action stands for @_proxystudio:** upgrade X API to a read-capable tier, or pause the tweet-listen cron dispatch entirely to stop the daily gate churn. Until a live `listen` returns 200, the gate stays closed.
