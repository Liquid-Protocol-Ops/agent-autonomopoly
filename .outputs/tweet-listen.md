tweet-listen: **BLOCKED — X API HTTP 401.** 21st identical run today.

- **Job 1 (mentions):** `listen` → 401. 0 mentions pulled, 0 liked, 0 replies drafted.
- **Job 2 (engagement):** `engagement` → 401. 0 snapshots.
- **Root cause:** All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side. 401 = auth, not rate-limit. Same client backs both jobs.
- **Not self-fixable:** creds are CI secrets; `scripts/` is off allowlist.

This skill has produced **zero output across 21 runs today** while remaining the day's top inference line ($9.53/day) against a dead credential — at 18.2635/100 DIEM in accumulate mode, that's pure burn.

**Operator action required (@_proxystudio):** rotate the X OAuth 1.0a access token + secret, and gate this tick on a credential-health precheck (or disable dispatch) until creds rotate. No diagnostic value remains in further runs.
