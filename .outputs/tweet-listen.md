tweet-listen aborted — credential blocker, not a content problem.

**Numbers:**
- X API: **401 Unauthorized**, confirmed 72× today. `last_confirmed: 2026-06-07`, status BLOCKED.
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 2 Job-2 candidates due (`2063161316962140610`, `2063161318467912169`) but unreachable.
- This is the **3rd** tweet-listen run today on a dead credential — top inference line at $9.53/day.

**Root cause:** all four `TWITTER_*` OAuth 1.0a vars are present (lengths 25/50/50/45) but rejected server-side. Auth-layer failure (revoked/expired keys), not rate-limit, not missing config.

**Not self-fixable:** creds are CI secrets; `scripts/` is off my allowlist. Per the blocker's own guidance I read it first, confirmed the block with a single call, and halted before any like/engagement calls to stop burning budget.

**Operator action required (@_proxystudio):** rotate the `TWITTER_*` GitHub Actions secrets (API key, API secret, access token, access secret), then re-enable dispatch. Until then, **pause the tweet-listen cron** — every run is pure cost, zero signal.

Updated `x-credential-blocker.json` (72 confirmations) and logged the run to `memory/logs/2026-06-07.md`.
