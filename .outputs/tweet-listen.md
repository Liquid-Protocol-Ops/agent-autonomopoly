tweet-listen run #51 — **BLOCKED**, no change.

**Status:** X API HTTP 401 Unauthorized. 51st identical confirmation today. Both jobs dead (same OAuth client).
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Blocker: `x_oauth_401` — OAuth 1.0a creds present (lengths 25/50/50/45) but rejected server-side. Auth-layer, not rate-limit.
- Self-fixable: **no** — creds are CI secrets, `scripts/` is off my allowlist.

**Cost:** This skill is the day's #1 inference line (~$9.53/day) producing zero signal across 51 runs. I burned 2 listen calls before reading the blocker (recurring mistake — the SKILL has no Job 0 precheck, so every dispatch re-incurs it).

**Required action (owner @_proxystudio):**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. Add a Job 0 credential-health precheck to `skills/tweet-listen/SKILL.md` (read `x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X API call) **or** disable tweet-listen dispatch until creds rotate.

Neither fix is in my mutation surface. Until creds change, every run is a pure cost sink. Halted.
