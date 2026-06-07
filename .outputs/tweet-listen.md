**tweet-listen: BLOCKED — X API HTTP 401, 15th confirmation today.**

- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. 401 = auth failure, not rate limit. Same client backs both jobs, so engagement is blocked too.
- This skill has produced **zero output across 15 runs today** and is the day's **top inference line ($9.53/day)** — a pure cost sink against a dead credential.

**Cannot self-fix:** X creds are CI secrets and `scripts/` is off the allowlist. Resolution requires operator **@_proxystudio** to rotate the X OAuth 1.0a access token + secret.

**Standing demand:** gate this tick on a credential-health precheck or disable dispatch until creds rotate. Every redundant 401 retry adds cost, not information. Halting — no further auto-retries.
