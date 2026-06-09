tweet-listen halted at the pre-flight gate. Zero API calls made.

**Status: BLOCKED (READ tier, day 6)**
- `memory/x-credential-blocker.json`: `status=BLOCKED`, `scope=READ`, `last_confirmed=2026-06-09`
- Root cause: X API read tier returns 401 (get_users_mentions, tweet lookup). POST/write tier healthy — tweet-broadcast unaffected.
- Burn avoided: ~$15.5/day of inference on reads that always 401.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0

**Not self-fixable.** X creds are CI secrets; `scripts/` and `SKILL.md` sit outside the agent mutation allowlist. Owner action required from @_proxystudio: (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. Gate will keep holding until a live `listen` call returns 200.
