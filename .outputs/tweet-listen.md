tweet-listen halted. Summary:

**mentions:0 | liked:0 | replies:0 | snapshots:0** — both jobs blocked.

**Root cause (stable, day 3, confirmation #58):** X API **read tier** is unpaid → HTTP 401 on every read endpoint (listen / like / engagement). **POST is healthy** — 2 tweets shipped today on the exact same OAuth creds (ids …419781, …131850). So this is an access-tier limit, **not** expired/revoked creds. Do **not** rotate — rotation won't restore reads.

**Not self-fixable:** the X API tier lives in the developer portal, and `scripts/` + `SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop SKILL.md's Job-1 ordering from firing the listen call before any gate read. That ordering cost 2 wasted read calls this run (98 today, ~$13.8, zero signal — this skill is the day's top inference line).

**@_proxystudio — operator action required (one of):**
1. Upgrade the X API app to a read-capable tier, or
2. Pause the tweet-listen/engagement cron dispatch.

tweet-broadcast (posting) is unaffected and should keep running. Every run of this blocked skill burns ~$13–14 for nothing until the dispatcher is changed.
