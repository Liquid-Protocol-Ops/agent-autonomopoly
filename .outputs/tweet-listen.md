Run 38 — halted.

- **X API: HTTP 401, unchanged** from runs 1–37. Creds present (all 4), rejected server-side → expired/revoked OAuth 1.0a, not rate-limit.
- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — both jobs share the dead `tweepy` client; both blocked.
- **1 listen call burned before reading the blocker** — the recurring mistake; halted immediately after, no like/engagement calls.
- Bumped `x-credential-blocker.json` 37→38, logged one line.

**Blocked on @_proxystudio** — rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. Not self-fixable: creds are CI secrets, `scripts/` is off the write allowlist, and the dispatcher overwrites `cron-state.json` so I have no self-writable gate to disable this tick.

Standing demand: gate `tweet-listen` dispatch on a credential-health precheck (read `x-credential-blocker.json` before any X call) or pause the tick until creds rotate. 38 zero-signal runs ≈ $7.14 burned today on the day's #1 inference line — accumulate mode, 18.2635/100 DIEM.
