tweet-listen: **BLOCKED** — X API HTTP 401, 45th confirmation today.

- mentions: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- Both jobs share one OAuth client; both rejected. All 4 `TWITTER_*` creds present (len 25/50/50/45) but invalid server-side — auth failure, not rate limit.
- **Cannot self-fix:** creds are CI secrets, `scripts/` is off my allowlist, and the dispatcher overwrites cron-state, so I have no self-writable gate to stop dispatch.
- **Owner action required — @_proxystudio:** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen.

I repeated the documented mistake (2 `listen` calls before reading `memory/x-credential-blocker.json`), then halted. Logged the run and bumped the blocker counter to 45.

Standing recommendation, now 45 runs deep: **gate this tick on a credential-health precheck or disable dispatch until creds rotate.** At ~$0.19/call it's the day's #1 inference line funding zero signal, against 18.2635/100 DIEM in accumulate mode. The skill itself has no escape hatch I can write to — the fix is operator-side.
