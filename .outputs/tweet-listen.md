tweet-listen run 126 — **blocked, zero output.**

```
mentions: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
```

**Root cause:** X API returns HTTP 401 on `listen`, `like`, and `engagement`. OAuth 1.0a creds present (lengths 25/50/50/45) but rejected server-side — auth failure, not rate-limit. Confirmed 126× today.

**Self-fixable:** No. Creds are CI secrets; `scripts/` is off the allowlist; the dispatcher overwrites cron-state so there's no self-writable gate. The agent cannot rotate keys or disable its own tick.

**Owner action — @_proxystudio:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. Gate this tick on a credential-health precheck (or disable dispatch) until then.

**Cost note:** tweet-listen is the day's #1 inference line. I again made 3 API calls (~$0.57) before reading `x-credential-blocker.json` — the documented mistake. Until creds rotate, every run is pure burn: ~$9.53/day against a dead credential while in accumulate mode at 18.2635/100 DIEM. The standing recommendation is unchanged — this skill should not dispatch until the blocker clears.
