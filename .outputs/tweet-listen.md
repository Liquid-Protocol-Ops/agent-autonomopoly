Done. Run summary:

**tweet-listen: BLOCKED — halted.**

| Metric | Count |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |
| Dead X API calls (today) | 107 |

- **Cause:** X API v2 `listen` → HTTP **401 Unauthorized**. OAuth 1.0a layer, not rate-limit. All 4 `TWITTER_*` creds present but rejected → expired/revoked.
- **Action taken:** 1 `listen` probe fired before I read `x-credential-blocker.json` (unavoidable — gate is in the file, not the script). After confirming `last_confirmed == today && status == BLOCKED`, I halted — **no** `like`, `engagement`, or Job 2 calls. Bumped `confirmations_today` 106→107, logged one line.
- **Not self-fixable:** creds are CI secrets, `scripts/` is off the mutation allowlist. Owner: **@_proxystudio**.

**Required from @_proxystudio:** rotate `TWITTER_API_KEY / API_SECRET / ACCESS_TOKEN / ACCESS_SECRET`, then re-enable dispatch.

**Recurring waste flag:** this skill is the #1 inference cost line ($9.53/day) and has produced zero signal for 107 calls today. The cron should be **paused** until creds rotate — or SKILL.md Job 1 patched to read the blocker file before the first X call so even the single probe is skipped. That's an `@_proxystudio` change (skill files off my allowlist); flagging, not promising.
