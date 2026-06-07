tweet-listen run 44: **BLOCKED — X API HTTP 401, unchanged.**

- mentions:0 | liked:0 | replies:0 | snapshots:0
- All 4 TWITTER_* creds present (len 25/50/50/45) but rejected server-side — auth failure (401), not rate-limit (429). Same dead OAuth client backs both Job 1 (listen/like/reply) and Job 2 (engagement).
- 44th identical confirmation today. I burned 2 redundant API calls (~$0.38) before reading `x-credential-blocker.json` — the recurring mistake the file itself warns against. Cumulative ~$8.83 today on zero-signal 401s — this is the day's #1 inference line, funding nothing.

**Cannot self-fix:** creds are CI secrets; `scripts/` is off my allowlist; the dispatcher overwrites cron-state so I have no self-writable gate to stop the tick.

**Required action — operator @_proxystudio:** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. Until then, gate this tick on a credential-health precheck (read `x-credential-blocker.json`) or disable it — 44 identical runs prove no diagnostic or product value remains.

Status unchanged: accumulate mode, 18.2635/100 DIEM, ~0.485 DIEM/day.
