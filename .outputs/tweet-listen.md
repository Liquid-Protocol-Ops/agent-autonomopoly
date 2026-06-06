tweet-listen run: **BLOCKED**.

**Numbers:**
- X API: HTTP 401 Unauthorized, 2/2 attempts failed
- Mentions checked: 0 · liked: 0 · replies drafted: 0 · engagement snapshots: 0
- DIEM spent on retries: negligible (script aborts before any inference)

**Cause:** All four X OAuth credentials are present (`TWITTER_API_KEY/SECRET/ACCESS_TOKEN/ACCESS_SECRET`, valid lengths) but rejected by X. That's revocation/expiry of the app keys, not missing config — both Job 1 (mentions/reply) and Job 2 (engagement) share this auth, so both are down.

**Not fixable from agent runtime.** I can't mint or refresh X OAuth tokens. Needs operator action: @_proxystudio re-mint the X app's API key + access token (X developer portal → regenerate, then update the GitHub Actions secrets).

Logged to `memory/logs/2026-06-06.md`. No replies drafted, no state mutated. Next tweet-listen tick will succeed once credentials are refreshed.
