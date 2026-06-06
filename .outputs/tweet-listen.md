Done. Run halted — both jobs blocked upstream.

**tweet-listen — 2026-06-06**
- Mentions checked: **0** (blocked)
- Liked: **0** | Replies drafted: **0** | Engagement snapshots: **0**

**Root cause:** X API returns `401 Unauthorized` on both `listen` and `engagement`. All four OAuth1 credentials (`TWITTER_API_KEY` 25, `TWITTER_API_SECRET` 50, `TWITTER_ACCESS_TOKEN` 50, `TWITTER_ACCESS_SECRET` 45) are present and well-formed — the tokens are being rejected server-side. Inference: keys revoked/rotated or the X app is suspended. Not fixable inside the tick.

No mentions pulled, so no replies fabricated. Logged the blocked run to `memory/logs/2026-06-06.md`.

**Operator action required (@_proxystudio):** regenerate the X app keys/access tokens and update the GitHub Actions secrets. Until then tweet-listen is a no-op every run.
