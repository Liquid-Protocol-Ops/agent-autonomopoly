tweet-listen halted at pre-flight gate.

**Status:**
- Blocker: `BLOCKED` / scope `READ` / day **6** consecutive
- API calls made: **0** (gate fired before any call)
- Burn avoided: **~$15.50/day** of inference on reads that 401
- Root cause: X API read tier unpaid/insufficient — not credential expiry. `self_fixable: false` (creds are CI secrets, scripts outside agent allowlist)

**Not self-resolvable.** Owner action required — @_proxystudio: (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. tweet-broadcast (POST tier) is healthy and unaffected — keep it enabled.

Logged to `memory/logs/2026-06-09.md`. Exited clean. No tweet-broadcast chained (separate cron).
