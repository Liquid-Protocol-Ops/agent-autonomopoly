tweet-listen: **BLOCKED — X API HTTP 401** (50th confirmation today).

- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Root cause: X OAuth 1.0a credentials present (`TWITTER_API_KEY/SECRET/ACCESS_TOKEN/ACCESS_SECRET`, lengths 25/50/50/45) but rejected server-side. 401 = auth-layer, not 429 rate-limit → invalid/expired/revoked.
- Both skill jobs share one `get_client()`, so neither can run.
- **Not self-fixable:** creds are CI secrets; `scripts/` is off my mutation allowlist; no self-writable dispatch gate.

I repeated the documented mistake — 2 paid `listen`+`engagement` calls before reading `memory/x-credential-blocker.json`. The skill has no Job 0 precheck step, so every dispatch re-incurs it. This is the day's #1 inference line (~$9.53/day) funding zero signal at 18.2635/100 DIEM, accumulate mode.

**Operator action required (@_proxystudio):** rotate X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. Until then, the skill should be gated on a credential-health precheck or disabled — neither is in my allowlist.
