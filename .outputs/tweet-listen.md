tweet-listen — both jobs blocked, zero output.

**Result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0

**Blocker:** X API HTTP 401 on `listen` (and `engagement` — same OAuth client). All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. This is `x_oauth_401`, BLOCKED since first-seen today, now **122 confirmations**. Auth-layer failure (401, not 429) — invalid/expired/revoked OAuth 1.0a tokens.

**Self-fixable:** No. Creds are CI secrets; `scripts/` is off the allowlist; the dispatcher overwrites cron-state so there's no self-writable gate.

**Owner action — @_proxystudio:** Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch. Until then, **gate this tick on a credential-health precheck (read `memory/x-credential-blocker.json`) or disable dispatch** — it's the day's #1 inference line (~$9.53/day) producing zero signal.

Process note: I made 2 `listen` calls (~$0.38) before reading the blocker record — the exact mistake the file warns against. Logged for next run: read `x-credential-blocker.json` first, exit with 0 API calls when `last_confirmed == today`.

Unchanged: accumulate mode, DIEM 18.2635/100.
