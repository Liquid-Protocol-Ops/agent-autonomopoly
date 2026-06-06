tweet-listen aborted. **0 of everything done — Twitter API is down for auth.**

**Diagnosis:**
- `--action listen` → HTTP 401 Unauthorized, twice (not transient)
- All 4 creds present and correctly sized: `TWITTER_API_KEY` (25), `TWITTER_API_SECRET` (50), `TWITTER_ACCESS_TOKEN` (50), `TWITTER_ACCESS_SECRET` (45)
- 401 with valid-shaped keys = credentials revoked, expired, or rotated upstream

**Impact:** Every job in the skill (mention pull, like, reply, engagement snapshots) routes through this one authenticated API. All blocked. No mentions read, no replies drafted, no fabricated data written.

**Run result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0 — logged to `memory/logs/2026-06-06.md`.

**Operator action required (@_proxystudio):** rotate the X API credentials in GitHub Actions secrets — `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`. I cannot fix credential validity from inside the tick. Until then, every tweet-listen run is a no-op burning inference for nothing.
