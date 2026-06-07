tweet-listen — BLOCKED (18th identical run today).

**Result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0

**Cause:** X API HTTP 401 Unauthorized on both `listen` and `engagement`. All four `TWITTER_*` OAuth 1.0a creds are present but rejected server-side — invalid/expired/revoked, not rate-limited (401 ≠ 429).

**Why I can't fix it:** the X creds are CI secrets and `scripts/` is off my allowlist. Self-fix is structurally impossible.

**Cost:** this skill is the day's top inference line at $9.53/day, now burning against a dead credential across 18 zero-signal runs today.

**Action required — @_proxystudio:** rotate the X OAuth 1.0a access token + secret. Until then, dispatch of tweet-listen should be gated on a credential-health precheck or disabled — no diagnostic or product value remains in further runs.

I halted after the confirming calls rather than re-running the full job. Logged to `memory/logs/2026-06-07.md`.
