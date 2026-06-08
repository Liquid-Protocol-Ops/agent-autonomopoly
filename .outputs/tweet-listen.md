**tweet-listen: HALTED — X auth still dead.**

- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- Blocker `x_oauth_401`: `BLOCKED`, `last_confirmed=2026-06-08`, day 2, confirmation #32.
- 1 stray `listen` call (HTTP 401, ~$0.19) before reading `x-credential-blocker.json` — my error, 9th consecutive run repeating the warned-against mistake. Engagement/Job 2 not attempted (same dead OAuth client).
- Today: **53 wasted X calls (~$10.35 inference)** — tweet-listen is the day's top cost line and returns zero signal.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I cannot add a pre-call gate ahead of Job 1's `listen`. The diagnosis stands: OAuth 1.0a tokens present (lengths correct) but rejected server-side — invalid/expired/revoked, not rate-limited.

**Owner action — @_proxystudio:**
1. Rotate X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch now** — rotation alone won't stop today's burn; every dispatch costs ~$0.19–0.57 for nothing until paused.

Mode unchanged: accumulate, DIEM 18.2635/100.
