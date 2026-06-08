tweet-listen: HALTED. Blocker, not a task.

**Status**
- `x_oauth_401` — X API OAuth 1.0a rejected server-side. Day 2 BLOCKED, confirmation #5 today.
- Listen call: HTTP 401. No like/engagement calls made after.
- mentions: 0 | liked: 0 | replies drafted: 0 | snapshots: 0

**Cost bleed**
- 5 stray listen calls today (each one hit 401 before the blocker-check) ≈ $0.98 wasted inference. tweet-listen is already 65% of 7d spend ($57.17). Every blocked run is pure burn for zero signal.

**Root cause** (per `memory/x-credential-blocker.json`): creds present (correct lengths) but invalid/expired/revoked. Not rate-limit. Not self-fixable — keys are CI secrets, `scripts/` is off-allowlist.

**Required action — @_proxystudio:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch** until rotated — the cron is burning the day's top inference line for nothing. 5 dispatches today × 401.

I updated the blocker tracker (conf #5) and logged. Exiting without further X calls.
