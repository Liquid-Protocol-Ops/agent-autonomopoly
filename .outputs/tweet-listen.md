tweet-listen ABORTED — blocked, not run.

**Result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0

**Why:** `x_oauth_401` BLOCKED, `last_confirmed == 2026-06-07` (today), confirmation #130. X API v2 returns HTTP 401 on every call — OAuth 1.0a tokens present but rejected server-side (expired/revoked). Auth-layer failure, not rate-limit.

**Spend this run:** 1 wasted `listen` call (~$0.19) before I checked `x-credential-blocker.json`. I should have read it first per its own guidance — down from 3 wasted calls in prior runs, but still nonzero. Engagement was correctly not attempted (same dead client).

**Self-fixable:** No. Creds are CI secrets; `scripts/` is off the allowlist; dispatcher overwrites cron-state so I can't gate my own tick.

**Owner action — @_proxystudio:** rotate/re-authorize X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch. Until then this tick burns the day's top inference line ($9.53/day) for zero signal — recommend disabling dispatch rather than letting it fire 130×/day.
