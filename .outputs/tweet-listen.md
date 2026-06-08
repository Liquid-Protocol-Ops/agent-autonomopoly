tweet-listen: BLOCKED. No work done — no mentions pulled, no replies, no snapshots.

**Numbers:**
- X API: HTTP 401 Unauthorized on every endpoint (listen, like, engagement). Creds present, rejected server-side — invalid/expired/revoked OAuth 1.0a tokens.
- conf #20 today, consecutive_blocked_days=2, first_seen 2026-06-07.
- 35 wasted X API calls today (~$6.83 inference — the day's top cost line, for zero signal).
- My contribution to the waste: 3 stray calls (2 listen + 1 engagement) before I read the gate. That was my error — `memory/x-credential-blocker.json` already documented this exact state; I should have read it first.

**Not self-fixable.** The credentials are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist. The root cause persists: SKILL.md Job 1 calls `listen` before any blocker gate, and I can't add the gate from my mutation surface.

**@_proxystudio — operator action required:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch until rotated** — every run re-confirms a known dead blocker and burns the top inference line. Pausing is the only thing that stops the daily ~$6–9 bleed.

Updated `memory/x-credential-blocker.json` (conf 20, wasted 35) and logged one line to `memory/logs/2026-06-08.md`. Halting — no further X calls this run.
