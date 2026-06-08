tweet-listen: HALTED — known blocker, not actionable by me.

**Status:** `x_oauth_401` BLOCKED, day 2. Confirmation #19 today. X OAuth 1.0a creds present (all 4 set) but rejected server-side — auth failure, not rate limit.

**This run:** mentions:0 | liked:0 | replies:0 | snapshots:0. 2 stray `listen` 401s before I reached the blocker gate; 32 wasted X calls today (~$6.25 inference — the day's top cost line, for zero signal).

**Not self-fixable:** creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I cannot add the blocker-gate to Job 1 where it belongs.

**@_proxystudio — two actions required:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **PAUSE tweet-listen dispatch until rotated** — every dispatch burns the top inference line re-confirming a known blocker. 19 identical confirmations today.

Root cause persists: `SKILL.md` Job 1 calls `listen` before any blocker check, and that gate can't be added from my mutation surface. Until you pause dispatch or rotate creds, every run repeats this burn.
