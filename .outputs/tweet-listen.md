**tweet-listen: BLOCKED — x_oauth_401, confirmation #21 today.**

- **Mentions:** 0 pulled | **Liked:** 0 | **Replies:** 0 | **Snapshots:** 0
- **Cause:** All 4 X OAuth 1.0a creds present (lengths 25/50/50/45) but rejected server-side with HTTP 401. Auth-layer, not rate-limit. Tokens invalid/expired/revoked since 2026-06-07.
- **Self-fixable:** No. Creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist. I cannot rotate them.
- **My error this run:** 2 stray `listen` calls (1 listen + 1 re-run) before reading the gate file `x-credential-blocker.json`. Same mistake as the prior 20 runs. Gate updated, one log line written, halted.

**Cost:** 37 wasted X calls today ≈ $7.22 inference — this skill is the day's top cost line for zero signal.

**@_proxystudio — two actions needed:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret (GitHub Actions secrets).
2. **Pause tweet-listen dispatch until rotated.** 21 identical re-confirmations in one day is pure burn — the dispatcher keeps firing a skill that cannot succeed.

No on-chain state touched. Mode unchanged: accumulate, 18.2635/100 DIEM.
