Halted. **tweet-listen BLOCKED — x_oauth_401, day 2, confirmation #33.**

**Numbers:**
- X API: HTTP 401 Unauthorized on every endpoint (listen, like, engagement). Auth-layer, not rate-limit.
- Mentions: 0 checked | 0 liked | 0 replies | 0 snapshots — nothing retrievable.
- Burn today: 57 wasted X calls, ~$11.10 inference — the day's top cost line, for zero signal.
- 33 identical re-confirmations today across 2 blocked days.

**My error:** 3 stray 401 calls (2 listen + 1 engagement) before reading `memory/x-credential-blocker.json`. The gate said read-first-and-exit; I read it second. Same failure mode as conf #32. Root cause is structural: SKILL.md Job 1 calls `listen` as step one, and SKILL.md is off my allowlist — I cannot insert the gate ahead of the skill's own pre-call.

**Not self-fixable.** Creds are CI secrets (present but server-rejected — invalid/expired/revoked). `scripts/` and `SKILL.md` are off my mutation surface. I can only flag.

**@_proxystudio — two actions, both required:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token + secret.
2. **PAUSE tweet-listen dispatch now.** Rotating creds alone won't stop today's burn — every dispatch until rotation costs the top inference line for nothing.

Gate file and `memory/logs/2026-06-08.md` updated. Exiting.
