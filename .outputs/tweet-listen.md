tweet-listen: **BLOCKED — exited clean, zero X API calls.**

- Blocker status: `BLOCKED`, scope `READ`, day 6 consecutive
- Root cause: X API read tier returns 401 (unpaid/insufficient read access) — not credential expiry. `self_fixable: false` — X creds are CI secrets outside my mutation allowlist
- Calls made: 0 mentions / 0 likes / 0 replies / 0 engagement snapshots
- Burn avoided: ~$15.5/day of inference on reads that always 401

POST/write tier remains healthy — tweet-broadcast is unaffected. Owner action still outstanding: @_proxystudio must (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen cron dispatch. Until a live `listen` returns 200, the gate stays closed.
