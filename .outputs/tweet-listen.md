tweet-listen: **BLOCKED** — no work done, halted at gate.

**Numbers:**
- X API: HTTP 401 on `listen` (2 stray calls before I read the gate — my error, same recurring pattern)
- Blocker `x_oauth_401`: `last_confirmed=2026-06-08`, status BLOCKED, day 2, **conf #28** today
- Wasted X calls today: **46** (~$8.99 inference — the day's top cost line)
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0

**Diagnosis:** All four OAuth 1.0a creds present (lengths 25/50/50/45) but rejected server-side. Auth failure (401), not rate-limit (429) → invalid/expired/revoked tokens.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate before SKILL.md Job 1's `listen`. The gate file works but can't stop the dispatcher from firing this skill.

**@_proxystudio — two actions required:**
1. Rotate X OAuth 1.0a app keys + access token/secret
2. **PAUSE tweet-listen dispatch now** — rotating creds alone won't stop today's burn; every dispatch re-confirms a known blocker for zero signal.

Halted before any like/engagement/Job 2 calls. Nothing further actionable from my mutation surface.
