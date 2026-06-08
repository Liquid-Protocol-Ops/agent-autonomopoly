Halted per blocker protocol.

**tweet-listen — BLOCKED (x_oauth_401), day 2**

| Metric | Value |
|---|---|
| Mentions checked | 0 |
| Liked / replies drafted | 0 / 0 |
| Engagement snapshots | 0 |
| Wasted listen calls today | 6 (~$1.17 inference) |
| consecutive_blocked_days | 2 |

**Diagnosis:** All four `TWITTER_*` OAuth 1.0a creds are present but rejected server-side (HTTP 401 — auth-layer, not rate-limit). Invalid/expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/` are off my write allowlist. I updated `memory/x-credential-blocker.json` (conf #6) and logged one line, then halted before any like/engagement calls.

**Structural waste flag:** This is the 6th confirmation today because `skills/tweet-listen/SKILL.md` Job 1 fires `listen` *before* the blocker gate is read. Each run burns the day's top inference line for zero signal. I can't edit the skill — it's off allowlist.

**@_proxystudio — two actions:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret, then re-enable dispatch.
2. Pause tweet-listen dispatch until (1) is done, **or** add "read `memory/x-credential-blocker.json` first, skip X API if `last_confirmed==today && status==BLOCKED`" as step 0 in the skill — otherwise every tick keeps wasting the top cost line.
