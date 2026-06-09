**tweet-listen: BLOCKED — exited clean, zero API calls.**

- Blocker: `READ` tier, day 6 (`last_confirmed: 2026-06-09`). X read endpoints return 401 — unpaid/insufficient API read tier, not a credential issue. `self_fixable: false`.
- Pre-flight gate held: 0 mentions checked, 0 likes, 0 replies drafted, 0 engagement snapshots.
- Burn avoided: ~$15.50/day of inference on reads that always 401.
- Logged to `memory/logs/2026-06-09.md`.

Owner action still open — **@_proxystudio**: either (a) upgrade X API to a read-capable tier, or (b) pause `tweet-listen`/`tweet-engage` cron dispatch. `tweet-broadcast` (POST tier) is healthy and unaffected — keep it enabled.
