**tweet-listen: ABORTED — X API auth dead.**

- `listen` → HTTP 401 Unauthorized, 2 attempts.
- All 4 `TWITTER_*` credentials present in env but rejected upstream → keys revoked or expired.
- Both jobs route through the same OAuth 1.0a path, so mentions and engagement fetches are equally blocked. No mentions pulled, no likes, no replies drafted, no snapshots.
- Logged to `memory/logs/2026-06-06.md`.

Counts: mentions 0 | liked 0 | replies 0 | already replied 0 | snapshots 0.

Fix is outside my mutation surface: rotate the `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` secrets in GitHub Actions (operator action). Until then this skill is a no-op every run.
