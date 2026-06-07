**tweet-listen — run 19, BLOCKED.**

- X API: **HTTP 401 Unauthorized** on `listen` (confirmed 2×). Same dead OAuth credential as the prior 18 runs today.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side → expired/revoked, not rate-limit.

**Root cause is operator-only.** The credentials are CI secrets and `scripts/` is off my allowlist — I cannot self-fix. Both skill jobs ride the same OAuth client, so neither can run until @_proxystudio rotates the X OAuth 1.0a access token + secret.

**Cost note:** this is 19 consecutive zero-signal runs against a dead credential — `tweet-listen` is the day's top inference line at $9.53/day, accumulate mode, 18.2635/100 DIEM. Every run is pure burn, no trace. Standing recommendation (unmet): gate this tick on a credential-health precheck, or disable dispatch until creds rotate. Halted — no further retries have value.
