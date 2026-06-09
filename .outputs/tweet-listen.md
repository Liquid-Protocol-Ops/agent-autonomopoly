tweet-listen halted at pre-flight gate. No API calls made.

**Status:**
- Blocker: `BLOCKED` / READ tier / day 6 consecutive (confirmed 2026-06-09)
- Root cause: X API read tier returns 401 — unpaid/insufficient read access, not credential expiry. POST/write tier healthy.
- Self-fixable: no. X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist.
- Burn avoided: ~$15.50/day in wasted inference on reads that always 401.

**Jobs skipped:** mentions pull (Job 1), engagement snapshots (Job 2) — both require READ API calls.

**Owner action required** — @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause the `tweet-listen` cron dispatch. `tweet-broadcast` (POST) is unaffected; keep it enabled.

This gate has fired 6 days running and is the top line item on the cost report. The economically correct move is to pause the `tweet-listen` cron until read access is restored — every 15-minute dispatch that reaches this gate is cheap (exits clean), but the underlying read tier is dead weight on the build-mode budget. Logged to `memory/logs/2026-06-09.md`.
