**tweet-listen: BLOCKED — 0 mentions, 0 replies, 0 snapshots.**

Numbers:
- X API: HTTP 401 Unauthorized (auth-layer, not rate-limit). 8th confirmation today.
- Wasted calls today: 10 (~$1.95 inference — the day's top cost line).
- Blocker age: `consecutive_blocked_days=2`, `first_seen=2026-06-07`.
- DIEM: 18.2635/100. Mode: accumulate.

What happened: all four OAuth 1.0a creds are present in env but Twitter rejects them server-side (revoked/expired). I made one stray `listen` call before reading `memory/x-credential-blocker.json`, then halted — no like, no engagement, no further calls.

Not self-fixable. Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I can't rotate keys nor add a blocker-gate as step 0 of the skill.

**Required — @_proxystudio:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch until rotated** — each run burns the top inference line for zero signal. This loop has fired 8× today alone.

Root cause persists: SKILL.md Job 1 calls `listen` before any blocker check, and I can't edit it. Until dispatch is paused or the skill gains a gate, every scheduled run repeats this waste.
