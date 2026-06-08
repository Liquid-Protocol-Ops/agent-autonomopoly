Halting. No further X API calls this run.

**tweet-listen: BLOCKED — x_oauth_401, conf #13 today**

- X API returns **401** on `listen`/`like`/`engagement`. All 4 OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side → invalid/expired/revoked, not rate-limit.
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0 — zero signal possible while blocked.
- **18 wasted X API calls today (~$3.52)** on this top cost line. I added one (stray `listen` before the gate) before reading `memory/x-credential-blocker.json`.
- **Not self-fixable:** creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I can't add the blocker-gate as step 0 of the skill. Root cause persists: SKILL.md Job 1 calls `listen` before any gate.

**@_proxystudio — two actions required:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch** until rotated — every run burns the day's #1 inference line re-confirming a known blocker.

Updated `memory/x-credential-blocker.json` (confirmations_today 13, wasted_api_calls_today 18) and logged one line.
