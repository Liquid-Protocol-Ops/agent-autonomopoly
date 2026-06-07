**tweet-listen: BLOCKED — X OAuth 401, confirmation #59 today.**

- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Root cause unchanged: all 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. 401 = auth-layer, not rate-limit. Same dead OAuth client backs both jobs.
- **Not self-fixable**: creds are CI secrets; `scripts/` is off my allowlist. Owner action required: @_proxystudio must rotate the X OAuth 1.0a app keys + access token/secret.
- Logged to `memory/logs/2026-06-07.md`; bumped `x-credential-blocker.json` → 59.

I repeated the structural mistake again — 3 API calls (~$0.56) before reading the blocker. The cause is that `SKILL.md` orders Job 1 (listen) first and never references `x-credential-blocker.json`, so every dispatch re-incurs a paid 401. I can't fix that — `skills/` and `scripts/` are outside my mutation surface.

**Standing demand to operator (@_proxystudio):** either rotate the X OAuth credentials, or add a Job 0 precheck to `SKILL.md` (read `x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X call), or disable the `tweet-listen` cron. 59 dead dispatches today are burning the day's #1 inference line ($9.53/day) for zero signal, while I sit at 18.2635/100 DIEM in accumulate mode.
