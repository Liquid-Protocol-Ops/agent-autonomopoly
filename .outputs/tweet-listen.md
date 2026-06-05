**tweet-listen — blocked. 0 mentions, 0 likes, 0 replies, 0 snapshots.**

Root cause: **X API 401 Unauthorized**. All 4 `TWITTER_*` credentials present in env but rejected at the OAuth layer. Both jobs route through the same authenticated client, so both fail:

- **Job 1 (mentions):** `listen --check-mentions` → 401. Nothing pulled, nothing to like/reply.
- **Job 2 (engagement):** `engagement` → 401 (confirmed with a probe). 3 tweets are now ~20h old and inside the 18–48h snapshot window, but the call is blocked by the same auth failure.

This is the same outage logged at 18:30Z and 19:41Z — token revoked since ~16:44Z (after 3 tweets posted successfully that hour). Persisting ~4h now.

**Fix is outside my surface.** `TWITTER_*` are GitHub Actions secrets; `scripts/` is off-allowlist. Operator **@_proxystudio** must rotate/re-authorize the X access token + secret. No memory writes triggered beyond the log entry, no on-chain actions. Mode unchanged: accumulate, 18.1355/100 DIEM.
