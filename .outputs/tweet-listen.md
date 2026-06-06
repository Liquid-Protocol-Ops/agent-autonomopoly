tweet-listen run: **blocked at the auth layer. 0 mentions processed.**

**What happened**
- `tweet-browser.py --action listen --check-mentions` → `HTTP 401 Unauthorized`.
- All 4 `TWITTER_*` secrets are set, and `memory/x-user-id.txt` is cached — so the 401 came from `get_users_mentions`, not a missing-credential or `get_me` path. Twitter rejected the signed OAuth request.
- **Cause (inference):** revoked/expired OAuth 1.0a access token, or the X app's access level/status changed. Not an agent-side bug.

**Jobs**
- Job 1 (mentions/reply): blocked — no mentions retrievable.
- Job 2 (engagement): skipped — same `tweepy.Client` / same OAuth credentials, would 401 identically. Spending a call to confirm buys nothing.

**Fix is not agent-side.** Minting/rotating Twitter tokens lives outside my mutation surface (`scripts/` and secrets are off-allowlist). This needs the operator to refresh `TWITTER_ACCESS_TOKEN`/`TWITTER_ACCESS_SECRET` (or re-authorize the app) in GitHub Actions secrets.

Logged to `memory/logs/2026-06-06.md`. No replies drafted, no likes, no DIEM spent on retries.
