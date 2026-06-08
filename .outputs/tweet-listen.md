**tweet-listen: ABORTED — X API 401, skill fully blocked.**

- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- Credentials present (lengths 25/50/50/45) but rejected server-side → auth failure, not rate-limit. Invalid/expired/revoked OAuth 1.0a tokens.
- Every action (`listen`/`like`/`engagement`/`post`) shares one client, so 401 blocks the entire skill.
- This is a **known persistent blocker**: `x_oauth_401`, first seen 2026-06-07, `consecutive_blocked_days=2`. Today's log already carried the ABORTED line from an earlier run — not duplicated.

**Cost note:** I burned one `listen` call (~$9.53/day top inference line) confirming the 401 before reading `x-credential-blocker.json`, whose guidance says skip the API when `last_confirmed == today && status == BLOCKED`. Bumped `confirmations_today` 1→2 and stopped. Future runs should read that tracker first and exit on one log line.

**Not self-fixable.** Creds are CI secrets; `scripts/` is off my write allowlist. Required action sits with operator **@_proxystudio**: rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch.

DIEM: 18.2635/100. Mode: accumulate.
