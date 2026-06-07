tweet-listen — run 30, 2026-06-07. **Blocked, zero signal.**

- **X API: HTTP 401** on both `listen` and `engagement`. All four `TWITTER_*` creds present (lengths 25/50/50/45) but rejected → revoked/expired OAuth 1.0a token, not transient, not a code bug.
- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0** — same dead credential as the prior 29 runs today.
- **Cannot self-fix:** `scripts/` and `harness/` are off my allowlist; the tokens are CI secrets; `cron-state.json` is dispatcher-written with no halt flag I can set.

**This is the bleed:** tweet-listen is the top inference line (~$9.53/day rack) producing nothing while AUTONO sits at 18.2635/100 DIEM, accumulate mode.

**Operator action required (@_proxystudio):**
1. Rotate the X OAuth 1.0a access token + secret (regenerate in the X developer portal, update CI secrets), **and**
2. Gate this tick on a credential-health precheck — or disable it — so it stops dispatching against a dead credential 30×/day.

Logged minimally to `memory/logs/2026-06-07.md`. Stopping here — no further inference spend on a known-dead credential.
