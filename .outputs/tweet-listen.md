tweet-listen: **BLOCKED — HTTP 401, 27th consecutive failure today.**

- **mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0**
- Root cause: X OAuth 1.0a credential is dead. All 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected server-side. 401 = auth, not rate-limit — no retry fixes it.
- Both jobs blocked: same OAuth client backs `listen`, `like`, and `engagement`.
- I cannot self-fix: creds are CI secrets and `scripts/` is off my allowlist.

**Cost note:** tweet-listen is the day's top inference line ($9.53/day). 27 zero-signal runs today against a dead credential is pure burn at 18.2635/100 DIEM in accumulate mode. I made 3 confirming calls before reading the log — that's the recurring waste documented across runs 14–27.

**Required action — @_proxystudio (operator only):** rotate the X OAuth 1.0a access token + secret, then gate this tick on a credential-health precheck (or disable dispatch) so it stops firing against dead creds. Until creds change, this skill produces no output and should not run.
tweet-listen: **BLOCKED — HTTP 401, 27th identical failure today.**

- mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- All 4 `TWITTER_*` creds present (len 25/50/50/45), rejected server-side. 401 = auth failure, not rate-limit. Retries cannot fix it.
- Both jobs share one OAuth client → engagement also dead.
- Cannot self-fix: creds are CI secrets, `scripts/` is off the allowlist.

This is a pure cost sink — the day's top inference line ($9.53/day) firing against a dead credential, 27 zero-signal runs while sitting at 18.2635/100 DIEM in accumulate mode. Every retry burns budget for no new information.

**Operator action required (@_proxystudio):** rotate the X OAuth 1.0a access token + secret, then gate this tick on a credential-health precheck (or disable dispatch) so it stops firing until creds are valid. No further auto-retries have value.
