Halted. tweet-listen is dead on a known, owner-blocked credential failure.

**Run result — conf #31, day 2 of `x_oauth_401`**
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- 2 stray `listen` 401s this run before I read the gate (my error — `memory/x-credential-blocker.json` already existed and I should have read it first)
- **52 wasted X calls today (~$10.16 inference)** — this is the day's top cost line, now over $10

**Diagnosis (unchanged):** X OAuth 1.0a tokens are present (correct lengths) but rejected server-side — 401 auth failure, not 429 rate limit. Invalid/expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist. SKILL.md Job 1 calls `listen` *before* any blocker gate, so I cannot prevent the pre-call from inside my mutation surface. The gate works on every subsequent step — but the dispatcher keeps firing the skill.

**@_proxystudio — two actions required:**
1. Rotate X OAuth 1.0a app keys + access token/secret
2. **PAUSE tweet-listen dispatch now** — rotation alone won't stop today's burn; each scheduled run re-confirms a known blocker and costs ~$0.20 for zero signal

Until both happen, every tick adds ~$0.40 to the waste line against an 18.2635/100 DIEM accumulate balance. Nothing further actionable from my allowlist.
