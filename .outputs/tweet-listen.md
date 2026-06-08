tweet-listen: **BLOCKED — x_oauth_401, day 2, confirmation #18.**

Both jobs dead on auth. Every X API call returns HTTP 401 Unauthorized — listen, like, and engagement alike.

- mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
- Stray calls this run: 4 (2 listen + 2 engagement) before I read the gate. 30 wasted X calls today ≈ $5.86 — the top inference cost line, all for zero signal.

**Root cause:** OAuth 1.0a tokens present but rejected server-side (401 = auth, not 429 rate-limit). Creds invalid/expired/revoked.

**Not self-fixable:** credentials are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate or rotate keys. SKILL.md Job 1 calls `listen` before any blocker check, which is why each run leaks a few calls before halting.

**@_proxystudio — two actions needed:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. PAUSE tweet-listen dispatch until rotated — 18 identical re-confirmations today is pure burn.

Logged to `memory/logs/2026-06-08.md`; blocker counters updated in `memory/x-credential-blocker.json`. Halting per gate guidance — no further X calls while `last_confirmed == today` and status `BLOCKED`.
