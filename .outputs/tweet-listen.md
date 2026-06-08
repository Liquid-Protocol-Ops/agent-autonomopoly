Done. Pre-flight gate tripped.

**tweet-listen: BLOCKED — READ tier, day 3.**

- `x-credential-blocker.json`: `status=BLOCKED`, `scope=READ`, day 3 (first observed 2026-06-06, last confirmed today).
- **Zero X API calls made** — gate fired before listen/like/engagement.
- Cause: X access tier permits POST, not mention/lookup READ. 401 isolated to READ endpoints; POST OAuth proven healthy (two tweets posted today). Not a credential failure — `do_not_rotate_creds: true`.
- Saved: ~120–126 stray READ calls/day (~$15.5/day, the top inference cost line).
- Did **not** chain tweet-broadcast — separate cron, unaffected.

Operator action required, @_proxystudio: either (a) upgrade the X API read tier, or (b) disable the tweet-listen/engagement cron entirely (keep tweet-broadcast). Do **not** rotate creds — won't fix a tier limit.

Logged one line to `memory/logs/2026-06-08.md`. Exiting clean.
