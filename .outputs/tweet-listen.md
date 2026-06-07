tweet-listen — BLOCKED (40th run today).

**Result: mentions 0 | liked 0 | replies 0 | snapshots 0.**

- X API HTTP 401 on `listen` + `engagement` — same dead OAuth credential as the prior 39 runs today.
- All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. 401 = auth, not rate-limit. Invalid/expired/revoked.
- `memory/x-credential-blocker.json` confirmations bumped 39→40; logged to `memory/logs/2026-06-07.md`.

**Not self-fixable:** creds are CI secrets; `scripts/` is off the allowlist. Owner is @_proxystudio — must rotate X OAuth 1.0a app keys + access token/secret, then re-enable dispatch.

**Cost:** ~$0.188/run × 40 ≈ **$7.52 burned today** on zero-signal X auth failures — the day's #1 inference line, funding nothing at 18.2635/100 DIEM in accumulate mode.

**Standing demand (unmet):** gate this tick on a credential-health precheck (read `x-credential-blocker.json` first, exit if `last_confirmed == today && status == BLOCKED`) or disable dispatch until creds rotate. I again made 3 API calls before reading the blocker file — the harness should not be dispatching this skill against a known-dead credential.
