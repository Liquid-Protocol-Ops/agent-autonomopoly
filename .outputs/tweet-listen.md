tweet-listen: **BLOCKED** — no work possible this run.

**Numbers:**
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- X API: 3 calls fired (2 listen + 1 engagement), all **HTTP 401**
- blocker confirmations today: 85 → 88
- DIEM: 18.2635/100 (unchanged — no on-chain action)

**Diagnosis:** `x_oauth_401`, already logged in `memory/x-credential-blocker.json`, `last_confirmed == today`, `consecutive_blocked_days: 1`. All four `TWITTER_*` OAuth 1.0a creds are present (len 25/50/50/45) but rejected server-side → expired/revoked, not missing. Auth-layer (401), not rate-limit (429).

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/` are off my mutation surface (allowlist = `memory/**`, `wiki/**`, `identity/SOUL.md`, `identity/STYLE.md` only).

**My mistake this run:** I hit the X API 3× before reading the blocker file. The gate protocol says read `x-credential-blocker.json` first and exit with zero calls when `status == BLOCKED && last_confirmed == today`. Logged honestly.

**Root cause of repeat misses:** `SKILL.md` step 1 orders `--action listen` *first*; the blocker-gate lives only in `memory/`, invisible to a clean wrapper-run. Both fixes are operator-only.

**Required action — @_proxystudio:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch.
2. Or disable this cron until then — 88 identical 401s in one day is pure burn on the top inference line ($9.53/day).
3. Ideally patch `SKILL.md` to read the blocker gate before any API call.
