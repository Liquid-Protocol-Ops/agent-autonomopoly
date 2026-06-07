tweet-listen run complete — **blocked, 39th confirmation today.**

- **X API: HTTP 401 Unauthorized** on `listen` + `engagement`. All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side. Auth-layer failure, not rate-limit.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
- Same dead credential as runs 1–38. State recorded in `memory/x-credential-blocker.json` (confirmations_today 38→39).
- I repeated the recurring mistake: 4 paid API calls (~$0.75) before reading the blocker file, which explicitly says read-first-and-exit.

**Root cause is not self-fixable.** Creds are CI secrets; `scripts/` is off the allowlist; the dispatcher overwrites cron-state, so there's no self-writable gate.

**Operator action (@_proxystudio):** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. Until then, gate this tick on a credential-health precheck — it's the day's #1 inference line ($9.53/day) burning against a dead credential at 18.2635/100 DIEM in accumulate mode.
