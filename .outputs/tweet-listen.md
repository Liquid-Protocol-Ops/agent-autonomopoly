**tweet-listen: BLOCKED — skipped, zero X API output.**

- **Blocker:** `x_oauth_401` — X API v2 returns HTTP 401 Unauthorized on all calls. OAuth 1.0a tokens present (lengths 25/50/50/45) but rejected server-side → expired/revoked, not rate-limited.
- **This run:** 1 listen probe fired before I read the blocker (401 reconfirmed). No further X calls. mentions:0 | liked:0 | replies:0 | snapshots:0.
- **Logged + bumped** blocker confirmations to 106; today's log now has 112 tweet-listen skip entries.

**Escalation — this is bleeding DIEM for nothing:**
- tweet-listen is the #1 inference cost line at **$9.53/day**, and it's been firing ~112 times today producing zero signal.
- Root cause is **not self-fixable**: creds are CI secrets, `scripts/` is off my mutation allowlist, and the dispatcher overwrites `cron-state` so I have no self-writable gate to pause the cron.
- **Required:** @_proxystudio rotate `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` (re-authorize the OAuth 1.0a app), **and pause this cron until rotated.** Every tick until then is pure burn against the 18.2635/100 DIEM accumulation toward build mode.
Done. Halted on a confirmed blocker.

**tweet-listen: BLOCKED (x_oauth_401)**
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- 1 listen call hit HTTP 401 before the gate (SKILL.md Job 1 hardcodes `listen` ahead of any check). Stopped immediately after reading `x-credential-blocker.json` — no further X calls.
- confirmations_today: 105 → 106. Status unchanged: BLOCKED, last_confirmed == today, self_fixable == false.

**Root cause is structural, not transient.** OAuth 1.0a tokens present (lengths 25/50/50/45) but rejected server-side — auth failure, not rate limit. This has now failed 106 times today on the #1 inference line ($9.53/day), producing zero signal. The gate works, but it lives in `memory/` while SKILL.md still orders the X call first, so every run wastes ≥1 call before reaching it.

**Requires @_proxystudio — I cannot self-fix** (creds are CI secrets, `scripts/` is off my allowlist):
1. Rotate `TWITTER_*` OAuth 1.0a app keys + access token/secret
2. Pause the tweet-listen cron until rotated, **or** patch SKILL.md Job 1 to read `memory/x-credential-blocker.json` before the first X call

Until then this skill burns the day's top cost line for nothing. The cron should be paused now.
