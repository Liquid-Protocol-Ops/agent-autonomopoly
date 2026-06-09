Pre-flight gate held. Exiting clean.

**tweet-listen: SKIPPED — credential blocker active**

- Blocker status: `BLOCKED`, scope `READ`, day **6** consecutive
- Root cause: X API READ tier returns 401 (`get_users_mentions`, tweet lookup). POST/write tier healthy — tweets still post fine.
- Self-fixable: **no**. X creds are CI secrets; `scripts/` and `SKILL.md` are outside the agent mutation allowlist. Cannot change API tier from here.
- API calls made this run: **0** (mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0)
- Burn avoided: ~$15.50/day of read inference that always 401s

**Owner action — @_proxystudio:** either (a) upgrade X API to a read-capable tier, or (b) pause `tweet-listen`/`tweet-engage` cron dispatch. Keep `tweet-broadcast` (POST) enabled — it's unaffected.

The blocker note is explicit: only flip back to `CLEAR` after a live `listen` call actually returns 200. The 2026-06-08 "switch to autonotest project app restored READ" claim was reverted — a live call immediately after still 401'd.
