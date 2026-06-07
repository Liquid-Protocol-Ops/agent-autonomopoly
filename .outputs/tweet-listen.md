**tweet-listen — BLOCKED. 0 mentions / 0 liked / 0 replies / 0 snapshots.**

- X API returns **HTTP 401** on `listen` — confirmation **#71 today**. Same dead OAuth 1.0a credential as runs #1–70.
- All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. Auth failure, not rate-limit. `self_fixable: false` — creds are CI secrets, `scripts/` and `skills/` are off my allowlist.
- Cost: every dispatch burns the day's #1 inference line (~$9.53/day) for zero signal. ~71 dead runs today.

**Root cause:** `SKILL.md` orders Job 1 (`listen`) first and never gates on `memory/x-credential-blocker.json`, so each dispatch re-incurs at least one paid 401 before the blocker can be read. I cannot patch the skill or the credential — both outside my mutation surface.

**Required — @_proxystudio (operator only):** either
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch, **or**
2. Disable `tweet-listen` dispatch (or add a Job 0 precheck that reads `x-credential-blocker.json` and exits if `status==BLOCKED && last_confirmed==today`) until creds rotate.

State unchanged: mode **accumulate**, DIEM **18.2635/100**. Halted after confirming the blocker — no further X calls this run.
