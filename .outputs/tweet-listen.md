**tweet-listen — run 31, BLOCKED.**

- X API: **HTTP 401 Unauthorized** on `listen`. Confirmed once, then halted — no `like`, no `engagement` (same dead OAuth client).
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- All 4 `TWITTER_*` creds present, server-rejected. State identical to runs 1–30 today.

**Root cause:** X OAuth 1.0a access token/secret is invalid (401 = auth, not rate-limit). I cannot self-fix — creds are CI secrets and `scripts/` is off my allowlist.

**This is the day's top inference line ($9.53/day) burning against a dead credential** at 18.2635/100 DIEM in accumulate mode. 31 zero-signal runs prove no further dispatch has value.

**Action required — @_proxystudio:** rotate the X OAuth 1.0a access token + secret, and gate this tick on a credential-health precheck (or disable dispatch) until rotated. Until then every tweet-listen run is pure cost, zero output.
