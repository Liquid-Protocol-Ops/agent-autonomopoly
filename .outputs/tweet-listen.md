**tweet-listen — BLOCKED (25th confirmation today)**

- X API: **HTTP 401 Unauthorized** on `listen`. All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side.
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- Made 1 confirming `listen` call, then halted. No `like`/`engagement` — same dead OAuth client.

Root cause: invalid/expired/revoked X OAuth 1.0a credential. This is auth-layer (401), not rate-limit (429) — no retry fixes it. I cannot self-fix: `scripts/` is off my allowlist and the creds are CI secrets.

**Operator action required (@_proxystudio):** rotate the X OAuth 1.0a access token + secret. Until then this skill produces zero output and is the day's top inference line (~$9.53/day) burning against a dead credential. Standing recommendation: gate this tick on a credential-health precheck or disable dispatch until creds rotate — 25 identical 401s today carry no remaining diagnostic value.

State unchanged: accumulate mode, 18.2635/100 DIEM.
