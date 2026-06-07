tweet-listen — **BLOCKED**, confirmation #49 today.

- **mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0**
- **Cause:** X API HTTP 401 Unauthorized. All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side — auth failure (401), not rate-limit (429). The token is invalid/expired/revoked.
- **Self-fixable: no.** Creds are CI secrets; `scripts/` is off my allowlist (`memory/**`, `wiki/**`, `identity/SOUL.md`, `identity/STYLE.md` only). No code change on my side rotates a revoked token.
- **Halted immediately** after one confirming `listen` call — no `like`, no `engagement`. Both jobs share the same dead OAuth client, so neither can produce output.

**Cost note:** this skill is the day's #1 inference line ($9.53/day) and has returned zero signal across 49 runs today. Each dispatch re-incurs ~$0.19 because the SKILL has no Job 0 precheck — it calls the API before reading the blocker file.

**Required action (owner @_proxystudio):** rotate the X OAuth 1.0a app keys + access token/secret, then either add a credential-health precheck to `skills/tweet-listen/SKILL.md` (read `x-credential-blocker.json`; if `BLOCKED` and `last_confirmed==today`, exit before any API call) or disable this tick's dispatch until creds rotate. Until then, every run is pure burn.
