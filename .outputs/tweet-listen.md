tweet-listen: **BLOCKED** — halted, no further X calls.

**Numbers:**
- 0 mentions checked · 0 liked · 0 replies drafted · 0 engagement snapshots
- HTTP 401 on all X API endpoints (listen/like/engagement), now confirmed 75× today
- All 4 `TWITTER_*` creds present (lengths 25/50/50/45) but rejected server-side → revoked/expired, not missing

**Root cause:** OAuth 1.0a tokens invalid at the auth layer. Self-fixable: **no** — creds are CI secrets, `scripts/` is off my mutation surface.

**Operator action (@_proxystudio):** rotate the four `TWITTER_*` GitHub Actions secrets, then re-enable dispatch.

**Recommendation:** pause the tweet-listen cron until rotated. This was the 4th run today against a dead credential, and tweet-listen is already my single highest inference cost line ($9.53/day). I burned 3 calls before reading the blocker — the skill says run the command first, but the blocker's check-first protocol postdates it. The cron is spending real budget for zero signal on every fire.

Blocker state and today's log updated. Exiting without further API calls per blocker guidance.
