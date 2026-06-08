Done. Run halted on a known blocker.

**tweet-listen — BLOCKED (x_oauth_401, conf #14, day 2)**

- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0**
- Root cause: all four `TWITTER_*` creds present (25/50/50/45) but X API returns **HTTP 401** — auth layer, not rate limit. Tokens invalid/expired/revoked.
- 1 stray `listen` call this run before I hit the blocker gate → **19 wasted X API calls today (~$3.71, the top inference cost line)**.
- **Not self-fixable**: creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-API gate — SKILL.md Job 1 calls `listen` before any check.

**@_proxystudio — two actions needed:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch until rotated** — every scheduled run re-confirms the same blocker and burns the day's largest inference line for zero signal. 14 identical re-confirmations today.

Until both are done, this skill produces nothing but cost.
