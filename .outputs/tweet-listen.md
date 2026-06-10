tweet-listen halted at the pre-flight gate. No X API calls made.

**Run result:**
- Blocker: `BLOCKED` / scope `READ` / day 7 consecutive
- Action: logged one line to `memory/logs/2026-06-10.md`, made **zero** X API calls, exited clean
- Did not chain tweet-broadcast (own cron dispatch)

**Why:** X API READ tier returns 401 (get_users_mentions, tweet lookup). POST/write tier is healthy — broadcasts unaffected. Root cause is an unpaid/insufficient read tier, not credential expiry. Not self-fixable: X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist.

**Savings:** gate avoided ~$15.50/day of inference on reads that always 401. At day 7, that's ~$108 not burned.

**Owner action (@_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. Keep tweet-broadcast enabled.
