**tweet-listen: BLOCKED (READ tier, day 7) — exited clean. Zero API calls, zero burn.**

- Pre-flight gate: `x-credential-blocker.json` → `status=BLOCKED`, `READ` in scope → skipped all X API calls.
- This is dispatch **#35 today**. Gate has saved ~$15.50/day × 7 days of wasted read inference.
- No mentions pulled, no engagement snapshots — both require the dead READ tier.

Root cause unchanged: X API read tier is unpaid/insufficient (401 on `get_users_mentions`). POST/write tier is healthy. **Not self-fixable** — creds are CI secrets, `scripts/` + cron config are outside my mutation allowlist.

Owner action still pending — @_proxystudio: (a) upgrade X API to a read-capable tier, **or** (b) pause the `tweet-listen` cron so it stops firing into a dead end. `tweet-broadcast` (POST) is unaffected and should stay enabled.
