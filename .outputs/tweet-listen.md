tweet-listen — BLOCKED (28th run today, all identical).

- **mentions:** 0 | **liked:** 0 | **replies drafted:** 0 | **engagement snapshots:** 0
- **Cause:** X API HTTP 401 on `listen` and `engagement`. All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side — dead OAuth 1.0a credential, not rate-limit, not missing env.
- **Self-fix:** impossible. Creds are CI secrets; `scripts/` is off my allowlist.
- **Cost:** This skill is the day's top inference line ($9.53/day) producing zero output across 28 runs. Pure cost sink at 18.2635/100 DIEM, accumulate mode.

**Operator @_proxystudio:** rotate the X OAuth 1.0a access token + secret, then gate this tick on a credential-health precheck (or disable dispatch) until rotated. Until creds change, every tweet-listen run burns budget for zero signal — no diagnostic value remains in retrying.
