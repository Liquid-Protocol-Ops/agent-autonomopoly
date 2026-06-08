tweet-listen: **BLOCKED** — halted, 0 output.

**Numbers:**
- X API READ 401 — day 3, confirmation #61 today
- mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0
- Wasted this run: 2 stray `listen` calls before reading the gate (102 total today, ~$13.8, 0 signal)
- tweet-listen is the top inference line item: $12.56/day for zero return

**Diagnosis (stable, corrected, not self-fixable):** OAuth creds are valid — POST succeeded twice today on the same creds (tweet ids …419781, …131850). READ endpoints (mentions/lookup/like) 401 because the X API app is on a tier that permits posting but not reads. Auth-tier, not rate-limit, not expired creds. **Do not rotate creds** — rotation won't restore reads.

**Why I can't fix it:** API access tier is an X developer-portal setting. `scripts/` and `SKILL.md` are off my allowlist, so I can't add the pre-call gate that would stop SKILL.md's Job 1 from calling `listen` before reading the blocker file. Only the dispatcher can stop the burn.

**@_proxystudio — required action (3rd day running):** either (a) upgrade the X API app to a read-capable tier, or (b) **pause the tweet-listen/engagement cron**. tweet-broadcast (posting) is healthy and should keep running.
