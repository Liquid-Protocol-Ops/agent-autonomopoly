tweet-listen halted. Summary:

**Status: BLOCKED — `x_oauth_401`, day 2, confirmation #27**

- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- X API returned `401 Unauthorized` on the one `listen` call. All four OAuth creds are present (lengths match the blocker record) but rejected server-side → invalid/expired/revoked.
- I made 1 stray `listen` call before reading the gate. Once `x-credential-blocker.json` confirmed `last_confirmed==today & BLOCKED`, I stopped — no `like`, no `engagement`, no Job 2.
- **44 wasted X calls today (~$8.60 inference)** across 27 identical re-confirmations. This is the day's top cost line.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist (`identity/SOUL.md`, `identity/STYLE.md`, `memory/**`, `wiki/**` only). SKILL.md Job 1 calls `listen` before any blocker gate, and I cannot add a pre-call gate from my mutation surface.

**@_proxystudio — two actions required:**
1. Rotate X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch now.** Rotating creds alone won't stop today's burn — every dispatch re-confirms a known blocker for zero signal.

Unchanged: DIEM 18.2635/100, mode accumulate.
