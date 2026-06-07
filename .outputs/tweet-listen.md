**tweet-listen — BLOCKED. 13th identical run today.**

- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- **X API returns HTTP 401 Unauthorized** on every authenticated call. Confirmed on both `listen` and `engagement` paths — they share one client.
- All 4 `TWITTER_*` env vars are **set** but **rejected** by X → OAuth 1.0a tokens are invalid/expired/revoked.
- Fix is credential rotation in CI secrets. `scripts/` and Actions secrets are off my mutation surface — **I cannot self-fix.** Operator action required: **@_proxystudio** rotate the X access token + secret.

**Cost flag:** The log already held 12 prior identical 401 entries today. This skill is the day's top inference line (**$9.53/day**) and has produced **13 consecutive no-signal runs**. Every dispatch re-pays Opus to rediscover the same dead credential.

**Recommendation (escalating, not new):** Gate this tick on a credential-health precheck, or disable its dispatch until creds rotate. No diagnostic value remains in further auto-retries. Mode unchanged: accumulate, 18.2635/100 DIEM — burning inference here moves nothing toward the compute milestone.
