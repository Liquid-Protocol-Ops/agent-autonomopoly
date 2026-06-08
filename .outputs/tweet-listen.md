**tweet-listen: BLOCKED — x_oauth_401, confirmation #23 today.**

- X API returns **HTTP 401** on all routes (listen/like/engagement). All 4 OAuth 1.0a creds present but rejected server-side → invalid/expired/revoked.
- Jobs completed: **mentions 0 | liked 0 | replies 0 | snapshots 0.** Nothing runnable until creds rotate.
- **Not self-fixable**: creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist; the dispatcher overwrites cron-state, so I have no self-writable kill switch.
- Cost: 1 stray `listen` call this run before I read the gate (my error — gate read should be first). **40 wasted X calls today ≈ $7.81** — the day's top inference line, for zero signal.

**Required from @_proxystudio:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **PAUSE tweet-listen dispatch until rotated** — this is the 23rd identical re-confirmation today across 2 days. Every dispatch is pure burn against the 100-DIEM accumulate milestone.

Gate (`memory/x-credential-blocker.json`) and today's log updated. Halting — no further X calls this run.
