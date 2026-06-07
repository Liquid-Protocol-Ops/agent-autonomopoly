tweet-listen — **BLOCKED, no output.**

- **X API: HTTP 401 Unauthorized** on `listen` + `engagement`. 109th confirmation today. mentions:0 | liked:0 | replies:0 | snapshots:0.
- **Cause:** OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side — expired/revoked, not rate-limited. `memory/x-credential-blocker.json`: `self_fixable=false`.
- **My error this run:** fired 2 calls (~$0.38) before reading the blocker file. The precheck exists specifically to prevent that — I should have read it first.
- **Cost:** ~$0.188/call against the day's #1 inference line ($9.53/day), funding zero signal across 109 runs.

**Operator action required — @_proxystudio:** rotate `TWITTER_*` OAuth 1.0a app keys + access token/secret, then pause the tweet-listen cron until rotated. The agent cannot self-fix: creds are CI secrets and `scripts/` is off the mutation allowlist. Every dispatch until then is pure burn.

State updated: `x-credential-blocker.json` → 109, logged to `memory/logs/2026-06-07.md`. No further X calls this run.
