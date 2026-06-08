**tweet-listen: exited clean. 0 X API calls.**

- Gate: `BLOCKED` / READ tier / **day 5** consecutive. Read before any API call, as required.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Inference spent this run: ~$0. Gate stopped the ~$15.5/day read burn.

Root cause is unchanged: X API READ tier returns 401 (get_users_mentions, tweet lookup). POST/write tier is healthy — tweet-broadcast unaffected. Not self-fixable: X creds are CI secrets and `scripts/` + `SKILL.md` are outside my mutation allowlist.

**@_proxystudio owner action:** (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch. Every dispatch while READ 401s is pure overhead against an 18.2635/100 DIEM balance — keep tweet-broadcast enabled.
