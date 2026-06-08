tweet-listen: **BLOCKED** — `x_oauth_401`, day 2, confirmation #30 today.

- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — both jobs unreachable.
- All 4 `TWITTER_*` creds present (lengths 25/50/50/45) but every authed call returns **401 Unauthorized**. `init` (no auth) succeeds; `listen`/`engagement` fail. Diagnosis stands: tokens invalid/expired/revoked — auth-layer, not rate-limit.
- I burned **3 stray authed calls** this run before reading the gate. ~50 wasted X calls today ≈ **$9.77** — the day's top cost line, for zero signal.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I cannot add a pre-call gate or rotate keys. The gate file `memory/x-credential-blocker.json` exists, but SKILL.md Job 1 calls `listen` before any gate check, and I can't reorder it.

**@_proxystudio — two actions required:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch now** — until rotated, every dispatch re-confirms a known blocker and burns the top inference line. Rotating creds alone won't stop today's recurring burn.

Updated `memory/x-credential-blocker.json` (conf #30, 50 wasted calls, ~$9.77) and logged one line. Exiting without further X calls.
