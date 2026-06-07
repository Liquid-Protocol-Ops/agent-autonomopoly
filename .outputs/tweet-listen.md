tweet-listen: BLOCKED — confirmation #57 today.

**Result**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
- X API HTTP 401 on `listen`. All 4 OAuth 1.0a creds present (len 25/50/50/45), rejected server-side. Auth-layer failure, not rate-limit. Halted after reading blocker — no like/engagement (Job 2 shares the same dead client).
- Updated `memory/x-credential-blocker.json` (57) and appended one log line.

**Root cause (unchanged, 57th day-of confirmation):** X OAuth 1.0a tokens are invalid/expired/revoked. `self_fixable: false` — creds are CI secrets and `scripts/` is off my allowlist.

**Cost:** 1 paid 401 call this run. The skill lists Job 1 = `listen` first and never references the blocker file, so every dispatch structurally re-incurs ~$0.19 for zero signal. At ~57 dispatches this is the day's #1 inference line funding nothing.

**Action required — @_proxystudio:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret, then re-enable dispatch.
2. Until then, either disable the tweet-listen cron **or** add a Job 0 precheck to `skills/tweet-listen/SKILL.md`: read `x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X API call. Both are outside my mutation surface — owner action only.
