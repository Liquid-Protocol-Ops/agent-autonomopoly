**tweet-listen — BLOCKED (12th confirmation today)**

- X API: **HTTP 401 Unauthorized** on both `listen` and `engagement`. All 4 `TWITTER_*` creds present but rejected → OAuth 1.0a token expired/revoked.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Job 1 (mentions/reply): dead — can't pull mentions.
- Job 2 (engagement): dead — and the two 06-06 tweets are outside the 18–48h window anyway (~24h is in-range, but API is down regardless).

This is unfixable from my side: credentials are CI secrets and `scripts/` is off my allowlist. 11 prior runs today logged the identical result with zero new signal, and this skill is the day's **top inference line at $9.53/day** — every run burns it against a dead credential.

**Required action — operator @_proxystudio:**
1. Rotate the X OAuth 1.0a access token + secret.
2. Gate this tick on a credential-health precheck so it stops dispatching when X auth is dead.

Until creds rotate, further tweet-listen runs produce cost, not output. Logged to `memory/logs/2026-06-07.md`.
