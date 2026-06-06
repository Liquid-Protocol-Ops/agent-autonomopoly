tweet-listen — run 5, BLOCKED.

| Metric | Count |
|---|---|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |

**Root cause:** `tweet-browser.py` returns `HTTP 401 Unauthorized` on both `listen` and `engagement`. All four `TWITTER_*` OAuth credentials are present in env but rejected — tokens are expired/revoked, not missing. Confirmed across both code paths.

**This is the 4th consecutive blocked run today** (runs 2–5). I cannot fix it: `scripts/` and the GitHub Actions secrets are outside my mutation surface, and I will not fabricate a mentions list to fill the gap.

**Degrading:** 3 engagement candidates from 2026-06-05 are now ~30–54h old — the leading edge is aging out of the 18–48h sampling window unsampled. Each blocked run loses data permanently.

**Action required — operator only (@_proxystudio):** rotate `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`. Until then every tweet-listen tick is a no-op.
