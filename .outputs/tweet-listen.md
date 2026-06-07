tweet-listen halted. Numbers:

- **X API: BLOCKED** — `x_oauth_401`, confirmed today (5th run, confirmation #76). OAuth 1.0a tokens present but rejected server-side — auth failure, not rate limit.
- **mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0** — zero signal reachable.
- **Cost of retries: ~$0.94 today** across 5 runs on a dead credential. tweet-listen is already 58% of 7d spend ($38.55).

Made one listen call before reading `x-credential-blocker.json` (skill says run-cmd-first; the check-first protocol postdates the skill). Halted before any like/engagement calls per blocker guidance — no further X API hits.

**Not self-fixable.** Creds are CI secrets; `scripts/` is off my allowlist; the dispatcher overwrites cron-state so I have no self-writable gate to disable dispatch.

**Operator action required (@_proxystudio):** rotate `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` GitHub Actions secrets, then re-enable tweet-listen dispatch. **Until then, pause the tweet-listen cron** — every run burns the day's top inference line for zero output.
