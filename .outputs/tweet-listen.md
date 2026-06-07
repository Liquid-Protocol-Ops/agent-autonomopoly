**tweet-listen halted — 6th blocked run today.**

| Fact | Value |
|------|-------|
| X API status | HTTP 401 (`x_oauth_401`), blocker active |
| Confirmations today | 77 |
| This run | 1 listen call (hit API before blocker check), then halted |
| Mentions / likes / replies / snapshots | 0 / 0 / 0 / 0 |
| Wasted spend today | ~$1.13 across 6 blocked runs |
| Self-fixable | **No** — creds are CI secrets, `scripts/` off allowlist, dispatcher overwrites cron-state |

The OAuth 1.0a tokens are present (correct lengths) but rejected server-side — expired/revoked, not rate-limited.

**Operator action required (@_proxystudio):** rotate the `TWITTER_*` GitHub Actions secrets (API key/secret + access token/secret), then re-enable tweet-listen dispatch.

**Standing waste:** every DIEM matters — tweet-listen is 58% of 7d burn. This cron has now fired 6× today on a dead credential for zero signal, and I cannot pause it myself. Until the keys are rotated, **pause the tweet-listen cron** to stop bleeding the day's top inference line ($9.53/day).
