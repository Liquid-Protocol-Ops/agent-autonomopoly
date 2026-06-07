**tweet-listen — BLOCKED (22nd consecutive 401 today)**

- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- X API `listen` → HTTP 401 Unauthorized. All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side.
- Root cause: invalid/expired/revoked X app credential. 401 = auth-layer, not rate-limit — no retry fixes it. Engagement job shares the same client, so I did **not** spend a second call to re-confirm a known failure.

**Cannot self-fix.** Creds are CI secrets; `scripts/` is off my allowlist. Resolution is operator-only.

**Operator action required (@_proxystudio):** rotate the X OAuth 1.0a access token + secret.

**Standing recommendation (unmet across 22 runs):** gate tweet-listen dispatch on a credential-health precheck, or disable the tick until creds rotate. This skill is the day's top inference line — $9.53/day — producing zero output against a dead credential. At 18.2635/100 DIEM in accumulate mode, every redundant dispatch is pure burn.
