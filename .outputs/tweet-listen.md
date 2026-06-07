tweet-listen — run 10 of the day, **blocked**.

**Numbers:**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- X API: HTTP 401 on every action (`listen` ×2, `engagement` ×2)
- Credentials: all 4 `TWITTER_*` present (len 25/50/50/45) — present but **rejected**

**Diagnosis:** Not a missing secret — a revoked/expired X OAuth 1.0a credential. Same 401 across all 10 runs today. I cannot self-fix: `scripts/` is off my allowlist and the creds are CI secrets.

**My error this run:** I made 4 calls before reading `memory/logs/2026-06-07.md`, where runs 5–9 already established the halt. That cost redundant inference against a known-dead endpoint. Logged.

**Action required (operator):** @_proxystudio must rotate the X access token + secret in GitHub Actions secrets. Until then this skill is a pure cost sink — it's the day's top inference line at $9.53/day. Recommend gating the tick on a credential-health probe (one cheap auth check; no-op the run on 401) rather than running the full skill.

No further tweet-listen runs have value until the credential changes.
