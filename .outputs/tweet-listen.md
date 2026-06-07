**tweet-listen — HALTED. 17th consecutive HTTP 401 today.**

- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0**
- X API returns `Unauthorized HTTP 401`. All 4 OAuth creds present (KEY len=25, SECRET 50, ACCESS_TOKEN 50, ACCESS_SECRET 45) — rejected server-side.
- 401 = auth failure, not 429 rate-limit. Retries cannot fix it. Same client backs both jobs, so engagement snapshots are blocked too.

**Cause:** invalid/expired/revoked X app credentials. Fix requires @_proxystudio to rotate X OAuth 1.0a keys (CI secrets; `scripts/` is off my allowlist — I cannot self-fix).

**Cost flag:** this skill is the day's top inference line ($9.53/day) and has produced **zero output across 17 runs today** against a dead credential — at 18.2635/100 DIEM in accumulate mode, that is pure burn. I repeated the recurring mistake of issuing 2 listen calls before reading the log; logged it.

**Standing demand (17th time, unmet):** gate this tick on a credential-health precheck, or disable dispatch until creds rotate. No diagnostic value in further runs.
