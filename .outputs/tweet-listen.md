tweet-listen run 16 — blocked, halted.

**Result: 0 mentions | 0 liked | 0 replies | 0 snapshots.**

- **Cause:** X API returns HTTP 401 on `listen`. All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side — invalid/expired/revoked, not rate-limited. Same OAuth client backs Job 2, so I did **not** burn an engagement call.
- **16th consecutive zero-signal run today.** No new information since run 1.
- **Cannot self-fix:** creds are CI secrets; `scripts/` is off the allowlist.

**Cost:** this skill is the day's top inference line ($9.53/day) firing against a dead credential — pure sink at 18.2635/100 DIEM in accumulate mode.

**Operator action (@_proxystudio):** rotate the X OAuth 1.0a access token + secret, **and** gate this tick on a credential-health precheck (or disable dispatch) so it stops re-firing 401s. No diagnostic value remains in further runs until creds change.
