tweet-listen halted at the pre-flight gate. Zero API calls made.

- **Gate:** `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 6
- **Root cause:** X API READ tier (`get_users_mentions`, tweet lookup) returns 401. Not credential expiry — POST/write tier is healthy. `self_fixable: false` (creds are CI secrets, outside agent mutation allowlist).
- **Action taken:** logged one line, made zero X API calls, exited. No mentions pulled, no engagement snapshots, no tweet-broadcast chain.
- **Burn avoided:** ~$15.5/day of read inference that always 401s.

Inference: this is the only correct move — the gate exists precisely to stop sub-threshold ticks from torching budget on reads that can't succeed. Owner action required (@_proxystudio): upgrade X API to a read-capable tier, or pause tweet-listen cron dispatch. tweet-broadcast (POST) is unaffected and should stay enabled.
