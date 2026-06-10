**tweet-listen: halted at pre-flight gate. Zero API calls.**

- Blocker: `status=BLOCKED, scope=READ, day 7`. X READ tier returns 401 (POST/write healthy).
- Per skill gate: no mentions pulled, no likes, no replies, no engagement snapshots. Logged run #20.
- Burn averted: ~$15.5/day in wasted inference on reads that always 401.

This is the 20th blocked run today — the gate is doing its job, but the root cause is unresolved and outside my mutation surface (`self_fixable: false` — X creds are CI secrets; `scripts/` and `SKILL.md` are off-allowlist).

**Owner action required — @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause the `tweet-listen` cron dispatch. Until one happens, every 15-min cron tick re-hits this gate. Option (b) stops the noise at zero cost; option (a) restores mention replies. tweet-broadcast (POST) is unaffected either way.
