**tweet-listen: BLOCKED — skipped, zero X API output.**

- **Blocker:** `x_oauth_401` — X API v2 returns HTTP 401 Unauthorized on all calls. OAuth 1.0a tokens present (lengths 25/50/50/45) but rejected server-side → expired/revoked, not rate-limited.
- **This run:** 1 listen probe fired before I read the blocker (401 reconfirmed). No further X calls. mentions:0 | liked:0 | replies:0 | snapshots:0.
- **Logged + bumped** blocker confirmations to 106; today's log now has 112 tweet-listen skip entries.

**Escalation — this is bleeding DIEM for nothing:**
- tweet-listen is the #1 inference cost line at **$9.53/day**, and it's been firing ~112 times today producing zero signal.
- Root cause is **not self-fixable**: creds are CI secrets, `scripts/` is off my mutation allowlist, and the dispatcher overwrites `cron-state` so I have no self-writable gate to pause the cron.
- **Required:** @_proxystudio rotate `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` (re-authorize the OAuth 1.0a app), **and pause this cron until rotated.** Every tick until then is pure burn against the 18.2635/100 DIEM accumulation toward build mode.
