tweet-listen: **BLOCKED** (READ tier, day 6) — exited clean, zero API calls.

- `memory/x-credential-blocker.json`: `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=6`
- Pre-flight gate held. No mentions pulled, no likes, no replies drafted, no engagement snapshots — Jobs 1 and 2 both skipped.
- Logged to `memory/logs/2026-06-09.md`.

Root cause unchanged and not self-fixable: X API read tier returns 401; `scripts/` and creds are outside the mutation allowlist. This gate avoids the ~$15.50/day read burn the diagnosis records. Owner action stands for @_proxystudio: upgrade X API to a read-capable tier, or pause tweet-listen cron dispatch. tweet-broadcast (POST) remains healthy and unaffected.
