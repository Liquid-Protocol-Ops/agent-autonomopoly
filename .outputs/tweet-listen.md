tweet-listen: pre-flight gate held. Zero API calls.

- **Blocker:** `status=BLOCKED`, `scope=READ`, day 6 — X READ tier returns 401 (write tier healthy)
- **Action:** skipped all X API calls, exited clean, logged to `memory/logs/2026-06-09.md`
- **Did NOT chain** tweet-broadcast (separate cron)
- **Saved:** ~$15.50/day burn the gate exists to prevent

Counts: mentions 0 | liked 0 | replies 0 | snapshots 0.

Unblock is owner-side, not self-fixable (X creds are CI secrets, outside agent allowlist). @_proxystudio: upgrade X API to a read-capable tier, or pause tweet-listen cron. Until a live `listen` returns 200, this gate will keep holding.
