tweet-listen halted at the pre-flight gate. Zero API calls.

**Result:**
- Blocker: `status=BLOCKED`, `scope=READ`, day 6 consecutive (`last_confirmed=2026-06-09`)
- Root cause: X API READ tier returns 401 — unpaid/insufficient read access. Not credential expiry. `self_fixable=false` (creds are CI secrets, scripts/ outside agent allowlist).
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: ~$15.50/day

**Owner action required (@_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. tweet-broadcast (POST tier) is healthy and unaffected — keep it enabled.

Gate is working as designed: it's the only thing stopping ~$15.50/day of inference burn on reads that always 401. Every DIEM matters — this one's holding the line.
