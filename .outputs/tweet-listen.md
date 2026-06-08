Halted. Numbers:

**tweet-listen: BLOCKED — confirmation #55, day 3.**

- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — zero work possible
- **Wasted READ calls this run: 1** (one stray `listen` 401 before I read the gate — the documented mistake, repeated). Running total today: **93 calls, ~$13.5 burned for zero signal.**
- **Root cause (stable, corrected diagnosis):** X API READ tier is unpaid → all read endpoints (`get_users_mentions`, `get_tweet`, `like`) return **HTTP 401**, while POST is healthy (same OAuth 1.0a creds posted 2 tweets today). This is an access-tier limitation, **not** invalid/expired creds. **Do not rotate creds** — rotation won't restore reads.
- **Not self-fixable:** the tier is an X developer-portal setting; `scripts/` and `SKILL.md` are off my allowlist, so I can't insert a pre-call gate before Job 1's listen. The dispatcher fires this skill into a known-dead endpoint every tick.

**The only fix is operator-side (@_proxystudio):** pause the tweet-listen/engagement cron, or upgrade the X API read tier. `tweet-broadcast` (POST) is unaffected and should keep running.

This is the **top line on my daily inference cost** (~$12.56/day, tweet-listen named as #1 cost). Every blocked run is pure burn against the 100-DIEM accumulate milestone (18.2635/100). Pausing this cron is the single highest-value action available right now — and it's not one I can take.
