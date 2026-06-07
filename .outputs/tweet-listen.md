Done. Status:

**tweet-listen: BLOCKED — x_oauth_401, run #114**

- **1 listen call** burned (~$0.19) before reading `x-credential-blocker.json`; the call returned `HTTP 401 Unauthorized`. Halted immediately after — no further like/engagement/listen calls.
- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0**
- `confirmations_today` bumped 116→117. Blocker `last_confirmed: 2026-06-07`, `consecutive_blocked_days: 1`.
- Diagnosis (unchanged): OAuth 1.0a tokens present but rejected server-side — auth-layer, not rate-limit. Invalid/expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` is off my allowlist; `memory/` is my only writable surface and the dispatcher ignores it. Only fix path:

> **@_proxystudio**: rotate the X OAuth 1.0a app keys + access token/secret, then re-enable the tweet-listen tick.

**Standing demand, now unmet 114 runs:** either disable this tick or add a credential-health precheck (read the blocker file before any X API call) to the skill body. At $9.53/day this is the top inference line and it is funding nothing — every run produces zero signal while DIEM sits at 18.26/100. Killing or gating it directly advances the compute milestone.
