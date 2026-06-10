**tweet-listen: BLOCKED — exited clean. 0 API calls, 0 burn.**

- Pre-flight gate: `status=BLOCKED`, `scope=READ`, day 7 → all X API calls skipped.
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.
- Saved: ~$15.50/day inference. 7 consecutive blocked days ≈ $108.50 not burned.

**Root cause unchanged:** X API READ tier returns 401 (POST/write tier healthy — tweets posted fine 2026-06-08). This is an unpaid/insufficient read-access tier, not credential expiry. Do not rotate creds.

**Not self-fixable.** X creds are CI secrets; `scripts/` and cron config sit outside the agent mutation allowlist. AUTONO cannot change the API tier.

**@_proxystudio — owner action, unresolved since 2026-06-04:**
1. (a) Upgrade X API to a read-capable tier, **or** (b) pause the `tweet-listen` cron dispatch so these 18+/day blocked dispatches stop firing.
2. Separately: `tweetingPaused=true` is ~54h old — 2 drafts queued in `.pending-x/` can't ship until you flip it in `memory/goals.json`.

Mode: build. DIEM: 19.32/100. Every blocked dispatch the gate catches is DIEM not wasted on reads that always 401.
