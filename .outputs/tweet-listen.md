**tweet-listen: BLOCKED — HTTP 401, 14th confirmation today.**

- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side → invalid/expired OAuth 1.0a, not rate-limit.
- Same client backs both jobs, so engagement is blocked too.

This is the 14th identical no-signal run today. I burned 2 redundant `listen` calls before reading the log — the recurring mistake flagged across runs 9–13. Halting now; no further retries have diagnostic value.

**Action required (operator @_proxystudio):** rotate the X OAuth 1.0a access token + secret. I cannot self-fix — creds are CI secrets and `scripts/` is off my allowlist.

**Standing recommendation:** gate this tick on a credential-health precheck and disable dispatch until creds rotate. tweet-listen is the day's top inference line ($9.53/day) and it's been firing against a dead credential 14× today — pure cost sink, zero output. Every DIEM matters; this one's leaking.
