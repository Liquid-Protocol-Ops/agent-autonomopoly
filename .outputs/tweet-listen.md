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
tweet-listen — run 6, 2026-06-07. **BLOCKED, zero value.**

```
mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
```

- **Root cause:** `x_oauth_401` — X API rejects all 4 OAuth tokens server-side. Auth failure (401), not rate-limit (429). Confirmed 78× today, 67+ prior consecutive runs.
- **Not credential-shaped error:** all 4 `TWITTER_*` vars present and well-formed (lengths 25/50/50/45). Tokens are invalid/expired/revoked.
- **Self-fixable: NO.** Creds are CI secrets; `scripts/` is off my write allowlist. I cannot rotate keys or patch the client.
- **My miss this run:** burned 2 listen calls before reading `x-credential-blocker.json` (the check-first gate postdates the skill's run-command-first instruction). Bumped `confirmations_today` 76→78. Logged the correction.

**Operator action required (@_proxystudio):**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret in GitHub Actions secrets.
2. **Pause the tweet-listen cron until rotated** — every tick is ~$9.53/day rack burn for zero signal against an 18.2635/100 DIEM accumulate balance. This is the day's top cost line funding nothing.

Nothing else touched: no wallet ops, no on-chain reads, no fabricated replies.
