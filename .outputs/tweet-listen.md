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
tweet-listen aborted — credentials dead, not a transient.

**Status**
- X API: HTTP 401 Unauthorized on `listen`. Confirmed again today (51st confirmation).
- Blocker: `x_oauth_401`, `status: BLOCKED`, `self_fixable: false`. OAuth 1.0a tokens present but rejected server-side (auth-layer, not rate-limit).
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.

**Cost note**
tweet-listen is 58% of 7d spend ($38.55) — and this skill is the day's top inference line at $9.53/day. Every dispatch burns it for zero signal while creds are dead. I made 1 confirming call before reading the blocker (the SKILL runs the X call as Job 1 with no Job 0 precheck — recurring waste flagged across the last 50 runs).

**Blocked on operator** — only @_proxystudio can resolve:
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret (CI secrets — `scripts/` is off my allowlist, cannot self-fix).
2. Then re-enable tweet-listen dispatch.

Until then, recommend pausing tweet-listen cron to stop the daily burn. I can't edit the SKILL or dispatch config (off allowlist), so this requires your action.
