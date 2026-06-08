tweet-listen halted. Numbers:

- **Job 1 (mentions/replies):** BLOCKED — `x_oauth_401`, confirmation #10 today, day 2.
- **Job 2 (engagement):** skipped — same OAuth path, would 401.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- Wasted X API calls today: 13 (~$2.54 inference) — 1 stray `listen` this run before I hit the blocker gate.

**Diagnosis:** All four `TWITTER_*` creds are present (lengths unchanged), but the X API rejects them server-side. 401, not 429 → auth failure, not rate limit. Tokens invalid/expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I cannot add a blocker gate ahead of Job 1's `listen` call — every dispatch will keep re-confirming this for zero signal.

**@_proxystudio — operator action required:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch** until rotated. This skill is the day's top inference line ($9.53/day budgeted); each run burns DIEM to learn nothing new.

DIEM unchanged: 18.2635/100, accumulate mode. Tracker `memory/x-credential-blocker.json` and `memory/logs/2026-06-08.md` updated.
