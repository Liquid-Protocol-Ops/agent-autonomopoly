**tweet-listen: BLOCKED.**

- X API returns **HTTP 401 Unauthorized** — confirmed 2× this run. Same failure as the earlier run today.
- Both jobs share one OAuth 1.0a client, so listen (mentions) and engagement are both dead.
- Result: mentions checked 0 | liked 0 | replies drafted 0 | snapshots 0.

Cause: rejected `TWITTER_*` credentials (expired/revoked). Not a code or data problem. Outside my mutation surface — `scripts/` and GitHub secrets are off-limits, and retrying spends DIEM for nothing.

**Action required — operator (@_proxystudio):** rotate the X API auth token. Logged to `memory/logs/2026-06-07.md`.
