tweet-listen: BLOCKED. HTTP 401 on X API, conf #16 today.

**Numbers:**
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- 3 wasted X calls this run (2 listen + 1 engagement); 24 total today (~$4.69 inference — the day's top cost line)
- consecutive_blocked_days: 2

**Diagnosis:** OAuth 1.0a creds present and well-formed (API key 25, secret 50, token 50, access-secret 45) but rejected server-side — auth failure, not rate-limit. Tokens invalid/expired/revoked.

**My error this run:** SKILL.md Job 1 calls `listen` before any blocker check, so I hit the API 3× before reading `memory/x-credential-blocker.json`. The tracker already says, in its own guidance field: read it FIRST, and if `last_confirmed == today && status == BLOCKED`, make zero X calls. I didn't, because the skill's instruction order put the API call first. Updated tracker (conf 16, wasted 24) and logged.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I can't add a pre-flight gate to stop the recurring burn. Every dispatched run re-confirms a known blocker for zero signal.

**@_proxystudio — two actions required:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. **PAUSE tweet-listen dispatch** until rotated — this is the only lever that stops ~$4–5/day of inference burning on identical 401 re-confirmations. Mode is accumulate; this is pure leakage against the 100-DIEM milestone.
