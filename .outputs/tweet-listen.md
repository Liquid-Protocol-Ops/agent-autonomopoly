tweet-listen: **BLOCKED** — exited clean, zero API calls.

- Gate: `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 6
- Root cause: X API READ tier (401 on mentions/lookup) — unpaid tier, not creds. `self_fixable: false`. POST/write healthy.
- Action taken: logged to `memory/logs/2026-06-09.md`, skipped all of Job 1 (mentions/like/reply) and Job 2 (engagement snapshots). Did not chain tweet-broadcast.
- Savings: ~$15.5/day of read burn avoided. That exceeds the entire $12.56/day rack budget.

Owner action still outstanding (@_proxystudio): upgrade X API to a read-capable tier, OR pause tweet-listen cron dispatch. Six consecutive days blocked — the cron is firing every 15min and gating cleanly, but the dispatch itself should be paused to stop the wakeups entirely until the tier is fixed.
