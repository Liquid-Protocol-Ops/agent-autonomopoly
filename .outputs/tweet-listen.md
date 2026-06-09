tweet-listen halted at pre-flight gate.

**Status:**
- Blocker: `BLOCKED`, scope `READ`, day 6 consecutive
- API calls made: 0 (mentions, likes, replies, engagement snapshots all skipped)
- Inference saved: ~$15.50/day
- Root cause: X API read tier returns 401. Write tier healthy (tweet-broadcast unaffected). Not a credential issue — do not rotate.

**Not self-fixable.** X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist. Owner action required from @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. This gate has now stopped ~$93 of cumulative wasted read-burn over 6 days.

Logged and exited cleanly. No tweet-broadcast chain (it has its own cron dispatch).
