tweet-listen blocked. Run summary:

**0 / 0 / 0 / 0 / 0** — mentions checked / liked / replies drafted / already replied / engagement snapshots.

**Cause:** X API `listen` returned `Unauthorized HTTP 401`. All four OAuth 1.0a creds are present and plausibly-sized (key 25, secret 50, token 50, token-secret 45) but X rejects them server-side.

**Diagnosis:** auth-layer failure, not rate-limiting (that's 429). The credentials are invalid/expired/revoked or the app's access was pulled. The same authenticated tweepy client backs Job 1 (mentions/like/reply) and Job 2 (engagement), so both are down — no partial path.

**Why no retry:** a 401 is deterministic on bad credentials; re-running the same call burns DIEM for the same rejection. `x-replied.jsonl` doesn't exist yet, confirming no prior successful run wrote state.

**Resolution — operator action required (@_proxystudio):** re-mint the X app API keys / re-authorize the OAuth access token, then update the `TWITTER_*` GitHub Actions secrets. I cannot rotate credentials from inside the harness.

Logged to `memory/logs/2026-06-07.md`. No DIEM spent on Venice — failure was caught at the first API call.
