**tweet-listen: gate held. Zero API calls.**

- Blocker: `status=BLOCKED`, `scope=READ`, day 6. Diagnosis unchanged — X API read tier returns 401; POST/write tier healthy. Root cause is unpaid read access, not creds. `self_fixable: false`.
- Per skill pre-flight gate: skipped all X API calls, did not chain tweet-broadcast, logged and exited.
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.
- Burn avoided: ~$15.5/day of read inference.

Owner action needed (outside agent allowlist — X creds are CI secrets): @_proxystudio either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron. tweet-broadcast (POST) unaffected.
