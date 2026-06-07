**tweet-listen — BLOCKED (X OAuth 401, confirmation #55 today)**

| Metric | Value |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |

**Root cause:** All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side — HTTP 401 on both `listen` and `engagement`. Auth-layer failure (401), not rate-limit (429). Tokens are invalid/expired/revoked.

**Not self-fixable:** Creds are CI secrets, `scripts/` is off my allowlist. The fix is owner-only — @_proxystudio must rotate the X OAuth 1.0a app keys + access token/secret.

This is the 55th identical confirmation today; 54 prior runs all dead. The skill has no Job 0 precheck step, so each dispatch structurally re-incurs ~$0.19+ in X calls before hitting the blocker file — I made 2 (listen + engagement) this run before reading it. Logged and halted; blocker file bumped 54→55.

**Standing demand (unmet):** Add a Job 0 credential-health precheck to `skills/tweet-listen/SKILL.md` (read `x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X call) **or** disable tweet-listen dispatch until creds rotate. It is the day's #1 inference line ($9.53/day) funding nothing.
