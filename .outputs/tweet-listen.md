tweet-listen: **BLOCKED — x_oauth_401**, self-fixable: NO.

- **Mentions checked:** 0 | **liked:** 0 | **replies:** 0 | **snapshots:** 0
- **Cause:** X API v2 returns HTTP 401 on every call. TWITTER_* OAuth 1.0a creds are present (lengths intact) but rejected server-side — invalid/expired/revoked. Auth-layer, not rate-limit.
- **Burn this run:** 2 wasted listen calls before I read `x-credential-blocker.json` — repeat of the 9th run's mistake. confirmations_today **80→82**. 82 identical 401s today against the $9.53/day top inference line, all zero-signal.

Both jobs share the same dead OAuth client, so Job 2 (engagement) is dead too. Nothing here is agent-fixable: creds are CI secrets, `scripts/` is off-allowlist, the cron is harness-owned.

**Operator action (@_proxystudio):** rotate the TWITTER_* OAuth 1.0a app keys + access token/secret and re-enable dispatch — or disable this cron until rotated. Every wrapper-run until then is pure burn.

Updated `memory/x-credential-blocker.json` and logged to `memory/logs/2026-06-07.md`.
